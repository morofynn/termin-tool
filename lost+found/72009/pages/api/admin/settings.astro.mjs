globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAuditLog } from '../../../chunks/audit-log_CTvpblnZ.mjs';
import { D as DEFAULT_SETTINGS } from '../../../chunks/constants_BIo0cEWV.mjs';
export { renderers } from '../../../renderers.mjs';

const SETTINGS_KEY = "settings";
function normalizeSettings(settings) {
  return {
    ...DEFAULT_SETTINGS,
    ...settings,
    // Sync zwischen alten und neuen Feldnamen
    maxBookingsPerSlot: settings.maxBookingsPerSlot ?? settings.maxAppointmentsPerSlot ?? DEFAULT_SETTINGS.maxAppointmentsPerSlot,
    maxAppointmentsPerSlot: settings.maxAppointmentsPerSlot ?? settings.maxBookingsPerSlot ?? DEFAULT_SETTINGS.maxAppointmentsPerSlot,
    autoConfirm: settings.autoConfirm ?? settings.bookingMode === "automatic",
    bookingMode: settings.autoConfirm ? "automatic" : settings.bookingMode ?? "manual",
    // Event Dates mit Defaults
    eventYear: settings.eventYear ?? DEFAULT_SETTINGS.eventYear,
    eventDateFriday: settings.eventDateFriday ?? DEFAULT_SETTINGS.eventDateFriday,
    eventDateSaturday: settings.eventDateSaturday ?? DEFAULT_SETTINGS.eventDateSaturday,
    eventDateSunday: settings.eventDateSunday ?? DEFAULT_SETTINGS.eventDateSunday
  };
}
function getSettingsChanges(oldSettings, newSettings) {
  const changes = [];
  if (oldSettings.availableDays?.friday !== newSettings.availableDays?.friday) {
    changes.push(`Freitag: ${newSettings.availableDays?.friday ? "aktiviert" : "deaktiviert"}`);
  }
  if (oldSettings.availableDays?.saturday !== newSettings.availableDays?.saturday) {
    changes.push(`Samstag: ${newSettings.availableDays?.saturday ? "aktiviert" : "deaktiviert"}`);
  }
  if (oldSettings.availableDays?.sunday !== newSettings.availableDays?.sunday) {
    changes.push(`Sonntag: ${newSettings.availableDays?.sunday ? "aktiviert" : "deaktiviert"}`);
  }
  if (oldSettings.maxAppointmentsPerSlot !== newSettings.maxAppointmentsPerSlot) {
    changes.push(`Max. Termine pro Slot: ${oldSettings.maxAppointmentsPerSlot} → ${newSettings.maxAppointmentsPerSlot}`);
  }
  if (oldSettings.showSlotIndicator !== newSettings.showSlotIndicator) {
    changes.push(`Slot-Indikator: ${newSettings.showSlotIndicator ? "aktiviert" : "deaktiviert"}`);
  }
  if (oldSettings.bookingMode !== newSettings.bookingMode) {
    changes.push(`Buchungsmodus: ${oldSettings.bookingMode === "automatic" ? "Automatisch" : "Manuell"} → ${newSettings.bookingMode === "automatic" ? "Automatisch" : "Manuell"}`);
  }
  if (oldSettings.autoConfirm !== newSettings.autoConfirm) {
    changes.push(`Auto-Bestätigung: ${newSettings.autoConfirm ? "aktiviert" : "deaktiviert"}`);
  }
  if (oldSettings.requireApproval !== newSettings.requireApproval) {
    changes.push(`Genehmigung erforderlich: ${newSettings.requireApproval ? "Ja" : "Nein"}`);
  }
  if (oldSettings.preventDuplicateEmail !== newSettings.preventDuplicateEmail) {
    changes.push(`Doppelbuchungen verhindern: ${newSettings.preventDuplicateEmail ? "aktiviert" : "deaktiviert"}`);
  }
  if (oldSettings.messagePlaceholder !== newSettings.messagePlaceholder) {
    changes.push(`Nachrichten-Platzhalter aktualisiert`);
  }
  if (oldSettings.adminEmail !== newSettings.adminEmail) {
    changes.push(`Admin E-Mail: ${oldSettings.adminEmail} → ${newSettings.adminEmail}`);
  }
  if (oldSettings.emailNotifications !== newSettings.emailNotifications) {
    changes.push(`E-Mail Benachrichtigungen: ${newSettings.emailNotifications ? "aktiviert" : "deaktiviert"}`);
  }
  if (oldSettings.companyName !== newSettings.companyName) {
    changes.push(`Firmenname: ${oldSettings.companyName} → ${newSettings.companyName}`);
  }
  if (oldSettings.companyWebsite !== newSettings.companyWebsite) {
    changes.push(`Website: ${oldSettings.companyWebsite || "leer"} → ${newSettings.companyWebsite || "leer"}`);
  }
  if (oldSettings.companyEmail !== newSettings.companyEmail) {
    changes.push(`Firma E-Mail: ${oldSettings.companyEmail} → ${newSettings.companyEmail}`);
  }
  if (oldSettings.companyPhone !== newSettings.companyPhone) {
    changes.push(`Telefon: ${oldSettings.companyPhone} → ${newSettings.companyPhone}`);
  }
  if (oldSettings.companyAddress !== newSettings.companyAddress) {
    changes.push(`Adresse aktualisiert`);
  }
  if (oldSettings.logoUrl !== newSettings.logoUrl) {
    changes.push(`Logo URL aktualisiert`);
  }
  if (oldSettings.eventLocation !== newSettings.eventLocation) {
    changes.push(`Event Ort: ${oldSettings.eventLocation || "leer"} → ${newSettings.eventLocation || "leer"}`);
  }
  if (oldSettings.eventHall !== newSettings.eventHall) {
    changes.push(`Event Halle: ${oldSettings.eventHall || "leer"} → ${newSettings.eventHall || "leer"}`);
  }
  if (oldSettings.eventName !== newSettings.eventName) {
    changes.push(`Event-Name: ${oldSettings.eventName || "leer"} → ${newSettings.eventName || "leer"}`);
  }
  if (oldSettings.eventYear !== newSettings.eventYear) {
    changes.push(`Event-Jahr: ${oldSettings.eventYear} → ${newSettings.eventYear}`);
  }
  if (oldSettings.eventDateFriday !== newSettings.eventDateFriday) {
    const oldDate = new Date(oldSettings.eventDateFriday || "").toLocaleDateString("de-DE");
    const newDate = new Date(newSettings.eventDateFriday || "").toLocaleDateString("de-DE");
    changes.push(`Freitag Datum: ${oldDate} → ${newDate}`);
  }
  if (oldSettings.eventDateSaturday !== newSettings.eventDateSaturday) {
    const oldDate = new Date(oldSettings.eventDateSaturday || "").toLocaleDateString("de-DE");
    const newDate = new Date(newSettings.eventDateSaturday || "").toLocaleDateString("de-DE");
    changes.push(`Samstag Datum: ${oldDate} → ${newDate}`);
  }
  if (oldSettings.eventDateSunday !== newSettings.eventDateSunday) {
    const oldDate = new Date(oldSettings.eventDateSunday || "").toLocaleDateString("de-DE");
    const newDate = new Date(newSettings.eventDateSunday || "").toLocaleDateString("de-DE");
    changes.push(`Sonntag Datum: ${oldDate} → ${newDate}`);
  }
  if (oldSettings.eventEnded !== newSettings.eventEnded) {
    changes.push(`Event Status: ${newSettings.eventEnded ? "beendet" : "aktiv"}`);
  }
  if (oldSettings.eventEndDate !== newSettings.eventEndDate) {
    const oldDate = new Date(oldSettings.eventEndDate || "").toLocaleString("de-DE");
    const newDate = new Date(newSettings.eventEndDate || "").toLocaleString("de-DE");
    changes.push(`Event-End-Datum: ${oldDate} → ${newDate}`);
  }
  if (oldSettings.maintenanceMode !== newSettings.maintenanceMode) {
    changes.push(`Wartungsmodus: ${newSettings.maintenanceMode ? "aktiviert" : "deaktiviert"}`);
  }
  if (oldSettings.maintenanceMessage !== newSettings.maintenanceMessage && newSettings.maintenanceMode) {
    changes.push(`Wartungsnachricht aktualisiert`);
  }
  if (oldSettings.rateLimitingEnabled !== newSettings.rateLimitingEnabled) {
    changes.push(`Rate Limiting: ${newSettings.rateLimitingEnabled ? "aktiviert" : "deaktiviert"}`);
  }
  if (oldSettings.rateLimitMaxRequests !== newSettings.rateLimitMaxRequests) {
    changes.push(`Rate Limit Max. Anfragen: ${oldSettings.rateLimitMaxRequests} → ${newSettings.rateLimitMaxRequests}`);
  }
  if (oldSettings.rateLimitWindowMinutes !== newSettings.rateLimitWindowMinutes) {
    changes.push(`Rate Limit Zeitfenster: ${oldSettings.rateLimitWindowMinutes} → ${newSettings.rateLimitWindowMinutes} Minuten`);
  }
  return changes;
}
const GET = async ({ locals }) => {
  const KV = locals?.runtime?.env?.APPOINTMENTS_KV;
  if (!KV) {
    return new Response(JSON.stringify({ message: "KV store not available" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const settingsData = await KV.get(SETTINGS_KEY);
    let settings;
    if (settingsData) {
      const rawSettings = JSON.parse(settingsData);
      settings = normalizeSettings(rawSettings);
    } else {
      settings = normalizeSettings({});
      await KV.put(SETTINGS_KEY, JSON.stringify(settings));
    }
    return new Response(JSON.stringify({ settings }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error fetching settings:", error);
    return new Response(JSON.stringify({ message: "Error fetching settings" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
const POST = async ({ request, locals }) => {
  const KV = locals?.runtime?.env?.APPOINTMENTS_KV;
  if (!KV) {
    return new Response(JSON.stringify({ message: "KV store not available" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
  try {
    const body = await request.json();
    const { settings: rawSettings } = body;
    if (!rawSettings) {
      return new Response(JSON.stringify({ message: "Missing settings data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const settings = normalizeSettings(rawSettings);
    if (settings.maxAppointmentsPerSlot < 1) {
      return new Response(JSON.stringify({ message: "Maximale Termine pro Slot muss mindestens 1 sein" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (!settings.adminEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.adminEmail)) {
      return new Response(JSON.stringify({ message: "Gültige Admin E-Mail erforderlich" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (settings.eventYear && (settings.eventYear < 2024 || settings.eventYear > 2100)) {
      return new Response(JSON.stringify({ message: "Event-Jahr muss zwischen 2024 und 2100 liegen" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (settings.eventDateFriday && !isValidISODate(settings.eventDateFriday)) {
      return new Response(JSON.stringify({ message: "Ungültiges Freitag Datum (Format: YYYY-MM-DD)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (settings.eventDateSaturday && !isValidISODate(settings.eventDateSaturday)) {
      return new Response(JSON.stringify({ message: "Ungültiges Samstag Datum (Format: YYYY-MM-DD)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (settings.eventDateSunday && !isValidISODate(settings.eventDateSunday)) {
      return new Response(JSON.stringify({ message: "Ungültiges Sonntag Datum (Format: YYYY-MM-DD)" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (settings.rateLimitingEnabled) {
      if (settings.rateLimitMaxRequests < 1 || settings.rateLimitMaxRequests > 50) {
        return new Response(JSON.stringify({ message: "Max. Anfragen muss zwischen 1 und 50 liegen" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
      if (settings.rateLimitWindowMinutes < 1 || settings.rateLimitWindowMinutes > 60) {
        return new Response(JSON.stringify({ message: "Zeitfenster muss zwischen 1 und 60 Minuten liegen" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        });
      }
    }
    const oldSettingsData = await KV.get(SETTINGS_KEY);
    const oldSettings = oldSettingsData ? normalizeSettings(JSON.parse(oldSettingsData)) : normalizeSettings({});
    const changes = getSettingsChanges(oldSettings, settings);
    await KV.put(SETTINGS_KEY, JSON.stringify(settings));
    if (changes.length > 0) {
      await createAuditLog(
        KV,
        "Einstellungen geändert",
        changes.join(" • "),
        void 0,
        "Admin"
      );
    }
    return new Response(JSON.stringify({ success: true, settings }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (error) {
    console.error("Error saving settings:", error);
    return new Response(JSON.stringify({ message: "Error saving settings" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
function isValidISODate(dateString) {
  const isoRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!isoRegex.test(dateString)) return false;
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
