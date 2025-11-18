globalThis.process ??= {}; globalThis.process.env ??= {};
const EVENT_CONFIG = {
  // Event-Daten (ISO Format: YYYY-MM-DD)
  dates: {
    friday: "2026-01-16",
    saturday: "2026-01-17",
    sunday: "2026-01-18"
  },
  // Display-Labels für UI (kurz)
  shortLabels: {
    friday: "Fr. 16.01.",
    saturday: "Sa. 17.01.",
    sunday: "So. 18.01."
  },
  // Display-Labels für UI (lang)
  longLabels: {
    friday: "Freitag, 16.01.2026",
    saturday: "Samstag, 17.01.2026",
    sunday: "Sonntag, 18.01.2026"
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
