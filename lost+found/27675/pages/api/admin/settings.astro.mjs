globalThis.process ??= {}; globalThis.process.env ??= {};
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
  bufferBetweenSlots: 0,
  maxBookingsPerDay: 20,
  emailNotifications: true,
  adminEmail: "info@moro-gmbh.de",
  autoConfirm: false,
  sendReminders: false,
  maintenanceMode: false,
  maintenanceMessage: "Das Buchungssystem ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.",
  googleCalendarSync: true,
  eventDuration: 60
};
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
    await KV.put(SETTINGS_KEY, JSON.stringify(settings));
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
