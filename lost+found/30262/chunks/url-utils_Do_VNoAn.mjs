globalThis.process ??= {}; globalThis.process.env ??= {};
import './index_xnc8mrq2.mjs';
import { c as createAuditLog } from './audit-log_BDxUJbGF.mjs';

function escapeHtml(unsafe) {
  return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email) && email.length <= 254;
}
function validatePhone(phone) {
  const phoneRegex = /^[\d\s\-\+\(\)\/]+$/;
  const cleaned = phone.replace(/\s/g, "");
  return phoneRegex.test(phone) && cleaned.length >= 6 && cleaned.length <= 20;
}
function validateName(name) {
  const nameRegex = /^[a-zA-ZäöüÄÖÜß\s\-]{2,100}$/;
  return nameRegex.test(name);
}
function validateCompany(company) {
  if (!company) return true;
  const companyRegex = /^[a-zA-Z0-9äöüÄÖÜß\s\-\.,&()]{1,200}$/;
  return companyRegex.test(company);
}
function validateMessage(message) {
  if (!message) return true;
  if (message.length > 1e3) return false;
  const dangerousPatterns = [/<script/i, /<iframe/i, /javascript:/i, /on\w+=/i];
  return !dangerousPatterns.some((pattern) => pattern.test(message));
}
function sanitizeInput(input) {
  return input.replace(/<script[^>]*>.*?<\/script>/gi, "").replace(/<iframe[^>]*>.*?<\/iframe>/gi, "").replace(/javascript:/gi, "").replace(/on\w+=/gi, "").trim();
}
function validateTime(time) {
  if (!time) return true;
  const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9]$/;
  return timeRegex.test(time);
}
function validateFormData(data) {
  const errors = {};
  if (!data.name || !validateName(data.name)) {
    errors.name = "Ungültiger Name (min. 2 Zeichen, nur Buchstaben)";
  }
  if (!data.email || !validateEmail(data.email)) {
    errors.email = "Ungültige E-Mail Adresse";
  }
  if (!data.phone || !validatePhone(data.phone)) {
    errors.phone = "Ungültige Telefonnummer";
  }
  if (data.company && !validateCompany(data.company)) {
    errors.company = "Ungültiger Firmenname";
  }
  if (data.message && !validateMessage(data.message)) {
    errors.message = "Nachricht enthält ungültige Zeichen oder ist zu lang";
  }
  if (data.time && !validateTime(data.time)) {
    errors.time = "Ungültige Uhrzeit";
  }
  const valid = Object.keys(errors).length === 0;
  return {
    valid,
    errors,
    ...valid && {
      sanitized: {
        name: sanitizeInput(data.name),
        company: data.company ? sanitizeInput(data.company) : void 0,
        phone: sanitizeInput(data.phone),
        email: sanitizeInput(data.email),
        message: data.message ? sanitizeInput(data.message) : void 0,
        time: data.time
      }
    }
  };
}

