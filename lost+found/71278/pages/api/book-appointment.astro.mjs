globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAuditLog } from '../../chunks/audit-log_CTvpblnZ.mjs';
import { v as validateFormData, a as sendAdminNotification, s as sendCustomerNotification } from '../../chunks/email_Cbsm-LWA.mjs';
import { K as KV_KEYS, D as DEFAULT_SETTINGS } from '../../chunks/constants_BIo0cEWV.mjs';
import { a as getLongLabel, c as getEventDate } from '../../chunks/event-config_Bu30ckYK.mjs';
export { renderers } from '../../renderers.mjs';

async function checkRateLimit(ip, kv, settings) {
  if (!settings.rateLimitingEnabled) {
    return { allowed: true };
  }
  const key = KV_KEYS.RATE_LIMIT(ip);
  const now = /* @__PURE__ */ new Date();
  const windowMs = settings.rateLimitWindowMinutes * 60 * 1e3;
  try {
    const existingData = await kv.get(key);
    if (!existingData) {
      const newEntry = {
        ip,
        requests: 1,
        firstRequest: now.toISOString(),
        lastRequest: now.toISOString()
      };
      await kv.put(
        key,
        JSON.stringify(newEntry),
        { expirationTtl: Math.ceil(windowMs / 1e3) + 60 }
      );
      return {
        allowed: true,
        remaining: settings.rateLimitMaxRequests - 1,
        resetAt: new Date(now.getTime() + windowMs).toISOString()
      };
    }
    const entry = JSON.parse(existingData);
    const firstRequestTime = new Date(entry.firstRequest);
    const timeSinceFirst = now.getTime() - firstRequestTime.getTime();
    if (timeSinceFirst > windowMs) {
      const newEntry = {
        ip,
        requests: 1,
        firstRequest: now.toISOString(),
        lastRequest: now.toISOString()
      };
      await kv.put(
        key,
        JSON.stringify(newEntry),
        { expirationTtl: Math.ceil(windowMs / 1e3) + 60 }
      );
      return {
        allowed: true,
        remaining: settings.rateLimitMaxRequests - 1,
        resetAt: new Date(now.getTime() + windowMs).toISOString()
      };
    }
    if (entry.requests >= settings.rateLimitMaxRequests) {
      const resetAt = new Date(firstRequestTime.getTime() + windowMs);
      return {
        allowed: false,
        remaining: 0,
        resetAt: resetAt.toISOString()
      };
    }
    entry.requests += 1;
    entry.lastRequest = now.toISOString();
    await kv.put(
      key,
      JSON.stringify(entry),
      { expirationTtl: Math.ceil(windowMs / 1e3) + 60 }
    );
    return {
      allowed: true,
      remaining: settings.rateLimitMaxRequests - entry.requests,
      resetAt: new Date(firstRequestTime.getTime() + windowMs).toISOString()
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    return { allowed: true };
  }
}
function getClientIP(request) {
  const cfConnectingIP = request.headers.get("cf-connecting-ip");
  if (cfConnectingIP) return cfConnectingIP;
  const xForwardedFor = request.headers.get("x-forwarded-for");
  if (xForwardedFor) {
    return xForwardedFor.split(",")[0].trim();
  }
  const xRealIP = request.headers.get("x-real-ip");
  if (xRealIP) return xRealIP;
  return "unknown";
}

const DAY_NAMES_FULL = {
  friday: getLongLabel("friday"),
  saturday: getLongLabel("saturday"),
  sunday: getLongLabel("sunday")
};
const POST = async ({ request, locals, url }) => {
  try {
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
    const settingsData = await kv.get("settings");
    const settings = settingsData ? JSON.parse(settingsData) : {
      ...DEFAULT_SETTINGS,
      rateLimitingEnabled: true
      // Standard: AN
    };
    const clientIP = getClientIP(request);
    const rateLimitResult = await checkRateLimit(clientIP, kv, settings);
    if (!rateLimitResult.allowed) {
      const resetDate = rateLimitResult.resetAt ? new Date(rateLimitResult.resetAt).toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" }) : "bald";
      await createAuditLog(
        kv,
        "Rate Limit erreicht",
        `IP ${clientIP} hat das Rate Limit erreicht. Nächster Reset: ${resetDate}`,
        void 0,
        clientIP
      );
      return new Response(
        JSON.stringify({
          message: `Zu viele Anfragen. Bitte versuchen Sie es um ${resetDate} Uhr erneut.`,
          retryAt: rateLimitResult.resetAt
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(settings.rateLimitWindowMinutes * 60)
          }
        }
      );
    }
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
    if (settings.preventDuplicateEmail !== false) {
      const allAppointmentsKey = "appointments:list";
      const existingList = await kv.get(allAppointmentsKey);
      const appointmentsList = existingList ? JSON.parse(existingList) : [];
      for (const aptId of appointmentsList) {
        const aptData = await kv.get(`appointment:${aptId}`);
        if (aptData) {
          const apt = JSON.parse(aptData);
          if (apt.email.toLowerCase() === sanitizedData.email.toLowerCase() && apt.status !== "cancelled") {
            await createAuditLog(
              kv,
              "Doppelbuchung verhindert",
              `E-Mail ${sanitizedData.email} hat versucht, einen zweiten Termin zu buchen. Bestehender Termin: ${apt.id}. IP: ${clientIP}`,
              apt.id,
              sanitizedData.email
            );
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
    const eventDate = getEventDate(day, settings);
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
    if (activeBookingsCount >= settings.maxAppointmentsPerSlot) {
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
    const autoConfirm = settings.bookingMode === "automatic";
    if (autoConfirm && googleClientId && googleClientSecret && googleRefreshToken) {
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
          const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || "fynn.klinkow@moro-gmbh.de";
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
            attendees: [{ email: sanitizedData.email, displayName: sanitizedData.name }],
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
      await kv.put(slotKey, JSON.stringify(slotAppointments), { expirationTtl: 60 * 60 * 24 * 90 });
      const allAppointmentsKey = "appointments:list";
      const existingList = await kv.get(allAppointmentsKey);
      const appointmentsList = existingList ? JSON.parse(existingList) : [];
      appointmentsList.push(appointmentId);
      await kv.put(allAppointmentsKey, JSON.stringify(appointmentsList), { expirationTtl: 60 * 60 * 24 * 90 });
      const actionText = autoConfirm ? "Termin gebucht" : "Terminanfrage eingegangen";
      const statusText = autoConfirm ? "bestätigt" : "ausstehend";
      await createAuditLog(
        kv,
        actionText,
        `${sanitizedData.name} (${sanitizedData.email}) hat einen Termin für ${DAY_NAMES_FULL[day]}, ${time} Uhr ${autoConfirm ? "gebucht" : "angefragt"}. Status: ${statusText}. IP: ${clientIP}`,
        appointmentId,
        sanitizedData.email
      );
      try {
        await sendAdminNotification(appointment, settings, autoConfirm ? "confirmed" : "requested", locals);
        await sendCustomerNotification(appointment, settings, autoConfirm ? "confirmed" : "requested", locals);
        console.log(`✅ Email notifications sent`);
      } catch (emailError) {
        console.error("Error sending notifications:", emailError);
      }
      return new Response(
        JSON.stringify({
          message: autoConfirm ? "Termin erfolgreich gebucht" : "Terminanfrage eingegangen",
          appointmentId,
          appointmentUrl,
          autoConfirmed: autoConfirm,
          ...googleEventId && { googleEventId },
          ...rateLimitResult.remaining !== void 0 && {
            rateLimitRemaining: rateLimitResult.remaining
          }
        }),
        { status: 200, headers: { "Content-Type": "application/json" } }
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
            const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || "fynn.klinkow@moro-gmbh.de";
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
