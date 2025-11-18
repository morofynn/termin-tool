import type { APIRoute } from 'astro';
import { sendCustomerNotification, sendReminderEmail } from '../../../lib/email';
import { getLongLabel } from '../../../lib/event-config';

const SETTINGS_KEY = 'settings';

/**
 * API-Route zum Versenden von Test-E-Mails
 * Test-E-Mails werden an die Admin-E-Mail-Adresse gesendet
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

    // Dynamische Datum-Labels basierend auf Settings
    const DAY_NAMES_FULL: Record<string, string> = {
      friday: getLongLabel('friday', settings),
      saturday: getLongLabel('saturday', settings),
      sunday: getLongLabel('sunday', settings),
    };

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
        // Erinnerungs-E-Mail hat spezielle Funktion
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

    // Sende Test-E-Mail
    const emailData = {
      ...testData,
      status,
      action,
    };

    try {
      const sent = await sendCustomerNotification(
        emailData,
        locals?.runtime?.env
      );

      if (sent) {
        return new Response(
          JSON.stringify({
            success: true,
            message: `Test-E-Mail (${emailType}) wurde an ${adminEmail} gesendet`,
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
      console.error('Error sending test email:', error);
      return new Response(
        JSON.stringify({
          success: false,
          message: 'Fehler beim Versenden der Test-E-Mail',
          error: error instanceof Error ? error.message : 'Unknown error',
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
