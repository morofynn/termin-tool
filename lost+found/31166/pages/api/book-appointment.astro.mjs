globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAuditLog } from '../../chunks/audit-log_CRKA170-.mjs';
export { renderers } from '../../renderers.mjs';

async function sendViaGmail(options, config) {
  try {
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
        grant_type: "refresh_token"
      })
    });
    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error("Gmail token error:", error);
      return false;
    }
    const { access_token } = await tokenResponse.json();
    const emailLines = [
      `From: ${options.from || config.userEmail}`,
      `To: ${options.to}`,
      `Subject: ${options.subject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=utf-8",
      "",
      options.html
    ];
    const email = emailLines.join("\r\n");
    const encodedEmail = btoa(unescape(encodeURIComponent(email))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const sendResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ raw: encodedEmail })
    });
    if (!sendResponse.ok) {
      const error = await sendResponse.text();
      console.error("Gmail send error:", error);
      return false;
    }
    console.log("✅ Email sent via Gmail API");
    return true;
  } catch (error) {
    console.error("Error sending email via Gmail:", error);
    return false;
  }
}
async function sendViaResend(options, apiKey) {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        from: options.from || "noreply@terminbuchung.de",
        to: [options.to],
        subject: options.subject,
        html: options.html
      })
    });
    if (!response.ok) {
      const error = await response.text();
      console.error("Resend API error:", error);
      return false;
    }
    return true;
  } catch (error) {
    console.error("Error sending email via Resend:", error);
    return false;
  }
}
async function sendViaSMTP(options, config) {
  try {
    if (config.provider === "mailgun") {
      const response = await fetch(`https://api.mailgun.net/v3/${config.domain}/messages`, {
        method: "POST",
        headers: {
          "Authorization": `Basic ${btoa(`api:${config.apiKey}`)}`,
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          from: options.from || `Terminbuchung <noreply@${config.domain}>`,
          to: options.to,
          subject: options.subject,
          html: options.html
        })
      });
      if (!response.ok) {
        const error = await response.text();
        console.error("Mailgun API error:", error);
        return false;
      }
      return true;
    }
    if (config.provider === "sendgrid") {
      const response = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${config.apiKey}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          personalizations: [{
            to: [{ email: options.to }]
          }],
          from: { email: options.from || "noreply@terminbuchung.de" },
          subject: options.subject,
          content: [{
            type: "text/html",
            value: options.html
          }]
        })
      });
      if (!response.ok) {
        const error = await response.text();
        console.error("SendGrid API error:", error);
        return false;
      }
      return true;
    }
    return false;
  } catch (error) {
    console.error("Error sending email via SMTP:", error);
    return false;
  }
}
async function sendEmail(options, env) {
  const googleClientId = env?.GOOGLE_CLIENT_ID || "";
  const googleClientSecret = env?.GOOGLE_CLIENT_SECRET || "";
  const googleRefreshToken = env?.GOOGLE_REFRESH_TOKEN || "";
  const googleUserEmail = env?.GOOGLE_USER_EMAIL || undefined                                 ;
  const resendApiKey = env?.RESEND_API_KEY || "";
  const mailgunApiKey = env?.MAILGUN_API_KEY || undefined                               ;
  const mailgunDomain = env?.MAILGUN_DOMAIN || undefined                              ;
  const sendgridApiKey = env?.SENDGRID_API_KEY || undefined                                ;
  if (googleClientId && googleClientSecret && googleRefreshToken && googleUserEmail) {
    console.log("📧 Attempting to send via Gmail API...");
    const success = await sendViaGmail(options, {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      refreshToken: googleRefreshToken,
      userEmail: googleUserEmail
    });
    if (success) {
      console.log("✅ Email sent successfully via Gmail");
      return true;
    }
    console.warn("⚠️ Gmail API failed, trying fallback providers...");
  }
  if (resendApiKey) {
    console.log("📧 Attempting to send via Resend...");
    return await sendViaResend(options, resendApiKey);
  }
  if (mailgunApiKey && mailgunDomain) {
    console.log("📧 Attempting to send via Mailgun...");
    return await sendViaSMTP(options, {
      apiKey: mailgunApiKey,
      domain: mailgunDomain,
      provider: "mailgun"
    });
  }
  if (sendgridApiKey) {
    console.log("📧 Attempting to send via SendGrid...");
    return await sendViaSMTP(options, {
      apiKey: sendgridApiKey,
      domain: "",
      provider: "sendgrid"
    });
  }
  console.warn("⚠️ No email provider configured. Skipping email notification.");
  return false;
}
function generateAdminNotificationEmail(data) {
  const statusText = data.status === "confirmed" ? "bestätigt" : "ausstehend";
  const statusColor = data.status === "confirmed" ? "#16a34a" : "#ca8a04";
  const statusBg = data.status === "confirmed" ? "#dcfce7" : "#fef3c7";
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Neue Terminbuchung</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, #2d62ff 0%, #1e48c8 100%); padding: 40px 30px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 700;">
                ${data.status === "confirmed" ? "✅ Neue Terminbuchung" : "⏳ Neue Terminanfrage"}
              </h1>
              <p style="color: #e0e7ff; font-size: 16px; margin: 10px 0 0 0;">
                ${data.status === "confirmed" ? "Ein Termin wurde automatisch bestätigt" : "Eine Terminanfrage wartet auf Ihre Bestätigung"}
              </p>
            </td>
          </tr>

          <!-- Status Badge -->
          <tr>
            <td style="padding: 20px 30px;">
              <div style="background-color: ${statusBg}; border: 2px solid ${statusColor}; border-radius: 12px; padding: 15px; text-align: center;">
                <span style="color: ${statusColor}; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                  Status: ${statusText}
                </span>
              </div>
            </td>
          </tr>

          <!-- Termin Details -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <h2 style="color: #111827; font-size: 20px; margin: 0 0 20px 0; font-weight: 600;">
                📅 Termin-Details
              </h2>
              
              <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; overflow: hidden;">
                <tr>
                  <td style="padding: 15px 20px; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 5px;">DATUM & UHRZEIT</strong>
                    <span style="color: #111827; font-size: 16px; font-weight: 600;">${data.day} um ${data.time} Uhr</span>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 20px; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 5px;">NAME</strong>
                    <span style="color: #111827; font-size: 16px;">${data.name}</span>
                  </td>
                </tr>
                ${data.company ? `
                <tr>
                  <td style="padding: 15px 20px; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 5px;">BETRIEB</strong>
                    <span style="color: #111827; font-size: 16px;">${data.company}</span>
                  </td>
                </tr>
                ` : ""}
                <tr>
                  <td style="padding: 15px 20px; border-bottom: 1px solid #e5e7eb;">
                    <strong style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 5px;">E-MAIL</strong>
                    <a href="mailto:${data.email}" style="color: #2d62ff; font-size: 16px; text-decoration: none;">${data.email}</a>
                  </td>
                </tr>
                <tr>
                  <td style="padding: 15px 20px;">
                    <strong style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 5px;">TELEFON</strong>
                    <a href="tel:${data.phone}" style="color: #2d62ff; font-size: 16px; text-decoration: none;">${data.phone}</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          ${data.message ? `
          <!-- Nachricht -->
          <tr>
            <td style="padding: 0 30px 20px 30px;">
              <h2 style="color: #111827; font-size: 20px; margin: 0 0 15px 0; font-weight: 600;">
                💬 Nachricht
              </h2>
              <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; border-left: 4px solid #2d62ff;">
                <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${data.message}</p>
              </div>
            </td>
          </tr>
          ` : ""}

          <!-- Call to Action -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <a href="${data.appointmentUrl}" style="display: block; background-color: #2d62ff; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; text-align: center; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(45, 98, 255, 0.3);">
                Termin im Admin-Panel anzeigen →
              </a>
            </td>
          </tr>

          ${data.status === "pending" ? `
          <!-- Pending Hinweis -->
          <tr>
            <td style="padding: 0 30px 30px 30px;">
              <div style="background-color: #fef3c7; border: 2px solid #fbbf24; border-radius: 12px; padding: 20px;">
                <p style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0;">
                  <strong>⚠️ Aktion erforderlich:</strong> Dieser Termin ist noch nicht bestätigt. 
                  Bitte prüfen Sie die Anfrage und bestätigen oder lehnen Sie diese im Admin-Panel ab.
                </p>
              </div>
            </td>
          </tr>
          ` : ""}

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 13px; margin: 0 0 10px 0;">
                Diese E-Mail wurde automatisch vom Terminbuchungs-System generiert.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                MORO GmbH • Eupener Str. 124 • 50933 Köln
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}
async function sendAdminNotification(data, adminEmail, env) {
  const subject = data.status === "confirmed" ? `✅ Neue Terminbuchung: ${data.name} am ${data.day} um ${data.time}` : `⏳ Neue Terminanfrage: ${data.name} am ${data.day} um ${data.time}`;
  const html = generateAdminNotificationEmail(data);
  return await sendEmail(
    {
      to: adminEmail,
      subject,
      html,
      from: "Terminbuchung <noreply@terminbuchung.de>"
    },
    env
  );
}

