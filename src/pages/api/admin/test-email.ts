import type { APIRoute } from 'astro';
import { sendCustomerNotification, sendAdminNotification, sendReminderEmail } from '../../../lib/email';
import { getLongLabel } from '../../../lib/event-config';

const SETTINGS_KEY = 'settings';

/**
 * API-Route zum Versenden von Test-E-Mails
 * ✅ FIX: Test-E-Mails senden BEIDE Versionen (Kunde + Admin) an Admin
 * ✅ FIX: instant-booked sendet jetzt Admin-Mail
 */
export const POST: APIRoute = async ({ request, locals, url }) => {
  const KV = locals?.runtime?.env?.APPOINTMENTS_KV;
  
  if (!KV) {
    return new Response(
      JSON.stringify({ message: 'KV store not available' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const body = await request.json() as { emailType?: string };
    const { emailType } = body;

    if (!emailType) {
      return new Response(
        JSON.stringify({ message: 'Missing emailType' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Lade Settings aus KV (für dynamische Event-Daten)
    let adminEmail = 'info@moro-gmbh.de';
    let settings: any = null;
    
    try {
      const settingsData = await KV.get(SETTINGS_KEY);
      if (settingsData) {
        settings = JSON.parse(settingsData);
        adminEmail = settings.adminEmail || adminEmail;
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }

    // Base URL für Test-Links
    const baseUrl = url.origin;
    const testAppointmentUrl = `${baseUrl}/termin/test-123`;

    // Beispiel-Daten für Test-E-Mail
    const testData = {
      name: 'Max Mustermann',
      company: 'Musterfirma GmbH',
      phone: '+49 123 456789',
      email: adminEmail, // Test-E-Mail geht an Admin
      day: '2025-01-24', // Freitag (ISO-Format)
      time: '10:30',
      message: 'Dies ist eine Test-Nachricht für die E-Mail-Vorschau.',
      appointmentUrl: testAppointmentUrl,
      status: 'confirmed' as const,
      action: 'confirmed' as const,
    };

    // Setze Action basierend auf emailType
    let action: 'requested' | 'instant-booked' | 'confirmed' | 'cancelled' | 'rejected' = 'confirmed';
    let status: 'confirmed' | 'cancelled' | 'pending' = 'confirmed';

    switch (emailType) {
      case 'requested':
        action = 'requested';
        status = 'pending';
        break;
      case 'instant-booked':
        action = 'instant-booked';
        status = 'confirmed';
        break;
      case 'confirmed':
        action = 'confirmed';
        status = 'confirmed';
        break;
      case 'rejected':
        action = 'rejected';
        status = 'cancelled';
        break;
      case 'cancelled':
        action = 'cancelled';
        status = 'cancelled';
        break;
      case 'reminder':
        // Erinnerungs-E-Mail hat spezielle Funktion (nur eine Version)
        try {
          const sent = await sendReminderEmail(
            { ...testData, status: 'confirmed', action: 'confirmed' },
            locals?.runtime?.env
          );

          if (sent) {
            return new Response(
              JSON.stringify({
                success: true,
                message: `Test-Erinnerungs-E-Mail wurde an ${adminEmail} gesendet`,
              }),
              { status: 200, headers: { 'Content-Type': 'application/json' } }
            );
          } else {
            return new Response(
              JSON.stringify({
                success: false,
                message: 'Fehler beim Versenden der Test-E-Mail',
              }),
              { status: 500, headers: { 'Content-Type': 'application/json' } }
            );
          }
        } catch (error) {
          console.error('Error sending reminder test email:', error);
          return new Response(
            JSON.stringify({
              success: false,
              message: 'Fehler beim Versenden der Test-E-Mail',
              error: error instanceof Error ? error.message : 'Unknown error',
            }),
            { status: 500, headers: { 'Content-Type': 'application/json' } }
          );
        }
      default:
        return new Response(
          JSON.stringify({ message: 'Invalid emailType' }),
          { status: 400, headers: { 'Content-Type': 'application/json' } }
        );
    }

    // ✅ FIX: Sende BEIDE Versionen für Emails die sowohl an Kunde als auch Admin gehen
    const emailData = {
      ...testData,
      status,
      action,
    };

    const results: string[] = [];
    let allSuccess = true;

    try {
      // 1. Kunden-Version an Admin senden
      console.log(`📧 Sending customer version to admin (${adminEmail})...`);
      const customerSent = await sendCustomerNotification(
        emailData,
        locals?.runtime?.env
      );

      if (customerSent) {
        results.push(`✅ Kunden-E-Mail (${emailType})`);
      } else {
        results.push(`❌ Kunden-E-Mail (${emailType}) fehlgeschlagen`);
        allSuccess = false;
      }

      // 2. Admin-Version an Admin senden (für requested, instant-booked, confirmed, cancelled, rejected)
      if (['requested', 'instant-booked', 'confirmed', 'cancelled', 'rejected'].includes(action)) {
        console.log(`📧 Sending admin version to admin (${adminEmail})...`);
        const adminSent = await sendAdminNotification(
          emailData,
          adminEmail,
          locals?.runtime?.env
        );

        if (adminSent) {
          results.push(`✅ Admin-E-Mail (${emailType})`);
        } else {
          results.push(`❌ Admin-E-Mail (${emailType}) fehlgeschlagen`);
          allSuccess = false;
        }
      }

      return new Response(
        JSON.stringify({
          success: allSuccess,
          message: allSuccess 
            ? `Beide Test-E-Mails (${emailType}) wurden an ${adminEmail} gesendet:\n${results.join('\n')}`
            : `Fehler beim Versenden einiger Test-E-Mails:\n${results.join('\n')}`,
          results,
        }),
        { status: allSuccess ? 200 : 500, headers: { 'Content-Type': 'application/json' } }
      );
    } catch (error) {
      console.error('Error sending test emails:', error);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Fehler beim Versenden der Test-E-Mails',
          error: error instanceof Error ? error.message : 'Unknown error',
          results,
        }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  } catch (error) {
    console.error('Test email error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Fehler beim Verarbeiten der Anfrage',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
