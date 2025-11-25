globalThis.process ??= {}; globalThis.process.env ??= {};
import { a as getEventDateISO } from '../../chunks/event-config_hIr2Xf8F.mjs';
import { a as getSettings, g as getAppointment } from '../../chunks/kv-utils_B0Om6nsN.mjs';
import { g as getSlotBookings } from '../../chunks/slot-utils_CyY0Z7gC.mjs';
export { renderers } from '../../renderers.mjs';

const DEFAULT_MAX_BOOKINGS = 1;
const DEFAULT_AVAILABLE_DAYS = {
  friday: true,
  saturday: true,
  sunday: true
};
const TIME_SLOTS = {
  friday: Array.from({ length: 15 }, (_, i) => {
    const hour = Math.floor(i / 2) + 10;
    const minute = i % 2 === 0 ? "00" : "30";
    return `${hour.toString().padStart(2, "0")}:${minute}`;
  }),
  saturday: Array.from({ length: 15 }, (_, i) => {
    const hour = Math.floor(i / 2) + 10;
    const minute = i % 2 === 0 ? "00" : "30";
    return `${hour.toString().padStart(2, "0")}:${minute}`;
  }),
  sunday: Array.from({ length: 13 }, (_, i) => {
    const hour = Math.floor(i / 2) + 10;
    const minute = i % 2 === 0 ? "00" : "30";
    return `${hour.toString().padStart(2, "0")}:${minute}`;
  })
};
const GET = async ({ locals }) => {
  try {
    const kv = locals.runtime?.env?.APPOINTMENTS_KV;
    if (!kv) {
      console.error("KV namespace not available");
      return new Response(
        JSON.stringify({}),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    }
    const settings = await getSettings(kv);
    const maxAppointmentsPerSlot = settings.maxAppointmentsPerSlot || DEFAULT_MAX_BOOKINGS;
    const availableDays = settings.availableDays || DEFAULT_AVAILABLE_DAYS;
    const maintenanceMode = settings.maintenanceMode || false;
    console.log(`Settings - maxAppointmentsPerSlot: ${maxAppointmentsPerSlot}, availableDays:`, availableDays, `maintenanceMode: ${maintenanceMode}`);
    if (maintenanceMode) {
      console.log("Maintenance mode is active - all slots unavailable");
      return new Response(
        JSON.stringify({
          maintenanceMode: true,
          maxBookingsPerSlot: maxAppointmentsPerSlot
          // ✅ FIX: Sende maxBookingsPerSlot auch im Wartungsmodus
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": "no-cache, no-store, must-revalidate"
          }
        }
      );
    }
    const availability = {};
    const allDays = ["friday", "saturday", "sunday"];
    for (const day of allDays) {
      const slots = TIME_SLOTS[day];
      for (const time of slots) {
        const slotKey = `${day}-${time}`;
        availability[slotKey] = {
          booked: 0,
          available: availableDays[day] === true
        };
      }
    }
    for (const day of allDays) {
      const slots = TIME_SLOTS[day];
      for (const time of slots) {
        const eventDate = getEventDateISO(day, settings);
        const responseKey = `${day}-${time}`;
        try {
          const appointmentIds = await getSlotBookings(kv, day, time, eventDate);
          if (appointmentIds.length > 0) {
            let activeCount = 0;
            for (const aptId of appointmentIds) {
              const apt = await getAppointment(kv, aptId);
              if (apt && apt.status !== "cancelled") {
                activeCount++;
              }
            }
            availability[responseKey].booked = activeCount;
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
    const sampleKeys = Object.keys(availability).slice(0, 5);
    for (const key of sampleKeys) {
      console.log(`Sample slot ${key}:`, availability[key]);
    }
    return new Response(
      JSON.stringify({
        ...availability,
        maxBookingsPerSlot: maxAppointmentsPerSlot
        // ✅ Füge maxBookingsPerSlot hinzu
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache, no-store, must-revalidate"
        }
      }
    );
  } catch (error) {
    console.error("Availability check error:", error);
    return new Response(
      JSON.stringify({}),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
