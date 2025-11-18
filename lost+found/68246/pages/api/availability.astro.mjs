globalThis.process ??= {}; globalThis.process.env ??= {};
import { b as getEventDateISO } from '../../chunks/event-config_CKxe_VBp.mjs';
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
    const slotCounts = {};
    const allDays = ["friday", "saturday", "sunday"];
    const allTimes = [
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
      "12:00",
      "12:30",
      "13:00",
      "13:30",
      "14:00",
      "14:30",
      "15:00",
      "15:30",
      "16:00",
      "16:30",
      "17:00",
      "17:30",
      "18:00",
      "18:30"
    ];
    for (const day of allDays) {
      for (const time of allTimes) {
        const eventDate = EVENT_DATES[day];
        const slotKey = `slot:${day}:${time}:${eventDate}`;
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
            const responseKey = `${day}-${time}`;
            slotCounts[responseKey] = activeCount;
          }
        } catch (error) {
          console.error(`Error reading slot ${slotKey}:`, error);
        }
      }
    }
    const availability = {};
    for (const [slotKey, count] of Object.entries(slotCounts)) {
      const [day] = slotKey.split("-");
      if (!availableDays[day]) {
        availability[slotKey] = {
          booked: count,
          available: false
        };
      } else {
        availability[slotKey] = {
          booked: count,
          available: count < maxBookingsPerSlot
        };
      }
    }
    for (const day of allDays) {
      if (!availableDays[day]) {
        for (const time of allTimes) {
          const slotKey = `${day}-${time}`;
          if (!availability[slotKey]) {
            availability[slotKey] = {
              booked: 0,
              available: false
            };
          }
        }
      }
    }
    console.log(`Availability calculated with ${Object.keys(availability).length} slots`);
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
