import type { APIRoute } from 'astro';
import type { Appointment } from '../../../types/appointments';
import {
  generateCustomerRequestEmail,
  generateCustomerConfirmationEmail,
  generateCustomerCancellationEmail,
  generateAdminNotificationEmail
} from '../../../lib/email-templates';
import { WebflowClient } from 'webflow-api';
import { createAuditLog } from './audit-log';
import icalGenerator from 'ical-generator';
import { DAY_NAMES } from '../../../lib/constants';

const APPOINTMENTS_PREFIX = 'appointment:';

// GET: Alle Termine abrufen
export const GET: APIRoute = async ({ locals }) => {
  try {
    const KV = locals?.runtime?.env?.APPOINTMENTS_KV;
    if (!KV) {
      return new Response(JSON.stringify({ error: 'KV not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Alle Termine aus dem KV Store laden
    const keys = await KV.list({ prefix: APPOINTMENTS_PREFIX });
    const appointments: Appointment[] = [];

    for (const key of keys.keys) {
      const value = await KV.get(key.name);
      if (value) {
        appointments.push(JSON.parse(value));
      }
    }

    // Nach Datum sortieren
    appointments.sort((a, b) => {
      const dateA = new Date(a.appointmentDate).getTime();
      const dateB = new Date(b.appointmentDate).getTime();
      return dateA - dateB;
    });

    return new Response(JSON.stringify({ appointments }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching appointments:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

// POST: Termin-Status ändern
export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const KV = locals?.runtime?.env?.APPOINTMENTS_KV;
    if (!KV) {
      console.error('❌ KV not configured');
      return new Response(JSON.stringify({ error: 'KV not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body = await request.json();
    const { appointmentId: id, action } = body;

    console.log(`📝 POST /api/admin/appointments - Action: ${action}, ID: ${id}`);

    if (!id || !action) {
      console.error('❌ Missing required fields:', { id, action });
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const key = `${APPOINTMENTS_PREFIX}${id}`;

    // Termin laden
    const appointmentData = await KV.get(key);
    if (!appointmentData) {
      console.error(`❌ Appointment not found: ${id}`);
      return new Response(JSON.stringify({ error: 'Appointment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const appointment: Appointment = JSON.parse(appointmentData);
    console.log(`✅ Appointment loaded: ${appointment.name} - ${appointment.email}`);

    // Aktionen ausführen
    switch (action) {
      case 'confirm':
        console.log('🔄 Executing confirm action...');
        return await confirmAppointment(appointment, KV, request.url, locals);
      case 'cancel':
        console.log('🔄 Executing cancel action...');
        return await cancelAppointment(appointment, KV, request.url, locals, body.reason);
      case 'delete':
        console.log('🔄 Executing delete action...');
        return await deleteAppointment(appointment, KV);
      default:
        console.error(`❌ Invalid action: ${action}`);
        return new Response(JSON.stringify({ error: 'Invalid action' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
    }
  } catch (error) {
    console.error('❌ Error updating appointment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: errorMessage 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

/**
 * BESTÄTIGT einen Termin
 */
async function confirmAppointment(
  appointment: Appointment,
  KV: any,
  requestUrl: string,
  locals: any
) {
  const originUrl = new URL(requestUrl).origin;

  // Status auf confirmed ändern
  appointment.status = 'confirmed';
  await KV.put(`${APPOINTMENTS_PREFIX}${appointment.id}`, JSON.stringify(appointment));

  // Audit Log
  await createAuditLog(
    KV,
    'Termin bestätigt',
    `Termin für ${appointment.name} (${appointment.email}) am ${DAY_NAMES[appointment.day]}, ${appointment.time} Uhr wurde bestätigt.`,
    appointment.id,
    'Admin'
  );

  // Termin-URL für die Detailseite erstellen
  const appointmentUrl = `${originUrl}/termin/${appointment.id}`;

  // Google Calendar Event erstellen (mit korrekter appointmentUrl)
  let googleEventLink: string | null = null;
  try {
    googleEventLink = await createGoogleCalendarEvent(
      appointment,
      appointmentUrl, // ✅ appointmentUrl wird übergeben
      locals
    );
    console.log('✅ Google Calendar event created:', googleEventLink);
  } catch (calError) {
    console.error('❌ Error creating Google Calendar event:', calError);
    // Weiter ohne Google Calendar
  }

  // E-Mail an Kunden senden
  try {
    const customerTemplate = generateCustomerConfirmationEmail(
      appointment.name,
      appointment.day,
      appointment.time,
      appointment.phone || '',
      appointment.email,
      appointmentUrl // ✅ appointmentUrl wird übergeben
    );

    // ICS Datei erstellen für Kunden-Email
    const icsContent = createICSForAppointment(appointment, appointmentUrl);

    await sendEmail({
      to: appointment.email,
      subject: customerTemplate.subject,
      html: customerTemplate.html,
      attachments: [
        {
          filename: 'termin.ics',
          content: Buffer.from(icsContent).toString('base64'),
          type: 'text/calendar',
          disposition: 'attachment',
        },
      ],
      locals,
    });

    console.log('✅ Confirmation email sent to customer:', appointment.email);

    // Audit Log für erfolgreiche E-Mail
    await createAuditLog(
      KV,
      'E-Mail versendet',
      `Bestätigungs-E-Mail an Kunden ${appointment.email} erfolgreich versendet.`,
      appointment.id,
      appointment.email
    );
  } catch (emailError) {
    console.error('❌ Error sending confirmation email to customer:', emailError);

    // Audit Log für fehlgeschlagene E-Mail
    const errorMessage = emailError instanceof Error ? emailError.message : 'Unbekannter Fehler';
    await createAuditLog(
      KV,
      'E-Mail Fehler',
      `Fehler beim Versenden der Bestätigungs-E-Mail an ${appointment.email}: ${errorMessage}`,
      appointment.id,
      appointment.email
    );
  }

  return new Response(JSON.stringify({ success: true, googleEventLink }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * STORNIERT einen Termin
 */
async function cancelAppointment(
  appointment: Appointment,
  KV: any,
  requestUrl: string,
  locals: any,
  reason?: string
) {
  const originUrl = new URL(requestUrl).origin;

  // Status auf cancelled ändern
  appointment.status = 'cancelled';
  appointment.cancellationReason = reason;
  await KV.put(`${APPOINTMENTS_PREFIX}${appointment.id}`, JSON.stringify(appointment));

  // Audit Log
  await createAuditLog(
    KV,
    'Termin storniert',
    `Termin für ${appointment.name} (${appointment.email}) am ${DAY_NAMES[appointment.day]}, ${appointment.time} Uhr wurde storniert${reason ? ` - Grund: ${reason}` : ''}.`,
    appointment.id,
    'Admin'
  );

  // Google Calendar Event löschen
  try {
    if (appointment.googleEventId) {
      await deleteGoogleCalendarEvent(appointment.googleEventId, locals);
      console.log('✅ Google Calendar event deleted');
    }
  } catch (calError) {
    console.error('❌ Error deleting Google Calendar event:', calError);
  }

  // E-Mail an Kunden senden
  try {
    const appointmentUrl = `${originUrl}/termin/${appointment.id}`;
    const customerTemplate = getCustomerCancellationTemplate(
      appointment.name,
      appointment.day,
      appointment.time,
      reason || 'Keine Angabe',
      appointmentUrl
    );

    await sendEmail({
      to: appointment.email,
      subject: customerTemplate.subject,
      html: customerTemplate.html,
      locals,
    });

    console.log('✅ Cancellation email sent to customer:', appointment.email);

    // Audit Log für erfolgreiche E-Mail
    await createAuditLog(
      KV,
      'E-Mail versendet',
      `Stornierungsbenachrichtigung an Kunden ${appointment.email} erfolgreich versendet.`,
      appointment.id,
      appointment.email
    );
  } catch (emailError) {
    console.error('❌ Error sending cancellation email:', emailError);

    // Audit Log für fehlgeschlagene E-Mail
    const errorMessage = emailError instanceof Error ? emailError.message : 'Unbekannter Fehler';
    await createAuditLog(
      KV,
      'E-Mail Fehler',
      `Fehler beim Versenden der Stornierungsbenachrichtigung an ${appointment.email}: ${errorMessage}`,
      appointment.id,
      appointment.email
    );
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * LÖSCHT einen Termin endgültig
 */
async function deleteAppointment(
  appointment: Appointment,
  KV: any
) {
  console.log(`🗑️ Deleting appointment: ${appointment.id}`);
  
  try {
    // Audit Log für Löschung BEVOR wir löschen
    await createAuditLog(
      KV,
      'Termin gelöscht',
      `Termin für ${appointment.name} (${appointment.email}) am ${DAY_NAMES[appointment.day]}, ${appointment.time} Uhr wurde endgültig gelöscht.`,
      appointment.id,
      'Admin'
    );
    console.log('✅ Audit log created');

    // Termin aus KV löschen
    await KV.delete(`${APPOINTMENTS_PREFIX}${appointment.id}`);
    console.log('✅ Appointment deleted from KV');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error in deleteAppointment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ 
      error: 'Failed to delete appointment',
      details: errorMessage 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}

/**
 * HELPER: Google Calendar Event erstellen
 * ✅ FIX: appointmentUrl wird jetzt korrekt in Description eingefügt
 */
async function createGoogleCalendarEvent(
  appointment: Appointment,
  appointmentUrl: string, // ✅ NEU: appointmentUrl als Parameter
  locals: any,
  durationMinutes: number = 30
): Promise<string | null> {
  try {
    const token = locals?.runtime?.env?.GOOGLE_ACCESS_TOKEN;
    const refreshToken = locals?.runtime?.env?.GOOGLE_REFRESH_TOKEN;
    const clientId = locals?.runtime?.env?.GOOGLE_CLIENT_ID;
    const clientSecret = locals?.runtime?.env?.GOOGLE_CLIENT_SECRET;
    const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || 'primary';

    if (!token || !refreshToken || !clientId || !clientSecret) {
      console.warn('⚠️ Google Calendar nicht vollständig konfiguriert');
      return null;
    }

    // Parse appointment date und time
    const [hours, minutes] = appointment.time.split(':').map(Number);
    const appointmentDate = new Date(appointment.appointmentDate);
    appointmentDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(appointmentDate);
    endDate.setMinutes(endDate.getMinutes() + durationMinutes);

    // ✅ FIX: appointmentUrl in Description einfügen
    const event = {
      summary: `Termin mit ${appointment.name}`,
      description: `Terminbuchung\n\nName: ${appointment.name}\nE-Mail: ${appointment.email}\nTelefon: ${appointment.phone || 'Nicht angegeben'}\n\nTermin-Link: ${appointmentUrl}`,
      start: {
        dateTime: appointmentDate.toISOString(),
        timeZone: 'Europe/Berlin',
      },
      end: {
        dateTime: endDate.toISOString(),
        timeZone: 'Europe/Berlin',
      },
      reminders: {
        useDefault: false,
        overrides: [
          { method: 'email', minutes: 24 * 60 },
          { method: 'popup', minutes: 30 },
        ],
      },
    };

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      throw new Error(`Google Calendar API error: ${response.status}`);
    }

    const data = (await response.json()) as { htmlLink?: string; id?: string };

    // Google Event ID speichern
    if (data.id) {
      appointment.googleEventId = data.id;
    }

    return data.htmlLink || null;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    return null;
  }
}

/**
 * HELPER: Google Calendar Event löschen
 */
async function deleteGoogleCalendarEvent(
  eventId: string,
  locals: any
): Promise<void> {
  try {
    const token = locals?.runtime?.env?.GOOGLE_ACCESS_TOKEN;
    const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || 'primary';

    if (!token) {
      console.warn('⚠️ Google Calendar nicht konfiguriert');
      return;
    }

    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      throw new Error(`Google Calendar API error: ${response.status}`);
    }
  } catch (error) {
    console.error('Error deleting Google Calendar event:', error);
    throw error;
  }
}

/**
 * HELPER: ICS Datei erstellen
 */
function createICSForAppointment(
  appointment: Appointment,
  appointmentUrl: string
): string {
  const cal = icalGenerator({ name: 'Terminbuchung' });

  // Parse appointment date und time
  const [hours, minutes] = appointment.time.split(':').map(Number);
  const appointmentDate = new Date(appointment.appointmentDate);
  appointmentDate.setHours(hours, minutes, 0, 0);

  const endDate = new Date(appointmentDate);
  endDate.setMinutes(endDate.getMinutes() + 30); // 30 Minuten Dauer

  cal.createEvent({
    start: appointmentDate,
    end: endDate,
    summary: `Termin mit ${appointment.name}`,
    description: `Terminbuchung\n\nName: ${appointment.name}\nE-Mail: ${appointment.email}\nTelefon: ${appointment.phone || 'Nicht angegeben'}\n\nTermin-Link: ${appointmentUrl}`,
    location: 'Online/Vor Ort',
    url: appointmentUrl,
  });

  return cal.toString();
}
