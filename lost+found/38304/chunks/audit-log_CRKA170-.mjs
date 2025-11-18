globalThis.process ??= {}; globalThis.process.env ??= {};
const GET = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get("limit") || "100");
    const KV = locals?.runtime?.env?.APPOINTMENTS_KV;
    if (!KV) {
      console.error("KV store not available");
      return new Response(
        JSON.stringify({
          logs: [],
          total: 0,
          message: "KV Store nicht verfügbar. Bitte stellen Sie sicher, dass das KV Binding in wrangler.jsonc korrekt konfiguriert ist."
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    let logList;
    try {
      logList = await KV.list({ prefix: "audit_log:" });
    } catch (listError) {
      console.error("Error listing audit logs:", listError);
      return new Response(
        JSON.stringify({
          logs: [],
          total: 0,
          message: "Keine Audit Log Einträge gefunden"
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    if (!logList || !logList.keys || logList.keys.length === 0) {
      console.log("No audit log entries found");
      return new Response(
        JSON.stringify({
          logs: [],
          total: 0,
          message: "Keine Audit Log Einträge vorhanden"
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const logEntries = [];
    for (const key of logList.keys) {
      try {
        const value = await KV.get(key.name);
        if (value) {
          const entry = JSON.parse(value);
          logEntries.push(entry);
        }
      } catch (parseError) {
        console.error("Failed to parse audit log entry:", key.name, parseError);
      }
    }
    logEntries.sort((a, b) => {
      try {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } catch {
        return 0;
      }
    });
    const limitedLogs = logEntries.slice(0, limit);
    console.log(`Returning ${limitedLogs.length} audit log entries (total: ${logEntries.length})`);
    return new Response(
      JSON.stringify({
        logs: limitedLogs,
        total: logEntries.length,
        message: `${limitedLogs.length} Einträge geladen`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error fetching audit log:", error);
    const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
    return new Response(
      JSON.stringify({
        logs: [],
        total: 0,
        message: `Fehler: ${errorMessage}`
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
async function createAuditLog(KV, action, details, appointmentId, user) {
  if (!KV) {
    console.error("Cannot create audit log: KV store not available");
    return;
  }
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
    console.log("Audit log created:", action);
    try {
      const ninetyDaysAgo = Date.now() - 90 * 24 * 60 * 60 * 1e3;
      const logList = await KV.list({ prefix: "audit_log:" });
      for (const key of logList.keys) {
        const timestampMatch = key.name.match(/audit_log:(\d+)_/);
        if (timestampMatch) {
          const timestamp = parseInt(timestampMatch[1]);
          if (timestamp < ninetyDaysAgo) {
            await KV.delete(key.name);
            console.log("Deleted old audit log:", key.name);
          }
        }
      }
    } catch (cleanupError) {
      console.error("Failed to cleanup old audit logs:", cleanupError);
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
