globalThis.process ??= {}; globalThis.process.env ??= {};
import { D as DAY_NAMES } from '../../../chunks/constants_CW49BNGH.mjs';
import { i as isValidEmail, a as sendAdminNotification, s as sendCustomerNotification } from '../../../chunks/email_KCAkukf4.mjs';
import { c as createAuditLog } from '../../../chunks/audit-log_CTvpblnZ.mjs';
export { renderers } from '../../../renderers.mjs';

const APPOINTMENTS_PREFIX = "appointment:";
const SETTINGS_KEY = "settings";
const GET = async ({ locals }) => {
  try {
    const KV = locals?.runtime?.env?.APPOINTMENTS_KV;
    if (!KV) {
      return new Response(JSON.stringify({ error: "KV not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    const list = await KV.list({ prefix: APPOINTMENTS_PREFIX });
    const appointments = [];
    for (const key of list.keys) {
      const value = await KV.get(key.name);
      if (value) {
        appointments.push(JSON.parse(value));
      }
    }
    appointments.sort((a, b) => {
      const dateA = new Date(a.appointmentDate).getTime();
      const dateB = new Date(b.appointmentDate).getTime();
      return dateA - dateB;
    });
    return new Response(JSON.stringify({ appointments }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const POST = async ({ request, locals }) => {
  try {
    const KV = locals?.runtime?.env?.APPOINTMENTS_KV;
    if (!KV) {
      return new Response(JSON.stringify({ error: "KV not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    const body = await request.json();
    const { appointmentId: id, action } = body;
    if (!id || !action) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const key = `${APPOINTMENTS_PREFIX}${id}`;
    const appointmentData = await KV.get(key);
    if (!appointmentData) {
      return new Response(JSON.stringify({ error: "Appointment not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    const appointment = JSON.parse(appointmentData);
    switch (action) {
      case "confirm":
        return await confirmAppointment(appointment, KV, request.url, locals);
      case "cancel":
        return await cancelAppointment(appointment, KV, request.url, locals, body.reason);
      case "delete":
        return await deleteAppointment(appointment, KV);
      default:
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
    }
  } catch (error) {
    console.error("Error updating appointment:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
async function confirmAppointment(appointment, KV, requestUrl, locals) {
  const url = new URL(requestUrl);
  let emailNotifications = false;
  let adminEmail = "";
  let appointmentDurationMinutes = 30;
  try {
    const settingsData = await KV.get(SETTINGS_KEY);
    if (settingsData) {
      const settings = JSON.parse(settingsData);
      emailNotifications = settings.emailNotifications || false;
      adminEmail = settings.adminEmail || "";
      appointmentDurationMinutes = settings.appointmentDurationMinutes || 30;
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
  const baseUrl = url.origin;
  const appointmentUrl = `${baseUrl}/termin/${appointment.id}`;
  const oldStatus = appointment.status;
  appointment.status = "confirmed";
  if (!appointment.googleEventId) {
    const googleCalendarResult = await createGoogleCalendarEvent(
      appointment,
      appointmentUrl,
      // ✅ FIX: Jetzt wird appointmentUrl übergeben
      locals,
      appointmentDurationMinutes
    );
    if (googleCalendarResult.success && googleCalendarResult.eventId) {
      appointment.googleEventId = googleCalendarResult.eventId;
      console.log(`✅ Google Calendar Event created: ${googleCalendarResult.eventId}`);
    } else {
      console.error("❌ Failed to create Google Calendar event:", googleCalendarResult.error);
    }
    await createAuditLog(
      KV,
      "Termin bestätigt",
      `Termin für ${appointment.name} (${appointment.email}) am ${DAY_NAMES[appointment.day]}, ${appointment.time} Uhr wurde bestätigt${googleCalendarResult.eventId ? " und in Google Calendar eingetragen" : ""}.`,
      appointment.id,
      "Admin"
    );
  } else {
    await createAuditLog(
      KV,
      "Status aktualisiert",
      `Status von ${appointment.name} wurde auf "bestätigt" gesetzt.`,
      appointment.id,
      "Admin"
    );
  }
  await KV.put(`${APPOINTMENTS_PREFIX}${appointment.id}`, JSON.stringify(appointment));
  if (oldStatus !== "confirmed") {
    const emailData = {
      name: appointment.name,
      company: appointment.company,
      phone: appointment.phone,
      email: appointment.email,
      day: new Date(appointment.appointmentDate).toISOString().split("T")[0],
      time: appointment.time,
      message: appointment.message,
      appointmentUrl,
      status: "confirmed",
      action: "confirmed"
    };
    if (emailNotifications && adminEmail && isValidEmail(adminEmail)) {
      try {
        const adminEmailSent = await sendAdminNotification(
          emailData,
          adminEmail,
          locals?.runtime?.env
        );
        if (adminEmailSent) {
          console.log(`✅ Admin confirmation notification sent to ${adminEmail}`);
        } else {
          console.error("❌ Failed to send admin email");
        }
      } catch (emailError) {
        console.error("Error sending admin notification:", emailError);
      }
    }
    try {
      const customerEmailSent = await sendCustomerNotification(
        emailData,
        locals?.runtime?.env
      );
      if (customerEmailSent) {
        console.log(`✅ Customer confirmation sent to ${appointment.email}`);
      } else {
        console.error("❌ Failed to send customer confirmation email");
      }
    } catch (emailError) {
      console.error("Error sending customer notification:", emailError);
    }
  }
  return new Response(JSON.stringify({
    success: true,
    appointment,
    emailSent: oldStatus !== "confirmed"
    // Nur wenn Status sich geändert hat
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function cancelAppointment(appointment, KV, requestUrl, locals, reason) {
  const url = new URL(requestUrl);
  let emailNotifications = false;
  let adminEmail = "";
  try {
    const settingsData = await KV.get(SETTINGS_KEY);
    if (settingsData) {
      const settings = JSON.parse(settingsData);
      emailNotifications = settings.emailNotifications || false;
      adminEmail = settings.adminEmail || "";
    }
  } catch (error) {
    console.error("Error loading settings:", error);
  }
  const baseUrl = url.origin;
  const appointmentUrl = `${baseUrl}/termin/${appointment.id}`;
  const oldStatus = appointment.status;
  appointment.status = "cancelled";
  if (appointment.googleEventId) {
    const deleteResult = await deleteGoogleCalendarEvent(
      appointment.googleEventId,
      locals
    );
    if (deleteResult.success) {
      console.log(`✅ Google Calendar Event deleted: ${appointment.googleEventId}`);
      appointment.googleEventId = void 0;
    } else {
      console.error("❌ Failed to delete Google Calendar event:", deleteResult.error);
    }
  }
  await createAuditLog(
    KV,
    "Termin storniert",
    `Termin für ${appointment.name} (${appointment.email}) am ${DAY_NAMES[appointment.day]}, ${appointment.time} Uhr wurde storniert${reason ? `. Grund: ${reason}` : ""}.`,
    appointment.id,
    "Admin"
  );
  await KV.put(`${APPOINTMENTS_PREFIX}${appointment.id}`, JSON.stringify(appointment));
  if (oldStatus !== "cancelled") {
    const emailData = {
      name: appointment.name,
      company: appointment.company,
      phone: appointment.phone,
      email: appointment.email,
      day: new Date(appointment.appointmentDate).toISOString().split("T")[0],
      time: appointment.time,
      message: appointment.message,
      appointmentUrl,
      status: "cancelled",
      action: oldStatus === "pending" ? "rejected" : "cancelled"
    };
    if (emailNotifications && adminEmail && isValidEmail(adminEmail)) {
      try {
        const adminEmailSent = await sendAdminNotification(
          emailData,
          adminEmail,
          locals?.runtime?.env
        );
        if (adminEmailSent) {
          console.log(`✅ Admin cancellation notification sent to ${adminEmail}`);
        } else {
          console.error("❌ Failed to send admin email");
        }
      } catch (emailError) {
        console.error("Error sending admin notification:", emailError);
      }
    }
    try {
      const customerEmailSent = await sendCustomerNotification(
        emailData,
        locals?.runtime?.env
      );
      if (customerEmailSent) {
        console.log(`✅ Customer cancellation sent to ${appointment.email}`);
      } else {
        console.error("❌ Failed to send customer cancellation email");
      }
    } catch (emailError) {
      console.error("Error sending customer notification:", emailError);
    }
  }
  return new Response(JSON.stringify({
    success: true,
    appointment,
    emailSent: oldStatus !== "cancelled"
  }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function deleteAppointment(appointment, KV) {
  await createAuditLog(
    KV,
    "Termin gelöscht",
    `Termin für ${appointment.name} (${appointment.email}) am ${DAY_NAMES[appointment.day]}, ${appointment.time} Uhr wurde endgültig gelöscht.`,
    appointment.id,
    "Admin"
  );
  await KV.delete(`${APPOINTMENTS_PREFIX}${appointment.id}`);
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function createGoogleCalendarEvent(appointment, appointmentUrl, locals, durationMinutes = 30) {
  const googleClientId = locals?.runtime?.env?.GOOGLE_CLIENT_ID || "";
  const googleClientSecret = locals?.runtime?.env?.GOOGLE_CLIENT_SECRET || "";
  const googleRefreshToken = locals?.runtime?.env?.GOOGLE_REFRESH_TOKEN || "";
  if (!googleClientId || !googleClientSecret || !googleRefreshToken) {
    console.error("❌ Google credentials not configured");
    return { success: false, error: "Missing Google credentials" };
  }
  try {
    console.log(`📅 Creating Google Calendar event for ${appointment.name}...`);
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        refresh_token: googleRefreshToken,
        grant_type: "refresh_token"
      })
    });
    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("❌ Failed to get access token:", error);
      return { success: false, error: "Token exchange failed" };
    }
    const tokenData = await tokenResponse.json();
    const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || "" || "primary";
    console.log(`📅 Using calendar: ${calendarId}`);
    const [hours, minutes] = appointment.time.split(":").map(Number);
    const startDate = new Date(appointment.appointmentDate);
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + durationMinutes);
    console.log(`⏰ Start: ${startDate.toISOString()}, End: ${endDate.toISOString()}, Duration: ${durationMinutes}min`);
    const description = `
Termin-Details:
- Name: ${appointment.name}
${appointment.company ? `- Firma: ${appointment.company}
` : ""}- Telefon: ${appointment.phone}
- E-Mail: ${appointment.email}
${appointment.message ? `- Nachricht: ${appointment.message}
` : ""}
Termin verwalten: ${appointmentUrl}
    `.trim();
    const event = {
      summary: `Termin: ${appointment.name}${appointment.company ? ` (${appointment.company})` : ""}`,
      description,
      // ✅ Jetzt mit Link!
      start: {
        dateTime: startDate.toISOString(),
        timeZone: "Europe/Berlin"
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: "Europe/Berlin"
      },
      attendees: [
        { email: appointment.email, displayName: appointment.name }
      ],
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          // 1 Tag vorher
          { method: "popup", minutes: 30 }
          // 30 Minuten vorher
        ]
      }
    };
    console.log(`📤 Sending event to Google Calendar API...`);
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${tokenData.access_token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(event)
      }
    );
    if (response.ok) {
      const result = await response.json();
      console.log(`✅ Google Calendar Event created successfully!`);
      console.log(`🔗 Event ID: ${result.id}`);
      console.log(`🔗 Event Link: ${result.htmlLink}`);
      return { success: true, eventId: result.id };
    } else {
      const error = await response.text();
      console.error("❌ Google Calendar API error:", error);
      return { success: false, error: `Calendar API error: ${response.status}` };
    }
  } catch (error) {
    console.error("❌ Error creating Google Calendar event:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
async function deleteGoogleCalendarEvent(eventId, locals) {
  const googleClientId = locals?.runtime?.env?.GOOGLE_CLIENT_ID || "";
  const googleClientSecret = locals?.runtime?.env?.GOOGLE_CLIENT_SECRET || "";
  const googleRefreshToken = locals?.runtime?.env?.GOOGLE_REFRESH_TOKEN || "";
  if (!googleClientId || !googleClientSecret || !googleRefreshToken) {
    console.error("❌ Google credentials not configured");
    return { success: false, error: "Missing Google credentials" };
  }
  try {
    console.log(`🗑️ Deleting Google Calendar event: ${eventId}...`);
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: googleClientId,
        client_secret: googleClientSecret,
        refresh_token: googleRefreshToken,
        grant_type: "refresh_token"
      })
    });
    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("❌ Failed to get access token:", error);
      return { success: false, error: "Token exchange failed" };
    }
    const tokenData = await tokenResponse.json();
    const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || "" || "primary";
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${tokenData.access_token}`
        }
      }
    );
    if (response.ok || response.status === 204) {
      console.log(`✅ Google Calendar Event deleted successfully!`);
      return { success: true };
    } else {
      const error = await response.text();
      console.error("❌ Google Calendar API error:", error);
      return { success: false, error: `Calendar API error: ${response.status}` };
    }
  } catch (error) {
    console.error("❌ Error deleting Google Calendar event:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
const PUT = async ({ request, locals }) => {
  try {
    const KV = locals?.runtime?.env?.APPOINTMENTS_KV;
    if (!KV) {
      return new Response(JSON.stringify({ error: "KV not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    const body = await request.json();
    const { appointmentId: id, adminNotes } = body;
    if (!id) {
      return new Response(JSON.stringify({ error: "Missing appointment ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const key = `${APPOINTMENTS_PREFIX}${id}`;
    const appointmentData = await KV.get(key);
    if (!appointmentData) {
      return new Response(JSON.stringify({ error: "Appointment not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    const appointment = JSON.parse(appointmentData);
    if (adminNotes !== void 0) {
      appointment.adminNotes = adminNotes;
      await createAuditLog(
        KV,
        "Notizen aktualisiert",
        `Admin-Notizen für ${appointment.name} wurden aktualisiert.`,
        appointment.id,
        "Admin"
      );
    }
    await KV.put(key, JSON.stringify(appointment));
    return new Response(JSON.stringify({ success: true, appointment }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST,
  PUT
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
