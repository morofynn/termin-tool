globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../renderers.mjs';

const MAX_BOOKINGS_PER_SLOT = 2;
const POST = async ({ request, locals }) => {
  try {
    const body = await request.json();
    const { day, time, name, company, phone, email, message } = body;
    if (!day || !time || !name || !phone || !email) {
      return new Response(
        JSON.stringify({ message: "Alle Pflichtfelder müssen ausgefüllt werden" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const kv = locals.runtime?.env?.APPOINTMENTS_KV;
    if (!kv) {
      console.error("KV namespace not available");
      return new Response(
        JSON.stringify({
          message: "Datenspeicher ist nicht verfügbar. Bitte kontaktieren Sie den Administrator."
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    const now = /* @__PURE__ */ new Date();
    const daysOfWeek = { friday: 5, saturday: 6, sunday: 0 };
    const targetDay = daysOfWeek[day];
    const currentDay = now.getDay();
    let daysUntilTarget = targetDay - currentDay;
    if (daysUntilTarget <= 0) {
      daysUntilTarget += 7;
    }
    const appointmentDate = new Date(now);
    appointmentDate.setDate(now.getDate() + daysUntilTarget);
    const [hours, minutes] = time.split(":").map(Number);
    appointmentDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(appointmentDate);
    endDate.setHours(appointmentDate.getHours() + 1);
    const slotKey = `slot:${day}:${time}:${appointmentDate.toISOString().split("T")[0]}`;
    const existingSlotData = await kv.get(slotKey);
    const slotAppointments = existingSlotData ? JSON.parse(existingSlotData) : [];
    if (slotAppointments.length >= MAX_BOOKINGS_PER_SLOT) {
      return new Response(
        JSON.stringify({
          message: "Dieser Zeitslot ist leider bereits ausgebucht. Bitte wählen Sie einen anderen Zeitpunkt."
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }
    const googleClientId = locals?.runtime?.env?.GOOGLE_CLIENT_ID || "";
    const googleClientSecret = locals?.runtime?.env?.GOOGLE_CLIENT_SECRET || "";
    const googleRefreshToken = locals?.runtime?.env?.GOOGLE_REFRESH_TOKEN || "";
    let googleEventId = "";
    if (googleClientId && googleClientSecret && googleRefreshToken) {
      try {
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded"
          },
          body: new URLSearchParams({
            client_id: googleClientId,
            client_secret: googleClientSecret,
            refresh_token: googleRefreshToken,
            grant_type: "refresh_token"
          })
        });
        if (tokenResponse.ok) {
          const { access_token } = await tokenResponse.json();
          const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || "" || "primary";
          const description = `
Termin-Details:
- Name: ${name}
${company ? `- Betrieb: ${company}` : ""}
- Telefon: ${phone}
- E-Mail: ${email}
${message ? `- Nachricht: ${message}` : ""}
          `.trim();
          const event = {
            summary: `Termin: ${name}${company ? ` (${company})` : ""}`,
            description,
            start: {
              dateTime: appointmentDate.toISOString(),
              timeZone: "Europe/Berlin"
            },
            end: {
              dateTime: endDate.toISOString(),
              timeZone: "Europe/Berlin"
            },
            attendees: [
              {
                email,
                displayName: name
              }
            ],
            reminders: {
              useDefault: false,
              overrides: [
                { method: "email", minutes: 24 * 60 },
                { method: "popup", minutes: 30 }
              ]
            }
          };
          const calendarResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${access_token}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify(event)
            }
          );
          if (calendarResponse.ok) {
            const createdEvent = await calendarResponse.json();
            googleEventId = createdEvent.id;
          } else {
            console.error("Failed to create Google Calendar event");
          }
        }
      } catch (error) {
        console.error("Google Calendar error:", error);
      }
    }
    const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const appointment = {
      id: appointmentId,
      day,
      time,
      name,
      company,
      phone,
      email,
      message,
      appointmentDate: appointmentDate.toISOString(),
      googleEventId,
      status: "confirmed",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    try {
      await kv.put(
        `appointment:${appointmentId}`,
        JSON.stringify(appointment),
        { expirationTtl: 60 * 60 * 24 * 30 }
        // 30 Tage
      );
      slotAppointments.push(appointmentId);
      await kv.put(
        slotKey,
        JSON.stringify(slotAppointments),
        { expirationTtl: 60 * 60 * 24 * 30 }
        // 30 Tage
      );
      const allAppointmentsKey = "appointments:list";
      const existingList = await kv.get(allAppointmentsKey);
      const appointmentsList = existingList ? JSON.parse(existingList) : [];
      appointmentsList.push(appointmentId);
      await kv.put(
        allAppointmentsKey,
        JSON.stringify(appointmentsList),
        { expirationTtl: 60 * 60 * 24 * 30 }
        // 30 Tage
      );
      return new Response(
        JSON.stringify({
          message: "Termin erfolgreich gebucht",
          appointmentId,
          ...googleEventId && { googleEventId }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("KV Store error:", error);
      if (googleEventId && googleClientId && googleClientSecret && googleRefreshToken) {
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
          if (tokenResponse.ok) {
            const { access_token } = await tokenResponse.json();
            const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || "" || "primary";
            await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${access_token}` }
              }
            );
          }
        } catch (deleteError) {
          console.error("Failed to cleanup Google Calendar event:", deleteError);
        }
      }
      return new Response(
        JSON.stringify({
          message: "Fehler beim Speichern des Termins",
          error: error instanceof Error ? error.message : "Unknown error"
        }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
  } catch (error) {
    console.error("Booking error:", error);
    return new Response(
      JSON.stringify({
        message: "Ein unerwarteter Fehler ist aufgetreten",
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
