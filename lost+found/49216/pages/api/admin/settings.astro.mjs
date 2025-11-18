globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAuditLog } from '../../../chunks/audit-log_CTvpblnZ.mjs';
export { renderers } from '../../../renderers.mjs';

const SETTINGS_KEY = "app:settings";
const DEFAULT_SETTINGS = {
  availableDays: {
    friday: true,
    saturday: true,
    sunday: true
  },
  slotDuration: 60,
  maxBookingsPerSlot: 1,
  showSlotIndicator: true,
  bufferBetweenSlots: 0,
  maxBookingsPerDay: 20,
  emailNotifications: true,
  adminEmail: "info@moro-gmbh.de",
  adminNotifications: true,
  autoConfirm: false,
  sendReminders: false,
  maintenanceMode: false,
  maintenanceMessage: "Das Buchungssystem ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.",
  googleCalendarSync: true,
  eventDuration: 60,
  preventDuplicateEmail: true,
  messagePlaceholder: "Ihre Nachricht...",
  // Branding Defaults
  companyName: "MORO",
  companyEmail: "info@moro-gmbh.de",
  companyPhone: "+49 221 292 40 500",
  companyAddress: "Eupener Str. 124, 50933 Köln",
  companyWebsite: "https://www.moroclub.com",
  logoUrl: "https://cdn.prod.website-files.com/66c5b6f94041a6256d15cfa6/66d86596b9d572660f8b239d_moro-logo.svg",
  // Event Location Defaults
  eventLocation: "Stand B4.110",
  eventHall: "Messe München"
};
function getSettingsChanges(oldSettings, newSettings) {
  const changes = [];
  if (JSON.stringify(oldSettings.availableDays) !== JSON.stringify(newSettings.availableDays)) {
    const changedDays = Object.entries(newSettings.availableDays).filter(([day, enabled]) => oldSettings.availableDays[day] !== enabled).map(([day, enabled]) => {
      const dayNames = { friday: "Freitag", saturday: "Samstag", sunday: "Sonntag" };
      return `${dayNames[day]}: ${enabled ? "aktiviert" : "deaktiviert"}`;
    });
    if (changedDays.length > 0) changes.push(`Verfügbare Tage: ${changedDays.join(", ")}`);
  }
  if (oldSettings.maxBookingsPerSlot !== newSettings.maxBookingsPerSlot) {
    changes.push(`Max. Termine pro Slot: ${oldSettings.maxBookingsPerSlot} → ${newSettings.maxBookingsPerSlot}`);
  }
  if (oldSettings.showSlotIndicator !== newSettings.showSlotIndicator) {
    changes.push(`Slot-Indikator: ${newSettings.showSlotIndicator ? "aktiviert" : "deaktiviert"}`);
  }
  if (oldSettings.autoConfirm !== newSettings.autoConfirm) {
    changes.push(`Auto-Bestätigung: ${newSettings.autoConfirm ? "aktiviert" : "deaktiviert"}`);
  }
  if (oldSettings.preventDuplicateEmail !== newSettings.preventDuplicateEmail) {
    changes.push(`Doppelbuchungen verhindern: ${newSettings.preventDuplicateEmail ? "aktiviert" : "deaktiviert"}`);
  }
  if (oldSettings.messagePlaceholder !== newSettings.messagePlaceholder) {
    changes.push(`Nachricht Platzhalter aktualisiert`);
  }
  if (oldSettings.emailNotifications !== newSettings.emailNotifications) {
    changes.push(`E-Mail-Benachrichtigungen: ${newSettings.emailNotifications ? "aktiviert" : "deaktiviert"}`);
  }
  if (oldSettings.adminEmail !== newSettings.adminEmail) {
    changes.push(`Admin E-Mail: ${oldSettings.adminEmail} → ${newSettings.adminEmail}`);
  }
  if (oldSettings.adminNotifications !== newSettings.adminNotifications) {
    changes.push(`Admin-Benachrichtigungen: ${newSettings.adminNotifications ? "aktiviert" : "deaktiviert"}`);
  }
  if (oldSettings.maintenanceMode !== newSettings.maintenanceMode) {
    changes.push(`Wartungsmodus: ${newSettings.maintenanceMode ? "aktiviert" : "deaktiviert"}`);
  }
  if (oldSettings.maintenanceMessage !== newSettings.maintenanceMessage && newSettings.maintenanceMode) {
    changes.push(`Wartungsmodus-Nachricht aktualisiert`);
  }
  if (oldSettings.companyName !== newSettings.companyName) {
    changes.push(`Firmenname: ${oldSettings.companyName} → ${newSettings.companyName}`);
  }
  if (oldSettings.companyWebsite !== newSettings.companyWebsite) {
    changes.push(`Website: ${oldSettings.companyWebsite} → ${newSettings.companyWebsite}`);
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
    changes.push(`Event Ort: ${oldSettings.eventLocation} → ${newSettings.eventLocation}`);
  }
  if (oldSettings.eventHall !== newSettings.eventHall) {
    changes.push(`Event Halle: ${oldSettings.eventHall} → ${newSettings.eventHall}`);
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
    if (settingsData) {
      const settings = JSON.parse(settingsData);
      if (settings.showSlotIndicator === void 0) {
        settings.showSlotIndicator = true;
      }
      if (settings.messagePlaceholder === void 0) {
        settings.messagePlaceholder = "Ihre Nachricht...";
      }
      return new Response(JSON.stringify({ settings }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    } else {
      await KV.put(SETTINGS_KEY, JSON.stringify(DEFAULT_SETTINGS));
      return new Response(JSON.stringify({ settings: DEFAULT_SETTINGS }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }
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
    const { settings } = body;
    if (!settings) {
      return new Response(JSON.stringify({ message: "Missing settings data" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (settings.maxBookingsPerSlot < 1) {
      return new Response(JSON.stringify({ message: "Maximale Buchungen pro Slot muss mindestens 1 sein" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (settings.maxBookingsPerDay < 1) {
      return new Response(JSON.stringify({ message: "Maximale Buchungen pro Tag muss mindestens 1 sein" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    if (settings.emailNotifications && !settings.adminEmail) {
      return new Response(JSON.stringify({ message: "Admin E-Mail ist erforderlich wenn Benachrichtigungen aktiv sind" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
    const oldSettingsData = await KV.get(SETTINGS_KEY);
    const oldSettings = oldSettingsData ? JSON.parse(oldSettingsData) : DEFAULT_SETTINGS;
    if (settings.showSlotIndicator === void 0) {
      settings.showSlotIndicator = true;
    }
    if (settings.messagePlaceholder === void 0) {
      settings.messagePlaceholder = "Ihre Nachricht...";
    }
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

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET,
  POST
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
