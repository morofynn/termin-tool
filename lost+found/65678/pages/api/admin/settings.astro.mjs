globalThis.process ??= {}; globalThis.process.env ??= {};
import { c as createAuditLog } from '../../../chunks/audit-log_CTvpblnZ.mjs';
import { b as DEFAULT_SETTINGS } from '../../../chunks/constants_CxrNys99.mjs';
export { renderers } from '../../../renderers.mjs';

const SETTINGS_KEY = "settings";
function getSettingsChanges(oldSettings, newSettings) {
  const changes = [];
  if (oldSettings.maxAppointmentsPerSlot !== newSettings.maxAppointmentsPerSlot) {
    changes.push(`Max. Termine pro Slot: ${oldSettings.maxAppointmentsPerSlot} → ${newSettings.maxAppointmentsPerSlot}`);
  }
  if (oldSettings.bookingMode !== newSettings.bookingMode) {
    changes.push(`Buchungsmodus: ${oldSettings.bookingMode === "automatic" ? "Automatisch" : "Manuell"} → ${newSettings.bookingMode === "automatic" ? "Automatisch" : "Manuell"}`);
  }
  if (oldSettings.requireApproval !== newSettings.requireApproval) {
    changes.push(`Genehmigung erforderlich: ${newSettings.requireApproval ? "Ja" : "Nein"}`);
  }
  if (oldSettings.adminEmail !== newSettings.adminEmail) {
    changes.push(`Admin E-Mail: ${oldSettings.adminEmail} → ${newSettings.adminEmail}`);
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
  if (oldSettings.standInfo !== newSettings.standInfo) {
    changes.push(`Stand-Info aktualisiert`);
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
    if (settingsData) {
      const settings = JSON.parse(settingsData);
      if (settings.rateLimitingEnabled === void 0) {
        settings.rateLimitingEnabled = DEFAULT_SETTINGS.rateLimitingEnabled;
      }
      if (settings.rateLimitMaxRequests === void 0) {
        settings.rateLimitMaxRequests = DEFAULT_SETTINGS.rateLimitMaxRequests;
      }
      if (settings.rateLimitWindowMinutes === void 0) {
        settings.rateLimitWindowMinutes = DEFAULT_SETTINGS.rateLimitWindowMinutes;
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
    const oldSettings = oldSettingsData ? JSON.parse(oldSettingsData) : DEFAULT_SETTINGS;
    if (settings.rateLimitingEnabled === void 0) {
      settings.rateLimitingEnabled = DEFAULT_SETTINGS.rateLimitingEnabled;
    }
    if (settings.rateLimitMaxRequests === void 0) {
      settings.rateLimitMaxRequests = DEFAULT_SETTINGS.rateLimitMaxRequests;
    }
    if (settings.rateLimitWindowMinutes === void 0) {
      settings.rateLimitWindowMinutes = DEFAULT_SETTINGS.rateLimitWindowMinutes;
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
