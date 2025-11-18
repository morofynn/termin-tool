globalThis.process ??= {}; globalThis.process.env ??= {};
const DEFAULT_EVENT_CONFIG = {
  year: 2026,
  dates: {
    friday: "2026-01-16",
    saturday: "2026-01-17",
    sunday: "2026-01-18"
  }
};
function getEventConfig(settings) {
  const year = DEFAULT_EVENT_CONFIG.year;
  const friday = DEFAULT_EVENT_CONFIG.dates.friday;
  const saturday = DEFAULT_EVENT_CONFIG.dates.saturday;
  const sunday = DEFAULT_EVENT_CONFIG.dates.sunday;
  return {
    year,
    name: `OPTI ${year.toString().slice(-2)}`,
    dates: {
      friday,
      saturday,
      sunday
    },
    // Dynamische Labels aus Daten generieren
    shortLabels: {
      friday: formatShortLabel(friday),
      saturday: formatShortLabel(saturday),
      sunday: formatShortLabel(sunday)
    },
    longLabels: {
      friday: formatLongLabel(friday, year),
      saturday: formatLongLabel(saturday, year),
      sunday: formatLongLabel(sunday, year)
    },
    dayNames: {
      friday: "Freitag",
      saturday: "Samstag",
      sunday: "Sonntag"
    }
  };
}
function formatShortLabel(isoDate) {
  const date = new Date(isoDate);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const dayNames = {
    0: "So.",
    1: "Mo.",
    2: "Di.",
    3: "Mi.",
    4: "Do.",
    5: "Fr.",
    6: "Sa."
  };
  const dayName = dayNames[date.getDay()] || "n/a";
  return `${dayName} ${day}.${month}.`;
}
function formatLongLabel(isoDate, year) {
  const date = new Date(isoDate);
  const day = date.getDate().toString().padStart(2, "0");
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const dayNames = {
    0: "Sonntag",
    1: "Montag",
    2: "Dienstag",
    3: "Mittwoch",
    4: "Donnerstag",
    5: "Freitag",
    6: "Samstag"
  };
  const dayName = dayNames[date.getDay()] || "n/a";
  return `${dayName}, ${day}.${month}.${year}`;
}
function getEventDate(day, settings) {
  const config = getEventConfig();
  return new Date(config.dates[day]);
}
function getEventDateISO(day, settings) {
  const config = getEventConfig();
  return config.dates[day];
}
function getShortLabel(day, settings) {
  const config = getEventConfig();
  return config.shortLabels[day];
}
function getLongLabel(day, settings) {
  const config = getEventConfig();
  return config.longLabels[day];
}
({
  shortLabels: {
    friday: formatShortLabel(DEFAULT_EVENT_CONFIG.dates.friday),
    saturday: formatShortLabel(DEFAULT_EVENT_CONFIG.dates.saturday),
    sunday: formatShortLabel(DEFAULT_EVENT_CONFIG.dates.sunday)
  },
  longLabels: {
    friday: formatLongLabel(DEFAULT_EVENT_CONFIG.dates.friday, DEFAULT_EVENT_CONFIG.year),
    saturday: formatLongLabel(DEFAULT_EVENT_CONFIG.dates.saturday, DEFAULT_EVENT_CONFIG.year),
    sunday: formatLongLabel(DEFAULT_EVENT_CONFIG.dates.sunday, DEFAULT_EVENT_CONFIG.year)
  }});

export { DEFAULT_EVENT_CONFIG as D, getLongLabel as a, getEventDateISO as b, getEventDate as c, getShortLabel as g };
