import type { APIRoute } from 'astro';
import { getEventDateISO } from '../../lib/event-config';

interface Appointment {
  id: string;
  day: string;
  time: string;
  appointmentDate: string;
  status: string;
  name: string;
  email: string;
}

interface Settings {
  maxAppointmentsPerSlot?: number;
  maxBookingsPerSlot?: number;
  availableDays?: any;
  eventYear?: number;
  eventDateFriday?: string;
  eventDateSaturday?: string;
  eventDateSunday?: string;
  [key: string]: any;
}

/**
 * ✅ FIX #14: Date-Validierung Helper
 */
function validateAndParseDate(dateString: string): Date | null {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error(`Invalid date: ${dateString}`);
      return null;
    }
    return date;
  } catch (error) {
    console.error(`Error parsing date: ${dateString}`, error);
    return null;
  }
}

export const GET: APIRoute = async ({ locals, url }) => {
  try {
    const kv = locals.runtime?.env?.APPOINTMENTS_KV;
    if (!kv) {
      return new Response('KV not available', { status: 500 });
    }

    // ✅ FIX #9: Korrekter Settings-Key
    const settingsData = await kv.get('settings');
    const settings: Settings | null = settingsData ? JSON.parse(settingsData) : null;

    // Spezifischer Slot zum Debuggen
    const day = url.searchParams.get('day') || 'friday';
    const time = url.searchParams.get('time') || '10:30';
    
    // ✅ FIX #10: Korrektes Slot-Key Format mit dateKey (3 Parameter)
    const eventDate = getEventDateISO(day as 'friday' | 'saturday' | 'sunday', settings);
    const slotKey = `slot:${day}:${time}:${eventDate}`;

    // Hole Slot-Daten
    const slotData = await kv.get(slotKey);
    const slotAppointments: string[] = slotData ? JSON.parse(slotData) : [];

    // Lade alle Appointments für diesen Slot
    const appointments: any[] = [];
    for (const aptId of slotAppointments) {
      const aptData = await kv.get(`appointment:${aptId}`);
      if (aptData) {
        const apt: Appointment = JSON.parse(aptData);
        
        // ✅ FIX #14: Validiere appointmentDate
        const validDate = validateAndParseDate(apt.appointmentDate);
        
        appointments.push({
          id: apt.id,
          name: apt.name,
          email: apt.email,
          status: apt.status,
          time: apt.time,
          day: apt.day,
          appointmentDate: apt.appointmentDate,
          appointmentDateValid: validDate !== null,
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
        
        // ✅ FIX #14: Validiere appointmentDate
        const validDate = validateAndParseDate(apt.appointmentDate);
        
        // Vergleiche mit eventDate (nicht nur day/time)
        const aptDateKey = validDate ? validDate.toISOString().split('T')[0] : null;
        
        if (apt.day === day && apt.time === time && aptDateKey === eventDate) {
          allAppointments.push({
            id: apt.id,
            name: apt.name,
            email: apt.email,
            status: apt.status,
            appointmentDate: apt.appointmentDate,
            appointmentDateValid: validDate !== null,
            dateKey: aptDateKey,
          });
        }
      }
    }

    // ✅ FIX #8: Zeige beide Namen für Diagnose
    const maxSlots = settings?.maxAppointmentsPerSlot ?? settings?.maxBookingsPerSlot ?? 'not set';

    const result = {
      slot: `${day} ${time} (${eventDate})`,
      settings: {
        maxAppointmentsPerSlot: settings?.maxAppointmentsPerSlot || 'not set',
        maxBookingsPerSlot: settings?.maxBookingsPerSlot || 'not set (deprecated)',
        effectiveMaxSlots: maxSlots,
        availableDays: settings?.availableDays || 'not set',
        eventYear: settings?.eventYear || 'not set',
        eventDateForDay: eventDate,
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
      validation: {
        allDatesValid: appointments.every(a => a.appointmentDateValid),
        invalidDates: appointments.filter(a => !a.appointmentDateValid).map(a => ({ id: a.id, date: a.appointmentDate })),
      },
      issue: slotAppointments.length !== allAppointments.length ? '⚠️ INCONSISTENCY DETECTED!' : '✅ OK',
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
