/**
 * Zentrale Event-Konfiguration für OPTI
 * 
 * Diese Datei enthält alle zeitbezogenen Einstellungen für das Event.
 * Die Werte können über die Admin-Settings angepasst werden.
 * 
 * WICHTIG: Diese Datei definiert nur die DEFAULT-Werte.
 * Die tatsächlich genutzten Werte kommen aus den Settings (KV Store).
 */

import type { Settings } from '../types/appointments';

/**
 * DEFAULT Event Configuration
 * Diese Werte werden genutzt, wenn keine Settings in KV gespeichert sind
 */
export const DEFAULT_EVENT_CONFIG = {
  year: 2026,
  dates: {
    friday: '2026-01-16',
    saturday: '2026-01-17',
    sunday: '2026-01-18',
  },
} as const;

export type EventDay = 'friday' | 'saturday' | 'sunday';

/**
 * Event Configuration aus Settings erstellen
 * Nutzt Settings falls vorhanden, sonst DEFAULT_EVENT_CONFIG
 */
export function getEventConfig(settings?: Partial<Settings>) {
  const year = settings?.eventYear ?? DEFAULT_EVENT_CONFIG.year;
  const friday = settings?.eventDateFriday ?? DEFAULT_EVENT_CONFIG.dates.friday;
  const saturday = settings?.eventDateSaturday ?? DEFAULT_EVENT_CONFIG.dates.saturday;
  const sunday = settings?.eventDateSunday ?? DEFAULT_EVENT_CONFIG.dates.sunday;

  return {
    year,
    name: `OPTI ${year.toString().slice(-2)}`,
    dates: {
      friday,
      saturday,
      sunday,
    },
    // Dynamische Labels aus Daten generieren
    shortLabels: {
      friday: formatShortLabel(friday),
      saturday: formatShortLabel(saturday),
      sunday: formatShortLabel(sunday),
    },
    longLabels: {
      friday: formatLongLabel(friday, year),
      saturday: formatLongLabel(saturday, year),
      sunday: formatLongLabel(sunday, year),
    },
    dayNames: {
      friday: 'Freitag',
      saturday: 'Samstag',
      sunday: 'Sonntag',
    },
  };
}

/**
 * Kurzes Datum-Label: "Fr. 16.01."
 */
function formatShortLabel(isoDate: string): string {
  const date = new Date(isoDate);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  const dayNames: Record<number, string> = {
    0: 'So.',
    1: 'Mo.',
    2: 'Di.',
    3: 'Mi.',
    4: 'Do.',
    5: 'Fr.',
    6: 'Sa.',
  };
  
  const dayName = dayNames[date.getDay()] || 'n/a';
  return `${dayName} ${day}.${month}.`;
}

/**
 * Langes Datum-Label: "Freitag, 16.01.2026"
 */
function formatLongLabel(isoDate: string, year: number): string {
  const date = new Date(isoDate);
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  
  const dayNames: Record<number, string> = {
    0: 'Sonntag',
    1: 'Montag',
    2: 'Dienstag',
    3: 'Mittwoch',
    4: 'Donnerstag',
    5: 'Freitag',
    6: 'Samstag',
  };
  
  const dayName = dayNames[date.getDay()] || 'n/a';
  return `${dayName}, ${day}.${month}.${year}`;
}

/**
 * Hilfsfunktion: ISO Date zu Date-Objekt
 */
export function getEventDate(day: EventDay, settings?: Partial<Settings>): Date {
  const config = getEventConfig(settings);
  return new Date(config.dates[day]);
}

/**
 * Hilfsfunktion: ISO Date String
 */
export function getEventDateISO(day: EventDay, settings?: Partial<Settings>): string {
  const config = getEventConfig(settings);
  return config.dates[day];
}

/**
 * Hilfsfunktion: Kurzes Label (z.B. "Fr. 16.01.")
 */
export function getShortLabel(day: EventDay, settings?: Partial<Settings>): string {
  const config = getEventConfig(settings);
  return config.shortLabels[day];
}

/**
 * Hilfsfunktion: Langes Label (z.B. "Freitag, 16.01.2026")
 */
export function getLongLabel(day: EventDay, settings?: Partial<Settings>): string {
  const config = getEventConfig(settings);
  return config.longLabels[day];
}

/**
 * Hilfsfunktion: Wochentag-Name (z.B. "Freitag")
 */
export function getDayName(day: EventDay, settings?: Partial<Settings>): string {
  const config = getEventConfig(settings);
  return config.dayNames[day];
}

/**
 * Hilfsfunktion: Event-Name (z.B. "OPTI 26")
 */
export function getEventName(settings?: Partial<Settings>): string {
  const config = getEventConfig(settings);
  return config.name;
}

/**
 * Hilfsfunktion: Event-Jahr (z.B. 2026)
 */
export function getEventYear(settings?: Partial<Settings>): number {
  const config = getEventConfig(settings);
  return config.year;
}

/**
 * Legacy Export für Backward Compatibility
 * @deprecated Use getEventConfig() instead
 */
export const EVENT_CONFIG = {
  get year() { return DEFAULT_EVENT_CONFIG.year; },
  get name() { return `OPTI ${DEFAULT_EVENT_CONFIG.year.toString().slice(-2)}`; },
  dates: DEFAULT_EVENT_CONFIG.dates,
  shortLabels: {
    friday: formatShortLabel(DEFAULT_EVENT_CONFIG.dates.friday),
    saturday: formatShortLabel(DEFAULT_EVENT_CONFIG.dates.saturday),
    sunday: formatShortLabel(DEFAULT_EVENT_CONFIG.dates.sunday),
  },
  longLabels: {
    friday: formatLongLabel(DEFAULT_EVENT_CONFIG.dates.friday, DEFAULT_EVENT_CONFIG.year),
    saturday: formatLongLabel(DEFAULT_EVENT_CONFIG.dates.saturday, DEFAULT_EVENT_CONFIG.year),
    sunday: formatLongLabel(DEFAULT_EVENT_CONFIG.dates.sunday, DEFAULT_EVENT_CONFIG.year),
  },
  dayNames: {
    friday: 'Freitag',
    saturday: 'Samstag',
    sunday: 'Sonntag',
  },
};

/**
 * Fetch Settings from API and return Event Config
 * Useful for client-side components that need event dates
 */
export async function fetchEventConfig(baseUrl: string): Promise<ReturnType<typeof getEventConfig>> {
  try {
    const response = await fetch(`${baseUrl}/api/admin/settings`);
    if (!response.ok) {
      console.warn('Failed to fetch settings, using defaults');
      return getEventConfig();
    }
    const data = await response.json();
    return getEventConfig(data.settings);
  } catch (error) {
    console.error('Error fetching event config:', error);
    return getEventConfig();
  }
}
