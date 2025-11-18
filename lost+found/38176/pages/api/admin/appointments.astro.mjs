globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAuditLog } from '../../../chunks/audit-log_CRKA170-.mjs';
export { renderers } from '../../../renderers.mjs';

const DAY_NAMES = {
  friday: "Freitag",
  saturday: "Samstag",
  sunday: "Sonntag"
};
const GET = async ({ locals }) => {
  const KV = locals?.runtime?.env?.APPOINTMENTS_KV;
  if (!KV) {
    return new Response(JSON.stringify({ message: "KV store not available" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const allAppointmentsKey = "appointments:list";
    const existingList = await KV.get(allAppointmentsKey);
    if (!existingList) {
      return new Response(JSON.stringify({ appointments: [] }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
    const appointmentIds = JSON.parse(existingList);
    const appointments = [];
    for (const id of appointmentIds) {
      const appointmentData = await KV.get(`appointment:${id}`);
      if (appointmentData) {
        const appointment = JSON.parse(appointmentData);
        appointments.push(appointment);
      }
    }
    appointments.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
    return new Response(JSON.stringify({ appointments }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return new Response(JSON.stringify({ message: "Error fetching appointments" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const PATCH = async ({ request, locals }) => {
  const KV = locals?.runtime?.env?.APPOINTMENTS_KV;
  if (!KV) {
    return new Response(JSON.stringify({ message: "KV store not available" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { id, status } = body;
    if (!id || !status) {
      return new Response(JSON.stringify({ message: "Missing id or status" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const appointmentData = await KV.get(`appointment:${id}`);
    if (!appointmentData) {
      return new Response(JSON.stringify({ message: "Appointment not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    const appointment = JSON.parse(appointmentData);
    const oldStatus = appointment.status;
    appointment.status = status;
    if (status === "confirmed" && !appointment.googleEventId) {
      const googleCalendarResult = await createGoogleCalendarEvent(appointment, locals);
      if (googleCalendarResult.success && googleCalendarResult.eventId) {
        appointment.googleEventId = googleCalendarResult.eventId;
      }
      await createAuditLog(
        KV,
        "Termin bestätigt",
        `Termin für ${appointment.name} (${appointment.email}) am ${DAY_NAMES[appointment.day]}, ${appointment.time} Uhr wurde bestätigt${googleCalendarResult.eventId ? " und in Google Calendar eingetragen" : ""}.`,
        appointment.id,
        "Admin"
      );
    }
    if (status === "cancelled" && appointment.googleEventId) {
      await deleteGoogleCalendarEvent(appointment.googleEventId, locals);
      await createAuditLog(
        KV,
        "Termin abgelehnt",
        `Termin für ${appointment.name} (${appointment.email}) am ${DAY_NAMES[appointment.day]}, ${appointment.time} Uhr wurde vom Admin abgelehnt.`,
        appointment.id,
        "Admin"
      );
    } else if (status === "cancelled") {
      await createAuditLog(
        KV,
        "Termin abgelehnt",
        `Termin für ${appointment.name} (${appointment.email}) am ${DAY_NAMES[appointment.day]}, ${appointment.time} Uhr wurde vom Admin abgelehnt.`,
        appointment.id,
        "Admin"
      );
    }
    await KV.put(`appointment:${id}`, JSON.stringify(appointment));
    return new Response(JSON.stringify({ success: true, appointment }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error updating appointment:", error);
    return new Response(JSON.stringify({ message: "Error updating appointment" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const DELETE = async ({ request, locals }) => {
  const KV = locals?.runtime?.env?.APPOINTMENTS_KV;
  if (!KV) {
    return new Response(JSON.stringify({ message: "KV store not available" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { id } = body;
    if (!id) {
      return new Response(JSON.stringify({ message: "Missing id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const appointmentData = await KV.get(`appointment:${id}`);
    if (!appointmentData) {
      return new Response(JSON.stringify({ message: "Appointment not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    const appointment = JSON.parse(appointmentData);
    if (appointment.googleEventId) {
      await deleteGoogleCalendarEvent(appointment.googleEventId, locals);
    }
    try {
      await KV.delete(`appointment:${id}`);
      const appointmentDate = new Date(appointment.appointmentDate);
      const dateKey = appointmentDate.toISOString().split("T")[0];
      const slotKey = `slot:${appointment.day}:${appointment.time}:${dateKey}`;
      const existingSlotData = await KV.get(slotKey);
      if (existingSlotData) {
        const slotAppointments = JSON.parse(existingSlotData);
        const updatedSlotAppointments = slotAppointments.filter((aptId) => aptId !== id);
        if (updatedSlotAppointments.length > 0) {
          await KV.put(
            slotKey,
            JSON.stringify(updatedSlotAppointments),
            { expirationTtl: 60 * 60 * 24 * 30 }
          );
        } else {
          await KV.delete(slotKey);
        }
      }
      const allAppointmentsKey = "appointments:list";
      const existingList = await KV.get(allAppointmentsKey);
      if (existingList) {
        const appointmentsList = JSON.parse(existingList);
        const updatedList = appointmentsList.filter((aptId) => aptId !== id);
        await KV.put(
          allAppointmentsKey,
          JSON.stringify(updatedList),
          { expirationTtl: 60 * 60 * 24 * 30 }
        );
      }
      await createAuditLog(
        KV,
        "Termin gelöscht",
        `Termin für ${appointment.name} (${appointment.email}) am ${DAY_NAMES[appointment.day]}, ${appointment.time} Uhr wurde vom Admin dauerhaft gelöscht.`,
        appointment.id,
        "Admin"
      );
      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } catch (kvError) {
      console.error("KV Store error during deletion:", kvError);
      return new Response(
        JSON.stringify({
          message: "Fehler beim Löschen des Termins",
          error: kvError instanceof Error ? kvError.message : "Unknown error"
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return new Response(JSON.stringify({ message: "Error deleting appointment" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
async function createGoogleCalendarEvent(appointment, locals) {
  const googleClientId = locals?.runtime?.env?.GOOGLE_CLIENT_ID || "";
  const googleClientSecret = locals?.runtime?.env?.GOOGLE_CLIENT_SECRET || "";
  const googleRefreshToken = locals?.runtime?.env?.GOOGLE_REFRESH_TOKEN || "";
  if (!googleClientId || !googleClientSecret || !googleRefreshToken) {
    console.error("Google credentials not configured");
    return { success: false };
  }
  try {
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
      console.error("Failed to get access token");
      return { success: false };
    }
    const tokenData = await tokenResponse.json();
    const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || "" || "primary";
    const [hours, minutes] = appointment.time.split(":").map(Number);
    const startDate = new Date(appointment.appointmentDate);
    startDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(startDate);
    endDate.setMinutes(endDate.getMinutes() + 30);
    const event = {
      summary: `Termin: ${appointment.name}`,
      description: `
Termin mit ${appointment.name}
${appointment.company ? `Firma: ${appointment.company}
` : ""}
Telefon: ${appointment.phone}
E-Mail: ${appointment.email}
${appointment.message ? `
Nachricht: ${appointment.message}` : ""}
      `.trim(),
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
      ]
    };
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
      return { success: true, eventId: result.id };
    } else {
      const error = await response.text();
      console.error("Google Calendar API error:", error);
      return { success: false };
    }
  } catch (error) {
    console.error("Error creating Google Calendar event:", error);
    return { success: false };
  }
}
async function deleteGoogleCalendarEvent(eventId, locals) {
  const googleClientId = locals?.runtime?.env?.GOOGLE_CLIENT_ID || "";
  const googleClientSecret = locals?.runtime?.env?.GOOGLE_CLIENT_SECRET || "";
  const googleRefreshToken = locals?.runtime?.env?.GOOGLE_REFRESH_TOKEN || "";
  if (!googleClientId || !googleClientSecret || !googleRefreshToken) {
    console.error("Google credentials not configured");
    return { success: false };
  }
  try {
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
      console.error("Failed to get access token for deletion");
      return { success: false };
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
    if (response.ok || response.status === 404 || response.status === 410) {
      return { success: true };
    } else {
      const error = await response.text();
      console.error("Google Calendar API delete error:", error);
      return { success: false };
    }
  } catch (error) {
    console.error("Error deleting Google Calendar event:", error);
    return { success: false };
  }
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE,
  GET,
  PATCH
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
