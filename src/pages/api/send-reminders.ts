import type { APIRoute } from 'astro';
import { sendReminderEmail } from '../../lib/email';
import { createAuditLog } from './admin/audit-log';
import { getAppointmentUrl } from '../../lib/url-utils';

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

/**
 * Konvertiert Appointment zu AppointmentData für Email-Service
 */
function toAppointmentData(
  appointment: Appointment,
  appointmentUrl: string
): AppointmentData {
  const appointmentDate = new Date(appointment.appointmentDate);
  const [hours, minutes] = appointment.time.split(':').map(Number);
  
  const endDate = new Date(appointmentDate);
  endDate.setMinutes(appointmentDate.getMinutes() + 30);
  
  const endTime = `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
  
  return {
    id: appointment.id,
    name: appointment.name,
    company: appointment.company,
    phone: appointment.phone,
    email: appointment.email,
    date: appointmentDate.toISOString().split('T')[0], // YYYY-MM-DD
    startTime: appointment.time,
    endTime: endTime,
    message: appointment.message,
    status: appointment.status,
    appointmentUrl,
  };
}

/**
 * API-Route zum Versenden von Erinnerungs-E-Mails
 * Wird automatisch 24h vor jedem Termin ausgeführt (via Cron Trigger)
 * 
 * Kann manuell getestet werden mit:
 * POST /api/send-reminders
 */
export const POST: APIRoute = async ({ locals, url }) => {
  try {
    console.log('🔔 Starting reminder email job...');
    
    const kv = locals.runtime?.env?.APPOINTMENTS_KV;
    if (!kv) {
      console.error('KV namespace not available');
      return new Response(
        JSON.stringify({ message: 'KV store not available' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Hole alle Appointments
    const allAppointmentsKey = 'appointments:list';
    const existingList = await kv.get(allAppointmentsKey);
    const appointmentIds: string[] = existingList ? JSON.parse(existingList) : [];

    console.log(`📋 Found ${appointmentIds.length} total appointments`);

    const now = new Date();
    const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const in25Hours = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    let remindersSent = 0;
    let remindersFailed = 0;
    const processedAppointments: string[] = [];

    // Durchlaufe alle Appointments
    for (const aptId of appointmentIds) {
      try {
        const aptData = await kv.get(`appointment:${aptId}`);
        if (!aptData) continue;

        const appointment: Appointment = JSON.parse(aptData);

        // Nur bestätigte Termine
        if (appointment.status !== 'confirmed') {
          continue;
        }

        const appointmentDate = new Date(appointment.appointmentDate);

        // Prüfe ob Termin in 24h ist (mit 1h Toleranz)
        if (appointmentDate >= in24Hours && appointmentDate <= in25Hours) {
          console.log(`⏰ Sending reminder for appointment ${aptId} (${appointment.name})`);

          // Prüfe ob Erinnerung bereits gesendet wurde
          const reminderSentKey = `reminder_sent:${aptId}`;
          const alreadySent = await kv.get(reminderSentKey);

          if (alreadySent) {
            console.log(`⏭️ Reminder already sent for ${aptId}, skipping`);
            continue;
          }

          // ✅ Zentrale URL-Generierung mit ADMIN_BASE_URL
          const appointmentUrl = getAppointmentUrl(aptId, locals?.runtime?.env, url.origin);

          try {
            const emailSent = await sendReminderEmail(
              {
                name: appointment.name,
                email: appointment.email,
                day: appointmentDate.toISOString().split('T')[0],
                time: appointment.time,
                company: appointment.company,
                phone: appointment.phone,
                appointmentUrl,
              },
              locals?.runtime?.env
            );

            if (emailSent) {
              remindersSent++;
              processedAppointments.push(`${appointment.name} (${appointment.email})`);

              // Markiere als gesendet (TTL: 7 Tage)
              await kv.put(reminderSentKey, 'true', { expirationTtl: 60 * 60 * 24 * 7 });

              // Audit Log
              await createAuditLog(
                kv,
                'Erinnerungs-E-Mail',
                `Erinnerung wurde an ${appointment.email} gesendet für Termin am ${appointmentDate.toISOString().split('T')[0]} um ${appointment.time} Uhr.`,
                appointment.id,
                'system'
              );

              console.log(`✅ Reminder sent to ${appointment.email}`);
            } else {
              remindersFailed++;
              console.error(`❌ Failed to send reminder to ${appointment.email}`);

              await createAuditLog(
                kv,
                'E-Mail fehlgeschlagen',
                `Erinnerung konnte nicht an ${appointment.email} gesendet werden.`,
                appointment.id,
                'system'
              );
            }
          } catch (emailError) {
            remindersFailed++;
            console.error(`❌ Error sending reminder to ${appointment.email}:`, emailError);

            await createAuditLog(
              kv,
              'E-Mail fehlgeschlagen',
              `Fehler beim Senden der Erinnerung an ${appointment.email}: ${emailError instanceof Error ? emailError.message : 'Unknown error'}`,
              appointment.id,
              'system'
            );
          }
        }
      } catch (error) {
        console.error(`Error processing appointment ${aptId}:`, error);
        remindersFailed++;
      }
    }

    console.log(`✅ Reminder job complete: ${remindersSent} sent, ${remindersFailed} failed`);

    // Gesamte Audit Log Eintrag
    if (remindersSent > 0 || remindersFailed > 0) {
      await createAuditLog(
        kv,
        'Erinnerungs-Job',
        `Erinnerungs-E-Mails versendet: ${remindersSent} erfolgreich, ${remindersFailed} fehlgeschlagen.`,
        undefined,
        'system'
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        remindersSent,
        remindersFailed,
        processedAppointments,
        message: `Reminder job complete: ${remindersSent} sent, ${remindersFailed} failed`,
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Reminder job error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Error running reminder job',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * GET-Methode für manuelle Ausführung/Test
 */
export const GET: APIRoute = async (context) => {
  return POST(context);
};
