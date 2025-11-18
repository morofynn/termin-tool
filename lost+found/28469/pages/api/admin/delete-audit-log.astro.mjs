globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../../renderers.mjs';

const DELETE = async ({ locals }) => {
  try {
    const KV = locals?.runtime?.env?.APPOINTMENTS_KV;
    if (!KV) {
      return new Response(
        JSON.stringify({ message: "KV Store nicht verfügbar" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    const logList = await KV.list({ prefix: "audit_log:" });
    let deletedCount = 0;
    for (const key of logList.keys) {
      try {
        await KV.delete(key.name);
        deletedCount++;
      } catch (error) {
        console.error("Error deleting audit log entry:", key.name, error);
      }
    }
    const finalEntry = {
      id: `audit_log:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      action: "Audit Log cleared",
      details: `${deletedCount} Einträge wurden gelöscht`,
      user: "Admin"
    };
    await KV.put(finalEntry.id, JSON.stringify(finalEntry));
    return new Response(
      JSON.stringify({
        message: "Audit Log wurde erfolgreich gelöscht",
        deletedCount
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error deleting audit log:", error);
    return new Response(
      JSON.stringify({ message: "Fehler beim Löschen des Audit Logs" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
