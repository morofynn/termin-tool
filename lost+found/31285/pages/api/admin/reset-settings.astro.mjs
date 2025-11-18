globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../../renderers.mjs';

const SETTINGS_KEY = "app:settings";
const AUDIT_LOG_KEY = "app:audit_log";
const DEFAULT_SETTINGS = {
  availableDays: {
    friday: true,
    saturday: true,
    sunday: true
  },
  slotDuration: 60,
  maxBookingsPerSlot: 1,
  bufferBetweenSlots: 0,
  maxBookingsPerDay: 20,
  emailNotifications: true,
  adminEmail: "info@moro-gmbh.de",
  autoConfirm: false,
  sendReminders: false,
  maintenanceMode: false,
  maintenanceMessage: "Das Buchungssystem ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.",
  googleCalendarSync: true,
  eventDuration: 60,
  preventDuplicateEmail: true,
  companyName: "MORO",
  companyEmail: "info@moro-gmbh.de",
  companyPhone: "+49 221 292 40 500",
  companyAddress: "Eupener Str. 124, 50933 Köln",
  companyWebsite: "https://www.moroclub.com",
  logoUrl: "https://cdn.prod.website-files.com/66c5b6f94041a6256d15cfa6/66d86596b9d572660f8b239d_moro-logo.svg",
  eventLocation: "Stand B4.110",
  eventHall: "Messe München"
};
async function addAuditLog(KV, action, details, type, metadata) {
  try {
    const logEntry = {
      id: `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: (/* @__PURE__ */ new Date()).toISOString(),
      action,
      details,
      type,
      metadata
    };
    const existingLogsData = await KV.get(AUDIT_LOG_KEY);
    const existingLogs = existingLogsData ? JSON.parse(existingLogsData) : [];
    existingLogs.unshift(logEntry);
    const trimmedLogs = existingLogs.slice(0, 1e3);
    await KV.put(AUDIT_LOG_KEY, JSON.stringify(trimmedLogs));
  } catch (error) {
    console.error("Error adding audit log:", error);
  }
}
const DELETE = async ({ locals }) => {
  const KV = locals?.runtime?.env?.APPOINTMENTS_KV;
  if (!KV) {
    return new Response(JSON.stringify({ message: "KV Store nicht verfügbar" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    await KV.put(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
    await addAuditLog(
      KV,
      "Alle Einstellungen zurückgesetzt",
      "Alle Einstellungen wurden auf die Standardwerte zurückgesetzt",
      "settings_reset",
      {
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        resetTo: "defaults"
      }
    );
    return new Response(
      JSON.stringify({
        success: true,
        message: "Alle Einstellungen wurden zurückgesetzt",
        settings: DEFAULT_SETTINGS
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error resetting settings:", error);
    return new Response(
      JSON.stringify({
        message: "Fehler beim Zurücksetzen der Einstellungen",
        error: error instanceof Error ? error.message : "Unknown error"
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
  DELETE
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
