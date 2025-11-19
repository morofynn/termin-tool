import type { APIRoute } from 'astro';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  userEmail?: string;
  appointmentId?: string;
}

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '100');

    const KV = locals?.runtime?.env?.APPOINTMENTS_KV;

    if (!KV) {
      console.error('KV store not available');
      return new Response(
        JSON.stringify({ 
          logs: [], 
          total: 0,
          message: 'KV Store nicht verfügbar. Bitte stellen Sie sicher, dass das KV Binding in wrangler.jsonc korrekt konfiguriert ist.' 
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Hole alle Audit Log Einträge aus der Liste
    const auditListData = await KV.get('audit:list');
    
    if (!auditListData) {
      console.log('No audit log entries found');
      return new Response(
        JSON.stringify({ 
          logs: [], 
          total: 0,
          message: 'Keine Audit Log Einträge vorhanden'
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const auditIds: string[] = JSON.parse(auditListData);
    const logEntries: AuditLogEntry[] = [];

    for (const auditId of auditIds) {
      try {
        const value = await KV.get(`audit:${auditId}`);
        if (value) {
          const entry = JSON.parse(value) as AuditLogEntry;
          logEntries.push(entry);
        }
      } catch (parseError) {
        console.error('Failed to parse audit log entry:', auditId, parseError);
        // Continue with other entries
      }
    }

    // Sortiere nach Timestamp (neueste zuerst) - bereits in der richtigen Reihenfolge durch unshift
    logEntries.sort((a, b) => {
      try {
        return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
      } catch {
        return 0;
      }
    });

    // Limitiere Anzahl
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
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error fetching audit log:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return new Response(
      JSON.stringify({ 
        logs: [], 
        total: 0,
        message: `Fehler: ${errorMessage}`
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

/**
 * DELETE: Audit Log löschen (alle Einträge)
 */
export const DELETE: APIRoute = async ({ locals }) => {
  console.log('🗑️ DELETE /api/admin/audit-log - Clearing all audit logs');
  
  try {
    const KV = locals?.runtime?.env?.APPOINTMENTS_KV;

    if (!KV) {
      console.error('❌ KV store not available');
      return new Response(
        JSON.stringify({ 
          error: 'KV Store nicht verfügbar',
          details: 'Bitte stellen Sie sicher, dass das KV Binding in wrangler.jsonc korrekt konfiguriert ist.'
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' } 
        }
      );
    }

    // Hole alle Audit Log IDs
    const auditListData = await KV.get('audit:list');
    
    if (!auditListData) {
      console.log('ℹ️ No audit log entries to delete');
      return new Response(
        JSON.stringify({ 
          success: true,
          message: 'Keine Audit Log Einträge vorhanden',
          deleted: 0
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const auditIds: string[] = JSON.parse(auditListData);
    console.log(`🔄 Deleting ${auditIds.length} audit log entries...`);

    // Lösche alle einzelnen Audit Log Einträge
    let deletedCount = 0;
    for (const auditId of auditIds) {
      try {
        await KV.delete(`audit:${auditId}`);
        deletedCount++;
      } catch (deleteError) {
        console.error(`❌ Failed to delete audit log entry ${auditId}:`, deleteError);
        // Continue with other entries
      }
    }

    // Lösche die Liste selbst
    await KV.delete('audit:list');
    console.log(`✅ Deleted ${deletedCount} audit log entries`);

    // Erstelle einen Audit Log Eintrag über das Löschen
    // (Dies ist der einzige Eintrag der übrig bleibt)
    await createAuditLog(
      KV,
      'Audit Log gelöscht',
      `Alle Audit Log Einträge (${deletedCount} Stück) wurden vom Admin gelöscht.`,
      undefined,
      'Admin'
    );

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `${deletedCount} Audit Log Einträge erfolgreich gelöscht`,
        deleted: deletedCount
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('❌ Error deleting audit log:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unbekannter Fehler';
    return new Response(
      JSON.stringify({ 
        error: 'Fehler beim Löschen des Audit Logs',
        details: errorMessage
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};

// Hilfsfunktion zum Erstellen von Audit Log Einträgen
export async function createAuditLog(
  KV: any,
  action: string,
  details: string,
  appointmentId?: string,
  userEmail?: string
): Promise<void> {
  if (!KV) {
    console.error('Cannot create audit log: KV store not available');
    return;
  }

  try {
    const auditId = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const entry: AuditLogEntry = {
      id: auditId,
      timestamp: new Date().toISOString(),
      action,
      details,
      userEmail,
      appointmentId,
    };

    // Speichere den Audit Log Eintrag
    await KV.put(`audit:${auditId}`, JSON.stringify(entry), { 
      expirationTtl: 60 * 60 * 24 * 90 // 90 Tage
    });

    // Füge zur Liste hinzu
    const auditListData = await KV.get('audit:list');
    const auditList: string[] = auditListData ? JSON.parse(auditListData) : [];
    auditList.unshift(auditId); // Neueste zuerst
    
    await KV.put('audit:list', JSON.stringify(auditList), { 
      expirationTtl: 60 * 60 * 24 * 90 // 90 Tage
    });

    console.log('✅ Audit log created:', action);
  } catch (error) {
    console.error('Failed to create audit log entry:', error);
    // Don't throw - audit logging should not break the main functionality
  }
}
