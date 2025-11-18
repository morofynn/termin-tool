import type { APIRoute } from 'astro';
import { createAuditLog } from '../audit-log';
import type { Appointment } from '../../../../types/appointments';

const APPOINTMENTS_PREFIX = 'appointment:';

/**
 * ✅ FIX: DELETE ALL APPOINTMENTS mit vollständigem KV Cleanup
 * 
 * Löscht:
 * - Alle Termine (appointment:*)
 * - appointments:list
 * - Alle Slot-Zähler (slot:*)
 * - Google Calendar Events (optional)
 * 
 * Erstellt Audit Log Entry über die Löschung
 */
export const POST: APIRoute = async ({ locals }) => {
  try {
    const KV = locals?.runtime?.env?.APPOINTMENTS_KV;
    
    if (!KV) {
      console.error('❌ KV not configured');
      return new Response(JSON.stringify({ error: 'KV not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    console.log('🗑️ Starting delete all appointments with full KV cleanup...');

    // 1. Alle Termine aus KV laden (für Google Calendar Cleanup)
    const keys = await KV.list({ prefix: APPOINTMENTS_PREFIX });
    console.log(`📋 Found ${keys.keys.length} appointments to delete`);

    const appointments: Appointment[] = [];
    for (const key of keys.keys) {
      try {
        const value = await KV.get(key.name);
        if (value) {
          appointments.push(JSON.parse(value));
        }
      } catch (error) {
        console.error(`❌ Error loading appointment ${key.name}:`, error);
      }
    }

    // 2. Google Calendar Events löschen (optional)
    let googleEventsDeleted = 0;
    const token = locals?.runtime?.env?.GOOGLE_ACCESS_TOKEN;
    const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || 'primary';
    
    if (token) {
      console.log('🗓️ Deleting Google Calendar events...');
      for (const appointment of appointments) {
        if (appointment.googleEventId) {
          try {
            const response = await fetch(
              `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events/${appointment.googleEventId}`,
              {
                method: 'DELETE',
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );

            if (response.ok || response.status === 404) {
              googleEventsDeleted++;
              console.log(`✅ Deleted Google Calendar event: ${appointment.googleEventId}`);
            } else {
              console.error(`❌ Failed to delete Google Calendar event: ${response.status}`);
            }
          } catch (error) {
            console.error(`❌ Error deleting Google Calendar event:`, error);
          }
        }
      }
      console.log(`✅ Deleted ${googleEventsDeleted} Google Calendar events`);
    }

    // 3. Alle Termine aus KV löschen
    let deleteCount = 0;
    for (const key of keys.keys) {
      try {
        await KV.delete(key.name);
        deleteCount++;
      } catch (error) {
        console.error(`❌ Error deleting ${key.name}:`, error);
      }
    }
    console.log(`✅ Deleted ${deleteCount} appointment entries`);

    // 4. appointments:list löschen
    try {
      await KV.delete('appointments:list');
      console.log('✅ Deleted appointments:list');
    } catch (error) {
      console.error('❌ Error deleting appointments:list:', error);
    }

    // 5. Alle Slot-Zähler löschen (slot:*)
    const slotKeys = await KV.list({ prefix: 'slot:' });
    console.log(`📋 Found ${slotKeys.keys.length} slot counters to delete`);
    
    let slotDeleteCount = 0;
    for (const key of slotKeys.keys) {
      try {
        await KV.delete(key.name);
        slotDeleteCount++;
      } catch (error) {
        console.error(`❌ Error deleting slot ${key.name}:`, error);
      }
    }
    console.log(`✅ Deleted ${slotDeleteCount} slot counters`);

    // 6. Audit Log Entry erstellen
    await createAuditLog(
      KV,
      'Alle Termine gelöscht',
      `${deleteCount} Termine, ${slotDeleteCount} Slot-Zähler und ${googleEventsDeleted} Google Calendar Events wurden gelöscht.`,
      undefined,
      'Admin'
    );

    console.log('✅ Full cleanup completed');

    return new Response(JSON.stringify({ 
      success: true, 
      deletedCount: deleteCount,
      slotsDeleted: slotDeleteCount,
      googleEventsDeleted: googleEventsDeleted,
      message: `${deleteCount} Termine erfolgreich gelöscht` 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('❌ Error deleting all appointments:', error);
    const errorMessage = error instanceof Error ? error.message : 'Internal server error';
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: errorMessage 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
