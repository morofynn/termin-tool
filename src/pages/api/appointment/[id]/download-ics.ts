import type { APIRoute } from 'astro';
import { getSettings, getAppointment } from '../../../../lib/kv-utils';
import { validateAndParseBerlinDate } from '../../../../lib/date-utils';
import { generateICS } from '../../../../lib/email-templates';
import type { AppointmentData, EmailSettings } from '../../../../lib/email-templates';

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

    // Determine base URL
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const appointmentUrl = `${baseUrl}/termin/${id}`;

    // Endzeit berechnen (falls nicht gesetzt)
    const [startHours, startMinutes] = appointment.time.split(':').map(Number);
    const durationMinutes = settings.appointmentDurationMinutes || 30;
    const endDateTime = new Date(appointmentDate);
    endDateTime.setHours(startHours, startMinutes + durationMinutes, 0, 0);

    // Prepare data for ICS generation
    const emailSettings: EmailSettings = {
      companyName: settings.companyName,
      companyAddress: settings.companyAddress,
      companyPhone: settings.companyPhone,
      companyEmail: settings.companyEmail,
      companyWebsite: settings.companyWebsite,
      logoUrl: settings.logoUrl,
      primaryColor: settings.primaryColor,
      standInfo: `${settings.eventLocation}, ${settings.eventHall}`,
      eventName: settings.eventName,
      eventYear: settings.eventYear,
    };

    const appointmentData: AppointmentData = {
      id: appointment.id,
      name: appointment.name,
      company: appointment.company,
      phone: appointment.phone,
      email: appointment.email,
      date: appointmentDate.toISOString().split('T')[0], // ISO date
      startTime: appointment.time,
      endTime: `${String(endDateTime.getHours()).padStart(2, '0')}:${String(endDateTime.getMinutes()).padStart(2, '0')}`,
      message: appointment.message,
      status: appointment.status,
      appointmentUrl,
    };

    // ✅ Verwende zentrale generateICS() Funktion
    const icsContent = generateICS(appointmentData, emailSettings);

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
