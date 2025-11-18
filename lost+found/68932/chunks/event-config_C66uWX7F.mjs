globalThis.process ??= {}; globalThis.process.env ??= {};
const EVENT_CONFIG = {
  // Event-Daten (ISO Format: YYYY-MM-DD)
  dates: {
    friday: "2025-01-24",
    saturday: "2025-01-25",
    sunday: "2025-01-26"
  },
  // Display-Labels für UI (kurz)
  shortLabels: {
    friday: "Fr. 24.01.",
    saturday: "Sa. 25.01.",
    sunday: "So. 26.01."
  },
  // Display-Labels für UI (lang)
  longLabels: {
    friday: "Freitag, 24.01.2025",
    saturday: "Samstag, 25.01.2025",
    sunday: "Sonntag, 26.01.2025"
  }};
function getEventDate(day) {
  return new Date(EVENT_CONFIG.dates[day]);
}
function getEventDateISO(day) {
  return EVENT_CONFIG.dates[day];
}
function getShortLabel(day) {
  return EVENT_CONFIG.shortLabels[day];
}
function getLongLabel(day) {
  return EVENT_CONFIG.longLabels[day];
}

export { getLongLabel as a, getEventDateISO as b, getEventDate as c, getShortLabel as g };