const DAY_NAMES = {
  friday: "Freitag, 16.01.2026",
  saturday: "Samstag, 17.01.2026",
  sunday: "Sonntag, 18.01.2026"
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
    let adminNotifications = false;
    let adminEmail = "";
    try {
      const settingsData = await kv.get(SETTINGS_KEY);
      if (settingsData) {
        const settings = JSON.parse(settingsData);
        autoConfirm = settings.autoConfirm || false;
        maxBookingsPerSlot = settings.maxBookingsPerSlot || DEFAULT_MAX_BOOKINGS;
        preventDuplicateEmail = settings.preventDuplicateEmail ?? true;
        adminNotifications = settings.adminNotifications || false;
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
      if (adminNotifications && adminEmail && isValidEmail(adminEmail)) {
        try {
          const emailSent = await sendAdminNotification(
            {
              name: sanitizedName,
              company: sanitizedCompany,
              phone: sanitizedPhone,
              email: sanitizedEmail,
              day: DAY_NAMES[day],
              time,
              message: sanitizedMessage,
              appointmentUrl,
              status: autoConfirm ? "confirmed" : "pending"
            },
            adminEmail,
            locals?.runtime?.env
          );
          if (emailSent) {
            console.log(`Admin notification sent to ${adminEmail}`);
            await createAuditLog(
              kv,
              "E-Mail versendet",
              `Admin-Benachrichtigung wurde an ${adminEmail} gesendet.`,
              appointmentId,
              "system"
            );
          } else {
            console.warn("Failed to send admin notification");
          }
        } catch (emailError) {
          console.error("Error sending admin notification:", emailError);
        }
      }
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
