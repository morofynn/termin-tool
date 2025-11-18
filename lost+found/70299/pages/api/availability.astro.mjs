globalThis.process ??= {}; globalThis.process.env ??= {};
import { b as getEventDateISO } from '../../chunks/event-config_B1Fu6tvr.mjs';
export { renderers } from '../../renderers.mjs';

const DEFAULT_MAX_BOOKINGS = 2;
const SETTINGS_KEY = "app:settings";
const DEFAULT_AVAILABLE_DAYS = {
  friday: true,
  saturday: true,
  sunday: true
};
const EVENT_DATES = {
  friday: getEventDateISO("friday"),
  saturday: getEventDateISO("saturday"),
  sunday: getEventDateISO("sunday")
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
    let maxBookingsPerSlot = DEFAULT_MAX_BOOKINGS;
    let availableDays = DEFAULT_AVAILABLE_DAYS;
    let maintenanceMode = false;
    try {
      const settingsData = await kv.get(SETTINGS_KEY);
      if (settingsData) {
        const settings = JSON.parse(settingsData);
        maxBookingsPerSlot = settings.maxBookingsPerSlot || DEFAULT_MAX_BOOKINGS;
        availableDays = settings.availableDays || DEFAULT_AVAILABLE_DAYS;
        maintenanceMode = settings.maintenanceMode || false;
      }
    } catch (error) {
      console.error("Error loading settings, using defaults:", error);
    }
    console.log(`Settings - maxBookings: ${maxBookingsPerSlot}, availableDays:`, availableDays, `maintenanceMode: ${maintenanceMode}`);
    if (maintenanceMode) {
      console.log("Maintenance mode is active - all slots unavailable");
      return new Response(
        JSON.stringify({ maintenanceMode: true }),
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
        const eventDate = EVENT_DATES[day];
        const slotKey = `slot:${day}:${time}:${eventDate}`;
        const responseKey = `${day}-${time}`;
        try {
          const slotData = await kv.get(slotKey);
          if (slotData) {
            const appointmentIds = JSON.parse(slotData);
            let activeCount = 0;
            for (const aptId of appointmentIds) {
              const aptData = await kv.get(`appointment:${aptId}`);
              if (aptData) {
                const apt = JSON.parse(aptData);
                if (apt.status !== "cancelled") {
                  activeCount++;
                }
              }
            }
            availability[responseKey].booked = activeCount;
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
    const sampleKeys = Object.keys(availability).slice(0, 5);
    for (const key of sampleKeys) {
      console.log(`Sample slot ${key}:`, availability[key]);
    }
    return new Response(
      JSON.stringify(availability),
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
