globalThis.process ??= {}; globalThis.process.env ??= {};
import { a as generateCustomerCancellationEmail, g as generateCustomerConfirmationEmail, b as generateICS, c as generateCustomerRequestEmail, d as generateAdminNotificationEmail, e as generateCustomerReminderEmail } from './email-templates_Biu9xZAS.mjs';
import { c as createAuditLog } from './audit-log_D4J27ZDp.mjs';

async function loadEmailSettings(env) {
  try {
    const settingsJson = await env.APPOINTMENTS_KV?.get("settings");
    if (settingsJson) {
      const settings = JSON.parse(settingsJson);
      const eventYear = settings.eventYear || (/* @__PURE__ */ new Date()).getFullYear();
      const eventName = `${settings.eventName || "OPTI"} ${eventYear.toString().slice(-2)}`;
      return {
        companyName: settings.companyName || "MORO",
        companyAddress: settings.companyAddress || "Eupener Str. 124, 50933 Köln",
        companyPhone: settings.companyPhone || "+49 221 292 40 500",
        companyEmail: settings.companyEmail || "info@moro-gmbh.de",
        companyWebsite: settings.companyWebsite,
        logoUrl: settings.logoUrl,
        primaryColor: settings.primaryColor || "#2d62ff",
        standInfo: `${settings.eventLocation || "Stand B4.110"}, ${settings.eventHall || "Messe München"}`,
        eventName,
        // z.B. "OPTI 26"
        eventYear
        // z.B. 2026
      };
    }
  } catch (error) {
    console.error("Error loading email settings:", error);
  }
  const fallbackYear = (/* @__PURE__ */ new Date()).getFullYear();
  return {
    companyName: "MORO",
    companyAddress: "Eupener Str. 124, 50933 Köln",
    companyPhone: "+49 221 292 40 500",
    companyEmail: "info@moro-gmbh.de",
    primaryColor: "#2d62ff",
    standInfo: "Stand B4.110, Messe München",
    eventName: `OPTI ${fallbackYear.toString().slice(-2)}`,
    eventYear: fallbackYear
  };
}
function base64EncodeUTF8(str) {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  let binary = "";
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}
function encodeSubject(subject) {
  if (/^[\x00-\x7F]*$/.test(subject)) {
    return subject;
  }
  const encoded = base64EncodeUTF8(subject);
  return `=?UTF-8?B?${encoded}?=`;
}
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
      return { success: false, error: "Token refresh failed" };
    }
    const tokenData = await tokenResponse.json();
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    const encodedSubject = encodeSubject(options.subject);
    let emailContent = "";
    if (options.icsAttachment) {
      emailContent = [
        `From: ${options.from || config.userEmail}`,
        `To: ${options.to}`,
        `Subject: ${encodedSubject}`,
        "MIME-Version: 1.0",
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        "",
        `--${boundary}`,
        "Content-Type: text/html; charset=utf-8",
        "Content-Transfer-Encoding: base64",
        "",
        base64EncodeUTF8(options.html),
        "",
        `--${boundary}`,
        "Content-Type: text/calendar; charset=utf-8; method=REQUEST",
        "Content-Transfer-Encoding: base64",
        'Content-Disposition: attachment; filename="termin.ics"',
        "",
        base64EncodeUTF8(options.icsAttachment),
        "",
        `--${boundary}--`
      ].join("\r\n");
    } else {
      emailContent = [
        `From: ${options.from || config.userEmail}`,
        `To: ${options.to}`,
        `Subject: ${encodedSubject}`,
        "MIME-Version: 1.0",
        "Content-Type: text/html; charset=utf-8",
        "Content-Transfer-Encoding: base64",
        "",
        base64EncodeUTF8(options.html)
      ].join("\r\n");
    }
    const encodedEmail = base64EncodeUTF8(emailContent).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
    const sendResponse = await fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${tokenData.access_token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ raw: encodedEmail })
    });
    if (!sendResponse.ok) {
      const error = await sendResponse.text();
      console.error("Gmail send error:", error);
      return { success: false, error: `Gmail API error: ${sendResponse.status}` };
    }
    const result = await sendResponse.json();
    console.log(`✅ Email sent via Gmail API (ID: ${result.id})`);
    return { success: true };
  } catch (error) {
    console.error("Error sending email via Gmail:", error);
    return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
  }
}
async function sendEmail(options, env) {
  const googleClientId = env?.GOOGLE_CLIENT_ID || "";
  const googleClientSecret = env?.GOOGLE_CLIENT_SECRET || "";
  const googleRefreshToken = env?.GOOGLE_REFRESH_TOKEN || "";
  const googleUserEmail = env?.GOOGLE_USER_EMAIL || undefined                                 ;
  if (googleClientId && googleClientSecret && googleRefreshToken && googleUserEmail) {
    console.log(`📧 Sending email to ${options.to}...`);
    const result = await sendViaGmail(options, {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      refreshToken: googleRefreshToken,
      userEmail: googleUserEmail
    });
    if (result.success) {
      console.log("✅ Email sent successfully via Gmail");
      return { success: true };
    }
    console.error(`❌ Gmail API failed: ${result.error}`);
    return { success: false, error: result.error };
  }
  console.warn("⚠️ Gmail API not configured. Skipping email notification.");
  return { success: false, error: "Gmail not configured" };
}
function formatDate(dateString) {
  const date = new Date(dateString);
  if (isNaN(date.getTime())) {
    console.error(`Invalid date string: ${dateString}`);
    return "Ungültiges Datum";
  }
  const options = {
    day: "2-digit",
    month: "2-digit",
    year: "numeric"
  };
  return date.toLocaleDateString("de-DE", options);
}
function convertToAppointmentData(data, durationMinutes = 30) {
  const [hours, minutes] = data.time.split(":").map(Number);
  const endDate = /* @__PURE__ */ new Date();
  endDate.setHours(hours, minutes + durationMinutes);
  const endTime = `${endDate.getHours().toString().padStart(2, "0")}:${endDate.getMinutes().toString().padStart(2, "0")}`;
  return {
    id: "",
    name: data.name,
    email: data.email,
    company: data.company,
    phone: data.phone || "",
    date: data.day,
    // ✅ Jetzt korrekt: ISO-Format
    startTime: data.time,
    endTime,
    message: data.message,
    status: data.status,
    appointmentUrl: data.appointmentUrl
  };
}
async function sendCustomerNotification(data, env) {
  const settings = await loadEmailSettings(env);
  let durationMinutes = 30;
  try {
    const settingsJson = await env?.APPOINTMENTS_KV?.get("settings");
    if (settingsJson) {
      const fullSettings = JSON.parse(settingsJson);
      durationMinutes = fullSettings.appointmentDurationMinutes || 30;
    }
  } catch (error) {
    console.error("Error loading duration settings:", error);
  }
  const appointment = convertToAppointmentData(data, durationMinutes);
  let html = "";
  let subject = "";
  let icsAttachment = void 0;
  switch (data.action) {
    case "requested":
      html = generateCustomerRequestEmail(appointment, settings);
      subject = `⏳ Ihre Terminanfrage für die ${settings.eventName}`;
      break;
    case "instant-booked":
    case "confirmed":
      html = generateCustomerConfirmationEmail(appointment, settings);
      subject = `✅ Terminbestätigung - ${settings.eventName}`;
      icsAttachment = generateICS(appointment, settings);
      break;
    case "cancelled":
      html = generateCustomerCancellationEmail(appointment, settings, "cancelled");
      subject = `❌ Termin storniert`;
      break;
    case "rejected":
      html = generateCustomerCancellationEmail(appointment, settings, "rejected");
      subject = `❌ Terminanfrage abgelehnt`;
      break;
    default:
      console.error(`Unknown action: ${data.action}`);
      return false;
  }
  const result = await sendEmail({
    to: data.email,
    subject,
    html,
    icsAttachment,
    from: `${settings.companyName} <${settings.companyEmail}>`
  }, env);
  if (env?.APPOINTMENTS_KV) {
    const actionLabel = data.action === "requested" ? "Anfrage" : data.action === "confirmed" || data.action === "instant-booked" ? "Bestätigung" : data.action === "cancelled" ? "Stornierung" : "Ablehnung";
    if (result.success) {
      await createAuditLog(
        env.APPOINTMENTS_KV,
        "✅ E-Mail an Kunde",
        `${actionLabel} wurde an ${data.email} gesendet.`,
        void 0,
        "system"
      );
    } else {
      await createAuditLog(
        env.APPOINTMENTS_KV,
        "❌ E-Mail-Fehler",
        `${actionLabel} konnte nicht an ${data.email} gesendet werden. Fehler: ${result.error || "Unbekannt"}`,
        void 0,
        "system"
      );
    }
  }
  return result.success;
}
async function sendAdminNotification(data, adminEmail, env) {
  const settings = await loadEmailSettings(env);
  let durationMinutes = 30;
  try {
    const settingsJson = await env?.APPOINTMENTS_KV?.get("settings");
    if (settingsJson) {
      const fullSettings = JSON.parse(settingsJson);
      durationMinutes = fullSettings.appointmentDurationMinutes || 30;
    }
  } catch (error) {
    console.error("Error loading duration settings:", error);
  }
  const appointment = convertToAppointmentData(data, durationMinutes);
  const html = generateAdminNotificationEmail(appointment, settings, data.action);
  let subject = "";
  switch (data.action) {
    case "requested":
      subject = `⏳ Neue Terminanfrage: ${data.name} am ${formatDate(data.day)} um ${data.time}`;
      break;
    case "confirmed":
      subject = `✅ Termin bestätigt: ${data.name} am ${formatDate(data.day)} um ${data.time}`;
      break;
    case "cancelled":
      subject = `❌ Termin storniert: ${data.name} am ${formatDate(data.day)} um ${data.time}`;
      break;
    case "rejected":
      subject = `❌ Termin abgelehnt: ${data.name} am ${formatDate(data.day)} um ${data.time}`;
      break;
  }
  const result = await sendEmail({
    to: adminEmail,
    subject,
    html,
    from: `${settings.companyName} - Terminbuchung <${settings.companyEmail}>`
  }, env);
  if (env?.APPOINTMENTS_KV) {
    const actionLabel = data.action === "requested" ? "Neue Anfrage" : data.action === "confirmed" ? "Bestätigung" : data.action === "cancelled" ? "Stornierung" : "Ablehnung";
    if (result.success) {
      await createAuditLog(
        env.APPOINTMENTS_KV,
        "✅ E-Mail an Admin",
        `${actionLabel}-Benachrichtigung wurde an ${adminEmail} gesendet.`,
        void 0,
        "system"
      );
    } else {
      await createAuditLog(
        env.APPOINTMENTS_KV,
        "❌ E-Mail-Fehler",
        `${actionLabel}-Benachrichtigung konnte nicht an ${adminEmail} gesendet werden. Fehler: ${result.error || "Unbekannt"}`,
        void 0,
        "system"
      );
    }
  }
  return result.success;
}
async function sendReminderEmail(data, env) {
  const settings = await loadEmailSettings(env);
  let durationMinutes = 30;
  try {
    const settingsJson = await env?.APPOINTMENTS_KV?.get("settings");
    if (settingsJson) {
      const fullSettings = JSON.parse(settingsJson);
      durationMinutes = fullSettings.appointmentDurationMinutes || 30;
    }
  } catch (error) {
    console.error("Error loading duration settings:", error);
  }
  const appointment = convertToAppointmentData({
    ...data,
    message: "",
    status: "confirmed"
  }, durationMinutes);
  const html = generateCustomerReminderEmail(appointment, settings);
  const result = await sendEmail({
    to: data.email,
    subject: `⏰ Erinnerung: Ihr Termin morgen - ${settings.eventName}`,
    html,
    from: `${settings.companyName} <${settings.companyEmail}>`
  }, env);
  if (env?.APPOINTMENTS_KV) {
    if (result.success) {
      await createAuditLog(
        env.APPOINTMENTS_KV,
        "✅ Erinnerungs-E-Mail",
        `Erinnerung wurde an ${data.email} gesendet.`,
        void 0,
        "system"
      );
    } else {
      await createAuditLog(
        env.APPOINTMENTS_KV,
        "❌ E-Mail-Fehler",
        `Erinnerung konnte nicht an ${data.email} gesendet werden. Fehler: ${result.error || "Unbekannt"}`,
        void 0,
        "system"
      );
    }
  }
  return result.success;
}

export { sendAdminNotification as a, sendReminderEmail as b, sendCustomerNotification as s };
