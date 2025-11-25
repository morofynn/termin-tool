import type { APIRoute } from 'astro';
import { getAppointment } from '../../../lib/kv-utils';

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
  startTime?: string;
  endTime?: string;
}

export const GET: APIRoute = async ({ params, locals }) => {
  try {
    const { id } = params;

    if (!id) {
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
    const appointment = await getAppointment(kv, id);
    if (!appointment) {
      return new Response(
        JSON.stringify({ message: 'Termin nicht gefunden' }),
        { status: 404, headers: { 'Content-Type': 'application/json' } }
      );
    }

    return new Response(JSON.stringify(appointment), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error fetching appointment:', error);
    return new Response(
      JSON.stringify({
        message: 'Ein Fehler ist aufgetreten',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
