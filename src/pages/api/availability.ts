import type { APIRoute } from 'astro';
import { EVENT_CONFIG, type EventDay, getEventDateISO } from '../../lib/event-config';

type DayKey = EventDay;

interface SlotAvailability {
  [key: string]: {
    booked: number;
    available: boolean;
  };
}

interface Appointment {
  id: string;
  day: string;
  time: string;
  appointmentDate: string;
  status: string;
}

interface AppSettings {
  maxBookingsPerSlot: number;
  availableDays: {
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  preventDuplicateEmail: boolean;
  maintenanceMode: boolean;
  [key: string]: any;
}

const DEFAULT_MAX_BOOKINGS = 2;

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
      // Return empty availability if not configured
      return new Response(
        JSON.stringify({}),
        { status: 200, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Lade Einstellungen
    let maxBookingsPerSlot = DEFAULT_MAX_BOOKINGS;
    let availableDays = DEFAULT_AVAILABLE_DAYS;
    let maintenanceMode = false;
    let settings: AppSettings | undefined;
    
    try {
      const settingsData = await kv.get('settings'); // Korrekter Key
      if (settingsData) {
        settings = JSON.parse(settingsData);
        maxBookingsPerSlot = settings.maxBookingsPerSlot || DEFAULT_MAX_BOOKINGS;
        availableDays = settings.availableDays || DEFAULT_AVAILABLE_DAYS;
        maintenanceMode = settings.maintenanceMode || false;
      }
    } catch (error) {
      console.error('Error loading settings, using defaults:', error);
    }

    console.log(`Settings - maxBookings: ${maxBookingsPerSlot}, availableDays:`, availableDays, `maintenanceMode: ${maintenanceMode}`);

    // Wenn Wartungsmodus aktiv, alle Slots als nicht verfügbar zurückgeben
    if (maintenanceMode) {
      console.log('Maintenance mode is active - all slots unavailable');
      return new Response(
        JSON.stringify({ maintenanceMode: true }),
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
        const slotKey = `slot:${day}:${time}:${eventDate}`;
        const responseKey = `${day}-${time}`;
        
        try {
          const slotData = await kv.get(slotKey);
          if (slotData) {
            const appointmentIds: string[] = JSON.parse(slotData);
            
            // Zähle nur aktive Termine (nicht cancelled)
            let activeCount = 0;
            for (const aptId of appointmentIds) {
              const aptData = await kv.get(`appointment:${aptId}`);
              if (aptData) {
                const apt: Appointment = JSON.parse(aptData);
                if (apt.status !== 'cancelled') {
                  activeCount++;
                }
              }
            }
            
            // Aktualisiere die Buchungsanzahl
            availability[responseKey].booked = activeCount;
            
            // Aktualisiere Verfügbarkeit: nur verfügbar wenn Tag aktiviert UND noch Plätze frei
            if (availableDays[day]) {
              availability[responseKey].available = activeCount < maxBookingsPerSlot;
            } else {
              availability[responseKey].available = false;
            }
          }
        } catch (error) {
          console.error(`Error reading slot ${slotKey}:`, error);
        }
      }
    }

    console.log(`Availability calculated with ${Object.keys(availability).length} slots`);
    
    // Debug: Zeige ein paar Beispiel-Slots
    const sampleKeys = Object.keys(availability).slice(0, 5);
    for (const key of sampleKeys) {
      console.log(`Sample slot ${key}:`, availability[key]);
    }

    return new Response(
      JSON.stringify(availability),
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
