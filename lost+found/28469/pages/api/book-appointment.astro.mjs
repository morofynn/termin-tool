globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAuditLog } from '../../chunks/audit-log_CRKA170-.mjs';
export { renderers } from '../../renderers.mjs';

const DAY_NAMES = {
  friday: "Freitag",
  saturday: "Samstag",
  sunday: "Sonntag"
};
const DEFAULT_MAX_BOOKINGS = 2;
const SETTINGS_KEY = "app:settings";
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}
function isValidPhone(phone) {
  const phoneRegex = /^[\d\s\-\+\(\)\/]{7,20}$/;
  return phoneRegex.test(phone);
}
function sanitizeInput(input, maxLength = 200) {
  return input.trim().substring(0, maxLength);
}
const POST = async ({ request, locals, url }) => {
  try {
    const body = await request.json();
    const { day, time, name, company, phone, email, message } = body;
    if (!day || !time || !name || !phone || !email) {
      return new Response(
        JSON.stringify({ message: "Alle Pflichtfelder müssen ausgefüllt werden" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (name.trim().length < 2 || name.trim().length > 100) {
      return new Response(
        JSON.stringify({ message: "Der Name muss zwischen 2 und 100 Zeichen lang sein" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!isValidEmail(email)) {
      return new Response(
        JSON.stringify({ message: "Bitte geben Sie eine gültige E-Mail-Adresse ein" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!isValidPhone(phone)) {
      return new Response(
        JSON.stringify({ message: "Bitte geben Sie eine gültige Telefonnummer ein" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!["friday", "saturday", "sunday"].includes(day)) {
      return new Response(
        JSON.stringify({ message: "Ungültiger Tag ausgewählt" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (!/^\d{2}:\d{2}$/.test(time)) {
      return new Response(
        JSON.stringify({ message: "Ungültiges Zeitformat" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const sanitizedName = sanitizeInput(name, 100);
    const sanitizedCompany = company ? sanitizeInput(company, 100) : void 0;
    const sanitizedMessage = message ? sanitizeInput(message, 500) : void 0;
    const sanitizedPhone = sanitizeInput(phone, 20);
    const sanitizedEmail = sanitizeInput(email, 100);
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
    let autoConfirm = false;
    let maxBookingsPerSlot = DEFAULT_MAX_BOOKINGS;
    let preventDuplicateEmail = true;
    try {
      const settingsData = await kv.get(SETTINGS_KEY);
      if (settingsData) {
        const settings = JSON.parse(settingsData);
        autoConfirm = settings.autoConfirm || false;
        maxBookingsPerSlot = settings.maxBookingsPerSlot || DEFAULT_MAX_BOOKINGS;
        preventDuplicateEmail = settings.preventDuplicateEmail ?? true;
      }
    } catch (error) {
      console.error("Error loading settings, using defaults:", error);
    }
    console.log(`Booking with autoConfirm: ${autoConfirm}, maxBookingsPerSlot: ${maxBookingsPerSlot}, preventDuplicateEmail: ${preventDuplicateEmail}`);
    if (preventDuplicateEmail) {
      const allAppointmentsKey = "appointments:list";
      const existingList = await kv.get(allAppointmentsKey);
      const appointmentsList = existingList ? JSON.parse(existingList) : [];
      for (const aptId of appointmentsList) {
        const aptData = await kv.get(`appointment:${aptId}`);
        if (aptData) {
          const apt = JSON.parse(aptData);
          if (apt.email.toLowerCase() === sanitizedEmail.toLowerCase() && apt.status !== "cancelled") {
            return new Response(
              JSON.stringify({
                message: "Mit dieser E-Mail-Adresse wurde bereits ein Termin gebucht. Bitte verwenden Sie eine andere E-Mail-Adresse oder stornieren Sie Ihren bestehenden Termin."
              }),
              { status: 409, headers: { "Content-Type": "application/json" } }
            );
          }
        }
      }
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
    if (slotAppointments.length >= maxBookingsPerSlot) {
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
    const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const baseUrl = url.origin;
    const appointmentUrl = `${baseUrl}/termin/${appointmentId}`;
    if (autoConfirm && googleClientId && googleClientSecret && googleRefreshToken) {
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
          const tokenData = await tokenResponse.json();
          const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || "" || "primary";
          const description = `
Termin-Details:
- Name: ${sanitizedName}
${sanitizedCompany ? `- Betrieb: ${sanitizedCompany}` : ""}
- Telefon: ${sanitizedPhone}
- E-Mail: ${sanitizedEmail}
${sanitizedMessage ? `- Nachricht: ${sanitizedMessage}` : ""}

Termin verwalten: ${appointmentUrl}
          `.trim();
          const event = {
            summary: `Termin: ${sanitizedName}${sanitizedCompany ? ` (${sanitizedCompany})` : ""}`,
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
                email: sanitizedEmail,
                displayName: sanitizedName
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
                Authorization: `Bearer ${tokenData.access_token}`,
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
    const appointment = {
      id: appointmentId,
      day,
      time,
      name: sanitizedName,
      company: sanitizedCompany,
      phone: sanitizedPhone,
      email: sanitizedEmail,
      message: sanitizedMessage,
      appointmentDate: appointmentDate.toISOString(),
      googleEventId,
      status: autoConfirm ? "confirmed" : "pending",
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
      const actionText = autoConfirm ? "Termin gebucht" : "Terminanfrage eingegangen";
      const statusText = autoConfirm ? "bestätigt" : "ausstehend";
      await createAuditLog(
        kv,
        actionText,
        `${sanitizedName} (${sanitizedEmail}) hat einen Termin für ${DAY_NAMES[day]}, ${time} Uhr ${autoConfirm ? "gebucht" : "angefragt"}. Status: ${statusText}.`,
        appointmentId,
        sanitizedEmail
      );
      console.log(`Should send email to ${sanitizedEmail} with appointment link: ${appointmentUrl}`);
      return new Response(
        JSON.stringify({
          message: autoConfirm ? "Termin erfolgreich gebucht" : "Terminanfrage eingegangen",
          appointmentId,
          appointmentUrl,
          autoConfirmed: autoConfirm,
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
            const tokenData = await tokenResponse.json();
            const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || "" || "primary";
            await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`,
              {
                method: "DELETE",
                headers: { Authorization: `Bearer ${tokenData.access_token}` }
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
