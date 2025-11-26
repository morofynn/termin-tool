globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAuditLog } from '../../../../chunks/audit-log_BDxUJbGF.mjs';
export { renderers } from '../../../../renderers.mjs';

const APPOINTMENTS_PREFIX = "appointment:";
const POST = async ({ locals }) => {
  try {
    const KV = locals?.runtime?.env?.APPOINTMENTS_KV;
    if (!KV) {
      console.error("❌ KV not configured");
      return new Response(JSON.stringify({ error: "KV not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" }
      });
    }
    console.log("🗑️ Starting delete all appointments with full KV cleanup...");
    const keys = await KV.list({ prefix: APPOINTMENTS_PREFIX });
    console.log(`📋 Found ${keys.keys.length} appointments to delete`);
    const appointments = [];
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
    let googleEventsDeleted = 0;
    let googleEventsSkipped = 0;
    const googleClientId = locals?.runtime?.env?.GOOGLE_CLIENT_ID || undefined                                ;
    const googleClientSecret = locals?.runtime?.env?.GOOGLE_CLIENT_SECRET || undefined                                    ;
    const googleRefreshToken = locals?.runtime?.env?.GOOGLE_REFRESH_TOKEN || undefined                                    ;
    const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || undefined                                   || "primary";
    if (googleClientId && googleClientSecret && googleRefreshToken) {
      console.log("🗓️ Deleting Google Calendar events...");
      try {
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: googleClientId,
            client_secret: googleClientSecret,
            refresh_token: googleRefreshToken,
            grant_type: "refresh_token"
          })
        });
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          console.log("✅ Got access token from refresh token");
          for (const appointment of appointments) {
            if (appointment.googleEventId) {
              if (appointment.status === "cancelled") {
                console.log(`⏭️ Skipping ${appointment.googleEventId} (already cancelled)`);
                googleEventsSkipped++;
                continue;
              }
              console.log(`🗓️ Deleting event ${appointment.googleEventId} (Status: ${appointment.status})`);
              try {
                const response = await fetch(
                  `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}/events/${appointment.googleEventId}?sendUpdates=none`,
                  {
                    method: "DELETE",
                    headers: {
                      Authorization: `Bearer ${tokenData.access_token}`
                    }
                  }
                );
                if (response.ok || response.status === 404) {
                  googleEventsDeleted++;
                  console.log(`✅ Deleted Google Calendar event: ${appointment.googleEventId}`);
                } else {
                  console.error(`❌ Failed to delete Google Calendar event ${appointment.googleEventId}: ${response.status}`);
                }
              } catch (error) {
                console.error(`❌ Error deleting Google Calendar event ${appointment.googleEventId}:`, error);
              }
            }
          }
          console.log(`✅ Deleted ${googleEventsDeleted} Google Calendar events (${googleEventsSkipped} skipped - already cancelled)`);
        } else {
          const errorText = await tokenResponse.text();
          console.error("❌ Failed to refresh Google token:", errorText);
        }
      } catch (tokenError) {
        console.error("❌ Error refreshing Google token:", tokenError);
      }
    } else {
      console.log("ℹ️ Google Calendar not configured - skipping event deletion");
    }
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
    try {
      await KV.delete("appointments:list");
      console.log("✅ Deleted appointments:list");
    } catch (error) {
      console.error("❌ Error deleting appointments:list:", error);
    }
    const slotKeys = await KV.list({ prefix: "slot:" });
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
    await createAuditLog(
      KV,
      "Alle Termine gelöscht",
      `${deleteCount} Termine, ${slotDeleteCount} Slot-Zähler und ${googleEventsDeleted} Google Calendar Events wurden gelöscht${googleEventsSkipped > 0 ? ` (${googleEventsSkipped} bereits stornierte Events übersprungen)` : ""}.`,
      void 0,
      "Admin"
    );
    console.log("✅ Full cleanup completed");
    return new Response(JSON.stringify({
      success: true,
      deletedCount: deleteCount,
      slotsDeleted: slotDeleteCount,
      googleEventsDeleted,
      googleEventsSkipped,
      message: `${deleteCount} Termine erfolgreich gelöscht`
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("❌ Error deleting all appointments:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return new Response(JSON.stringify({
      error: "Internal server error",
      details: errorMessage
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
