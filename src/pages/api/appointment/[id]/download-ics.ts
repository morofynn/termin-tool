import type { APIRoute } from 'astro';
import ical from 'ical-generator';
import { getSettings, getAppointment } from '../../../../lib/kv-utils';
import { validateAndParseBerlinDate } from '../../../../lib/date-utils';

export const GET: APIRoute = async ({ params, locals, request }) => {
  const { id } = params;

  if (!id) {
    return new Response('Missing appointment ID', { status: 400 });
  }

  // KV Store aus Cloudflare Runtime holen
  const KV = locals?.runtime?.env?.APPOINTMENTS_KV || 
             (locals as any)?.APPOINTMENT_BOOKINGS ||
             import.meta.env?.APPOINTMENT_BOOKINGS;

  if (!KV) {
    console.error('KV Storage not available. locals:', JSON.stringify(Object.keys(locals || {})));
    console.error('Runtime env keys:', locals?.runtime?.env ? Object.keys(locals.runtime.env) : 'no runtime.env');
    return new Response('Storage not available - KV binding missing', { status: 500 });
  }

  try {
    // ✅ Verwende getAppointment() aus kv-utils
    const appointment = await getAppointment(KV, id);
    if (!appointment) {
      return new Response('Appointment not found', { status: 404 });
    }

    // ✅ Verwende getSettings() für normalisierte Settings
    const settings = await getSettings(KV);

    // ✅ Validiere appointmentDate mit date-utils
    const appointmentDate = validateAndParseBerlinDate(appointment.appointmentDate);
    if (!appointmentDate) {
      console.error(`Invalid appointment date for ${id}: ${appointment.appointmentDate}`);
      return new Response('Invalid appointment date', { status: 400 });
    }
    
    const [startHours, startMinutes] = appointment.time.split(':').map(Number);
    const endHours = appointment.endTime ? appointment.endTime.split(':').map(Number)[0] : startHours + 1;
    const endMinutes = appointment.endTime ? appointment.endTime.split(':').map(Number)[1] : startMinutes;

    const startDateTime = new Date(appointmentDate);
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    const endDateTime = new Date(appointmentDate);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    // Determine base URL
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const appointmentUrl = `${baseUrl}/termin/${id}`;
    const location = `${settings.eventLocation}, ${settings.eventHall}`;

    // Create ICS
    const calendar = ical({ name: 'Terminbestätigung' });

    // ICS enthält Unternehmensdaten, nicht Kundendaten
    calendar.createEvent({
      start: startDateTime,
      end: endDateTime,
      summary: `Termin bei ${settings.companyName}`,
      description: `Ihr Termin bei ${settings.companyName}\n\n` +
        `Ort: ${location}\n\n` +
        `Kontakt:\n` +
        `${settings.companyName}\n` +
        `${settings.companyAddress}\n` +
        `Tel: ${settings.companyPhone}\n` +
        `E-Mail: ${settings.companyEmail}` +
        (settings.companyWebsite ? `\nWeb: ${settings.companyWebsite}` : '') +
        `\n\nTermindetails: ${appointmentUrl}`,
      location,
      organizer: {
        name: settings.companyName,
        email: settings.companyEmail,
      },
    });

    const icsContent = calendar.toString();

    return new Response(icsContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/calendar; charset=utf-8',
        'Content-Disposition': `attachment; filename="termin-${id}.ics"`,
      },
    });
  } catch (error) {
    console.error('ICS generation error:', error);
    return new Response(`Internal server error: ${error instanceof Error ? error.message : 'Unknown'}`, { status: 500 });
  }
};
