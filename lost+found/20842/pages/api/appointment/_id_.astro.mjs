globalThis.process ??= {}; globalThis.process.env ??= {};
import { g as getAppointment } from '../../../chunks/kv-utils_B0Om6nsN.mjs';
export { renderers } from '../../../renderers.mjs';

const GET = async ({ params, locals }) => {
  try {
    const { id } = params;
    if (!id) {
      return new Response(
        JSON.stringify({ message: "Termin-ID fehlt" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }
    const kv = locals.runtime?.env?.APPOINTMENTS_KV;
    if (!kv) {
      console.error("KV namespace not available");
      return new Response(
        JSON.stringify({ message: "Datenspeicher nicht verfügbar" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    const appointment = await getAppointment(kv, id);
    if (!appointment) {
      return new Response(
        JSON.stringify({ message: "Termin nicht gefunden" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    return new Response(JSON.stringify(appointment), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching appointment:", error);
    return new Response(
      JSON.stringify({
        message: "Ein Fehler ist aufgetreten",
        error: error instanceof Error ? error.message : "Unknown error"
      }),
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
