import type { APIRoute } from 'astro';
import ical from 'ical-generator';

export const GET: APIRoute = async ({ params, locals, request }) => {
  const { id } = params;

  if (!id) {
    return new Response('Missing appointment ID', { status: 400 });
  }

  // Try multiple ways to access KV
  const KV = locals?.runtime?.env?.APPOINTMENT_BOOKINGS || 
             (locals as any)?.APPOINTMENT_BOOKINGS ||
             import.meta.env?.APPOINTMENT_BOOKINGS;

  if (!KV) {
    console.error('KV Storage not available. locals:', JSON.stringify(Object.keys(locals || {})));
    console.error('Runtime env keys:', locals?.runtime?.env ? Object.keys(locals.runtime.env) : 'no runtime.env');
    return new Response('Storage not available - KV binding missing', { status: 500 });
  }

  try {
    // Get appointment data
    const appointmentJson = await KV.get(`appointment:${id}`);
    if (!appointmentJson) {
      return new Response('Appointment not found', { status: 404 });
    }

    const appointment = JSON.parse(appointmentJson);

    // Get settings
    const settingsJson = await KV.get('settings');
    const settings = settingsJson ? JSON.parse(settingsJson) : {
      companyName: 'Unternehmen',
      companyEmail: 'info@example.com',
      companyPhone: '+49 123 456789',
      companyAddress: 'Musterstraße 1, 12345 Musterstadt',
      companyWebsite: '',
      eventLocation: 'Veranstaltungsort',
      eventHall: 'Halle/Raum',
      eventName: '',
      standInfo: ''
    };

    // Parse date and time
    const appointmentDate = new Date(appointment.date);
    const [startHours, startMinutes] = appointment.startTime.split(':').map(Number);
    const [endHours, endMinutes] = appointment.endTime.split(':').map(Number);

    const startDateTime = new Date(appointmentDate);
    startDateTime.setHours(startHours, startMinutes, 0, 0);

    const endDateTime = new Date(appointmentDate);
    endDateTime.setHours(endHours, endMinutes, 0, 0);

    // Determine base URL
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const appointmentUrl = `${baseUrl}/termin/${id}`;

    // Identisch mit Email-ICS: OHNE Firmenadresse, OHNE RSVP
    const description = [
      `Termin mit ${settings.companyName}`,
      settings.eventName ? `\nVeranstaltung: ${settings.eventName}` : '',
      settings.standInfo ? `\nStand/Ort: ${settings.standInfo}` : '',
      `\n\nKontakt:`,
      `\nTelefon: ${settings.companyPhone}`,
      `\nE-Mail: ${settings.companyEmail}`,
      settings.companyWebsite ? `\nWebsite: ${settings.companyWebsite}` : '',
      appointment.message ? `\n\nIhre Nachricht:\n${appointment.message}` : '',
      `\n\nTermin verwalten:\n${appointmentUrl}`,
    ].filter(Boolean).join('');

    // Location: Nur standInfo, KEIN Fallback auf companyAddress
    const location = settings.standInfo 
      ? `${settings.standInfo}${settings.eventName ? ` (${settings.eventName})` : ''}`
      : '';

    // Create ICS
    const calendar = ical({ name: `Termin ${settings.companyName}` });

    calendar.createEvent({
      start: startDateTime,
      end: endDateTime,
      summary: settings.eventName 
        ? `Termin: ${settings.companyName} - ${settings.eventName}` 
        : `Termin: ${settings.companyName}`,
      description,
      location,
      organizer: {
        name: settings.companyName,
        email: settings.companyEmail,
      },
      attendees: [
        {
          name: appointment.name,
          email: appointment.email,
          rsvp: false,
        }
      ],
      status: appointment.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE',
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
