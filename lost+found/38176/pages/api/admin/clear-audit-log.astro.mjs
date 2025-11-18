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
    const listData = await kv.get("audit:list");
    const auditIds = listData ? JSON.parse(listData) : [];
    const deletedCount = auditIds.length;
    await kv.put(
      "audit:list",
      JSON.stringify([]),
      { expirationTtl: 60 * 60 * 24 * 90 }
      // 90 Tage
    );
    for (const auditId of auditIds) {
      try {
        await kv.put(
          `audit:${auditId}`,
          "null",
          { expirationTtl: 1 }
        );
      } catch (e) {
        console.warn(`Could not clear audit log ${auditId}:`, e);
      }
    }
    return new Response(
      JSON.stringify({
        success: true,
        message: "Audit-Log wurde erfolgreich gelöscht",
        deletedCount
      }),
      {
        status: 200,
        headers: corsHeaders
      }
    );
  } catch (error) {
    console.error("Clear audit log error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Fehler beim Löschen des Audit-Logs",
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
