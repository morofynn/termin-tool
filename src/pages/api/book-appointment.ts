import type { APIRoute } from 'astro';
import { createAuditLog } from './admin/audit-log';
import { sendAdminNotification, sendCustomerNotification } from '../../lib/email';
import { validateFormData } from '../../lib/validation';
import { checkRateLimit, getClientIP } from '../../lib/rate-limit';
import { DEFAULT_SETTINGS } from '../../lib/constants';
import type { Appointment, Settings, DayKey } from '../../types/appointments';
import { getEventDate, type EventDay } from '../../lib/event-config';
import { getLongLabel } from '../../lib/event-config';

// Helper-Funktion für Day-Labels
const DAY_NAMES_FULL: Record<DayKey, string> = {
  friday: getLongLabel('friday'),
  saturday: getLongLabel('saturday'),
  sunday: getLongLabel('sunday'),
};

interface BookingRequest {
  day: DayKey;
  time: string;
  name: string;
  company?: string;
  phone: string;
  email: string;
  message?: string;
}

export const POST: APIRoute = async ({ request, locals, url }) => {
  try {
    // KV Store aus Cloudflare Runtime holen
    const kv = locals.runtime?.env?.APPOINTMENTS_KV;
    if (!kv) {
      console.error('KV namespace not available');
      return new Response(
        JSON.stringify({ 
          message: 'Datenspeicher ist nicht verfügbar. Bitte kontaktieren Sie den Administrator.' 
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Settings laden
    const settingsData = await kv.get('settings');
    const settings: Settings = settingsData ? JSON.parse(settingsData) : {
      ...DEFAULT_SETTINGS,
      rateLimitingEnabled: true, // Standard: AN
    };

    // RATE LIMITING CHECK
    const clientIP = getClientIP(request);
    const rateLimitResult = await checkRateLimit(clientIP, kv, settings);

    if (!rateLimitResult.allowed) {
      const resetDate = rateLimitResult.resetAt 
        ? new Date(rateLimitResult.resetAt).toLocaleTimeString('de-DE', { hour: '2-digit', minute: '2-digit' })
        : 'bald';

      await createAuditLog(
        kv,
        'Rate Limit erreicht',
        `IP ${clientIP} hat das Rate Limit erreicht. Nächster Reset: ${resetDate}`,
        undefined,
        clientIP
      );

      return new Response(
        JSON.stringify({ 
          message: `Zu viele Anfragen. Bitte versuchen Sie es um ${resetDate} Uhr erneut.`,
          retryAt: rateLimitResult.resetAt,
        }),
        { 
          status: 429,
          headers: { 
            'Content-Type': 'application/json',
            'Retry-After': String(settings.rateLimitWindowMinutes * 60),
          } 
        }
      );
    }

    const body: BookingRequest = await request.json();
    const { day, time, name, company, phone, email, message } = body;

    // === INPUT-VALIDIERUNG ===
    const validation = validateFormData({
      name,
      company: company || '',
      phone,
      email,
      message: message || '',
      time,
    });

    if (!validation.valid) {
      const firstError = Object.values(validation.errors)[0];
      return new Response(
        JSON.stringify({ message: firstError }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Verwende sanitized data
    const sanitizedData = validation.sanitized!;

    // Tag validieren
    if (!['friday', 'saturday', 'sunday'].includes(day)) {
      return new Response(
        JSON.stringify({ message: 'Ungültiger Tag ausgewählt' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // === DOPPELBUCHUNGSSCHUTZ (nur wenn aktiviert) ===
    if (settings.preventDuplicateEmail !== false) {
      const allAppointmentsKey = 'appointments:list';
      const existingList = await kv.get(allAppointmentsKey);
      const appointmentsList: string[] = existingList ? JSON.parse(existingList) : [];

      for (const aptId of appointmentsList) {
        const aptData = await kv.get(`appointment:${aptId}`);
        if (aptData) {
          const apt: Appointment = JSON.parse(aptData);
          if (apt.email.toLowerCase() === sanitizedData.email.toLowerCase() && 
              apt.status !== 'cancelled') {
            
            // Audit Log für blockierte Doppelbuchung
            await createAuditLog(
              kv,
              'Doppelbuchung verhindert',
              `E-Mail ${sanitizedData.email} hat versucht, einen zweiten Termin zu buchen. Bestehender Termin: ${apt.id}. IP: ${clientIP}`,
              apt.id,
              sanitizedData.email
            );

            return new Response(
              JSON.stringify({ 
                message: 'Mit dieser E-Mail-Adresse wurde bereits ein Termin gebucht. Bitte verwenden Sie eine andere E-Mail-Adresse oder stornieren Sie Ihren bestehenden Termin.' 
              }),
              { status: 409, headers: { 'Content-Type': 'application/json' } }
            );
          }
        }
      }
    }

    // === DYNAMISCHES DATUM AUS SETTINGS VERWENDEN ===
    const eventDate = getEventDate(day as EventDay, settings);
    const appointmentDate = new Date(eventDate);
    
    // Zeit setzen
    const [hours, minutes] = time.split(':').map(Number);
    appointmentDate.setHours(hours, minutes, 0, 0);

    // Endzeit (30 Minuten später)
    const endDate = new Date(appointmentDate);
    endDate.setMinutes(appointmentDate.getMinutes() + (settings.appointmentDurationMinutes || 30));

    // Prüfe verfügbare Plätze für diesen Slot
    const slotKey = `slot:${day}:${time}:${appointmentDate.toISOString().split('T')[0]}`;
    const existingSlotData = await kv.get(slotKey);
    const slotAppointments: string[] = existingSlotData ? JSON.parse(existingSlotData) : [];

    // Zähle nur aktive Termine (nicht cancelled)
    let activeBookingsCount = 0;
    for (const aptId of slotAppointments) {
      const aptData = await kv.get(`appointment:${aptId}`);
      if (aptData) {
        const apt: Appointment = JSON.parse(aptData);
        if (apt.status !== 'cancelled') {
          activeBookingsCount++;
        }
      }
    }

    if (activeBookingsCount >= settings.maxAppointmentsPerSlot) {
      return new Response(
        JSON.stringify({ 
          message: 'Dieser Zeitslot ist leider bereits ausgebucht. Bitte wählen Sie einen anderen Zeitpunkt.' 
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Google Calendar Konfiguration
    const googleClientId = locals?.runtime?.env?.GOOGLE_CLIENT_ID || import.meta.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = locals?.runtime?.env?.GOOGLE_CLIENT_SECRET || import.meta.env.GOOGLE_CLIENT_SECRET;
    const googleRefreshToken = locals?.runtime?.env?.GOOGLE_REFRESH_TOKEN || import.meta.env.GOOGLE_REFRESH_TOKEN;

    let googleEventId = '';

    // Appointment ID generieren
    const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Base URL für die Termin-Link-Generierung
    const baseUrl = url.origin;
    const appointmentUrl = `${baseUrl}/termin/${appointmentId}`;

    const autoConfirm = settings.bookingMode === 'automatic';

    // Google Calendar Event erstellen (optional)
    if (autoConfirm && googleClientId && googleClientSecret && googleRefreshToken) {
      try {
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

          const description = `
Termin-Details:
- Name: ${sanitizedData.name}
${sanitizedData.company ? `- Betrieb: ${sanitizedData.company}` : ''}
- Telefon: ${sanitizedData.phone}
- E-Mail: ${sanitizedData.email}
${sanitizedData.message ? `- Nachricht: ${sanitizedData.message}` : ''}

Termin verwalten: ${appointmentUrl}
          `.trim();

          const event = {
            summary: `Termin: ${sanitizedData.name}${sanitizedData.company ? ` (${sanitizedData.company})` : ''}`,
            description,
            start: {
              dateTime: appointmentDate.toISOString(),
              timeZone: 'Europe/Berlin',
            },
            end: {
              dateTime: endDate.toISOString(),
              timeZone: 'Europe/Berlin',
            },
            attendees: [{ email: sanitizedData.email, displayName: sanitizedData.name }],
            reminders: {
              useDefault: false,
              overrides: [
                { method: 'email', minutes: 24 * 60 },
                { method: 'popup', minutes: 30 },
              ],
            },
          };

          const calendarResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events`,
            {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${tokenData.access_token}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(event),
            }
          );

          if (calendarResponse.ok) {
            const createdEvent = await calendarResponse.json() as { id: string };
            googleEventId = createdEvent.id;
          }
        }
      } catch (error) {
        console.error('Google Calendar error:', error);
      }
    }

    // Appointment Objekt erstellen
    const appointment: Appointment = {
      id: appointmentId,
      day,
      time,
      name: sanitizedData.name,
      company: sanitizedData.company || undefined,
      phone: sanitizedData.phone,
      email: sanitizedData.email,
      message: sanitizedData.message || undefined,
      appointmentDate: appointmentDate.toISOString(),
      googleEventId,
      status: autoConfirm ? 'confirmed' : 'pending',
      createdAt: new Date().toISOString(),
    };

    // Im KV Store speichern
    try {
      // 1. Appointment speichern
      await kv.put(
        `appointment:${appointmentId}`,
        JSON.stringify(appointment),
        { expirationTtl: 60 * 60 * 24 * 90 }
      );

      // 2. Slot-Index aktualisieren
      slotAppointments.push(appointmentId);
      await kv.put(slotKey, JSON.stringify(slotAppointments), { expirationTtl: 60 * 60 * 24 * 90 });

      // 3. In Liste aller Appointments hinzufügen
      const allAppointmentsKey = 'appointments:list';
      const existingList = await kv.get(allAppointmentsKey);
      const appointmentsList: string[] = existingList ? JSON.parse(existingList) : [];
      appointmentsList.push(appointmentId);
      await kv.put(allAppointmentsKey, JSON.stringify(appointmentsList), { expirationTtl: 60 * 60 * 24 * 90 });

      // 4. Audit Log erstellen
      const actionText = autoConfirm ? "Termin gebucht" : "Terminanfrage eingegangen";
      const statusText = autoConfirm ? "bestätigt" : "ausstehend";
      await createAuditLog(
        kv,
        actionText,
        `${sanitizedData.name} (${sanitizedData.email}) hat einen Termin für ${DAY_NAMES_FULL[day]}, ${time} Uhr ${autoConfirm ? "gebucht" : "angefragt"}. Status: ${statusText}. IP: ${clientIP}`,
        appointmentId,
        sanitizedData.email
      );


      // 5. E-Mail-Benachrichtigungen senden
      // ✅ FIX: Übergebe ISO-Datum statt formatierten Tag-Namen
      const emailData = {
        name: sanitizedData.name,
        company: sanitizedData.company,
        phone: sanitizedData.phone,
        email: sanitizedData.email,
        day: appointmentDate.toISOString().split('T')[0], // ✅ z.B. "2025-01-17"
        time,
        message: sanitizedData.message,
        appointmentUrl,
        action: (autoConfirm ? 'instant-booked' : 'requested') as 'instant-booked' | 'requested',
        status: (autoConfirm ? 'confirmed' : 'pending') as 'confirmed' | 'pending',
      };

      try {
        // Admin-Benachrichtigung
        if (settings.emailNotifications && settings.adminEmail) {
          const adminEmailSent = await sendAdminNotification(
            emailData,
            settings.adminEmail,
            locals?.runtime?.env
          );
          if (adminEmailSent) {
            console.log(`✅ Admin notification sent to ${settings.adminEmail}`);
          } else {
            console.error(`❌ Failed to send admin notification`);
          }
        }

        // Kunden-Benachrichtigung
        const customerEmailSent = await sendCustomerNotification(
          emailData,
          locals?.runtime?.env
        );
        if (customerEmailSent) {
          console.log(`✅ Customer notification sent to ${sanitizedData.email}`);
        } else {
          console.error(`❌ Failed to send customer notification`);
        }
      } catch (emailError) {
        console.error('Error sending notifications:', emailError);
      }

      return new Response(
        JSON.stringify({
          message: autoConfirm ? 'Termin erfolgreich gebucht' : 'Terminanfrage eingegangen',
          appointmentId,
          appointmentUrl,
          autoConfirmed: autoConfirm,
          ...(googleEventId && { googleEventId }),
          ...(rateLimitResult.remaining !== undefined && { 
            rateLimitRemaining: rateLimitResult.remaining 
          }),
        }),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('KV Store error:', error);
      
      // Cleanup Google Calendar Event bei Fehler
      if (googleEventId && googleClientId && googleClientSecret && googleRefreshToken) {
        try {
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
            
            await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}`,
              {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${tokenData.access_token}` },
              }
            );
          }
        } catch (deleteError) {
          console.error('Failed to cleanup Google Calendar event:', deleteError);
        }
      }

      return new Response(
        JSON.stringify({ 
          message: 'Fehler beim Speichern des Termins',
          error: error instanceof Error ? error.message : 'Unknown error'
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Booking error:', error);
    return new Response(
      JSON.stringify({ 
        message: 'Ein unerwarteter Fehler ist aufgetreten',
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
