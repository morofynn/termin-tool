globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../renderers.mjs';

const GET = async ({ locals, url }) => {
  try {
    const kv = locals.runtime?.env?.APPOINTMENTS_KV;
    if (!kv) {
      return new Response("KV not available", { status: 500 });
    }
    const settingsData = await kv.get("app:settings");
    const settings = settingsData ? JSON.parse(settingsData) : null;
    const day = url.searchParams.get("day") || "friday";
    const time = url.searchParams.get("time") || "10:30";
    const slotKey = `slot:${day}-${time}`;
    const slotData = await kv.get(slotKey);
    const slotAppointments = slotData ? JSON.parse(slotData) : [];
    const appointments = [];
    for (const aptId of slotAppointments) {
      const aptData = await kv.get(`appointment:${aptId}`);
      if (aptData) {
        const apt = JSON.parse(aptData);
        appointments.push({
          id: apt.id,
          name: apt.name,
          email: apt.email,
          status: apt.status,
          time: apt.time,
          day: apt.day
        });
      }
    }
    const activeCount = appointments.filter((a) => a.status !== "cancelled").length;
    const cancelledCount = appointments.filter((a) => a.status === "cancelled").length;
    const listData = await kv.get("appointments:list");
    const allIds = listData ? JSON.parse(listData) : [];
    const allAppointments = [];
    for (const aptId of allIds) {
      const aptData = await kv.get(`appointment:${aptId}`);
      if (aptData) {
        const apt = JSON.parse(aptData);
        if (apt.day === day && apt.time === time) {
          allAppointments.push({
            id: apt.id,
            name: apt.name,
            email: apt.email,
            status: apt.status
          });
        }
      }
    }
    const result = {
      slot: `${day} ${time}`,
      settings: {
        maxBookingsPerSlot: settings?.maxBookingsPerSlot || "not set",
        availableDays: settings?.availableDays || "not set"
      },
      slotKey,
      slotData: {
        appointmentIds: slotAppointments,
        count: slotAppointments.length
      },
      appointmentsFromSlot: appointments,
      appointmentsFromList: allAppointments,
      counts: {
        inSlotKey: slotAppointments.length,
        activeFromSlot: activeCount,
        cancelledFromSlot: cancelledCount,
        fromList: allAppointments.length,
        activeFromList: allAppointments.filter((a) => a.status !== "cancelled").length
      },
      issue: slotAppointments.length !== allAppointments.length ? "INCONSISTENCY DETECTED!" : "OK"
    };
    return new Response(
      JSON.stringify(result, null, 2),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
