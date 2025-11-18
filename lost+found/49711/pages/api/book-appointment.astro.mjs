globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAuditLog } from '../../chunks/audit-log_CTvpblnZ.mjs';
import { v as validateFormData, s as sendAdminNotification, a as sendCustomerNotification } from '../../chunks/email_kw6sVTh_.mjs';
export { renderers } from '../../renderers.mjs';

const DAY_NAMES = {
  friday: "Freitag, 16.01.2026",
  saturday: "Samstag, 17.01.2026",
  sunday: "Sonntag, 18.01.2026"
};
const EVENT_DATES = {
  friday: /* @__PURE__ */ new Date("2026-01-16"),
  saturday: /* @__PURE__ */ new Date("2026-01-17"),
  sunday: /* @__PURE__ */ new Date("2026-01-18")
};
const DEFAULT_MAX_BOOKINGS = 2;
const SETTINGS_KEY = "app:settings";
const POST = async ({ request, locals, url }) => {
  try {
    const body = await request.json();
    const { day, time, name, company, phone, email, message } = body;
    const validation = validateFormData({
      name,
      company: company || "",
      phone,
      email,
      message: message || "",
      time
    });
    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      return new Response(
        JSON.stringify({ message: firstError }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const sanitizedData = validation.sanitized;
    if (!["friday", "saturday", "sunday"].includes(day)) {
      return new Response(
        JSON.stringify({ message: "Ungültiger Tag ausgewählt" }),
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
    let autoConfirm = false;
    let maxBookingsPerSlot = DEFAULT_MAX_BOOKINGS;
    let preventDuplicateEmail = true;
    let emailNotifications = false;
    let adminEmail = "";
    try {
      const settingsData = await kv.get(SETTINGS_KEY);
      if (settingsData) {
        const settings = JSON.parse(settingsData);
        autoConfirm = settings.autoConfirm || false;
        maxBookingsPerSlot = settings.maxBookingsPerSlot || DEFAULT_MAX_BOOKINGS;
        preventDuplicateEmail = settings.preventDuplicateEmail ?? true;
        emailNotifications = settings.emailNotifications || false;
        adminEmail = settings.adminEmail || "";
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
          if (apt.email.toLowerCase() === sanitizedData.email.toLowerCase() && apt.status !== "cancelled") {
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
    const eventDate = EVENT_DATES[day];
    const appointmentDate = new Date(eventDate);
    const [hours, minutes] = time.split(":").map(Number);
    appointmentDate.setHours(hours, minutes, 0, 0);
    const endDate = new Date(appointmentDate);
    endDate.setMinutes(appointmentDate.getMinutes() + 30);
    const slotKey = `slot:${day}:${time}:${appointmentDate.toISOString().split("T")[0]}`;
    const existingSlotData = await kv.get(slotKey);
    const slotAppointments = existingSlotData ? JSON.parse(existingSlotData) : [];
    let activeBookingsCount = 0;
    for (const aptId of slotAppointments) {
      const aptData = await kv.get(`appointment:${aptId}`);
      if (aptData) {
        const apt = JSON.parse(aptData);
        if (apt.status !== "cancelled") {
          activeBookingsCount++;
        }
      }
    }
    if (activeBookingsCount >= maxBookingsPerSlot) {
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
- Name: ${sanitizedData.name}
${sanitizedData.company ? `- Betrieb: ${sanitizedData.company}` : ""}
- Telefon: ${sanitizedData.phone}
- E-Mail: ${sanitizedData.email}
${sanitizedData.message ? `- Nachricht: ${sanitizedData.message}` : ""}

Termin verwalten: ${appointmentUrl}
          `.trim();
          const event = {
            summary: `Termin: ${sanitizedData.name}${sanitizedData.company ? ` (${sanitizedData.company})` : ""}`,
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
                email: sanitizedData.email,
                displayName: sanitizedData.name
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
      name: sanitizedData.name,
      company: sanitizedData.company || void 0,
      phone: sanitizedData.phone,
      email: sanitizedData.email,
      message: sanitizedData.message || void 0,
      appointmentDate: appointmentDate.toISOString(),
      googleEventId,
      status: autoConfirm ? "confirmed" : "pending",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    try {
      await kv.put(
        `appointment:${appointmentId}`,
        JSON.stringify(appointment),
        { expirationTtl: 60 * 60 * 24 * 90 }
      );
      slotAppointments.push(appointmentId);
      await kv.put(
        slotKey,
        JSON.stringify(slotAppointments),
        { expirationTtl: 60 * 60 * 24 * 90 }
      );
      const allAppointmentsKey = "appointments:list";
      const existingList = await kv.get(allAppointmentsKey);
      const appointmentsList = existingList ? JSON.parse(existingList) : [];
      appointmentsList.push(appointmentId);
      await kv.put(
        allAppointmentsKey,
        JSON.stringify(appointmentsList),
        { expirationTtl: 60 * 60 * 24 * 90 }
      );
      const actionText = autoConfirm ? "Termin gebucht" : "Terminanfrage eingegangen";
      const statusText = autoConfirm ? "bestätigt" : "ausstehend";
      await createAuditLog(
        kv,
        actionText,
        `${sanitizedData.name} (${sanitizedData.email}) hat einen Termin für ${DAY_NAMES[day]}, ${time} Uhr ${autoConfirm ? "gebucht" : "angefragt"}. Status: ${statusText}.`,
        appointmentId,
        sanitizedData.email
      );
      const emailData = {
        name: sanitizedData.name,
        email: sanitizedData.email,
        day: appointmentDate.toISOString().split("T")[0],
        time,
        company: sanitizedData.company || void 0,
        phone: sanitizedData.phone,
        message: sanitizedData.message || void 0,
        appointmentUrl,
        action: autoConfirm ? "instant-booked" : "requested",
        status: appointment.status
      };
      if (emailNotifications && adminEmail) {
        try {
          const adminEmailSent = await sendAdminNotification(
            { ...emailData, action: autoConfirm ? "confirmed" : "requested" },
            adminEmail,
            locals?.runtime?.env
          );
          if (adminEmailSent) {
            console.log(`✅ Admin notification sent`);
            await createAuditLog(
              kv,
              "E-Mail an Admin",
              `Admin-Benachrichtigung wurde gesendet.`,
              appointmentId,
              "system"
            );
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
          console.log(`✅ Customer notification sent`);
          await createAuditLog(
            kv,
            "E-Mail an Kunde",
            `${autoConfirm ? "Bestätigung" : "Bestätigungsanfrage"} wurde an ${sanitizedData.email} gesendet.`,
            appointmentId,
            "system"
          );
        }
      } catch (emailError) {
        console.error("Error sending customer notification:", emailError);
      }
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
