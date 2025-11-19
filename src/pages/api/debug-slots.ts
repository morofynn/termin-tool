import type { APIRoute } from 'astro';

interface Appointment {
  id: string;
  day: string;
  time: string;
  appointmentDate: string;
  status: string;
  name: string;
  email: string;
}

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const kv = locals.runtime?.env?.APPOINTMENTS_KV;
    if (!kv) {
      return new Response('KV not available', { status: 500 });
    }

    // Hole Settings
    const settingsData = await kv.get('app:settings');
    const settings = settingsData ? JSON.parse(settingsData) : null;

    // Spezifischer Slot zum Debuggen
    const day = url.searchParams.get('day') || 'friday';
    const time = url.searchParams.get('time') || '10:30';
    const slotKey = `slot:${day}-${time}`;

    // Hole Slot-Daten
    const slotData = await kv.get(slotKey);
    const slotAppointments: string[] = slotData ? JSON.parse(slotData) : [];

    // Lade alle Appointments für diesen Slot
    const appointments: any[] = [];
    for (const aptId of slotAppointments) {
      const aptData = await kv.get(`appointment:${aptId}`);
      if (aptData) {
        const apt: Appointment = JSON.parse(aptData);
        appointments.push({
          id: apt.id,
          name: apt.name,
          email: apt.email,
          status: apt.status,
          time: apt.time,
          day: apt.day,
        });
      }
    }

    // Zähle aktive
    const activeCount = appointments.filter(a => a.status !== 'cancelled').length;
    const cancelledCount = appointments.filter(a => a.status === 'cancelled').length;

    // Hole auch die appointments:list
    const listData = await kv.get('appointments:list');
    const allIds: string[] = listData ? JSON.parse(listData) : [];

    // Hole ALLE Appointments aus der Liste
    const allAppointments: any[] = [];
    for (const aptId of allIds) {
      const aptData = await kv.get(`appointment:${aptId}`);
      if (aptData) {
        const apt: Appointment = JSON.parse(aptData);
        if (apt.day === day && apt.time === time) {
          allAppointments.push({
            id: apt.id,
            name: apt.name,
            email: apt.email,
            status: apt.status,
          });
        }
      }
    }

    const result = {
      slot: `${day} ${time}`,
      settings: {
        maxBookingsPerSlot: settings?.maxBookingsPerSlot || 'not set',
        availableDays: settings?.availableDays || 'not set',
      },
      slotKey,
      slotData: {
        appointmentIds: slotAppointments,
        count: slotAppointments.length,
      },
      appointmentsFromSlot: appointments,
      appointmentsFromList: allAppointments,
      counts: {
        inSlotKey: slotAppointments.length,
        activeFromSlot: activeCount,
        cancelledFromSlot: cancelledCount,
        fromList: allAppointments.length,
        activeFromList: allAppointments.filter(a => a.status !== 'cancelled').length,
      },
      issue: slotAppointments.length !== allAppointments.length ? 'INCONSISTENCY DETECTED!' : 'OK',
    };

    return new Response(
      JSON.stringify(result, null, 2),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
