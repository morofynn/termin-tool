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
    const auditListData = await KV.get("audit:list");
    if (!auditListData) {
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
    const auditIds = JSON.parse(auditListData);
    const logEntries = [];
    for (const auditId of auditIds) {
      try {
        const value = await KV.get(`audit:${auditId}`);
        if (value) {
          const entry = JSON.parse(value);
          logEntries.push(entry);
        }
      } catch (parseError) {
        console.error("Failed to parse audit log entry:", auditId, parseError);
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
const POST = async ({ request, locals }) => {
  console.log("📝 POST /api/admin/audit-log - Creating audit log entry");
  try {
    const KV = locals?.runtime?.env?.APPOINTMENTS_KV;
    if (!KV) {
      console.error("❌ KV store not available");
      return new Response(
        JSON.stringify({
          error: "KV Store nicht verfügbar",
          details: "Bitte stellen Sie sicher, dass das KV Binding in wrangler.jsonc korrekt konfiguriert ist."
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const body = await request.json();
    const { action, details, appointmentId, userEmail, performedBy } = body;
    if (!action || !details) {
      return new Response(
        JSON.stringify({
          error: "Fehlende Pflichtfelder",
          details: "action und details sind erforderlich"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    await createAuditLog(
      KV,
      action,
      details,
      appointmentId,
      userEmail || performedBy
    );
    console.log("✅ Audit log entry created:", action);
    return new Response(
      JSON.stringify({
        success: true,
        message: "Audit Log Eintrag erfolgreich erstellt"
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("❌ Error creating audit log entry:", error);
    const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
    return new Response(
      JSON.stringify({
        error: "Fehler beim Erstellen des Audit Log Eintrags",
        details: errorMessage
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
const DELETE = async ({ locals }) => {
  console.log("🗑️ DELETE /api/admin/audit-log - Clearing all audit logs");
  try {
    const KV = locals?.runtime?.env?.APPOINTMENTS_KV;
    if (!KV) {
      console.error("❌ KV store not available");
      return new Response(
        JSON.stringify({
          error: "KV Store nicht verfügbar",
          details: "Bitte stellen Sie sicher, dass das KV Binding in wrangler.jsonc korrekt konfiguriert ist."
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const auditListData = await KV.get("audit:list");
    if (!auditListData) {
      console.log("ℹ️ No audit log entries to delete");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Keine Audit Log Einträge vorhanden",
          deleted: 0
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
    const auditIds = JSON.parse(auditListData);
    console.log(`🔄 Deleting ${auditIds.length} audit log entries...`);
    let deletedCount = 0;
    for (const auditId of auditIds) {
      try {
        await KV.delete(`audit:${auditId}`);
        deletedCount++;
      } catch (deleteError) {
        console.error(`❌ Failed to delete audit log entry ${auditId}:`, deleteError);
      }
    }
    await KV.delete("audit:list");
    console.log(`✅ Deleted ${deletedCount} audit log entries`);
    await createAuditLog(
      KV,
      "Audit Log gelöscht",
      `Alle Audit Log Einträge (${deletedCount} Stück) wurden vom Admin gelöscht.`,
      void 0,
      "Admin"
    );
    return new Response(
      JSON.stringify({
        success: true,
        message: `${deletedCount} Audit Log Einträge erfolgreich gelöscht`,
        deleted: deletedCount
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("❌ Error deleting audit log:", error);
    const errorMessage = error instanceof Error ? error.message : "Unbekannter Fehler";
    return new Response(
      JSON.stringify({
        error: "Fehler beim Löschen des Audit Logs",
        details: errorMessage
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
async function createAuditLog(KV, action, details, appointmentId, userEmail) {
  if (!KV) {
    console.error("Cannot create audit log: KV store not available");
    return;
  }
  try {
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const entry = {
      id: auditId,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      action,
      details,
      userEmail,
      appointmentId,
      performedBy: userEmail || "Admin"
    };
    await KV.put(`audit:${auditId}`, JSON.stringify(entry), {
      expirationTtl: 60 * 60 * 24 * 90
      // 90 Tage
    });
    const auditListData = await KV.get("audit:list");
    const auditList = auditListData ? JSON.parse(auditListData) : [];
    auditList.unshift(auditId);
    await KV.put("audit:list", JSON.stringify(auditList), {
      expirationTtl: 60 * 60 * 24 * 90
      // 90 Tage
    });
    console.log("✅ Audit log created:", action);
  } catch (error) {
    console.error("Failed to create audit log entry:", error);
  }
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE,
  GET,
  POST,
  createAuditLog
}, Symbol.toStringTag, { value: 'Module' }));

export { _page as _, createAuditLog as c };
