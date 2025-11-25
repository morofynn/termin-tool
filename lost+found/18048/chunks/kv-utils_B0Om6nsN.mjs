globalThis.process ??= {}; globalThis.process.env ??= {};
import { D as DEFAULT_EVENT_CONFIG } from './event-config_hIr2Xf8F.mjs';

const DAY_NAMES = {
  friday: "Freitag",
  saturday: "Samstag",
  sunday: "Sonntag"
};
const DEFAULT_SETTINGS = {
  // Branding
  companyName: "MORO",
  companyAddress: "Eupener Str. 124, 50933 Köln",
  companyPhone: "+49 221 292 40 500",
  companyEmail: "info@moro-gmbh.de",
  companyWebsite: "https://www.moroclub.com",
  logoUrl: "https://cdn.prod.website-files.com/66c5b6f94041a6256d15cfa6/66d86596b9d572660f8b239d_moro-logo.svg",
  primaryColor: "#2d62ff",
  // Booking Settings
  maxAppointmentsPerSlot: 1,
  maxBookingsPerSlot: 1,
  bookingMode: "manual",
  autoConfirm: false,
  requireApproval: true,
  adminEmail: "info@moro-gmbh.de",
  emailNotifications: true,
  // Termindauer in Minuten (Standard: 30)
  appointmentDurationMinutes: 30,
  // Days Configuration
  availableDays: {
    friday: true,
    saturday: true,
    sunday: true
  },
  // UI Settings
  showSlotIndicator: true,
  messagePlaceholder: "Ihre Nachricht...",
  preventDuplicateEmail: true,
  // Event Location - ✅ GEÄNDERT: C4.246
  standInfo: "Stand C4.246, Messe München",
  eventLocation: "Stand C4.246",
  eventHall: "Messe München",
  // Event Status
  eventEnded: false,
  // Berechne eventEndDate dynamisch: Sonntag 23:59:59
  get eventEndDate() {
    const sunday = new Date(DEFAULT_EVENT_CONFIG.dates.sunday);
    sunday.setHours(23, 59, 59, 999);
    return sunday.toISOString();
  },
  // Event Configuration (für jährliche Anpassung)
  eventName: "OPTI",
  eventYear: DEFAULT_EVENT_CONFIG.year,
  eventDateFriday: DEFAULT_EVENT_CONFIG.dates.friday,
  eventDateSaturday: DEFAULT_EVENT_CONFIG.dates.saturday,
  eventDateSunday: DEFAULT_EVENT_CONFIG.dates.sunday,
  // Maintenance
  maintenanceMode: false,
  maintenanceMessage: "Das Buchungssystem ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.",
  // Rate Limiting
  rateLimitingEnabled: true,
  rateLimitMaxRequests: 5,
  rateLimitWindowMinutes: 15
};
const KV_KEYS = {
  APPOINTMENT: (id) => `appointment:${id}`,
  SLOT: (day, time, date) => `slot:${day}:${time}:${date}`,
  SETTINGS: "settings",
  AUDIT_LOG: (id) => `audit:${id}`,
  LAST_CHECK: "last_check",
  RATE_LIMIT: (ip) => `ratelimit:${ip}`
};

