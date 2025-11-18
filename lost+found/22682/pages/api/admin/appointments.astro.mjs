globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../../renderers.mjs';

const GET = async ({ locals }) => {
  const KV = locals?.runtime?.env?.APPOINTMENTS_KV;
  if (!KV) {
    return new Response(JSON.stringify({ message: "KV store not available" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const list = await KV.list();
    const appointments = [];
    for (const key of list.keys) {
      const value = await KV.get(key.name);
      if (value) {
        const appointment = JSON.parse(value);
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
    const { id, status } = await request.json();
    if (!id || !status) {
      return new Response(JSON.stringify({ message: "Missing id or status" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const appointmentData = await KV.get(id);
    if (!appointmentData) {
      return new Response(JSON.stringify({ message: "Appointment not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }
    const appointment = JSON.parse(appointmentData);
    appointment.status = status;
    if (status === "confirmed" && !appointment.googleEventId) {
      const googleCalendarResult = await createGoogleCalendarEvent(appointment, locals);
      if (googleCalendarResult.success && googleCalendarResult.eventId) {
        appointment.googleEventId = googleCalendarResult.eventId;
      }
    }
    if (status === "cancelled" && appointment.googleEventId) {
      await deleteGoogleCalendarEvent(appointment.googleEventId, locals);
    }
    await KV.put(id, JSON.stringify(appointment));
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
    const { id } = await request.json();
    if (!id) {
      return new Response(JSON.stringify({ message: "Missing id" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const appointmentData = await KV.get(id);
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
    await KV.delete(id);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return new Response(JSON.stringify({ message: "Error deleting appointment" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
async function createGoogleCalendarEvent(appointment, locals) {
  const accessToken = locals?.runtime?.env?.GOOGLE_ACCESS_TOKEN;
  const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || "primary";
  if (!accessToken) {
    console.error("Google access token not configured");
    return { success: false };
  }
  try {
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
      location: "Opti 2026 - Messe München",
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
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
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
  const accessToken = locals?.runtime?.env?.GOOGLE_ACCESS_TOKEN;
  const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || "primary";
  if (!accessToken) {
    console.error("Google access token not configured");
    return { success: false };
  }
  try {
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${accessToken}`
        }
      }
    );
    if (response.ok || response.status === 404) {
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
