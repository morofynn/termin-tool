globalThis.process ??= {}; globalThis.process.env ??= {};
const GET = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const KV = locals?.runtime?.env?.APPOINTMENT_KV;
    if (!KV) {
      return new Response(
        JSON.stringify({ error: "Storage not available" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    const logList = await KV.list({ prefix: "audit_log:" });
    const logEntries = [];
    for (const key of logList.keys) {
      const value = await KV.get(key.name);
      if (value) {
        try {
          const entry = JSON.parse(value);
          logEntries.push(entry);
        } catch (e) {
          console.error("Failed to parse audit log entry:", e);
        }
      }
    }
    logEntries.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    const limitedLogs = logEntries.slice(0, limit);
    return new Response(
      JSON.stringify({ logs: limitedLogs, total: logEntries.length }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error fetching audit log:", error);
    return new Response(
      JSON.stringify({ error: "Failed to fetch audit log" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
async function createAuditLog(KV, action, details, appointmentId, user) {
  try {
    const id = `audit_log:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const entry = {
      id,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      action,
      details,
      user,
      appointmentId
    };
    await KV.put(id, JSON.stringify(entry));
    const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1e3;
    const logList = await KV.list({ prefix: "audit_log:" });
    for (const key of logList.keys) {
      const timestampMatch = key.name.match(/audit_log:(\d+)_/);
      if (timestampMatch) {
        const timestamp = parseInt(timestampMatch[1]);
        if (timestamp < ninetyDaysAgo) {
          await KV.delete(key.name);
        }
      }
    }
  } catch (error) {
    console.error("Failed to create audit log entry:", error);
  }
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  createAuditLog
}, Symbol.toStringTag, { value: 'Module' }));

export { _page as _, createAuditLog as c };
