import type { APIRoute } from 'astro';
import { createAuditLog } from '../admin/audit-log';
import { sendAdminNotification, sendCustomerNotification } from '../../../lib/email';
import { getLongLabel } from '../../../lib/event-config';
import { DAY_NAMES } from '../../../lib/constants';

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
}

interface AppSettings {
  emailNotifications?: boolean;
  adminEmail?: string;
  [key: string]: any;
}

const DAY_NAMES_FULL: { [key: string]: string } = {
  friday: getLongLabel('friday'),
  saturday: getLongLabel('saturday'),
  sunday: getLongLabel('sunday'),
};

const SETTINGS_KEY = 'app:settings';

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

    // Appointment laden
    const appointmentData = await kv.get(`appointment:${appointmentId}`);
    if (!appointmentData) {
      return new Response(
        JSON.stringify({ message: 'Termin nicht gefunden' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    const appointment: Appointment = JSON.parse(appointmentData);

    // Prüfen ob bereits storniert
    if (appointment.status === 'cancelled') {
      return new Response(
        JSON.stringify({ message: 'Termin wurde bereits storniert' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Einstellungen laden für E-Mail-Benachrichtigungen
    let emailNotifications = false;
    let adminEmail = '';
    try {
      const settingsData = await kv.get(SETTINGS_KEY);
      if (settingsData) {
        const settings: AppSettings = JSON.parse(settingsData);
        emailNotifications = settings.emailNotifications || false;
        adminEmail = settings.adminEmail || '';
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }

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
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${appointment.googleEventId}`,
              {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
              }
            );

            console.log('Google Calendar event deleted:', appointment.googleEventId);
          }
        } catch (error) {
          console.error('Failed to delete Google Calendar event:', error);
          // Weiter machen, auch wenn Google Calendar fehlschlägt
        }
      }
    }

    // Zeitslot freigeben und Status auf cancelled setzen
    try {
      // Aus Slot-Index entfernen, um Zeitslot freizugeben
      const appointmentDate = new Date(appointment.appointmentDate);
      const dateKey = appointmentDate.toISOString().split('T')[0];
      const slotKey = `slot:${appointment.day}:${appointment.time}:${dateKey}`;
      
      const existingSlotData = await kv.get(slotKey);
      if (existingSlotData) {
        const slotAppointments: string[] = JSON.parse(existingSlotData);
        const updatedSlotAppointments = slotAppointments.filter(aptId => aptId !== appointmentId);
        
        if (updatedSlotAppointments.length > 0) {
          await kv.put(
            slotKey,
            JSON.stringify(updatedSlotAppointments),
            { expirationTtl: 60 * 60 * 24 * 90 }
          );
        } else {
          await kv.delete(slotKey);
        }
      }

      // Status auf cancelled setzen, aber Termin NICHT löschen
      appointment.status = 'cancelled';
      await kv.put(`appointment:${appointmentId}`, JSON.stringify(appointment));

      // Audit Log erstellen
      await createAuditLog(
        kv,
        'Termin storniert (Kunde)',
        `Termin für ${appointment.name} (${appointment.email}) am ${DAY_NAMES[appointment.day]}, ${appointment.time} Uhr wurde vom Kunden storniert. Zeitslot wurde freigegeben.`,
        appointment.id,
        appointment.email
      );

      // Base URL für Termin-Link
      const baseUrl = url.origin;
      const appointmentUrl = `${baseUrl}/termin/${appointmentId}`;

      // E-Mail-Daten vorbereiten
      const emailData = {
        name: appointment.name,
        company: appointment.company,
        phone: appointment.phone,
        email: appointment.email,
        day: new Date(appointment.appointmentDate).toISOString().split('T')[0],
        time: appointment.time,
        message: appointment.message,
        appointmentUrl,
        status: 'cancelled' as const,
        action: 'cancelled' as const,
      };

      // Admin-Benachrichtigung senden (wenn aktiviert)
      if (emailNotifications && adminEmail && isValidEmail(adminEmail)) {
        try {
          const adminEmailSent = await sendAdminNotification(
            emailData,
            adminEmail,
            locals?.runtime?.env
          );

          if (adminEmailSent) {
            console.log(`✅ Admin cancellation notification sent to ${adminEmail}`);
            await createAuditLog(
              kv,
              "E-Mail an Admin",
              `Admin wurde über Stornierung informiert (${adminEmail}).`,
              appointment.id,
              'system'
            );
          }
        } catch (emailError) {
          console.error('Error sending admin notification:', emailError);
        }
      }

      // Kunden-Benachrichtigung senden
      try {
        const customerEmailSent = await sendCustomerNotification(
          emailData,
          locals?.runtime?.env
        );

        if (customerEmailSent) {
          console.log(`✅ Customer cancellation notification sent to ${appointment.email}`);
          await createAuditLog(
            kv,
            "E-Mail an Kunde",
            `Stornierungsbestätigung wurde an ${appointment.email} gesendet.`,
            appointment.id,
            'system'
          );
        }
      } catch (emailError) {
        console.error('Error sending customer notification:', emailError);
      }

      return new Response(
        JSON.stringify({
          message: 'Termin wurde erfolgreich storniert',
          appointment: {
            name: appointment.name,
            email: appointment.email,
            day: new Date(appointment.appointmentDate).toISOString().split('T')[0],
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
