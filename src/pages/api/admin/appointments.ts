import type { APIRoute } from 'astro';
import type { Appointment } from '../../../types/appointments';
import { sendCustomerNotification, sendAdminNotification } from '../../../lib/email';
import { createAuditLog } from './audit-log';
import { DAY_NAMES } from '../../../lib/constants';
import { getAppointmentUrl } from '../../../lib/url-utils';

// ✅ MIGRATION: Import Utils
import { getAppointment, saveAppointment, deleteAppointment as deleteAppointmentFromKV, getAllAppointments, getSettings } from '../../../lib/kv-utils';
import { releaseSlot, extractDateKey } from '../../../lib/slot-utils';
import { validateAndParseBerlinDate } from '../../../lib/date-utils';

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

    // ✅ MIGRATION: Verwende getAllAppointments() Utility
    const appointments = await getAllAppointments(KV);

    // Nach Datum sortieren (mit Validierung)
    appointments.sort((a, b) => {
      const dateA = validateAndParseBerlinDate(a.appointmentDate);
      const dateB = validateAndParseBerlinDate(b.appointmentDate);
      
      if (!dateA && !dateB) return 0;
      if (!dateA) return 1;
      if (!dateB) return -1;
      
      return dateA.getTime() - dateB.getTime();
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

    // ✅ MIGRATION: Verwende getAppointment() Utility
    const appointment = await getAppointment(KV, id);
    if (!appointment) {
      console.error(`❌ Appointment not found: ${id}`);
      return new Response(JSON.stringify({ error: 'Appointment not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log(`✅ Appointment loaded: ${appointment.name} - ${appointment.email} (Status: ${appointment.status})`);

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
        return await deleteAppointmentHandler(appointment, KV, locals);
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
  // Status auf confirmed ändern
  appointment.status = 'confirmed';
  appointment.updatedAt = new Date().toISOString();
  
  // ✅ MIGRATION: Verwende saveAppointment() Utility
  await saveAppointment(KV, appointment);

  // Audit Log
  await createAuditLog(
    KV,
    'Termin bestätigt',
    `Termin für ${appointment.name} (${appointment.email}) am ${DAY_NAMES[appointment.day]}, ${appointment.time} Uhr wurde bestätigt.`,
    appointment.id,
    'Admin'
  );

  const originUrl = new URL(requestUrl).origin;
  const appointmentUrl = getAppointmentUrl(appointment.id, locals?.runtime?.env, originUrl);

  // Google Calendar Event erstellen
  let googleEventLink: string | null = null;
  try {
    const settings = await getSettings(KV);
    googleEventLink = await createGoogleCalendarEvent(
      appointment,
      appointmentUrl,
      locals,
      settings.appointmentDurationMinutes
    );
    
    if (googleEventLink) {
      console.log('✅ Google Calendar event created:', googleEventLink);
      await saveAppointment(KV, appointment);
    }
  } catch (calError) {
    console.error('❌ Error creating Google Calendar event:', calError);
    
    await createAuditLog(
      KV,
      '⚠️ Google Calendar Fehler',
      `Fehler beim Erstellen des Calendar-Events für ${appointment.name}: ${calError instanceof Error ? calError.message : 'Unbekannt'}`,
      appointment.id,
      'system'
    );
  }

  // E-Mail an Kunden senden
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
        action: 'confirmed',
        status: 'confirmed',
      },
      locals?.runtime?.env
    );
  } catch (emailError) {
    console.error('❌ Error sending confirmation email to customer:', emailError);
  }

  // Admin-Benachrichtigung senden
  try {
    const settings = await getSettings(KV);
    if (settings.adminEmail) {
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
        settings.adminEmail,
        locals?.runtime?.env
      );
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
  appointment.updatedAt = new Date().toISOString();
  if (reason) {
    appointment.message = (appointment.message || '') + `\n\nStornierungsgrund: ${reason}`;
  }
  
  // ✅ MIGRATION: Verwende saveAppointment() Utility
  await saveAppointment(KV, appointment);

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

  const originUrl = new URL(requestUrl).origin;
  const appointmentUrl = getAppointmentUrl(appointment.id, locals?.runtime?.env, originUrl);

  // E-Mail an Kunden senden
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

  // Admin-Benachrichtigung senden
  try {
    const settings = await getSettings(KV);
    if (settings.adminEmail && settings.emailNotifications) {
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
          action: 'cancelled',
          status: 'cancelled',
        },
        settings.adminEmail,
        locals?.runtime?.env
      );
      console.log('✅ Admin cancellation notification sent');
    }
  } catch (error) {
    console.error('❌ Error sending admin notification:', error);
  }

  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}

/**
 * LÖSCHT einen Termin endgültig
 * ✅ FIX v1.1: Prüft Status vor Google Calendar Löschung
 */
async function deleteAppointmentHandler(
  appointment: Appointment,
  KV: any,
  locals: any
) {
  console.log(`🗑️ Deleting appointment: ${appointment.id} (Status: ${appointment.status})`);
  
  try {
    // Audit Log für Löschung
    await createAuditLog(
      KV,
      'Termin gelöscht',
      `Termin für ${appointment.name} (${appointment.email}) am ${DAY_NAMES[appointment.day]}, ${appointment.time} Uhr wurde endgültig gelöscht.`,
      appointment.id,
      'Admin'
    );

    // ✅ FIX v1.1: Nur Google Calendar löschen wenn Status NICHT cancelled
    // Bei cancelled wurde das Event bereits beim Stornieren gelöscht
    if (appointment.status !== 'cancelled' && appointment.googleEventId) {
      console.log(`🗓️ Deleting Google Calendar event (Status: ${appointment.status})`);
      try {
        await deleteGoogleCalendarEvent(appointment.googleEventId, locals);
        console.log('✅ Google Calendar event deleted');
      } catch (calError) {
        console.error('❌ Error deleting Google Calendar event:', calError);
        
        await createAuditLog(
          KV,
          '⚠️ Google Calendar Fehler',
          `Fehler beim Löschen des Calendar-Events: ${calError instanceof Error ? calError.message : 'Unbekannt'}`,
          appointment.id,
          'system'
        );
      }
    } else if (appointment.status === 'cancelled') {
      console.log('⏭️ Skipping Google Calendar deletion (already cancelled)');
    } else {
      console.log('⏭️ No Google Calendar event to delete');
    }

    // ✅ MIGRATION: Slot freigeben mit Utility
    const appointmentDate = validateAndParseBerlinDate(appointment.appointmentDate);
    if (appointmentDate) {
      const dateKey = extractDateKey(appointment.appointmentDate);
      await releaseSlot(KV, appointment.day, appointment.time, dateKey, appointment.id);
    } else {
      console.error(`Invalid appointmentDate for appointment ${appointment.id}: ${appointment.appointmentDate}`);
      
      await createAuditLog(
        KV,
        '⚠️ Ungültiges Datum',
        `Termin ${appointment.id} hat ein ungültiges appointmentDate: ${appointment.appointmentDate}`,
        appointment.id,
        'system'
      );
    }

    // ✅ MIGRATION: Termin löschen mit Utility (inkl. Liste-Cleanup)
    await deleteAppointmentFromKV(KV, appointment.id);
    console.log('✅ Appointment deleted from KV');

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error in deleteAppointment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    
    try {
      await createAuditLog(
        KV,
        '❌ Termin-Löschung fehlgeschlagen',
        `Fehler beim Löschen von Termin ${appointment.id}: ${errorMessage}`,
        appointment.id,
        'system'
      );
    } catch (auditError) {
      console.error('Failed to create audit log:', auditError);
    }
    
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

    // Access Token von Refresh Token holen
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

    // Parse appointment date und time
    const appointmentDate = validateAndParseBerlinDate(appointment.appointmentDate);
    if (!appointmentDate) {
      throw new Error(`Invalid appointmentDate: ${appointment.appointmentDate}`);
    }
    
    const [hours, minutes] = appointment.time.split(':').map(Number);
    appointmentDate.setHours(hours, minutes, 0, 0);

    const endDate = new Date(appointmentDate);
    endDate.setMinutes(endDate.getMinutes() + durationMinutes);

    // Event erstellen
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
