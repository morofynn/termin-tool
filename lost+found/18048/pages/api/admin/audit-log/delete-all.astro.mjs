globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../../../renderers.mjs';

const POST = async ({ request, locals }) => {
  console.log("🗑️ POST /api/admin/audit-log/delete-all - Clearing all audit logs");
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
    const url = new URL(request.url);
    const silent = url.searchParams.get("silent") === "true";
    console.log(`🔇 Silent mode: ${silent}`);
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
    if (!silent) {
      const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      const entry = {
        id: auditId,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        action: "Audit Log gelöscht",
        details: `Alle Audit Log Einträge (${deletedCount} Stück) wurden vom Admin gelöscht.`,
        userEmail: "Admin"
      };
      await KV.put(`audit:${auditId}`, JSON.stringify(entry), {
        expirationTtl: 60 * 60 * 24 * 90
        // 90 Tage
      });
      await KV.put("audit:list", JSON.stringify([auditId]), {
        expirationTtl: 60 * 60 * 24 * 90
        // 90 Tage
      });
      console.log("📝 Created new audit log entry for deletion");
    } else {
      console.log("🔇 Silent mode - no audit log entry created");
    }
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

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
