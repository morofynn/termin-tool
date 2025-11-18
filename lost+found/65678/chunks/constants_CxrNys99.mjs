globalThis.process ??= {}; globalThis.process.env ??= {};
const DAY_NAMES = {
  friday: "Freitag",
  saturday: "Samstag",
  sunday: "Sonntag"
};
const DAY_NAMES_FULL = {
  friday: "Freitag, 16.01.2026",
  saturday: "Samstag, 17.01.2026",
  sunday: "Sonntag, 18.01.2026"
};
const DEFAULT_SETTINGS = {
  companyName: "Ihre Firma",
  companyAddress: "Musterstraße 1, 12345 Musterstadt",
  companyPhone: "+49 123 456789",
  companyEmail: "kontakt@example.com",
  maxAppointmentsPerSlot: 1,
  bookingMode: "manual",
  adminEmail: "admin@example.com",
  requireApproval: true,
  primaryColor: "#2d62ff",
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

export { DAY_NAMES as D, KV_KEYS as K, DAY_NAMES_FULL as a, DEFAULT_SETTINGS as b };
