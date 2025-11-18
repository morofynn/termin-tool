globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../../renderers.mjs';

const POST = async ({ locals, request }) => {
  const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json"
  };
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  try {
    const kv = locals.runtime?.env?.APPOINTMENTS_KV;
    if (!kv) {
      return new Response(
        JSON.stringify({ success: false, message: "KV namespace not available" }),
        { status: 500, headers: corsHeaders }
      );
    }
    const listData = await kv.get("appointments:list");
    const appointmentIds = listData ? JSON.parse(listData) : [];
    const deletedCount = appointmentIds.length;
    await kv.put(
      "appointments:list",
      JSON.stringify([]),
      { expirationTtl: 60 * 60 * 24 * 90 }
      // 90 Tage
    );
    for (const aptId of appointmentIds) {
      try {
        await kv.put(
          `appointment:${aptId}`,
          "null",
          { expirationTtl: 1 }
        );
      } catch (e) {
        console.warn(`Could not clear appointment ${aptId}:`, e);
      }
    }
    const days = ["friday", "saturday", "sunday"];
    const times = [
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
    const dates = ["2026-01-16", "2026-01-17", "2026-01-18"];
    for (const day of days) {
      for (const time of times) {
        for (const date of dates) {
          const slotKey = `slot:${day}:${time}:${date}`;
          try {
            await kv.put(slotKey, "[]", { expirationTtl: 1 });
          } catch (e) {
            console.warn(`Could not clear slot ${slotKey}:`, e);
          }
        }
      }
    }
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const auditEntry = {
      id: auditId,
      action: "Alle Termine gelöscht",
      details: `Alle Termine (${deletedCount} Stück) wurden aus dem System entfernt.`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      userEmail: "admin",
      appointmentId: null
    };
    await kv.put(
      `audit:${auditId}`,
      JSON.stringify(auditEntry),
      { expirationTtl: 60 * 60 * 24 * 90 }
    );
    const auditListData = await kv.get("audit:list");
    const auditList = auditListData ? JSON.parse(auditListData) : [];
    auditList.unshift(auditId);
    await kv.put(
      "audit:list",
      JSON.stringify(auditList),
      { expirationTtl: 60 * 60 * 24 * 90 }
    );
    return new Response(
      JSON.stringify({
        success: true,
        message: "Alle Termine wurden erfolgreich gelöscht",
        deletedCount
      }),
      {
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error("Clear appointments error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Fehler beim Löschen der Termine",
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      { status: 500, headers: corsHeaders }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
