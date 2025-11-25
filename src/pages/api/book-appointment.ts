import type { APIRoute } from 'astro';
import { createAuditLog } from './admin/audit-log';
import { sendAdminNotification, sendCustomerNotification } from '../../lib/email';
import { validateFormData } from '../../lib/validation';
import { checkRateLimit, getClientIP } from '../../lib/rate-limit';
import { DEFAULT_SETTINGS } from '../../lib/constants';
import type { Appointment, Settings, DayKey } from '../../types/appointments';
import { getEventDateISO, type EventDay } from '../../lib/event-config';
import { getLongLabel } from '../../lib/event-config';
import { getAppointmentUrl } from '../../lib/url-utils';

// ✅ NEW: Import Utils
import { getSettings, saveAppointment, addToAppointmentsList, removeFromAppointmentsList, getAllAppointments } from '../../lib/kv-utils';
import { reserveSlot, releaseSlot, isSlotAvailable } from '../../lib/slot-utils';
import { createAppointmentDateTime } from '../../lib/date-utils';

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

    // ✅ MIGRATION: Settings laden mit Utility
    const settings = await getSettings(kv);

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
    if (!['friday', 'saturday', 'saturday', 'sunday'].includes(day)) {
      return new Response(
        JSON.stringify({ message: 'Ungültiger Tag ausgewählt' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ✅ MIGRATION: DOPPELBUCHUNGSSCHUTZ (mit Utility)
    if (settings.preventDuplicateEmail !== false) {
      const allAppointments = await getAllAppointments(kv);
      
      const existingAppointment = allAppointments.find(
        apt => apt.email.toLowerCase() === sanitizedData.email.toLowerCase() && apt.status !== 'cancelled'
      );
      
      if (existingAppointment) {
        await createAuditLog(
          kv,
          'Doppelbuchung verhindert',
          `E-Mail ${sanitizedData.email} hat versucht, einen zweiten Termin zu buchen. Bestehender Termin: ${existingAppointment.id}. IP: ${clientIP}`,
          existingAppointment.id,
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

    // === DYNAMISCHES DATUM AUS SETTINGS VERWENDEN ===
    const eventDateISO = getEventDateISO(day as EventDay, settings);
    
    // ✅ MIGRATION: DateTime mit Utility erstellen
    const appointmentDateTimeStr = createAppointmentDateTime(eventDateISO, time);
    const appointmentDate = new Date(appointmentDateTimeStr);

    // Endzeit (aus Settings)
    const endDate = new Date(appointmentDate);
    endDate.setMinutes(appointmentDate.getMinutes() + (settings.appointmentDurationMinutes || 30));

    // ✅ FIX RACE CONDITION: Appointment ID JETZT generieren
    const appointmentId = `apt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // ✅ FIX: Zentrale URL-Generierung mit ADMIN_BASE_URL
    const appointmentUrl = getAppointmentUrl(appointmentId, locals?.runtime?.env, url.origin);
    
    const autoConfirm = settings.bookingMode === 'automatic';

    // ✅ MIGRATION: Slot-Verfügbarkeit prüfen mit Utility
    const dateKey = eventDateISO;
    const slotAvailable = await isSlotAvailable(kv, day, time, dateKey, settings.maxAppointmentsPerSlot);

    if (!slotAvailable) {
      return new Response(
        JSON.stringify({ 
          message: 'Dieser Zeitslot ist leider bereits ausgebucht. Bitte wählen Sie einen anderen Zeitpunkt.' 
        }),
        { status: 409, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ✅ MIGRATION: SOFORT Slot reservieren mit Utility
    const slotReserved = await reserveSlot(kv, day, time, dateKey, appointmentId);
    if (!slotReserved) {
      console.error('Failed to reserve slot');
      return new Response(
        JSON.stringify({ message: 'Fehler beim Reservieren des Zeitslots' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Appointment Objekt erstellen (VORLÄUFIG ohne googleEventId)
    const appointment: Appointment = {
      id: appointmentId,
      day,
      time,
      name: sanitizedData.name,
      company: sanitizedData.company || undefined,
      phone: sanitizedData.phone,
      email: sanitizedData.email,
      message: sanitizedData.message || undefined,
      appointmentDate: appointmentDateTimeStr,
      googleEventId: '', // Wird später gesetzt
      status: autoConfirm ? 'confirmed' : 'pending',
      createdAt: new Date().toISOString(),
    };

    // Google Calendar Konfiguration
    const googleClientId = locals?.runtime?.env?.GOOGLE_CLIENT_ID || import.meta.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = locals?.runtime?.env?.GOOGLE_CLIENT_SECRET || import.meta.env.GOOGLE_CLIENT_SECRET;
    const googleRefreshToken = locals?.runtime?.env?.GOOGLE_REFRESH_TOKEN || import.meta.env.GOOGLE_REFRESH_TOKEN;

    let googleEventId = '';

    // ✅ FIX #1: GESAMTER BUCHUNGSPROZESS IN EINEM TRY-BLOCK
    try {
      // Google Calendar Event erstellen (optional, NACH Slot-Reservierung)
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

            // ✅ FIX v1.1.4: attendees ENTFERNT + sendUpdates=none
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
              // ❌ ENTFERNT: attendees würde Google dazu bringen, E-Mails zu senden
              // attendees: [{ email: sanitizedData.email, displayName: sanitizedData.name }],
              reminders: {
                useDefault: false,
                overrides: [
                  { method: 'popup', minutes: 30 },
                ],
              },
            };

            // ✅ FIX v1.1.4: sendUpdates=none hinzugefügt
            const calendarResponse = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events?sendUpdates=none`,
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
              appointment.googleEventId = googleEventId;
              console.log(`✅ Google Calendar event created: ${googleEventId}`);
            } else {
              console.error('❌ Google Calendar API error:', await calendarResponse.text());
            }
          }
        } catch (error) {
          console.error('❌ Google Calendar error:', error);
          
          // Audit Log für Calendar-Fehler (aber Buchung fortsetzen)
          await createAuditLog(
            kv,
            '⚠️ Google Calendar Fehler',
            `Fehler beim Erstellen des Calendar-Events für ${sanitizedData.name}: ${error instanceof Error ? error.message : 'Unbekannt'}`,
            appointmentId,
            'system'
          );
        }
      }

      // ✅ MIGRATION: Appointment speichern mit Utility
      const saved = await saveAppointment(kv, appointment);
      if (!saved) {
        throw new Error('Failed to save appointment');
      }
      console.log(`✅ Appointment saved: ${appointmentId}`);

      // ✅ MIGRATION: In Liste hinzufügen mit Utility
      await addToAppointmentsList(kv, appointmentId);
      console.log(`✅ Added to appointments:list`);

      // Audit Log erstellen
      const actionText = autoConfirm ? "Termin gebucht" : "Terminanfrage eingegangen";
      const statusText = autoConfirm ? "bestätigt" : "ausstehend";
      await createAuditLog(
        kv,
        actionText,
        `${sanitizedData.name} (${sanitizedData.email}) hat einen Termin für ${DAY_NAMES_FULL[day]}, ${time} Uhr ${autoConfirm ? "gebucht" : "angefragt"}. Status: ${statusText}. IP: ${clientIP}`,
        appointmentId,
        sanitizedData.email
      );

      // E-Mail-Benachrichtigungen senden
      const emailData = {
        name: sanitizedData.name,
        company: sanitizedData.company,
        phone: sanitizedData.phone,
        email: sanitizedData.email,
        day: eventDateISO,
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
        // Emails sind nicht kritisch - Buchung ist bereits gespeichert
      }

      // Erfolgreiche Response
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
      // ✅ CLEANUP: Vollständiger Rollback bei Fehler
      console.error('❌ Booking process error:', error);
      
      try {
        console.log('⚠️ Starting cleanup after booking error...');
        
        // ✅ MIGRATION: Cleanup mit Utils
        // 1. Slot freigeben
        await releaseSlot(kv, day, time, dateKey, appointmentId);
        
        // 2. Aus Liste entfernen
        await removeFromAppointmentsList(kv, appointmentId);
        
        // 3. Appointment löschen
        await kv.delete(`appointment:${appointmentId}`);
        
        // 4. Google Calendar Event löschen (falls erstellt)
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
              
              // ✅ FIX v1.1.4: sendUpdates=none auch beim DELETE
              await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${googleEventId}?sendUpdates=none`,
                {
                  method: 'DELETE',
                  headers: { Authorization: `Bearer ${tokenData.access_token}` },
                }
              );
              console.log(`✅ Google Calendar cleanup successful: ${googleEventId}`);
            }
          } catch (calError) {
            console.error('❌ Failed to cleanup Google Calendar event:', calError);
          }
        }
        
        // 5. Audit Log für Fehler
        await createAuditLog(
          kv,
          '❌ Buchungsfehler',
          `Fehler beim Speichern des Termins für ${sanitizedData.name} (${sanitizedData.email}). Cleanup durchgeführt. IP: ${clientIP}`,
          appointmentId,
          sanitizedData.email
        );
        
        console.log('✅ Cleanup completed successfully');
      } catch (cleanupError) {
        console.error('❌ Failed to cleanup after error:', cleanupError);
      }

      return new Response(
        JSON.stringify({ 
          message: 'Fehler beim Speichern des Termins. Bitte versuchen Sie es erneut.',
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
