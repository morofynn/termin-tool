globalThis.process ??= {}; globalThis.process.env ??= {};
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
  // Event Location
  standInfo: "Stand B4.110, Messe München",
  eventLocation: "Stand B4.110",
  eventHall: "Messe München",
  // Event Status - Nur manuell steuerbar
  eventEnded: false,
  eventEndDate: "",
  // Leer = kein automatisches Ende
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

export { DEFAULT_SETTINGS as D, KV_KEYS as K };
