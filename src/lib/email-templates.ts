/**
 * Moderne Email Templates mit dynamischen Settings und ICS-Dateien
 * 
 * Features:
 * - Dynamische Settings (Logo, Kontaktdaten, Farben)
 * - ICS Calendar Dateien
 * - XSS-geschützt
 * - Responsive HTML Design
 */

import ical, { ICalCalendar } from 'ical-generator';
import { escapeHtml } from './validation';

export interface EmailSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite?: string;
  logoUrl?: string;
  primaryColor?: string;
  standInfo?: string; // z.B. "Messe München, Stand B4.110"
  eventName?: string; // z.B. "OPTI 26" - wird dynamisch aus Settings generiert
  eventYear?: number; // z.B. 2026 - für Datumsformatierung
}

export interface AppointmentData {
  id: string;
  name: string;
  company?: string;
  phone: string;
  email: string;
  date: string; // ISO Date String
  startTime: string; // HH:mm
  endTime: string; // HH:mm
  message?: string;
  status: 'pending' | 'confirmed' | 'cancelled' | 'rejected';
  appointmentUrl: string;
}

/**
 * Generiert ICS Calendar Datei für Appointment
 * ✅ FIX: Firmendaten prominenter für Kunden-ICS
 */
export function generateICS(appointment: AppointmentData, settings: EmailSettings): string {
  const calendar = ical({ name: `Termin ${settings.companyName}` });
  
  // Parse Date & Time
  const appointmentDate = new Date(appointment.date);
  const [startHour, startMin] = appointment.startTime.split(':').map(Number);
  const [endHour, endMin] = appointment.endTime.split(':').map(Number);
  
  const startDateTime = new Date(appointmentDate);
  startDateTime.setHours(startHour, startMin, 0, 0);
  
  const endDateTime = new Date(appointmentDate);
  endDateTime.setHours(endHour, endMin, 0, 0);
  
  // Kunden-ICS: Zeige FIRMENDATEN prominent
  const description = [
    `Termin mit ${settings.companyName}`,
    settings.eventName ? `\nVeranstaltung: ${settings.eventName}` : '',
    settings.standInfo ? `\nStand/Ort: ${settings.standInfo}` : '',
    `\n${settings.companyAddress}`,
    `\n\nKontakt:`,
    `Telefon: ${settings.companyPhone}`,
    `E-Mail: ${settings.companyEmail}`,
    settings.companyWebsite ? `Website: ${settings.companyWebsite}` : '',
    appointment.message ? `\n\nIhre Nachricht:\n${appointment.message}` : '',
    `\n\nTermin-Details: ${appointment.appointmentUrl}`,
  ].filter(Boolean).join('');
  
  // Create Event
  calendar.createEvent({
    start: startDateTime,
    end: endDateTime,
    summary: settings.eventName 
      ? `Termin: ${settings.companyName} - ${settings.eventName}` 
      : `Termin: ${settings.companyName}`,
    description,
    location: settings.standInfo 
      ? `${settings.standInfo}${settings.eventName ? ` (${settings.eventName})` : ''}`
      : settings.companyAddress,
    url: appointment.appointmentUrl,
    organizer: {
      name: settings.companyName,
      email: settings.companyEmail,
    },
    attendees: [
      {
        name: appointment.name,
        email: appointment.email,
        rsvp: true,
      }
    ],
    status: appointment.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE',
  });
  
  return calendar.toString();
}

/**
 * Formatiert Datum für Email (z.B. "Montag, 15. Januar 2025")
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  const options: Intl.DateTimeFormatOptions = { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  };
  return date.toLocaleDateString('de-DE', options);
}

/**
 * Base HTML Template mit Settings
 */
