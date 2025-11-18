globalThis.process ??= {}; globalThis.process.env ??= {};
import { g as generateCustomerConfirmationEmail, I as It } from '../../../chunks/email-templates_Biu9xZAS.mjs';
import { c as createAuditLog } from '../../../chunks/audit-log_D4J27ZDp.mjs';
import { D as DAY_NAMES } from '../../../chunks/constants_CW49BNGH.mjs';
export { renderers } from '../../../renderers.mjs';

const APPOINTMENTS_PREFIX = "appointment:";
const GET = async ({ locals }) => {
  try {
    const KV = locals?.runtime?.env?.APPOINTMENTS_KV;
    if (!KV) {
      return new Response(JSON.stringify({ error: "KV not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    const keys = await KV.list({ prefix: APPOINTMENTS_PREFIX });
    const appointments = [];
    for (const key of keys.keys) {
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
      console.error("❌ KV not configured");
      return new Response(JSON.stringify({ error: "KV not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    const body = await request.json();
    const { appointmentId: id, action } = body;
    console.log(`📝 POST /api/admin/appointments - Action: ${action}, ID: ${id}`);
    if (!id || !action) {
      console.error("❌ Missing required fields:", { id, action });
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const key = `${APPOINTMENTS_PREFIX}${id}`;
    const appointmentData = await KV.get(key);
    if (!appointmentData) {
      console.error(`❌ Appointment not found: ${id}`);
      return new Response(JSON.stringify({ error: "Appointment not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    const appointment = JSON.parse(appointmentData);
    console.log(`✅ Appointment loaded: ${appointment.name} - ${appointment.email}`);
    switch (action) {
      case "confirm":
        console.log("🔄 Executing confirm action...");
        return await confirmAppointment(appointment, KV, request.url, locals);
      case "cancel":
        console.log("🔄 Executing cancel action...");
        return await cancelAppointment(appointment, KV, request.url, locals, body.reason);
      case "delete":
        console.log("🔄 Executing delete action...");
        return await deleteAppointment(appointment, KV);
      default:
        console.error(`❌ Invalid action: ${action}`);
        return new Response(JSON.stringify({ error: "Invalid action" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
    }
  } catch (error) {
    console.error("❌ Error updating appointment:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: errorMessage
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
async function confirmAppointment(appointment, KV, requestUrl, locals) {
  const originUrl = new URL(requestUrl).origin;
  appointment.status = "confirmed";
  await KV.put(`${APPOINTMENTS_PREFIX}${appointment.id}`, JSON.stringify(appointment));
  await createAuditLog(
    KV,
    "Termin bestätigt",
    `Termin für ${appointment.name} (${appointment.email}) am ${DAY_NAMES[appointment.day]}, ${appointment.time} Uhr wurde bestätigt.`,
    appointment.id,
    "Admin"
  );
  const appointmentUrl = `${originUrl}/termin/${appointment.id}`;
  let googleEventLink = null;
  try {
    googleEventLink = await createGoogleCalendarEvent(
      appointment,
      appointmentUrl,
      // ✅ appointmentUrl wird übergeben
      locals
    );
    console.log("✅ Google Calendar event created:", googleEventLink);
  } catch (calError) {
    console.error("❌ Error creating Google Calendar event:", calError);
  }
  try {
    const customerTemplate = generateCustomerConfirmationEmail(
      appointment.name,
      appointment.day,
      appointment.time,
      appointment.phone || "",
      appointment.email,
      appointmentUrl
      // ✅ appointmentUrl wird übergeben
    );
    const icsContent = createICSForAppointment(appointment, appointmentUrl);
    await sendEmail({
      to: appointment.email,
      subject: customerTemplate.subject,
      html: customerTemplate.html,
      attachments: [
        {
          filename: "termin.ics",
          content: Buffer.from(icsContent).toString("base64"),
          type: "text/calendar",
          disposition: "attachment"
        }
      ],
      locals
    });
    console.log("✅ Confirmation email sent to customer:", appointment.email);
    await createAuditLog(
      KV,
      "E-Mail versendet",
      `Bestätigungs-E-Mail an Kunden ${appointment.email} erfolgreich versendet.`,
      appointment.id,
      appointment.email
    );
  } catch (emailError) {
    console.error("❌ Error sending confirmation email to customer:", emailError);
    const errorMessage = emailError instanceof Error ? emailError.message : "Unbekannter Fehler";
    await createAuditLog(
      KV,
      "E-Mail Fehler",
      `Fehler beim Versenden der Bestätigungs-E-Mail an ${appointment.email}: ${errorMessage}`,
      appointment.id,
      appointment.email
    );
  }
  return new Response(JSON.stringify({ success: true, googleEventLink }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function cancelAppointment(appointment, KV, requestUrl, locals, reason) {
  const originUrl = new URL(requestUrl).origin;
  appointment.status = "cancelled";
  appointment.cancellationReason = reason;
  await KV.put(`${APPOINTMENTS_PREFIX}${appointment.id}`, JSON.stringify(appointment));
  await createAuditLog(
    KV,
    "Termin storniert",
    `Termin für ${appointment.name} (${appointment.email}) am ${DAY_NAMES[appointment.day]}, ${appointment.time} Uhr wurde storniert${reason ? ` - Grund: ${reason}` : ""}.`,
    appointment.id,
    "Admin"
  );
  try {
    if (appointment.googleEventId) {
      await deleteGoogleCalendarEvent(appointment.googleEventId, locals);
      console.log("✅ Google Calendar event deleted");
    }
  } catch (calError) {
    console.error("❌ Error deleting Google Calendar event:", calError);
  }
  try {
    const appointmentUrl = `${originUrl}/termin/${appointment.id}`;
    const customerTemplate = getCustomerCancellationTemplate(
      appointment.name,
      appointment.day,
      appointment.time,
      reason || "Keine Angabe",
      appointmentUrl
    );
    await sendEmail({
      to: appointment.email,
      subject: customerTemplate.subject,
      html: customerTemplate.html,
      locals
    });
    console.log("✅ Cancellation email sent to customer:", appointment.email);
    await createAuditLog(
      KV,
      "E-Mail versendet",
      `Stornierungsbenachrichtigung an Kunden ${appointment.email} erfolgreich versendet.`,
      appointment.id,
      appointment.email
    );
  } catch (emailError) {
    console.error("❌ Error sending cancellation email:", emailError);
    const errorMessage = emailError instanceof Error ? emailError.message : "Unbekannter Fehler";
    await createAuditLog(
      KV,
      "E-Mail Fehler",
      `Fehler beim Versenden der Stornierungsbenachrichtigung an ${appointment.email}: ${errorMessage}`,
      appointment.id,
      appointment.email
    );
  }
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" }
  });
}
async function deleteAppointment(appointment, KV) {
  console.log(`🗑️ Deleting appointment: ${appointment.id}`);
  try {
    await createAuditLog(
      KV,
      "Termin gelöscht",
      `Termin für ${appointment.name} (${appointment.email}) am ${DAY_NAMES[appointment.day]}, ${appointment.time} Uhr wurde endgültig gelöscht.`,
      appointment.id,
      "Admin"
    );
    console.log("✅ Audit log created");
    await KV.delete(`${APPOINTMENTS_PREFIX}${appointment.id}`);
    console.log("✅ Appointment deleted from KV");
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("❌ Error in deleteAppointment:", error);
    const errorMessage = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({
      error: "Failed to delete appointment",
      details: errorMessage
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
async function createGoogleCalendarEvent(appointment, appointmentUrl, locals, durationMinutes = 30) {
  try {
    const token = locals?.runtime?.env?.GOOGLE_ACCESS_TOKEN;
    const refreshToken = locals?.runtime?.env?.GOOGLE_REFRESH_TOKEN;
    const clientId = locals?.runtime?.env?.GOOGLE_CLIENT_ID;
    const clientSecret = locals?.runtime?.env?.GOOGLE_CLIENT_SECRET;
    const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || "primary";
    if (!token || !refreshToken || !clientId || !clientSecret) {
      console.warn("⚠️ Google Calendar nicht vollständig konfiguriert");
      return null;
    }
    const [hours, minutes] = appointment.time.split(":").map(Number);
    const appointmentDate = new Date(appointment.appointmentDate);
    appointmentDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(appointmentDate);
    endDate.setMinutes(endDate.getMinutes() + durationMinutes);
    const event = {
      summary: `Termin mit ${appointment.name}`,
      description: `Terminbuchung

Name: ${appointment.name}
E-Mail: ${appointment.email}
Telefon: ${appointment.phone || "Nicht angegeben"}

Termin-Link: ${appointmentUrl}`,
      start: {
        dateTime: appointmentDate.toISOString(),
        timeZone: "Europe/Berlin"
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: "Europe/Berlin"
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 },
          { method: "popup", minutes: 30 }
        ]
      }
    };
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(event)
      }
    );
    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.status}`);
    }
    const data = await response.json();
    if (data.id) {
      appointment.googleEventId = data.id;
    }
    return data.htmlLink || null;
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
    return null;
  }
}
async function deleteGoogleCalendarEvent(eventId, locals) {
  try {
    const token = locals?.runtime?.env?.GOOGLE_ACCESS_TOKEN;
    const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || "primary";
    if (!token) {
      console.warn("⚠️ Google Calendar nicht konfiguriert");
      return;
    }
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`
        }
      }
    );
    if (!response.ok && response.status !== 404) {
      throw new Error(`Google Calendar API error: ${response.status}`);
    }
  } catch (error) {
    console.error("Error deleting Google Calendar event:", error);
    throw error;
  }
}
function createICSForAppointment(appointment, appointmentUrl) {
  const cal = It({ name: "Terminbuchung" });
  const [hours, minutes] = appointment.time.split(":").map(Number);
  const appointmentDate = new Date(appointment.appointmentDate);
  appointmentDate.setHours(hours, minutes, 0, 0);
  const endDate = new Date(appointmentDate);
  endDate.setMinutes(endDate.getMinutes() + 30);
  cal.createEvent({
    start: appointmentDate,
    end: endDate,
    summary: `Termin mit ${appointment.name}`,
    description: `Terminbuchung

Name: ${appointment.name}
E-Mail: ${appointment.email}
Telefon: ${appointment.phone || "Nicht angegeben"}

Termin-Link: ${appointmentUrl}`,
    location: "Online/Vor Ort",
    url: appointmentUrl
  });
  return cal.toString();
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
