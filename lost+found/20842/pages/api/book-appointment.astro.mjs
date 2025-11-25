globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAuditLog } from '../../chunks/audit-log_BDxUJbGF.mjs';
import { v as validateFormData, g as getAppointmentUrl, a as sendAdminNotification, s as sendCustomerNotification } from '../../chunks/url-utils_DFkUyZnU.mjs';
import { K as KV_KEYS, a as getSettings, b as getAllAppointments, s as saveAppointment, f as addToAppointmentsList, r as removeFromAppointmentsList } from '../../chunks/kv-utils_B0Om6nsN.mjs';
import { g as getLongLabel, a as getEventDateISO } from '../../chunks/event-config_hIr2Xf8F.mjs';
import { i as isSlotAvailable, a as reserveSlot, r as releaseSlot } from '../../chunks/slot-utils_CyY0Z7gC.mjs';
import { c as createAppointmentDateTime } from '../../chunks/date-utils_D4nZ-TEO.mjs';
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
    const settings = await getSettings(kv);
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
    if (!["friday", "saturday", "saturday", "sunday"].includes(day)) {
      return new Response(
        JSON.stringify({ message: "Ungültiger Tag ausgewählt" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    if (settings.preventDuplicateEmail !== false) {
      const allAppointments = await getAllAppointments(kv);
      const existingAppointment = allAppointments.find(
        (apt) => apt.email.toLowerCase() === sanitizedData.email.toLowerCase() && apt.status !== "cancelled"
      );
      if (existingAppointment) {
        await createAuditLog(
          kv,
          "Doppelbuchung verhindert",
          `E-Mail ${sanitizedData.email} hat versucht, einen zweiten Termin zu buchen. Bestehender Termin: ${existingAppointment.id}. IP: ${clientIP}`,
          existingAppointment.id,
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
    const eventDateISO = getEventDateISO(day, settings);
    const appointmentDateTimeStr = createAppointmentDateTime(eventDateISO, time);
    const appointmentDate = new Date(appointmentDateTimeStr);
    const endDate = new Date(appointmentDate);
    endDate.setMinutes(appointmentDate.getMinutes() + (settings.appointmentDurationMinutes || 30));
    const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const appointmentUrl = getAppointmentUrl(appointmentId, locals?.runtime?.env, url.origin);
    const autoConfirm = settings.bookingMode === "automatic";
    const dateKey = eventDateISO;
    const slotAvailable = await isSlotAvailable(kv, day, time, dateKey, settings.maxAppointmentsPerSlot);
    if (!slotAvailable) {
      return new Response(
        JSON.stringify({
          message: "Dieser Zeitslot ist leider bereits ausgebucht. Bitte wählen Sie einen anderen Zeitpunkt."
        }),
        { status: 409, headers: { "Content-Type": "application/json" } }
      );
    }
    const slotReserved = await reserveSlot(kv, day, time, dateKey, appointmentId);
    if (!slotReserved) {
      console.error("Failed to reserve slot");
      return new Response(
        JSON.stringify({ message: "Fehler beim Reservieren des Zeitslots" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
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
      appointmentDate: appointmentDateTimeStr,
      googleEventId: "",
      // Wird später gesetzt
      status: autoConfirm ? "confirmed" : "pending",
      createdAt: (/* @__PURE__ */ new Date()).toISOString()
    };
    const googleClientId = locals?.runtime?.env?.GOOGLE_CLIENT_ID || undefined                                ;
    const googleClientSecret = locals?.runtime?.env?.GOOGLE_CLIENT_SECRET || undefined                                    ;
    const googleRefreshToken = locals?.runtime?.env?.GOOGLE_REFRESH_TOKEN || undefined                                    ;
    let googleEventId = "";
    try {
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
            const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || undefined                                   || "primary";
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
              // ❌ ENTFERNT: attendees würde Google dazu bringen, E-Mails zu senden
              // attendees: [{ email: sanitizedData.email, displayName: sanitizedData.name }],
              reminders: {
                useDefault: false,
                overrides: [
                  { method: "popup", minutes: 30 }
                ]
              }
            };
            const calendarResponse = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=none`,
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
              appointment.googleEventId = googleEventId;
              console.log(`✅ Google Calendar event created: ${googleEventId}`);
            } else {
              console.error("❌ Google Calendar API error:", await calendarResponse.text());
            }
          }
        } catch (error) {
          console.error("❌ Google Calendar error:", error);
          await createAuditLog(
            kv,
            "⚠️ Google Calendar Fehler",
            `Fehler beim Erstellen des Calendar-Events für ${sanitizedData.name}: ${error instanceof Error ? error.message : "Unbekannt"}`,
            appointmentId,
            "system"
          );
        }
      }
      const saved = await saveAppointment(kv, appointment);
      if (!saved) {
        throw new Error("Failed to save appointment");
      }
      console.log(`✅ Appointment saved: ${appointmentId}`);
      await addToAppointmentsList(kv, appointmentId);
      console.log(`✅ Added to appointments:list`);
      const actionText = autoConfirm ? "Termin gebucht" : "Terminanfrage eingegangen";
      const statusText = autoConfirm ? "bestätigt" : "ausstehend";
      await createAuditLog(
        kv,
        actionText,
        `${sanitizedData.name} (${sanitizedData.email}) hat einen Termin für ${DAY_NAMES_FULL[day]}, ${time} Uhr ${autoConfirm ? "gebucht" : "angefragt"}. Status: ${statusText}. IP: ${clientIP}`,
        appointmentId,
        sanitizedData.email
      );
      const emailData = {
        name: sanitizedData.name,
        company: sanitizedData.company,
        phone: sanitizedData.phone,
        email: sanitizedData.email,
        day: eventDateISO,
        time,
        message: sanitizedData.message,
        appointmentUrl,
        action: autoConfirm ? "instant-booked" : "requested",
        status: autoConfirm ? "confirmed" : "pending"
      };
      try {
        if (settings.emailNotifications && settings.adminEmail) {
          const adminEmailSent = await sendAdminNotification(
            emailData,
            settings.adminEmail,
            locals?.runtime?.env
          );
          if (adminEmailSent) {
            console.log(`✅ Admin notification sent to ${settings.adminEmail}`);
          } else {
            console.error(`❌ Failed to send admin notification`);
          }
        }
        const customerEmailSent = await sendCustomerNotification(
          emailData,
          locals?.runtime?.env
        );
        if (customerEmailSent) {
          console.log(`✅ Customer notification sent to ${sanitizedData.email}`);
        } else {
          console.error(`❌ Failed to send customer notification`);
        }
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
      console.error("❌ Booking process error:", error);
      try {
        console.log("⚠️ Starting cleanup after booking error...");
        await releaseSlot(kv, day, time, dateKey, appointmentId);
        await removeFromAppointmentsList(kv, appointmentId);
        await kv.delete(`appointment:${appointmentId}`);
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
              const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || undefined                                   || "primary";
              await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}?sendUpdates=none`,
                {
                  method: "DELETE",
                  headers: { Authorization: `Bearer ${tokenData.access_token}` }
                }
              );
              console.log(`✅ Google Calendar cleanup successful: ${googleEventId}`);
            }
          } catch (calError) {
            console.error("❌ Failed to cleanup Google Calendar event:", calError);
          }
        }
        await createAuditLog(
          kv,
          "❌ Buchungsfehler",
          `Fehler beim Speichern des Termins für ${sanitizedData.name} (${sanitizedData.email}). Cleanup durchgeführt. IP: ${clientIP}`,
          appointmentId,
          sanitizedData.email
        );
        console.log("✅ Cleanup completed successfully");
      } catch (cleanupError) {
        console.error("❌ Failed to cleanup after error:", cleanupError);
      }
      return new Response(
        JSON.stringify({
          message: "Fehler beim Speichern des Termins. Bitte versuchen Sie es erneut.",
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
