/**
 * Zentrale Zeitslot-Definition
 * 
 * Diese Datei definiert die verfügbaren Zeitslots für jeden Event-Tag.
 * Wird von allen Komponenten verwendet, die Zeitslots benötigen.
 */

export type DayKey = 'friday' | 'saturday' | 'sunday';

/**
 * Verfügbare Zeitslots pro Tag
 * - Freitag & Samstag: 10:00 - 17:30 (15 Slots)
 * - Sonntag: 10:00 - 16:30 (13 Slots)
 */
export const TIME_SLOTS: Record<DayKey, readonly string[]> = {
  friday: Array.from({ length: 15 }, (_, i) => {
    const hour = Math.floor(i / 2) + 10;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  }),
  saturday: Array.from({ length: 15 }, (_, i) => {
    const hour = Math.floor(i / 2) + 10;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  }),
  sunday: Array.from({ length: 13 }, (_, i) => {
    const hour = Math.floor(i / 2) + 10;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  }),
} as const;

/**
 * Alle einzigartigen Zeitslots über alle Tage hinweg (sortiert)
 */
export const ALL_TIME_SLOTS = Array.from(
  new Set([
    ...TIME_SLOTS.friday,
    ...TIME_SLOTS.saturday,
    ...TIME_SLOTS.sunday
  ])
).sort();
