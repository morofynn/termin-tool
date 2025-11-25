globalThis.process ??= {}; globalThis.process.env ??= {};
import { I as It } from '../../../../chunks/index_xnc8mrq2.mjs';
import { g as getAppointment, a as getSettings } from '../../../../chunks/kv-utils_B0Om6nsN.mjs';
import { v as validateAndParseBerlinDate } from '../../../../chunks/date-utils_D4nZ-TEO.mjs';
export { renderers } from '../../../../renderers.mjs';

const __vite_import_meta_env__ = {"ASSETS_PREFIX": undefined, "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SITE": undefined, "SSR": true};
const GET = async ({ params, locals, request }) => {
  const { id } = params;
  if (!id) {
    return new Response("Missing appointment ID", { status: 400 });
  }
  const KV = locals?.runtime?.env?.APPOINTMENTS_KV || locals?.APPOINTMENT_BOOKINGS || Object.assign(__vite_import_meta_env__, { _: process.env._ })?.APPOINTMENT_BOOKINGS;
  if (!KV) {
    console.error("KV Storage not available. locals:", JSON.stringify(Object.keys(locals || {})));
    console.error("Runtime env keys:", locals?.runtime?.env ? Object.keys(locals.runtime.env) : "no runtime.env");
    return new Response("Storage not available - KV binding missing", { status: 500 });
  }
  try {
    const appointment = await getAppointment(KV, id);
    if (!appointment) {
      return new Response("Appointment not found", { status: 404 });
    }
    const settings = await getSettings(KV);
    const appointmentDate = validateAndParseBerlinDate(appointment.appointmentDate);
    if (!appointmentDate) {
      console.error(`Invalid appointment date for ${id}: ${appointment.appointmentDate}`);
      return new Response("Invalid appointment date", { status: 400 });
    }
    const [startHours, startMinutes] = appointment.time.split(":").map(Number);
    const endHours = appointment.endTime ? appointment.endTime.split(":").map(Number)[0] : startHours + 1;
    const endMinutes = appointment.endTime ? appointment.endTime.split(":").map(Number)[1] : startMinutes;
    const startDateTime = new Date(appointmentDate);
    startDateTime.setHours(startHours, startMinutes, 0, 0);
    const endDateTime = new Date(appointmentDate);
    endDateTime.setHours(endHours, endMinutes, 0, 0);
    const url = new URL(request.url);
    const baseUrl = `${url.protocol}//${url.host}`;
    const appointmentUrl = `${baseUrl}/termin/${id}`;
    const location = `${settings.eventLocation}, ${settings.eventHall}`;
    const calendar = It({ name: "Terminbestätigung" });
    calendar.createEvent({
      start: startDateTime,
      end: endDateTime,
      summary: `Termin bei ${settings.companyName}`,
      description: `Ihr Termin bei ${settings.companyName}

Ort: ${location}

Kontakt:
${settings.companyName}
${settings.companyAddress}
Tel: ${settings.companyPhone}
E-Mail: ${settings.companyEmail}` + (settings.companyWebsite ? `
Web: ${settings.companyWebsite}` : "") + `

Termindetails: ${appointmentUrl}`,
      location,
      organizer: {
        name: settings.companyName,
        email: settings.companyEmail
      }
    });
    const icsContent = calendar.toString();
    return new Response(icsContent, {
      status: 200,
      headers: {
        "Content-Type": "text/calendar; charset=utf-8",
        "Content-Disposition": `attachment; filename="termin-${id}.ics"`
      }
    });
  } catch (error) {
    console.error("ICS generation error:", error);
    return new Response(`Internal server error: ${error instanceof Error ? error.message : "Unknown"}`, { status: 500 });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
