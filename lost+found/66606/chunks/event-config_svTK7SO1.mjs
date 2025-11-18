globalThis.process ??= {}; globalThis.process.env ??= {};
const EVENT_CONFIG = {
  // Event-Daten (ISO Format: YYYY-MM-DD)
  dates: {
    friday: "2026-01-16",
    saturday: "2026-01-17",
    sunday: "2026-01-18"
  }};
function getEventDate(day) {
  return new Date(EVENT_CONFIG.dates[day]);
}
function getEventDateISO(day) {
  return EVENT_CONFIG.dates[day];
}

export { getEventDate as a, getEventDateISO as g };
