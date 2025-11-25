globalThis.process ??= {}; globalThis.process.env ??= {};
import { a as getEventDateISO } from '../../chunks/event-config_hIr2Xf8F.mjs';
export { renderers } from '../../renderers.mjs';

function validateAndParseDate(dateString) {
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
const GET = async ({ locals, url }) => {
  try {
    const kv = locals.runtime?.env?.APPOINTMENTS_KV;
    if (!kv) {
      return new Response("KV not available", { status: 500 });
    }
    const settingsData = await kv.get("settings");
    const settings = settingsData ? JSON.parse(settingsData) : null;
    const day = url.searchParams.get("day") || "friday";
    const time = url.searchParams.get("time") || "10:30";
    const eventDate = getEventDateISO(day, settings);
    const slotKey = `slot:${day}:${time}:${eventDate}`;
    const slotData = await kv.get(slotKey);
    const slotAppointments = slotData ? JSON.parse(slotData) : [];
    const appointments = [];
    for (const aptId of slotAppointments) {
      const aptData = await kv.get(`appointment:${aptId}`);
      if (aptData) {
        const apt = JSON.parse(aptData);
        const validDate = validateAndParseDate(apt.appointmentDate);
        appointments.push({
          id: apt.id,
          name: apt.name,
          email: apt.email,
          status: apt.status,
          time: apt.time,
          day: apt.day,
          appointmentDate: apt.appointmentDate,
          appointmentDateValid: validDate !== null
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
        const validDate = validateAndParseDate(apt.appointmentDate);
        const aptDateKey = validDate ? validDate.toISOString().split("T")[0] : null;
        if (apt.day === day && apt.time === time && aptDateKey === eventDate) {
          allAppointments.push({
            id: apt.id,
            name: apt.name,
            email: apt.email,
            status: apt.status,
            appointmentDate: apt.appointmentDate,
            appointmentDateValid: validDate !== null,
            dateKey: aptDateKey
          });
        }
      }
    }
    const maxSlots = settings?.maxAppointmentsPerSlot ?? settings?.maxBookingsPerSlot ?? "not set";
    const result = {
      slot: `${day} ${time} (${eventDate})`,
      settings: {
        maxAppointmentsPerSlot: settings?.maxAppointmentsPerSlot || "not set",
        maxBookingsPerSlot: settings?.maxBookingsPerSlot || "not set (deprecated)",
        effectiveMaxSlots: maxSlots,
        availableDays: settings?.availableDays || "not set",
        eventYear: settings?.eventYear || "not set",
        eventDateForDay: eventDate
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
      validation: {
        allDatesValid: appointments.every((a) => a.appointmentDateValid),
        invalidDates: appointments.filter((a) => !a.appointmentDateValid).map((a) => ({ id: a.id, date: a.appointmentDate }))
      },
      issue: slotAppointments.length !== allAppointments.length ? "⚠️ INCONSISTENCY DETECTED!" : "✅ OK"
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
