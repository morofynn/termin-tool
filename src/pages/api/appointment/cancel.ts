import type { APIRoute } from 'astro';
import { createAuditLog } from '../admin/audit-log';
import { sendAdminNotification, sendCustomerNotification } from '../../../lib/email';
import { getLongLabel } from '../../../lib/event-config';
import { DAY_NAMES } from '../../../lib/constants';
import { getAppointmentUrl } from '../../../lib/url-utils';
import { getSettings, getAppointment, updateAppointment } from '../../../lib/kv-utils';
import { releaseSlot } from '../../../lib/slot-utils';
import { validateAndParseBerlinDate } from '../../../lib/date-utils';

interface Appointment {
  id: string;
  day: string;
  time: string;
  name: string;
  company?: string;
  phone: string;
  email: string;
  message?: string;
  appointmentDate: string;
  googleEventId?: string;
  status: 'confirmed' | 'cancelled' | 'pending';
  createdAt: string;
  updatedAt?: string;
}

const DAY_NAMES_FULL: { [key: string]: string } = {
  friday: getLongLabel('friday'),
  saturday: getLongLabel('saturday'),
  sunday: getLongLabel('sunday'),
};

function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export const POST: APIRoute = async ({ request, locals, url }) => {
  try {
    const body = await request.json() as { appointmentId?: string };
    const { appointmentId } = body;

    if (!appointmentId) {
      return new Response(
        JSON.stringify({ message: 'Termin-ID fehlt' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // KV Store aus Cloudflare Runtime holen
    const kv = locals.runtime?.env?.APPOINTMENTS_KV;
    if (!kv) {
      console.error('KV namespace not available');
      return new Response(
        JSON.stringify({ message: 'Datenspeicher nicht verfügbar' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ✅ Verwende getAppointment() aus kv-utils
    const appointment = await getAppointment(kv, appointmentId);
    if (!appointment) {
      return new Response(
        JSON.stringify({ message: 'Termin nicht gefunden' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ✅ Validiere appointmentDate mit date-utils
    const appointmentDate = validateAndParseBerlinDate(appointment.appointmentDate);
    if (!appointmentDate) {
      console.error(`Invalid appointmentDate for appointment ${appointmentId}: ${appointment.appointmentDate}`);
      return new Response(
        JSON.stringify({ message: 'Ungültiges Termin-Datum' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Prüfen ob bereits storniert
    if (appointment.status === 'cancelled') {
      return new Response(
        JSON.stringify({ message: 'Termin wurde bereits storniert' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ✅ Verwende getSettings() für normalisierte Settings
    const settings = await getSettings(kv);

    // Google Calendar Event löschen (falls vorhanden)
    if (appointment.googleEventId) {
      const googleClientId = locals?.runtime?.env?.GOOGLE_CLIENT_ID || import.meta.env.GOOGLE_CLIENT_ID;
      const googleClientSecret = locals?.runtime?.env?.GOOGLE_CLIENT_SECRET || import.meta.env.GOOGLE_CLIENT_SECRET;
      const googleRefreshToken = locals?.runtime?.env?.GOOGLE_REFRESH_TOKEN || import.meta.env.GOOGLE_REFRESH_TOKEN;

      if (googleClientId && googleClientSecret && googleRefreshToken) {
        try {
          // Access Token holen
          const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
              client_id: googleClientId,
              client_secret: googleClientSecret,
              refresh_token: googleRefreshToken,
              grant_type: 'refresh_token',
            }),
          });

          if (tokenResponse.ok) {
            const tokenData = await tokenResponse.json() as { access_token: string };
            const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || import.meta.env.GOOGLE_CALENDAR_ID || 'primary';

            // Event löschen
            await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${appointment.googleEventId}?sendUpdates=none`,
              {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
              }
            );

            console.log('✅ Google Calendar event deleted:', appointment.googleEventId);
          }
        } catch (error) {
          console.error('Failed to delete Google Calendar event:', error);
          // Weiter machen, auch wenn Google Calendar fehlschlägt
        }
      }
    }

    // ✅ Verwende releaseSlot() aus slot-utils
    try {
      const released = await releaseSlot(
        kv,
        appointment.day,
        appointment.time,
        appointment.appointmentDate,
        appointmentId
      );

      if (released) {
        console.log(`✅ Slot released for ${appointment.day} ${appointment.time}`);
      } else {
        console.warn(`⚠️ Slot not found or already released for ${appointment.day} ${appointment.time}`);
      }

      // Status auf cancelled setzen
      appointment.status = 'cancelled';
      appointment.updatedAt = new Date().toISOString();
      
      // ✅ Verwende updateAppointment() aus kv-utils
      await updateAppointment(kv, appointment);

      // Audit Log erstellen
      await createAuditLog(
        kv,
        'Termin storniert (Kunde)',
        `Termin für ${appointment.name} (${appointment.email}) am ${DAY_NAMES[appointment.day]}, ${appointment.time} Uhr wurde vom Kunden storniert. Zeitslot wurde freigegeben.`,
        appointment.id,
        appointment.email
      );

      // ✅ Zentrale URL-Generierung
      const appointmentUrl = getAppointmentUrl(appointmentId, locals?.runtime?.env, url.origin);

      // E-Mail-Daten vorbereiten
      const emailData = {
        name: appointment.name,
        company: appointment.company,
        phone: appointment.phone,
        email: appointment.email,
        day: appointmentDate.toISOString().split('T')[0],
        time: appointment.time,
        message: appointment.message,
        appointmentUrl,
        status: 'cancelled' as const,
        action: 'cancelled' as const,
      };

      // ✅ FIX v1.1: E-Mail-Funktionen erstellen bereits Audit-Logs
      // Keine doppelten Logs mehr hier

      // Admin-Benachrichtigung senden (wenn aktiviert)
      if (settings.emailNotifications && settings.adminEmail && isValidEmail(settings.adminEmail)) {
        try {
          await sendAdminNotification(
            emailData,
            settings.adminEmail,
            locals?.runtime?.env
          );
          console.log(`✅ Admin cancellation notification sent to ${settings.adminEmail}`);
        } catch (emailError) {
          console.error('Error sending admin notification:', emailError);
        }
      }

      // Kunden-Benachrichtigung senden
      try {
        await sendCustomerNotification(
          emailData,
          locals?.runtime?.env
        );
        console.log(`✅ Customer cancellation notification sent to ${appointment.email}`);
      } catch (emailError) {
        console.error('Error sending customer notification:', emailError);
      }

      return new Response(
        JSON.stringify({
          message: 'Termin wurde erfolgreich storniert',
          appointment: {
            name: appointment.name,
            email: appointment.email,
            day: appointmentDate.toISOString().split('T')[0],
            time: appointment.time,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('KV Store error during cancellation:', error);
      return new Response(
        JSON.stringify({ 
          message: 'Fehler beim Stornieren des Termins',
          error: error instanceof Error ? error.message : 'Unknown error'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Cancellation error:', error);
    return new Response(
      JSON.stringify({ 
        message: 'Ein unerwarteter Fehler ist aufgetreten',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
