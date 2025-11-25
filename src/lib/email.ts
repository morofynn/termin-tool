/**
 * Email Service mit Gmail API Integration
 * 
 * Nutzt die neuen Templates mit dynamischen Settings und ICS-Dateien
 * Fixed: UTF-8 Encoding für Subject Lines (Umlaute + Emojis)
 * Fixed: Multipart Email Encoding (HTML + ICS beide Base64)
 * Fixed: "Invalid Date" Problem - ISO-Datum statt formatierter String
 * Fixed: Termindauer aus Settings verwenden
 * Fixed: Admin-Email Link führt zum Admin-Panel (dynamisch aus ADMIN_SECRET_PATH)
 * Fixed: Admin-Email Formatierung & Subject für Auto-Confirm
 * Fixed: Test-Emails senden BEIDE Versionen (Kunde + Admin) an Admin
 * Fixed: Sofortbuchung sendet Admin-Mail mit richtiger Action (instant-booked)
 * Fixed: Admin Base URL aus Environment Variable (ADMIN_BASE_URL)
 */

import { 
  generateCustomerRequestEmail,
  generateCustomerConfirmationEmail,
  generateCustomerCancellationEmail,
  generateCustomerReminderEmail,
  generateAdminNotificationEmail,
  generateICS,
  type EmailSettings,
  type AppointmentData
} from './email-templates';
import { createAuditLog } from '../pages/api/admin/audit-log';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  icsAttachment?: string;
  from?: string;
}

/**
 * Lädt Email Settings aus KV Store
 */
export async function loadEmailSettings(env: any): Promise<EmailSettings> {
  try {
    const settingsJson = await env.APPOINTMENTS_KV?.get('settings');
    if (settingsJson) {
      const settings = JSON.parse(settingsJson);
      
      // Generiere Event-Name dynamisch aus Settings
      const eventYear = settings.eventYear || new Date().getFullYear();
      const eventName = `${settings.eventName || 'OPTI'} ${eventYear.toString().slice(-2)}`;
      
      return {
        companyName: settings.companyName || 'MORO',
        companyAddress: settings.companyAddress || 'Eupener Str. 124, 50933 Köln',
        companyPhone: settings.companyPhone || '+49 221 292 40 500',
        companyEmail: settings.companyEmail || 'info@moro-gmbh.de',
        companyWebsite: settings.companyWebsite,
        logoUrl: settings.logoUrl,
        primaryColor: settings.primaryColor || '#2d62ff',
        standInfo: `${settings.eventLocation || 'Stand B4.110'}, ${settings.eventHall || 'Messe München'}`,
        eventName: eventName, // z.B. "OPTI 26"
        eventYear: eventYear, // z.B. 2026
      };
    }
  } catch (error) {
    console.error('Error loading email settings:', error);
  }
  
  // Fallback Settings
  const fallbackYear = new Date().getFullYear();
  return {
    companyName: 'MORO',
    companyAddress: 'Eupener Str. 124, 50933 Köln',
    companyPhone: '+49 221 292 40 500',
    companyEmail: 'info@moro-gmbh.de',
    primaryColor: '#2d62ff',
    standInfo: 'Stand B4.110, Messe München',
    eventName: `OPTI ${fallbackYear.toString().slice(-2)}`,
    eventYear: fallbackYear,
  };
}

/**
 * Base64 Encoding für UTF-8 Strings (Browser-kompatibel)
 * Wichtig für Umlaute und Emojis!
 */
function base64EncodeUTF8(str: string): string {
  // TextEncoder für korrekte UTF-8 Bytes
  const encoder = new TextEncoder();
  const bytes = encoder.encode(str);
  
  // Bytes zu Base64
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  
  return btoa(binary);
}

/**
 * RFC 2047 Encoding für Subject Lines
 * Format: =?UTF-8?B?<base64>?=
 */
function encodeSubject(subject: string): string {
  // Prüfe ob nicht-ASCII Zeichen vorhanden
  if (/^[\x00-\x7F]*$/.test(subject)) {
    // Nur ASCII - kein Encoding nötig
    return subject;
  }
  
  // UTF-8 + Base64 Encoding für Subject
  const encoded = base64EncodeUTF8(subject);
  return `=?UTF-8?B?${encoded}?=`;
}