async function getAppointment(kv, appointmentId) {
  try {
    const data = await kv.get(`appointment:${appointmentId}`);
    if (!data) {
      return null;
    }
    return JSON.parse(data);
  } catch (error) {
    console.error(`Error loading appointment ${appointmentId}:`, error);
    return null;
  }
}
async function saveAppointment(kv, appointment, ttlDays = 90) {
  try {
    await kv.put(
      `appointment:${appointment.id}`,
      JSON.stringify(appointment),
      { expirationTtl: 60 * 60 * 24 * ttlDays }
    );
    return true;
  } catch (error) {
    console.error(`Error saving appointment ${appointment.id}:`, error);
    return false;
  }
}
async function updateAppointment(kv, appointment, ttlDays = 90) {
  return await saveAppointment(kv, appointment, ttlDays);
}
async function deleteAppointment(kv, appointmentId) {
  try {
    await removeFromAppointmentsList(kv, appointmentId);
    await kv.delete(`appointment:${appointmentId}`);
    return true;
  } catch (error) {
    console.error(`Error deleting appointment ${appointmentId}:`, error);
    return false;
  }
}
async function getSettings(kv) {
  try {
    const data = await kv.get("settings");
    let rawSettings;
    if (!data) {
      console.log("No settings found, using defaults");
      rawSettings = {};
    } else {
      rawSettings = JSON.parse(data);
    }
    const settings = {
      ...DEFAULT_SETTINGS,
      ...rawSettings,
      // Sync zwischen maxBookingsPerSlot und maxAppointmentsPerSlot
      maxBookingsPerSlot: rawSettings.maxBookingsPerSlot ?? rawSettings.maxAppointmentsPerSlot ?? DEFAULT_SETTINGS.maxAppointmentsPerSlot,
      maxAppointmentsPerSlot: rawSettings.maxAppointmentsPerSlot ?? rawSettings.maxBookingsPerSlot ?? DEFAULT_SETTINGS.maxAppointmentsPerSlot,
      // Sync zwischen autoConfirm und bookingMode
      autoConfirm: rawSettings.autoConfirm ?? rawSettings.bookingMode === "automatic",
      bookingMode: rawSettings.autoConfirm ? "automatic" : rawSettings.bookingMode ?? "manual",
      // Event Dates mit Defaults
      eventYear: rawSettings.eventYear ?? DEFAULT_SETTINGS.eventYear,
      eventDateFriday: rawSettings.eventDateFriday ?? DEFAULT_SETTINGS.eventDateFriday,
      eventDateSaturday: rawSettings.eventDateSaturday ?? DEFAULT_SETTINGS.eventDateSaturday,
      eventDateSunday: rawSettings.eventDateSunday ?? DEFAULT_SETTINGS.eventDateSunday
    };
    return settings;
  } catch (error) {
    console.error("Error loading settings:", error);
    return { ...DEFAULT_SETTINGS };
  }
}
async function saveSettings(kv, settings) {
  try {
    await kv.put("settings", JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error("Error saving settings:", error);
    return false;
  }
}
async function getAppointmentsList(kv) {
  try {
    const data = await kv.get("appointments:list");
    if (!data) {
      return [];
    }
    return JSON.parse(data);
  } catch (error) {
    console.error("Error loading appointments list:", error);
    return [];
  }
}
async function saveAppointmentsList(kv, appointmentIds, ttlDays = 90) {
  try {
    await kv.put(
      "appointments:list",
      JSON.stringify(appointmentIds),
      { expirationTtl: 60 * 60 * 24 * ttlDays }
    );
    return true;
  } catch (error) {
    console.error("Error saving appointments list:", error);
    return false;
  }
}
async function addToAppointmentsList(kv, appointmentId) {
  try {
    const list = await getAppointmentsList(kv);
    list.push(appointmentId);
    return await saveAppointmentsList(kv, list);
  } catch (error) {
    console.error("Error adding to appointments list:", error);
    return false;
  }
}
async function removeFromAppointmentsList(kv, appointmentId) {
  try {
    const list = await getAppointmentsList(kv);
    const updatedList = list.filter((id) => id !== appointmentId);
    if (updatedList.length !== list.length) {
      return await saveAppointmentsList(kv, updatedList);
    }
    return true;
  } catch (error) {
    console.error("Error removing from appointments list:", error);
    return false;
  }
}
async function getAllAppointments(kv) {
  try {
    const appointmentIds = await getAppointmentsList(kv);
    const appointments = [];
    for (const id of appointmentIds) {
      const appointment = await getAppointment(kv, id);
      if (appointment) {
        appointments.push(appointment);
      }
    }
    return appointments;
  } catch (error) {
    console.error("Error loading all appointments:", error);
    return [];
  }
}

export { DAY_NAMES as D, KV_KEYS as K, getSettings as a, getAllAppointments as b, saveSettings as c, deleteAppointment as d, DEFAULT_SETTINGS as e, addToAppointmentsList as f, getAppointment as g, removeFromAppointmentsList as r, saveAppointment as s, updateAppointment as u };
