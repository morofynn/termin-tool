import type { APIRoute } from 'astro';
import type { Appointment } from '../../../types/appointments';
import { sendCustomerNotification, sendAdminNotification } from '../../../lib/email';
import { WebflowClient } from 'webflow-api';
import { createAuditLog } from './audit-log';
import { DAY_NAMES } from '../../../lib/constants';
import { getAppointmentUrl } from '../../../lib/url-utils';

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
        return await deleteAppointment(appointment, KV, locals);
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
 * ✅ FIX: Verwendet neue Email-API und Google Calendar korrekt
 */
async function confirmAppointment(
  appointment: Appointment,
  KV: any,
  requestUrl: string,
  locals: any
) {
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

  // ✅ Zentrale URL-Generierung mit ADMIN_BASE_URL
  const originUrl = new URL(requestUrl).origin;
  const appointmentUrl = getAppointmentUrl(appointment.id, locals?.runtime?.env, originUrl);

  // Google Calendar Event erstellen
  let googleEventLink: string | null = null;
  try {
    googleEventLink = await createGoogleCalendarEvent(
      appointment,
      appointmentUrl,
      locals
    );
    console.log('✅ Google Calendar event created:', googleEventLink);
    
    // Speichere Event ID im Appointment
    if (googleEventLink) {
      await KV.put(`${APPOINTMENTS_PREFIX}${appointment.id}`, JSON.stringify(appointment));
    }
  } catch (calError) {
    console.error('❌ Error creating Google Calendar event:', calError);
    
    // Audit Log für Calendar-Fehler
    const errorMessage = calError instanceof Error ? calError.message : 'Unbekannter Fehler';
    await createAuditLog(
      KV,
      '❌ Google Calendar Fehler',
      `Fehler beim Erstellen des Calendar-Events für ${appointment.name}: ${errorMessage}`,
      appointment.id,
      'system'
    );
    // Weiter ohne Google Calendar
  }

  // ✅ FIX: E-Mail an Kunden mit neuer API senden
  try {
    const emailSent = await sendCustomerNotification(
      {
        name: appointment.name,
        email: appointment.email,
        day: appointment.appointmentDate, // ISO-Format
        time: appointment.time,
        company: appointment.company,
        phone: appointment.phone || '',
        message: appointment.message,
        appointmentUrl,
        action: 'confirmed',
        status: 'confirmed',
      },
      locals?.runtime?.env
    );

    if (!emailSent) {
      console.error('❌ Failed to send confirmation email to customer');
    }
  } catch (emailError) {
    console.error('❌ Error sending confirmation email to customer:', emailError);
  }

  // ✅ NEU: Admin-Benachrichtigung senden (falls gewünscht)
  try {
    const settingsData = await KV.get('settings');
    if (settingsData) {
      const settings = JSON.parse(settingsData);
      const adminEmail = settings.adminEmail;
      
      if (adminEmail) {
        await sendAdminNotification(
          {
            name: appointment.name,
            email: appointment.email,
            day: appointment.appointmentDate,
            time: appointment.time,
            company: appointment.company,
            phone: appointment.phone || '',
            message: appointment.message,
            appointmentUrl,
            action: 'confirmed',
            status: 'confirmed',
          },
          adminEmail,
          locals?.runtime?.env
        );
      }
    }
  } catch (error) {
    console.error('❌ Error sending admin notification:', error);
  }

  return new Response(JSON.stringify({ success: true, googleEventLink }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * STORNIERT einen Termin
 * ✅ FIX: Verwendet neue Email-API
 */
async function cancelAppointment(
  appointment: Appointment,
  KV: any,
  requestUrl: string,
  locals: any,
  reason?: string
) {
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

  // ✅ Zentrale URL-Generierung mit ADMIN_BASE_URL
  const originUrl = new URL(requestUrl).origin;
  const appointmentUrl = getAppointmentUrl(appointment.id, locals?.runtime?.env, originUrl);

  // ✅ FIX: E-Mail an Kunden mit neuer API senden
  try {
    await sendCustomerNotification(
      {
        name: appointment.name,
        email: appointment.email,
        day: appointment.appointmentDate,
        time: appointment.time,
        company: appointment.company,
        phone: appointment.phone || '',
        message: appointment.message,
        appointmentUrl,
        action: 'cancelled',
        status: 'cancelled',
      },
      locals?.runtime?.env
    );
  } catch (emailError) {
    console.error('❌ Error sending cancellation email:', emailError);
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
  KV: any,
  locals: any
) {
  console.log(`🗑️ Deleting appointment: ${appointment.id}`);
  
  try {
    // 1. Audit Log für Löschung
    await createAuditLog(
      KV,
      'Termin gelöscht',
      `Termin für ${appointment.name} (${appointment.email}) am ${DAY_NAMES[appointment.day]}, ${appointment.time} Uhr wurde endgültig gelöscht.`,
      appointment.id,
      'Admin'
    );

    // 2. Google Calendar Event löschen
    try {
      if (appointment.googleEventId) {
        await deleteGoogleCalendarEvent(appointment.googleEventId, locals);
        console.log('✅ Google Calendar event deleted');
      }
    } catch (calError) {
      console.error('❌ Error deleting Google Calendar event:', calError);
    }

    // 3. Termin aus appointments:list entfernen
    const listKey = 'appointments:list';
    const listData = await KV.get(listKey);
    if (listData) {
      const appointmentsList: string[] = JSON.parse(listData);
      const updatedList = appointmentsList.filter(id => id !== appointment.id);
      await KV.put(listKey, JSON.stringify(updatedList));
      console.log(`✅ Removed ${appointment.id} from appointments:list`);
    }

    // 4. Slot-Zähler dekrementieren
    const slotKey = `slot:${appointment.day}:${appointment.time}`;
    const slotData = await KV.get(slotKey);
    if (slotData) {
      const slotCount = parseInt(slotData);
      if (slotCount > 0) {
        const newCount = slotCount - 1;
        if (newCount === 0) {
          await KV.delete(slotKey);
          console.log(`✅ Deleted slot key: ${slotKey}`);
        } else {
          await KV.put(slotKey, newCount.toString());
          console.log(`✅ Decremented slot count for ${slotKey}: ${slotCount} -> ${newCount}`);
        }
      }
    }

    // 5. Termin selbst löschen
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
 * ✅ FIX: Verwendet OAuth Refresh Token Flow + speichert Event ID
 */
async function createGoogleCalendarEvent(
  appointment: Appointment,
  appointmentUrl: string,
  locals: any,
  durationMinutes: number = 30
): Promise<string | null> {
  try {
    const clientId = locals?.runtime?.env?.GOOGLE_CLIENT_ID || import.meta.env.GOOGLE_CLIENT_ID;
    const clientSecret = locals?.runtime?.env?.GOOGLE_CLIENT_SECRET || import.meta.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = locals?.runtime?.env?.GOOGLE_REFRESH_TOKEN || import.meta.env.GOOGLE_REFRESH_TOKEN;
    const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || import.meta.env.GOOGLE_CALENDAR_ID || 'primary';

    if (!clientId || !clientSecret || !refreshToken) {
      console.warn('⚠️ Google Calendar nicht vollständig konfiguriert');
      return null;
    }

    // 1. Access Token von Refresh Token holen
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      const error = await tokenResponse.text();
      console.error('Google token refresh error:', error);
      throw new Error(`Token refresh failed: ${tokenResponse.status}`);
    }

    const { access_token } = await tokenResponse.json() as { access_token: string };

    // 2. Parse appointment date und time
    const [hours, minutes] = appointment.time.split(':').map(Number);
    const appointmentDate = new Date(appointment.appointmentDate);
    appointmentDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(appointmentDate);
    endDate.setMinutes(endDate.getMinutes() + durationMinutes);

    // 3. Event erstellen
    const event = {
      summary: `Termin mit ${appointment.name}${appointment.company ? ` (${appointment.company})` : ''}`,
      description: [
        `Terminbuchung`,
        ``,
        `Name: ${appointment.name}`,
        appointment.company ? `Firma: ${appointment.company}` : '',
        `E-Mail: ${appointment.email}`,
        `Telefon: ${appointment.phone || 'Nicht angegeben'}`,
        appointment.message ? `\nNachricht:\n${appointment.message}` : '',
        ``,
        `Termin-Details: ${appointmentUrl}`,
      ].filter(Boolean).join('\n'),
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
          Authorization: `Bearer ${access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(event),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error('Google Calendar API error:', error);
      throw new Error(`Google Calendar API error: ${response.status}`);
    }

    const data = (await response.json()) as { htmlLink?: string; id?: string };

    // Event ID speichern
    if (data.id) {
      appointment.googleEventId = data.id;
      console.log(`✅ Google Event ID saved: ${data.id}`);
    }

    return data.htmlLink || null;
  } catch (error) {
    console.error('Error creating Google Calendar event:', error);
    throw error;
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
    const clientId = locals?.runtime?.env?.GOOGLE_CLIENT_ID || import.meta.env.GOOGLE_CLIENT_ID;
    const clientSecret = locals?.runtime?.env?.GOOGLE_CLIENT_SECRET || import.meta.env.GOOGLE_CLIENT_SECRET;
    const refreshToken = locals?.runtime?.env?.GOOGLE_REFRESH_TOKEN || import.meta.env.GOOGLE_REFRESH_TOKEN;
    const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || import.meta.env.GOOGLE_CALENDAR_ID || 'primary';

    if (!clientId || !clientSecret || !refreshToken) {
      console.warn('⚠️ Google Calendar nicht konfiguriert');
      return;
    }

    // Access Token holen
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: 'refresh_token',
      }),
    });

    if (!tokenResponse.ok) {
      throw new Error('Token refresh failed');
    }

    const { access_token } = await tokenResponse.json() as { access_token: string };

    // Event löschen
    const response = await fetch(
      `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${eventId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${access_token}`,
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