/**
 * Sendet E-Mail über Gmail API
 */
async function sendViaGmail(options: EmailOptions, config: { 
  clientId: string; 
  clientSecret: string; 
  refreshToken: string;
  userEmail: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // 1. Access Token von Refresh Token holen
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: config.clientId,
        client_secret: config.clientSecret,
        refresh_token: config.refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Gmail token error:', error);
      return { success: false, error: 'Token refresh failed' };
    }

    const tokenData = await tokenResponse.json() as { access_token: string };

    // 2. E-Mail im RFC 2822 Format erstellen
    const boundary = `boundary_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    
    // Subject mit RFC 2047 Encoding (für Umlaute + Emojis)
    const encodedSubject = encodeSubject(options.subject);
    
    let emailContent = '';
    
    if (options.icsAttachment) {
      // Multipart Email mit ICS Anhang - BEIDE PARTS Base64-encoded!
      emailContent = [
        `From: ${options.from || config.userEmail}`,
        `To: ${options.to}`,
        `Subject: ${encodedSubject}`,
        'MIME-Version: 1.0',
        `Content-Type: multipart/mixed; boundary="${boundary}"`,
        '',
        `--${boundary}`,
        'Content-Type: text/html; charset=utf-8',
        'Content-Transfer-Encoding: base64',
        '',
        base64EncodeUTF8(options.html),
        '',
        `--${boundary}`,
        'Content-Type: text/calendar; charset=utf-8; method=REQUEST',
        'Content-Transfer-Encoding: base64',
        'Content-Disposition: attachment; filename="termin.ics"',
        '',
        base64EncodeUTF8(options.icsAttachment),
        '',
        `--${boundary}--`,
      ].join('\r\n');
    } else {
      // Einfache HTML Email - auch Base64
      emailContent = [
        `From: ${options.from || config.userEmail}`,
        `To: ${options.to}`,
        `Subject: ${encodedSubject}`,
        'MIME-Version: 1.0',
        'Content-Type: text/html; charset=utf-8',
        'Content-Transfer-Encoding: base64',
        '',
        base64EncodeUTF8(options.html),
      ].join('\r\n');
    }
    
    // Gmail API erwartet URL-safe Base64
    const encodedEmail = base64EncodeUTF8(emailContent)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // 3. E-Mail über Gmail API senden
    const sendResponse = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ raw: encodedEmail }),
    });

    if (!sendResponse.ok) {
      const error = await sendResponse.text();
      console.error('Gmail send error:', error);
      return { success: false, error: `Gmail API error: ${sendResponse.status}` };
    }

    const result = await sendResponse.json() as { id: string };
    console.log(`✅ Email sent via Gmail API (ID: ${result.id})`);
    return { success: true };
  } catch (error) {
    console.error('Error sending email via Gmail:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

/**
 * Hauptfunktion zum E-Mail-Versand
 */
async function sendEmail(options: EmailOptions, env?: any): Promise<{ success: boolean; error?: string }> {
  // Google OAuth Credentials (gleiche wie für Calendar)
  const googleClientId = env?.GOOGLE_CLIENT_ID || import.meta.env.GOOGLE_CLIENT_ID;
  const googleClientSecret = env?.GOOGLE_CLIENT_SECRET || import.meta.env.GOOGLE_CLIENT_SECRET;
  const googleRefreshToken = env?.GOOGLE_REFRESH_TOKEN || import.meta.env.GOOGLE_REFRESH_TOKEN;
  const googleUserEmail = env?.GOOGLE_USER_EMAIL || import.meta.env.GOOGLE_USER_EMAIL;

  // Gmail API (nur wenn Google OAuth konfiguriert)
  if (googleClientId && googleClientSecret && googleRefreshToken && googleUserEmail) {
    console.log(`📧 Sending email to ${options.to}...`);
    const result = await sendViaGmail(options, {
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      refreshToken: googleRefreshToken,
      userEmail: googleUserEmail,
    });
    
    if (result.success) {
      console.log('✅ Email sent successfully via Gmail');
      return { success: true };
    }
    
    console.error(`❌ Gmail API failed: ${result.error}`);
    return { success: false, error: result.error };
  }

  console.warn('⚠️ Gmail API not configured. Skipping email notification.');
  return { success: false, error: 'Gmail not configured' };
}

/**
 * Helper: Formatiert Datum für Subject Lines (DD.MM.YYYY)
 */
function formatDate(dateString: string): string {
  const date = new Date(dateString);
  
  // Validierung: Prüfe ob Date gültig ist
  if (isNaN(date.getTime())) {
    console.error(`Invalid date string: ${dateString}`);
    return 'Ungültiges Datum';
  }
  
  const options: Intl.DateTimeFormatOptions = { 
    day: '2-digit', 
    month: '2-digit',
    year: 'numeric'
  };
  return date.toLocaleDateString('de-DE', options);
}

/**
 * Helper: Konvertiert API-Daten zu AppointmentData
 * ✅ FIX: Verwendet appointmentDurationMinutes aus Settings
 */
function convertToAppointmentData(
  data: {
    name: string;
    email: string;
    day: string; // MUSS ISO-Format sein (z.B. "2025-01-17")
    time: string;
    company?: string;
    phone: string;
    message?: string;
    appointmentUrl: string;
    status: 'pending' | 'confirmed' | 'cancelled';
  },
  durationMinutes: number = 30
): AppointmentData {
  // Berechne endTime basierend auf Settings
  const [hours, minutes] = data.time.split(':').map(Number);
  const endDate = new Date();
  endDate.setHours(hours, minutes + durationMinutes);
  const endTime = `${endDate.getHours().toString().padStart(2, '0')}:${endDate.getMinutes().toString().padStart(2, '0')}`;
  
  return {
    id: '',
    name: data.name,
    email: data.email,
    company: data.company,
    phone: data.phone || '',
    date: data.day, // ✅ Jetzt korrekt: ISO-Format
    startTime: data.time,
    endTime,
    message: data.message,
    status: data.status,
    appointmentUrl: data.appointmentUrl,
  };
}

/**
 * Unified function to send customer notifications
 * Automatically selects the correct email template based on action
 */
export async function sendCustomerNotification(
  data: {
    name: string;
    email: string;
    day: string; // MUSS ISO-Format sein (z.B. "2025-01-17")
    time: string;
    company?: string;
    phone: string;
    message?: string;
    appointmentUrl: string;
    action: 'requested' | 'instant-booked' | 'confirmed' | 'cancelled' | 'rejected';
    status: 'pending' | 'confirmed' | 'cancelled';
  },
  env?: any
): Promise<boolean> {
  const settings = await loadEmailSettings(env);
  
  // Lade vollständige Settings für Termindauer
  let durationMinutes = 30;
  try {
    const settingsJson = await env?.APPOINTMENTS_KV?.get('settings');
    if (settingsJson) {
      const fullSettings = JSON.parse(settingsJson);
      durationMinutes = fullSettings.appointmentDurationMinutes || 30;
    }
  } catch (error) {
    console.error('Error loading duration settings:', error);
  }
  
  const appointment = convertToAppointmentData(data, durationMinutes);

  let html = '';
  let subject = '';
  let icsAttachment: string | undefined = undefined;

  // Select correct function based on action
  switch (data.action) {
    case 'requested':
      html = generateCustomerRequestEmail(appointment, settings);
      subject = `⏳ Ihre Terminanfrage für die ${settings.eventName}`;
      break;
    
    case 'instant-booked':
    case 'confirmed':
      html = generateCustomerConfirmationEmail(appointment, settings);
      subject = `✅ Terminbestätigung - ${settings.eventName}`;
      icsAttachment = generateICS(appointment, settings);
      break;
    
    case 'cancelled':
      html = generateCustomerCancellationEmail(appointment, settings, 'cancelled');
      subject = `❌ Termin storniert`;
      break;
    
    case 'rejected':
      html = generateCustomerCancellationEmail(appointment, settings, 'rejected');
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
    from: `${settings.companyName} <${settings.companyEmail}>`,
  }, env);

  // Audit Log für E-Mail-Versand
  if (env?.APPOINTMENTS_KV) {
    const actionLabel = data.action === 'requested' ? 'Anfrage' : 
                       data.action === 'confirmed' || data.action === 'instant-booked' ? 'Bestätigung' :
                       data.action === 'cancelled' ? 'Stornierung' : 'Ablehnung';
    
    if (result.success) {
      await createAuditLog(
        env.APPOINTMENTS_KV,
        '✅ E-Mail an Kunde',
        `${actionLabel} wurde an ${data.email} gesendet.`,
        undefined,
        'system'
      );
    } else {
      await createAuditLog(
        env.APPOINTMENTS_KV,
        '❌ E-Mail-Fehler',
        `${actionLabel} konnte nicht an ${data.email} gesendet werden. Fehler: ${result.error || 'Unbekannt'}`,
        undefined,
        'system'
      );
    }
  }

  return result.success;
}

/**
 * Sends admin notification
 * ✅ FIX: Admin-Email Link führt zum Admin-Panel (nicht zu Terminseite)
 * ✅ FIX: Auto-Confirm Emails haben jetzt ICS-Anhang
 * ✅ FIX: Subject & Header korrekt formatiert
 * ✅ FIX: Sofortbuchung (instant-booked) wird akzeptiert und als separater Template generiert
 * ✅ FIX: Admin Base URL aus Environment Variable (ADMIN_BASE_URL)
 */
export async function sendAdminNotification(
  data: {
    name: string;
    email: string;
    day: string; // MUSS ISO-Format sein (z.B. "2025-01-17")
    time: string;
    company?: string;
    phone: string;
    message?: string;
    appointmentUrl: string; // Dies ist die Termin-Detailseite (/termin/xxx)
    action: 'requested' | 'instant-booked' | 'confirmed' | 'cancelled' | 'rejected';
    status: 'pending' | 'confirmed' | 'cancelled';
  },
  adminEmail: string,
  env?: any
): Promise<boolean> {
  const settings = await loadEmailSettings(env);
  
  // Lade vollständige Settings für Termindauer
  let durationMinutes = 30;
  try {
    const settingsJson = await env?.APPOINTMENTS_KV?.get('settings');
    if (settingsJson) {
      const fullSettings = JSON.parse(settingsJson);
      durationMinutes = fullSettings.appointmentDurationMinutes || 30;
    }
  } catch (error) {
    console.error('Error loading duration settings:', error);
  }
  
  // ✅ FIX: Admin-Panel URL aus Environment Variable (ADMIN_BASE_URL)
  const adminBaseUrl = env?.ADMIN_BASE_URL || import.meta.env.ADMIN_BASE_URL;
  const adminSecretPath = env?.ADMIN_SECRET_PATH || import.meta.env.ADMIN_SECRET_PATH || 'secure-admin-panel-xyz789';
  
  // URL-Aufbau: {ADMIN_BASE_URL}/{adminSecretPath}
  const adminPanelUrl = adminBaseUrl 
    ? `${adminBaseUrl}/${adminSecretPath}`
    : `${data.appointmentUrl.split('/termin/')[0]}/${adminSecretPath}`; // Fallback zur alten Methode
  
  console.log(`🔍 Admin URL Konstruktion:`);
  console.log(`  - ADMIN_BASE_URL: ${adminBaseUrl || '(nicht gesetzt - Fallback aktiv)'}`);
  console.log(`  - adminSecretPath: ${adminSecretPath}`);
  console.log(`  - adminPanelUrl: ${adminPanelUrl}`);
  
  const appointment = convertToAppointmentData({
    ...data,
    appointmentUrl: adminPanelUrl, // ✅ Admin-Panel URL statt Termin-URL
  }, durationMinutes);
  
  // ✅ Map instant-booked to email template action
  const templateAction = data.action === 'instant-booked' ? 'instant-booked' : data.action;
  
  const html = generateAdminNotificationEmail(appointment, settings, templateAction);
  
  // ✅ FIX: Korrekte Subject Lines mit formatiertem Datum
  let subject = '';
  switch (data.action) {
    case 'requested':
      subject = `⏳ Neue Terminanfrage: ${data.name} am ${formatDate(data.day)} um ${data.time}`;
      break;
    case 'instant-booked':
      subject = `✅ Termin automatisch bestätigt: ${data.name} am ${formatDate(data.day)} um ${data.time}`;
      break;
    case 'confirmed':
      subject = `✅ Termin bestätigt: ${data.name} am ${formatDate(data.day)} um ${data.time}`;
      break;
    case 'cancelled':
      subject = `❌ Termin storniert: ${data.name} am ${formatDate(data.day)} um ${data.time}`;
      break;
    case 'rejected':
      subject = `❌ Termin abgelehnt: ${data.name} am ${formatDate(data.day)} um ${data.time}`;
      break;
  }
  
  // ✅ FIX: ICS-Anhang für Auto-Confirm & bestätigte Termine (action = 'confirmed' oder 'instant-booked')
  let icsAttachment: string | undefined = undefined;
  if (data.action === 'confirmed' || data.action === 'instant-booked') {
    // Verwende die Original-Termin-URL (nicht Admin-Panel) für ICS
    const icsAppointment = convertToAppointmentData(data, durationMinutes);
    icsAttachment = generateICS(icsAppointment, settings);
  }
  
  const result = await sendEmail({
    to: adminEmail,
    subject,
    html,
    icsAttachment, // ✅ ICS-Anhang bei confirmed und instant-booked
    from: `${settings.companyName} - Terminbuchung <${settings.companyEmail}>`,
  }, env);

  // Audit Log für Admin-E-Mail
  if (env?.APPOINTMENTS_KV) {
    const actionLabel = data.action === 'requested' ? 'Neue Anfrage' : 
                       data.action === 'instant-booked' ? 'Sofortbestätigung' :
                       data.action === 'confirmed' ? 'Bestätigung' :
                       data.action === 'cancelled' ? 'Stornierung' : 'Ablehnung';
    
    if (result.success) {
      await createAuditLog(
        env.APPOINTMENTS_KV,
        '✅ E-Mail an Admin',
        `${actionLabel}-Benachrichtigung wurde an ${adminEmail} gesendet.`,
        undefined,
        'system'
      );
    } else {
      await createAuditLog(
        env.APPOINTMENTS_KV,
        '❌ E-Mail-Fehler',
        `${actionLabel}-Benachrichtigung konnte nicht an ${adminEmail} gesendet werden. Fehler: ${result.error || 'Unbekannt'}`,
        undefined,
        'system'
      );
    }
  }

  return result.success;
}

/**
 * Alias for reminder emails
 */
export async function sendReminderEmail(
  data: {
    name: string;
    email: string;
    day: string; // MUSS ISO-Format sein (z.B. "2025-01-17")
    time: string;
    company?: string;
    phone: string;
    appointmentUrl: string;
  },
  env?: any
): Promise<boolean> {
  const settings = await loadEmailSettings(env);
  
  // Lade vollständige Settings für Termindauer
  let durationMinutes = 30;
  try {
    const settingsJson = await env?.APPOINTMENTS_KV?.get('settings');
    if (settingsJson) {
      const fullSettings = JSON.parse(settingsJson);
      durationMinutes = fullSettings.appointmentDurationMinutes || 30;
    }
  } catch (error) {
    console.error('Error loading duration settings:', error);
  }
  
  const appointment = convertToAppointmentData({
    ...data,
    message: '',
    status: 'confirmed',
  }, durationMinutes);

  const html = generateCustomerReminderEmail(appointment, settings);
  
  const result = await sendEmail({
    to: data.email,
    subject: `⏰ Erinnerung: Ihr Termin morgen - ${settings.eventName}`,
    html,
    from: `${settings.companyName} <${settings.companyEmail}>`,
  }, env);

  // Audit Log für Erinnerung
  if (env?.APPOINTMENTS_KV) {
    if (result.success) {
      await createAuditLog(
        env.APPOINTMENTS_KV,
        '✅ Erinnerungs-E-Mail',
        `Erinnerung wurde an ${data.email} gesendet.`,
        undefined,
        'system'
      );
    } else {
      await createAuditLog(
        env.APPOINTMENTS_KV,
        '❌ E-Mail-Fehler',
        `Erinnerung konnte nicht an ${data.email} gesendet werden. Fehler: ${result.error || 'Unbekannt'}`,
        undefined,
        'system'
      );
    }
  }

  return result.success;
}
