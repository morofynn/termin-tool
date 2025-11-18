globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../renderers.mjs';

const DEFAULT_MAX_BOOKINGS = 2;
const SETTINGS_KEY = "app:settings";
const DEFAULT_AVAILABLE_DAYS = {
  friday: true,
  saturday: true,
  sunday: true
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
    const now = /* @__PURE__ */ new Date();
    const twoWeeksLater = new Date(now);
    twoWeeksLater.setDate(now.getDate() + 14);
    const appointmentsList = await kv.get("appointments:list");
    const appointmentIds = appointmentsList ? JSON.parse(appointmentsList) : [];
    const slotCounts = {};
    for (const appointmentId of appointmentIds) {
      try {
        const appointmentData = await kv.get(`appointment:${appointmentId}`);
        if (!appointmentData) continue;
        const appointment = JSON.parse(appointmentData);
        if (appointment.status === "cancelled") continue;
        const appointmentDate = new Date(appointment.appointmentDate);
        if (appointmentDate < now || appointmentDate > twoWeeksLater) continue;
        const day = appointment.day;
        const time = appointment.time;
        if (!day || !time) continue;
        const slotKey = `${day}-${time}`;
        slotCounts[slotKey] = (slotCounts[slotKey] || 0) + 1;
      } catch (error) {
        console.error(`Error loading appointment ${appointmentId}:`, error);
        continue;
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
    const allDays = ["friday", "saturday", "sunday"];
    const allTimes = [
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "13:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
      "18:00"
    ];
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