function getBaseTemplate(
  settings: EmailSettings,
  headerTitle: string,
  headerSubtitle: string,
  statusBadge: { text: string; color: string; bg: string } | null,
  content: string
): string {
  const primaryColor = settings.primaryColor || '#2d62ff';
  const logoHtml = settings.logoUrl 
    ? `<img src="${escapeHtml(settings.logoUrl)}" alt="${escapeHtml(settings.companyName)}" style="max-width: 200px; height: auto; margin-bottom: 20px;" />`
    : '';
  
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
          ` : ''}

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
                ${settings.companyWebsite ? ` • <a href="${escapeHtml(settings.companyWebsite)}" style="color: ${primaryColor}; text-decoration: none;">${escapeHtml(settings.companyWebsite.replace(/^https?:\/\//, ''))}</a>` : ''}
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

/**
 * Helper: Farbe abdunkeln/aufhellen
 */
function shadeColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  return '#' + (
    0x1000000 +
    (R < 255 ? (R < 1 ? 0 : R) : 255) * 0x10000 +
    (G < 255 ? (G < 1 ? 0 : G) : 255) * 0x100 +
    (B < 255 ? (B < 1 ? 0 : B) : 255)
  ).toString(16).slice(1);
}

/**
 * Generiert Appointment Details Tabelle
 */
function getAppointmentDetailsTable(appointment: AppointmentData): string {
  return `
<table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f9fafb; border-radius: 12px; overflow: hidden;">
  <tr>
    <td style="padding: 15px 20px; border-bottom: 1px solid #e5e7eb;">
      <strong style="color: #6b7280; font-size: 13px; display: block; margin-bottom: 5px;">DATUM & UHRZEIT</strong>
      <span style="color: #111827; font-size: 18px; font-weight: 700;">${escapeHtml(formatDate(appointment.date))} um ${escapeHtml(appointment.startTime)} Uhr</span>
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
  ` : ''}
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

/**
 * CUSTOMER: Neue Terminanfrage
 */
export function generateCustomerRequestEmail(
  appointment: AppointmentData,
  settings: EmailSettings
): string {
  const primaryColor = settings.primaryColor || '#2d62ff';
  
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
    ` : ''}

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
    '⏳ Terminanfrage eingegangen',
    'Wir haben Ihre Anfrage erhalten',
    { text: 'Ausstehend', color: '#ca8a04', bg: '#fef3c7' },
    content
  );
}

/**
 * CUSTOMER: Termin bestätigt
 */
export function generateCustomerConfirmationEmail(
  appointment: AppointmentData,
  settings: EmailSettings
): string {
  const primaryColor = settings.primaryColor || '#2d62ff';
  
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
            ${settings.eventName ? `<strong>Event:</strong> ${escapeHtml(settings.eventName)}<br>` : ''}
            <strong>Ort:</strong> ${escapeHtml(settings.standInfo)}<br>
            <strong>Bitte erscheinen Sie pünktlich.</strong> Bei Fragen oder falls Sie den Termin nicht wahrnehmen können, 
            nutzen Sie bitte den obigen Link.
          </p>
        </div>
      </td>
    </tr>
    ` : ''}

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
    '✅ Terminbestätigung',
    'Ihr Termin wurde erfolgreich bestätigt',
    { text: 'Bestätigt', color: '#16a34a', bg: '#dcfce7' },
    content
  );
}

/**
 * CUSTOMER: Termin abgelehnt/storniert
 */
export function generateCustomerCancellationEmail(
  appointment: AppointmentData,
  settings: EmailSettings,
  reason: 'cancelled' | 'rejected' = 'cancelled'
): string {
  const primaryColor = settings.primaryColor || '#2d62ff';
  
  const isRejected = reason === 'rejected';
  const headerTitle = isRejected 
    ? '❌ Terminanfrage abgelehnt' 
    : '❌ Termin storniert';
  const headerSubtitle = isRejected 
    ? 'Leider konnten wir Ihre Anfrage nicht annehmen' 
    : 'Ihr Termin wurde storniert';
  const mainMessage = isRejected
    ? 'Leider konnten wir Ihre Terminanfrage nicht annehmen.'
    : 'Ihr Termin wurde storniert.';
  const additionalInfo = isRejected
    ? 'Der gewünschte Termin war nicht verfügbar oder konnte aus anderen Gründen nicht bestätigt werden.'
    : 'Sollten Sie weitere Fragen haben oder einen neuen Termin vereinbaren möchten, kontaktieren Sie uns gerne.';
  
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
            ${settings.companyWebsite ? `<br><strong>Website:</strong> <a href="${escapeHtml(settings.companyWebsite)}" style="color: ${primaryColor}; text-decoration: none;">${escapeHtml(settings.companyWebsite)}</a>` : ''}
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
          <a href="${escapeHtml(appointment.appointmentUrl.replace(/\/termin\/.*$/, ''))}" style="display: inline-block; background-color: ${primaryColor}; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-weight: 600; font-size: 14px;">
            Neuen Termin buchen →
          </a>
        </div>
      </td>
    </tr>
    ` : ''}
  `;
  
  return getBaseTemplate(
    settings,
    headerTitle,
    headerSubtitle,
    { text: isRejected ? 'Abgelehnt' : 'Storniert', color: '#dc2626', bg: '#fee2e2' },
    content
  );
}

/**
 * CUSTOMER: Termin-Erinnerung (24h vorher)
 */
export function generateCustomerReminderEmail(
  appointment: AppointmentData,
  settings: EmailSettings
): string {
  const primaryColor = settings.primaryColor || '#2d62ff';
  
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
            ${settings.eventName ? `<strong>Event:</strong> ${escapeHtml(settings.eventName)}<br>` : ''}
            <strong>Ort:</strong> ${escapeHtml(settings.standInfo)}<br>
            <strong>Bitte erscheinen Sie pünktlich.</strong>
          </p>
        </div>
      </td>
    </tr>
    ` : ''}
  `;
  
  return getBaseTemplate(
    settings,
    '⏰ Erinnerung: Ihr Termin morgen',
    'Wir freuen uns auf Sie!',
    null,
    content
  );
}

/**
 * ADMIN: Benachrichtigung über Terminaktionen
 * ✅ FIX: ICS-Anhang für Sofortbuchungen/Bestätigungen hinzugefügt
 */
export function generateAdminNotificationEmail(
  appointment: AppointmentData,
  settings: EmailSettings,
  action: 'requested' | 'confirmed' | 'cancelled' | 'rejected'
): string {
  const primaryColor = settings.primaryColor || '#2d62ff';
  
  let headerTitle = '';
  let headerSubtitle = '';
  let statusBadge: { text: string; color: string; bg: string } | null = null;
  let actionRequired = false;

  switch (action) {
    case 'requested':
      headerTitle = '⏳ Neue Terminanfrage';
      headerSubtitle = 'Eine Terminanfrage wartet auf Ihre Bestätigung';
      statusBadge = { text: 'Ausstehend', color: '#ca8a04', bg: '#fef3c7' };
      actionRequired = true;
      break;
    case 'confirmed':
      headerTitle = '✅ Termin bestätigt';
      headerSubtitle = 'Ein Termin wurde automatisch bestätigt';
      statusBadge = { text: 'Bestätigt', color: '#16a34a', bg: '#dcfce7' };
      break;
    case 'cancelled':
      headerTitle = '❌ Termin storniert';
      headerSubtitle = 'Ein Termin wurde storniert';
      statusBadge = { text: 'Storniert', color: '#dc2626', bg: '#fee2e2' };
      break;
    case 'rejected':
      headerTitle = '❌ Terminanfrage abgelehnt';
      headerSubtitle = 'Eine Terminanfrage wurde abgelehnt';
      statusBadge = { text: 'Abgelehnt', color: '#dc2626', bg: '#fee2e2' };
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
    ` : ''}

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
    ` : ''}
  `;
  
  return getBaseTemplate(
    settings,
    headerTitle,
    headerSubtitle,
    statusBadge,
    content
  );
}
