globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../renderers.mjs';

const DEFAULT_MAX_BOOKINGS = 2;
const SETTINGS_KEY = "app:settings";
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
    try {
      const settingsData = await kv.get(SETTINGS_KEY);
      if (settingsData) {
        const settings = JSON.parse(settingsData);
        maxBookingsPerSlot = settings.maxBookingsPerSlot || DEFAULT_MAX_BOOKINGS;
      }
    } catch (error) {
      console.error("Error loading settings, using defaults:", error);
    }
    console.log(`Using maxBookingsPerSlot: ${maxBookingsPerSlot}`);
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
      availability[slotKey] = {
        booked: count,
        available: count < maxBookingsPerSlot
      };
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
