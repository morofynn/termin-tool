import type { APIRoute } from 'astro';
import { EVENT_CONFIG, type EventDay, getEventDateISO } from '../../lib/event-config';

// ✅ MIGRATION: Import Utils
import { getSettings, getAppointment } from '../../lib/kv-utils';
import { getSlotBookings } from '../../lib/slot-utils';

type DayKey = EventDay;

interface SlotAvailability {
  [key: string]: {
    booked: number;
    available: boolean;
  };
}

// ✅ FIX: Default auf 1 setzen (entspricht DEFAULT_SETTINGS in constants.ts)
const DEFAULT_MAX_BOOKINGS = 1;

const DEFAULT_AVAILABLE_DAYS = {
  friday: true,
  saturday: true,
  sunday: true,
};

// Zeitslots Definition - muss mit AppointmentScheduler übereinstimmen
const TIME_SLOTS = {
  friday: Array.from({ length: 15 }, (_, i) => {
    const hour = Math.floor(i / 2) + 10;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  }),
  saturday: Array.from({ length: 15 }, (_, i) => {
    const hour = Math.floor(i / 2) + 10;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  }),
  sunday: Array.from({ length: 13 }, (_, i) => {
    const hour = Math.floor(i / 2) + 10;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  }),
};

export const GET: APIRoute = async ({ locals }) => {
  try {
    // KV Store aus Cloudflare Runtime holen
    const kv = locals.runtime?.env?.APPOINTMENTS_KV;
    if (!kv) {
      console.error('KV namespace not available');
      return new Response(
        JSON.stringify({}),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // ✅ MIGRATION: Verwende getSettings() Utility
    const settings = await getSettings(kv);
    
    const maxAppointmentsPerSlot = settings.maxAppointmentsPerSlot || DEFAULT_MAX_BOOKINGS;
    const availableDays = settings.availableDays || DEFAULT_AVAILABLE_DAYS;
    const maintenanceMode = settings.maintenanceMode || false;

    console.log(`Settings - maxAppointmentsPerSlot: ${maxAppointmentsPerSlot}, availableDays:`, availableDays, `maintenanceMode: ${maintenanceMode}`);

    // Wenn Wartungsmodus aktiv, alle Slots als nicht verfügbar zurückgeben
    if (maintenanceMode) {
      console.log('Maintenance mode is active - all slots unavailable');
      return new Response(
        JSON.stringify({ 
          maintenanceMode: true,
          maxBookingsPerSlot: maxAppointmentsPerSlot // ✅ FIX: Sende maxBookingsPerSlot auch im Wartungsmodus
        }),
        {
          status: 200,
          headers: { 
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
          },
        }
      );
    }

    // Initialisiere availability mit ALLEN Slots
    const availability: SlotAvailability = {};
    const allDays: DayKey[] = ['friday', 'saturday', 'sunday'];

    // Erstelle ALLE Slots zuerst (unabhängig von Buchungen)
    for (const day of allDays) {
      const slots = TIME_SLOTS[day];
      for (const time of slots) {
        const slotKey = `${day}-${time}`;
        
        // Standard: verfügbar wenn Tag aktiviert ist
        availability[slotKey] = {
          booked: 0,
          available: availableDays[day] === true,
        };
      }
    }

    // Jetzt zähle die tatsächlichen Buchungen und aktualisiere die Verfügbarkeit
    for (const day of allDays) {
      const slots = TIME_SLOTS[day];
      
      for (const time of slots) {
        const eventDate = getEventDateISO(day, settings);
        const responseKey = `${day}-${time}`;
        
        try {
          // ✅ MIGRATION: Verwende getSlotBookings() Utility
          const appointmentIds = await getSlotBookings(kv, day, time, eventDate);
          
          if (appointmentIds.length > 0) {
            // Zähle nur aktive Termine (nicht cancelled)
            let activeCount = 0;
            for (const aptId of appointmentIds) {
              const apt = await getAppointment(kv, aptId);
              if (apt && apt.status !== 'cancelled') {
                activeCount++;
              }
            }
            
            // Aktualisiere die Buchungsanzahl
            availability[responseKey].booked = activeCount;
            
            // Aktualisiere Verfügbarkeit: nur verfügbar wenn Tag aktiviert UND noch Plätze frei
            if (availableDays[day]) {
              availability[responseKey].available = activeCount < maxAppointmentsPerSlot;
            } else {
              availability[responseKey].available = false;
            }
          }
        } catch (error) {
          console.error(`Error reading slot ${day}:${time}:${eventDate}:`, error);
        }
      }
    }

    console.log(`Availability calculated with ${Object.keys(availability).length} slots`);
    
    // Debug: Zeige ein paar Beispiel-Slots
    const sampleKeys = Object.keys(availability).slice(0, 5);
    for (const key of sampleKeys) {
      console.log(`Sample slot ${key}:`, availability[key]);
    }

    // ✅ FIX: Sende maxBookingsPerSlot mit in der Response
    return new Response(
      JSON.stringify({
        ...availability,
        maxBookingsPerSlot: maxAppointmentsPerSlot // ✅ Füge maxBookingsPerSlot hinzu
      }),
      {
        status: 200,
        headers: { 
          'Content-Type': 'application/json',
          'Cache-Control': 'no-cache, no-store, must-revalidate',
        },
      }
    );
  } catch (error) {
    console.error('Availability check error:', error);
    return new Response(
      JSON.stringify({}),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