function formatDate$1(dateString) {
  const date = new Date(dateString);
  const options = {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  };
  return date.toLocaleDateString("de-DE", options);
}
function getBaseTemplate(settings, headerTitle, headerSubtitle, statusBadge, content) {
  const primaryColor = settings.primaryColor || "#2d62ff";
  const logoHtml = settings.logoUrl ? `<img src="${escapeHtml(settings.logoUrl)}" alt="${escapeHtml(settings.companyName)}" style="max-width: 200px; height: auto; margin-bottom: 20px;" />` : "";
  return `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${escapeHtml(headerTitle)}</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #f3f4f6;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f3f4f6; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); overflow: hidden;">
          
          <!-- Header -->
          <tr>
            <td style="background: linear-gradient(135deg, ${primaryColor} 0%, ${shadeColor(primaryColor, -20)} 100%); padding: 40px 30px; text-align: center;">
              ${logoHtml}
              <h1 style="color: #ffffff; font-size: 28px; margin: 0; font-weight: 700;">
                ${escapeHtml(headerTitle)}
              </h1>
              <p style="color: #e0e7ff; font-size: 16px; margin: 10px 0 0 0;">
                ${escapeHtml(headerSubtitle)}
              </p>
            </td>
          </tr>

          ${statusBadge ? `
          <!-- Status Badge -->
          <tr>
            <td style="padding: 20px 30px;">
              <div style="background-color: ${statusBadge.bg}; border: 2px solid ${statusBadge.color}; border-radius: 12px; padding: 15px; text-align: center;">
                <span style="color: ${statusBadge.color}; font-weight: 700; font-size: 14px; text-transform: uppercase; letter-spacing: 0.5px;">
                  Status: ${escapeHtml(statusBadge.text)}
                </span>
              </div>
            </td>
          </tr>
          ` : ""}

          ${content}

          <!-- Footer -->
          <tr>
            <td style="padding: 30px; background-color: #f9fafb; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 13px; margin: 0 0 10px 0;">
                Diese E-Mail wurde automatisch vom Terminbuchungs-System generiert.
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                ${escapeHtml(settings.companyName)} • ${escapeHtml(settings.companyAddress)}
              </p>
              <p style="color: #9ca3af; font-size: 12px; margin: 10px 0 0 0;">
                Bei Fragen: 
                <a href="tel:${escapeHtml(settings.companyPhone)}" style="color: ${primaryColor}; text-decoration: none;">${escapeHtml(settings.companyPhone)}</a> • 
                <a href="mailto:${escapeHtml(settings.companyEmail)}" style="color: ${primaryColor}; text-decoration: none;">${escapeHtml(settings.companyEmail)}</a>
                ${settings.companyWebsite ? ` • <a href="${escapeHtml(settings.companyWebsite)}" style="color: ${primaryColor}; text-decoration: none;">${escapeHtml(settings.companyWebsite.replace(/^https?:\/\//, ""))}</a>` : ""}
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
function shadeColor(color, percent) {
  const num = parseInt(color.replace("#", ""), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 255) + amt;
  const B = (num & 255) + amt;
  return "#" + (16777216 + (R < 255 ? R < 1 ? 0 : R : 255) * 65536 + (G < 255 ? G < 1 ? 0 : G : 255) * 256 + (B < 255 ? B < 1 ? 0 : B : 255)).toString(16).slice(1);
}
function getAppointmentDetailsTable(appointment) {
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; overflow: hidden;">
  <tr>
    <td style="padding: 15px 20px; border-bottom: 1px solid #e5e7eb;">
      <strong style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 5px;">DATUM & UHRZEIT</strong>
      <span style="color: #111827; font-size: 18px; font-weight: 700;">${escapeHtml(formatDate$1(appointment.date))} um ${escapeHtml(appointment.startTime)} Uhr</span>
    </td>
  </tr>
  <tr>
    <td style="padding: 15px 20px; border-bottom: 1px solid #e5e7eb;">
      <strong style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 5px;">NAME</strong>
      <span style="color: #111827; font-size: 16px;">${escapeHtml(appointment.name)}</span>
    </td>
  </tr>
  ${appointment.company ? `
  <tr>
    <td style="padding: 15px 20px; border-bottom: 1px solid #e5e7eb;">
      <strong style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 5px;">FIRMA</strong>
      <span style="color: #111827; font-size: 16px;">${escapeHtml(appointment.company)}</span>
    </td>
  </tr>
  ` : ""}
  <tr>
    <td style="padding: 15px 20px; border-bottom: 1px solid #e5e7eb;">
      <strong style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 5px;">E-MAIL</strong>
      <a href="mailto:${escapeHtml(appointment.email)}" style="color: #2d62ff; font-size: 16px; text-decoration: none;">${escapeHtml(appointment.email)}</a>
    </td>
  </tr>
  <tr>
    <td style="padding: 15px 20px;">
      <strong style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 5px;">TELEFON</strong>
      <a href="tel:${escapeHtml(appointment.phone)}" style="color: #2d62ff; font-size: 16px; text-decoration: none;">${escapeHtml(appointment.phone)}</a>
    </td>
  </tr>
</table>
  `;
}
function generateCustomerRequestEmail(appointment, settings) {
  const primaryColor = settings.primaryColor || "#2d62ff";
  const content = `
    <!-- Main Message -->
    <tr>
      <td style="padding: 30px 30px 20px 30px;">
        <p style="color: #374151; font-size: 16px; line-height: 1.8; margin: 0; text-align: center;">
          Vielen Dank für Ihre Terminanfrage!<br><br>
          <strong style="color: #111827;">Wir haben Ihre Anfrage erhalten und werden diese schnellstmöglich bearbeiten.</strong><br>
          Sie erhalten eine weitere E-Mail, sobald Ihr Termin bestätigt wurde.
        </p>
      </td>
    </tr>

    <!-- Appointment Details -->
    <tr>
      <td style="padding: 0 30px 20px 30px;">
        <h2 style="color: #111827; font-size: 20px; margin: 0 0 20px 0; font-weight: 600; text-align: center;">
          📅 Ihre Termin-Details
        </h2>
        ${getAppointmentDetailsTable(appointment)}
      </td>
    </tr>

    ${appointment.message ? `
    <!-- Message -->
    <tr>
      <td style="padding: 0 30px 20px 30px;">
        <h2 style="color: #111827; font-size: 20px; margin: 0 0 15px 0; font-weight: 600;">
          💬 Ihre Nachricht
        </h2>
        <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; border-left: 4px solid ${primaryColor};">
          <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${escapeHtml(appointment.message)}</p>
        </div>
      </td>
    </tr>
    ` : ""}

    <!-- CTA -->
    <tr>
      <td style="padding: 0 30px 30px 30px;">
        <a href="${escapeHtml(appointment.appointmentUrl)}" style="display: block; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; text-align: center; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(45, 98, 255, 0.3);">
          Termin-Details ansehen →
        </a>
      </td>
    </tr>

    <!-- Pending Notice -->
    <tr>
      <td style="padding: 0 30px 30px 30px;">
        <div style="background-color: #eff6ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 20px;">
          <p style="color: #1e40af; font-size: 14px; line-height: 1.6; margin: 0;">
            <strong>💡 Hinweis:</strong> Ihr Termin ist noch nicht bestätigt. 
            Sie erhalten eine Bestätigungs-E-Mail, sobald wir Ihre Anfrage geprüft haben.
          </p>
        </div>
      </td>
    </tr>
  `;
  return getBaseTemplate(
    settings,
    "⏳ Terminanfrage eingegangen",
    "Wir haben Ihre Anfrage erhalten",
    { text: "Ausstehend", color: "#ca8a04", bg: "#fef3c7" },
    content
  );
}
function generateCustomerConfirmationEmail(appointment, settings) {
  const primaryColor = settings.primaryColor || "#2d62ff";
  const content = `
    <!-- Main Message -->
    <tr>
      <td style="padding: 30px 30px 20px 30px;">
        <p style="color: #374151; font-size: 16px; line-height: 1.8; margin: 0; text-align: center;">
          Ihr Termin wurde erfolgreich bestätigt!<br><br>
          <strong style="color: #111827;">Wir freuen uns auf Ihren Besuch.</strong>
        </p>
      </td>
    </tr>

    <!-- Appointment Details -->
    <tr>
      <td style="padding: 0 30px 20px 30px;">
        <h2 style="color: #111827; font-size: 20px; margin: 0 0 20px 0; font-weight: 600; text-align: center;">
          📅 Ihre Termin-Details
        </h2>
        ${getAppointmentDetailsTable(appointment)}
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding: 0 30px 30px 30px;">
        <a href="${escapeHtml(appointment.appointmentUrl)}" style="display: block; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; text-align: center; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(45, 98, 255, 0.3);">
          Termin-Details ansehen →
        </a>
      </td>
    </tr>

    <!-- Important Info -->
    ${settings.standInfo ? `
    <tr>
      <td style="padding: 0 30px 30px 30px;">
        <div style="background-color: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 20px;">
          <h3 style="color: #15803d; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">
            📍 Wichtige Informationen
          </h3>
          <p style="color: #166534; font-size: 14px; line-height: 1.6; margin: 0;">
            ${settings.eventName ? `<strong>Event:</strong> ${escapeHtml(settings.eventName)}<br>` : ""}
            <strong>Ort:</strong> ${escapeHtml(settings.standInfo)}<br>
            <strong>Bitte erscheinen Sie pünktlich.</strong> Bei Fragen oder falls Sie den Termin nicht wahrnehmen können, 
            nutzen Sie bitte den obigen Link.
          </p>
        </div>
      </td>
    </tr>
    ` : ""}

    <!-- Calendar Attachment Info -->
    <tr>
      <td style="padding: 0 30px 30px 30px;">
        <div style="background-color: #fef3c7; border: 2px solid #fbbf24; border-radius: 12px; padding: 15px; text-align: center;">
          <p style="color: #92400e; font-size: 13px; margin: 0;">
            📆 <strong>Dieser E-Mail ist eine Kalenderdatei (.ics) angehängt.</strong><br>
            Sie können den Termin direkt in Ihren Kalender importieren.
          </p>
        </div>
      </td>
    </tr>
  `;
  return getBaseTemplate(
    settings,
    "✅ Terminbestätigung",
    "Ihr Termin wurde erfolgreich bestätigt",
    { text: "Bestätigt", color: "#16a34a", bg: "#dcfce7" },
    content
  );
}
function generateCustomerCancellationEmail(appointment, settings, reason = "cancelled") {
  const primaryColor = settings.primaryColor || "#2d62ff";
  const isRejected = reason === "rejected";
  const headerTitle = isRejected ? "❌ Terminanfrage abgelehnt" : "❌ Termin storniert";
  const headerSubtitle = isRejected ? "Leider konnten wir Ihre Anfrage nicht annehmen" : "Ihr Termin wurde storniert";
  const mainMessage = isRejected ? "Leider konnten wir Ihre Terminanfrage nicht annehmen." : "Ihr Termin wurde storniert.";
  const additionalInfo = isRejected ? "Der gewünschte Termin war nicht verfügbar oder konnte aus anderen Gründen nicht bestätigt werden." : "Sollten Sie weitere Fragen haben oder einen neuen Termin vereinbaren möchten, kontaktieren Sie uns gerne.";
  const content = `
    <!-- Main Message -->
    <tr>
      <td style="padding: 30px 30px 20px 30px;">
        <p style="color: #374151; font-size: 16px; line-height: 1.8; margin: 0; text-align: center;">
          ${mainMessage}<br><br>
          <strong style="color: #111827;">${additionalInfo}</strong>
        </p>
      </td>
    </tr>

    <!-- Appointment Details -->
    <tr>
      <td style="padding: 0 30px 20px 30px;">
        <h2 style="color: #111827; font-size: 20px; margin: 0 0 20px 0; font-weight: 600; text-align: center;">
          📅 Betroffener Termin
        </h2>
        ${getAppointmentDetailsTable(appointment)}
      </td>
    </tr>

    <!-- Contact Info -->
    <tr>
      <td style="padding: 0 30px 30px 30px;">
        <div style="background-color: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 20px;">
          <h3 style="color: #15803d; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">
            💬 Haben Sie Fragen?
          </h3>
          <p style="color: #166534; font-size: 14px; line-height: 1.6; margin: 0;">
            Wir sind gerne für Sie da und helfen Ihnen weiter.<br><br>
            <strong>Telefon:</strong> <a href="tel:${escapeHtml(settings.companyPhone)}" style="color: ${primaryColor}; text-decoration: none;">${escapeHtml(settings.companyPhone)}</a><br>
            <strong>E-Mail:</strong> <a href="mailto:${escapeHtml(settings.companyEmail)}" style="color: ${primaryColor}; text-decoration: none;">${escapeHtml(settings.companyEmail)}</a>
            ${settings.companyWebsite ? `<br><strong>Website:</strong> <a href="${escapeHtml(settings.companyWebsite)}" style="color: ${primaryColor}; text-decoration: none;">${escapeHtml(settings.companyWebsite)}</a>` : ""}
          </p>
        </div>
      </td>
    </tr>

    ${isRejected ? `
    <!-- New Booking Option -->
    <tr>
      <td style="padding: 0 30px 30px 30px;">
        <div style="background-color: #eff6ff; border: 2px solid #3b82f6; border-radius: 12px; padding: 20px; text-align: center;">
          <p style="color: #1e40af; font-size: 14px; line-height: 1.6; margin: 0 0 15px 0;">
            <strong>Möchten Sie einen anderen Termin buchen?</strong><br>
            Schauen Sie sich gerne unsere verfügbaren Termine an.
          </p>
          <a href="${escapeHtml(appointment.appointmentUrl.replace(/\/termin\/.*$/, ""))}" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Neuen Termin buchen →
          </a>
        </div>
      </td>
    </tr>
    ` : ""}
  `;
  return getBaseTemplate(
    settings,
    headerTitle,
    headerSubtitle,
    { text: isRejected ? "Abgelehnt" : "Storniert", color: "#dc2626", bg: "#fee2e2" },
    content
  );
}
function generateCustomerReminderEmail(appointment, settings) {
  const primaryColor = settings.primaryColor || "#2d62ff";
  const content = `
    <!-- Main Message -->
    <tr>
      <td style="padding: 30px 30px 20px 30px;">
        <p style="color: #374151; font-size: 16px; line-height: 1.8; margin: 0; text-align: center;">
          Guten Tag ${escapeHtml(appointment.name)},<br><br>
          <strong style="color: #111827;">Dies ist eine freundliche Erinnerung an Ihren morgigen Termin.</strong><br>
          Wir freuen uns auf Ihren Besuch!
        </p>
      </td>
    </tr>

    <!-- Appointment Details -->
    <tr>
      <td style="padding: 0 30px 20px 30px;">
        <h2 style="color: #111827; font-size: 20px; margin: 0 0 20px 0; font-weight: 600; text-align: center;">
          📅 Ihre Termin-Details
        </h2>
        ${getAppointmentDetailsTable(appointment)}
      </td>
    </tr>

    <!-- CTA -->
    <tr>
      <td style="padding: 0 30px 20px 30px;">
        <a href="${escapeHtml(appointment.appointmentUrl)}" style="display: block; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; text-align: center; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(45, 98, 255, 0.3); margin-bottom: 12px;">
          Termin-Details ansehen →
        </a>
      </td>
    </tr>

    <!-- Cancellation Option -->
    <tr>
      <td style="padding: 0 30px 30px 30px;">
        <div style="background-color: #f9fafb; border: 2px solid #e5e7eb; border-radius: 12px; padding: 20px; text-align: center;">
          <p style="color: #6b7280; font-size: 14px; margin: 0 0 12px 0;">
            <strong>Ihnen ist etwas dazwischen gekommen?</strong>
          </p>
          <p style="color: #6b7280; font-size: 13px; margin: 0 0 16px 0; line-height: 1.6;">
            Kein Problem! Sie können Ihren Termin jederzeit stornieren.
          </p>
          <a href="${escapeHtml(appointment.appointmentUrl)}" style="display: inline-block; background-color: #ffffff; color: #6b7280; text-decoration: none; padding: 10px 24px; border: 2px solid #d1d5db; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Termin stornieren
          </a>
        </div>
      </td>
    </tr>

    <!-- Important Info -->
    ${settings.standInfo ? `
    <tr>
      <td style="padding: 0 30px 30px 30px;">
        <div style="background-color: #f0fdf4; border: 2px solid #22c55e; border-radius: 12px; padding: 20px;">
          <h3 style="color: #15803d; font-size: 16px; margin: 0 0 10px 0; font-weight: 600;">
            📍 Wichtige Informationen
          </h3>
          <p style="color: #166534; font-size: 14px; line-height: 1.6; margin: 0;">
            ${settings.eventName ? `<strong>Event:</strong> ${escapeHtml(settings.eventName)}<br>` : ""}
            <strong>Ort:</strong> ${escapeHtml(settings.standInfo)}<br>
            <strong>Bitte erscheinen Sie pünktlich.</strong>
          </p>
        </div>
      </td>
    </tr>
    ` : ""}
  `;
  return getBaseTemplate(
    settings,
    "⏰ Erinnerung: Ihr Termin morgen",
    "Wir freuen uns auf Sie!",
    null,
    content
  );
}
function generateAdminNotificationEmail(appointment, settings, action) {
  const primaryColor = settings.primaryColor || "#2d62ff";
  let headerTitle = "";
  let headerSubtitle = "";
  let statusBadge = null;
  let actionRequired = false;
  switch (action) {
    case "requested":
      headerTitle = "⏳ Neue Terminanfrage";
      headerSubtitle = "Eine Terminanfrage wartet auf Ihre Bestätigung";
      statusBadge = { text: "Ausstehend", color: "#ca8a04", bg: "#fef3c7" };
      actionRequired = true;
      break;
    case "instant-booked":
      headerTitle = "✅ Termin automatisch bestätigt";
      headerSubtitle = "Ein Termin wurde automatisch bestätigt";
      statusBadge = { text: "Auto-Bestätigt", color: "#16a34a", bg: "#dcfce7" };
      break;
    case "confirmed":
      headerTitle = "✅ Termin bestätigt";
      headerSubtitle = "Ein Termin wurde bestätigt";
      statusBadge = { text: "Bestätigt", color: "#16a34a", bg: "#dcfce7" };
      break;
    case "cancelled":
      headerTitle = "❌ Termin storniert";
      headerSubtitle = "Ein Termin wurde storniert";
      statusBadge = { text: "Storniert", color: "#dc2626", bg: "#fee2e2" };
      break;
    case "rejected":
      headerTitle = "❌ Terminanfrage abgelehnt";
      headerSubtitle = "Eine Terminanfrage wurde abgelehnt";
      statusBadge = { text: "Abgelehnt", color: "#dc2626", bg: "#fee2e2" };
      break;
  }
  const content = `
    <!-- Appointment Details -->
    <tr>
      <td style="padding: 0 30px 20px 30px;">
        <h2 style="color: #111827; font-size: 20px; margin: 0 0 20px 0; font-weight: 600;">
          📅 Termin-Details
        </h2>
        ${getAppointmentDetailsTable(appointment)}
      </td>
    </tr>

    ${appointment.message ? `
    <!-- Message -->
    <tr>
      <td style="padding: 0 30px 20px 30px;">
        <h2 style="color: #111827; font-size: 20px; margin: 0 0 15px 0; font-weight: 600;">
          💬 Nachricht
        </h2>
        <div style="background-color: #f9fafb; border-radius: 12px; padding: 20px; border-left: 4px solid ${primaryColor};">
          <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0; white-space: pre-wrap;">${escapeHtml(appointment.message)}</p>
        </div>
      </td>
    </tr>
    ` : ""}

    <!-- CTA -->
    <tr>
      <td style="padding: 0 30px 30px 30px;">
        <a href="${escapeHtml(appointment.appointmentUrl)}" style="display: block; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; padding: 16px 32px; border-radius: 12px; text-align: center; font-weight: 600; font-size: 16px; box-shadow: 0 4px 6px rgba(45, 98, 255, 0.3);">
          Im Admin-Panel öffnen →
        </a>
      </td>
    </tr>

    ${actionRequired ? `
    <!-- Action Required -->
    <tr>
      <td style="padding: 0 30px 30px 30px;">
        <div style="background-color: #fef3c7; border: 2px solid #fbbf24; border-radius: 12px; padding: 20px;">
          <p style="color: #92400e; font-size: 14px; line-height: 1.6; margin: 0;">
            <strong>⚠️ Aktion erforderlich:</strong> Dieser Termin wartet auf Ihre Bestätigung. 
            Bitte prüfen Sie die Anfrage im Admin-Panel.
          </p>
        </div>
      </td>
    </tr>
    ` : ""}
  `;
  return getBaseTemplate(
    settings,
    headerTitle,
    headerSubtitle,
    statusBadge,
    content
  );
}

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
    const encodedSubject = encodeSubject(options.subject);
    const emailContent = [
      `From: ${options.from || config.userEmail}`,
      `To: ${options.to}`,
      `Subject: ${encodedSubject}`,
      "MIME-Version: 1.0",
      "Content-Type: text/html; charset=utf-8",
      "Content-Transfer-Encoding: base64",
      "",
      base64EncodeUTF8(options.html)
    ].join("\r\n");
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
  const googleClientId = env?.GOOGLE_CLIENT_ID || undefined                                ;
  const googleClientSecret = env?.GOOGLE_CLIENT_SECRET || undefined                                    ;
  const googleRefreshToken = env?.GOOGLE_REFRESH_TOKEN || undefined                                    ;
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
  switch (data.action) {
    case "requested":
      html = generateCustomerRequestEmail(appointment, settings);
      subject = `⏳ Ihre Terminanfrage für die ${settings.eventName}`;
      break;
    case "instant-booked":
    case "confirmed":
      html = generateCustomerConfirmationEmail(appointment, settings);
      subject = `✅ Terminbestätigung - ${settings.eventName}`;
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
  const adminBaseUrl = env?.ADMIN_BASE_URL || undefined                              ;
  const adminSecretPath = env?.ADMIN_SECRET_PATH || undefined                                  || "secure-admin-panel-xyz789";
  const adminPanelUrl = adminBaseUrl ? `${adminBaseUrl}/${adminSecretPath}` : `${data.appointmentUrl.split("/termin/")[0]}/${adminSecretPath}`;
  console.log(`🔍 Admin URL Konstruktion:`);
  console.log(`  - ADMIN_BASE_URL: ${adminBaseUrl || "(nicht gesetzt - Fallback aktiv)"}`);
  console.log(`  - adminSecretPath: ${adminSecretPath}`);
  console.log(`  - adminPanelUrl: ${adminPanelUrl}`);
  const appointment = convertToAppointmentData({
    ...data,
    appointmentUrl: adminPanelUrl
    // ✅ Admin-Panel URL statt Termin-URL
  }, durationMinutes);
  const templateAction = data.action === "instant-booked" ? "instant-booked" : data.action;
  const html = generateAdminNotificationEmail(appointment, settings, templateAction);
  let subject = "";
  switch (data.action) {
    case "requested":
      subject = `⏳ Neue Terminanfrage: ${data.name} am ${formatDate(data.day)} um ${data.time}`;
      break;
    case "instant-booked":
      subject = `✅ Termin automatisch bestätigt: ${data.name} am ${formatDate(data.day)} um ${data.time}`;
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
    const actionLabel = data.action === "requested" ? "Neue Anfrage" : data.action === "instant-booked" ? "Sofortbestätigung" : data.action === "confirmed" ? "Bestätigung" : data.action === "cancelled" ? "Stornierung" : "Ablehnung";
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

const __vite_import_meta_env__ = {"ASSETS_PREFIX": undefined, "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SITE": undefined, "SSR": true};
function getAppointmentUrl(appointmentId, env, fallbackOrigin) {
  const adminBaseUrl = env?.ADMIN_BASE_URL || (typeof import.meta !== "undefined" ? Object.assign(__vite_import_meta_env__, { _: process.env._, PATH: process.env.PATH })?.ADMIN_BASE_URL : null);
  const baseUrl = adminBaseUrl || fallbackOrigin || "";
  const cleanBaseUrl = baseUrl.replace(/\/$/, "");
  const appointmentUrl = `${cleanBaseUrl}/termin/${appointmentId}`;
  return appointmentUrl;
}

export { sendAdminNotification as a, sendReminderEmail as b, getAppointmentUrl as g, sendCustomerNotification as s, validateFormData as v };
