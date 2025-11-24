/**
 * Hilfsfunktionen für Datumsberechnungen
 * 
 * ✅ IMPROVEMENT: Explizite Europe/Berlin Timezone für Event-Daten
 */

/**
 * Erstellt ein Date-Objekt mit expliziter Europe/Berlin Timezone
 * Verhindert Timezone-Probleme bei Event-Daten
 * 
 * @param isoDate - ISO-Datum (YYYY-MM-DD)
 * @param time - Optional: Zeit im Format HH:MM
 * @returns Date-Objekt in Europe/Berlin Timezone
 */
export function createBerlinDate(isoDate: string, time?: string): Date {
  if (time) {
    // Mit Zeit: z.B. "2026-01-16T10:30:00+01:00"
    return new Date(`${isoDate}T${time}:00+01:00`);
  } else {
    // Ohne Zeit: Midnight in Berlin
    return new Date(`${isoDate}T00:00:00+01:00`);
  }
}

/**
 * Berechnet das Folgedatum (nächster Tag)
 * ✅ IMPROVED: Verwendet Berlin Timezone
 */
export function addDays(dateString: string, days: number): string {
  const date = createBerlinDate(dateString);
  date.setDate(date.getDate() + days);
  
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}

/**
 * Berechnet Samstag und Sonntag basierend auf einem Freitag
 */
export function calculateEventDates(fridayDate: string): {
  friday: string;
  saturday: string;
  sunday: string;
} {
  return {
    friday: fridayDate,
    saturday: addDays(fridayDate, 1),
    sunday: addDays(fridayDate, 2),
  };
}

/**
 * Validiert ein ISO-Datum (YYYY-MM-DD)
 */
export function isValidISODate(dateString: string): boolean {
  if (!dateString) return false;
  
  const pattern = /^\d{4}-\d{2}-\d{2}$/;
  if (!pattern.test(dateString)) return false;
  
  const date = createBerlinDate(dateString);
  return !isNaN(date.getTime());
}

/**
 * Konvertiert Date zu ISO String (YYYY-MM-DD)
 * ✅ IMPROVED: Verwendet Berlin Timezone
 */
export function toISODateString(date: Date): string {
  // Konvertiere zu Berlin Timezone String
  const berlinString = date.toLocaleString('sv-SE', { 
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  });
  
  return berlinString.split(' ')[0]; // "YYYY-MM-DD"
}

/**
 * ✅ NEW: Formatiert Datum für Anzeige in deutschem Format
 * @param dateString - ISO-Datum (YYYY-MM-DD) oder ISO DateTime
 * @returns Formatiertes Datum (z.B. "16. Januar 2026")
 */
export function formatDateForDisplay(dateString: string): string {
  if (!dateString) return 'Kein Datum';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return 'Ungültiges Datum';
    }
    
    return date.toLocaleDateString('de-DE', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      timeZone: 'Europe/Berlin',
    });
  } catch {
    return 'Ungültiges Datum';
  }
}

/**
 * ✅ NEW: Formatiert Zeit für Anzeige
 * @param time - Zeit im Format HH:MM
 * @returns Formatierte Zeit (z.B. "14:30")
 */
export function formatTimeForDisplay(time: string): string {
  return time; // Bereits im richtigen Format
}

/**
 * ✅ NEW: Prüft ob ein Event in der Vergangenheit liegt
 * @param date - Date-Objekt oder ISO-String
 * @returns true wenn in der Vergangenheit
 */
export function isEventInPast(date: Date | string): boolean {
  const eventDate = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  // Setze beide auf Mitternacht für Tagesvergleich
  const eventDay = new Date(eventDate.getFullYear(), eventDate.getMonth(), eventDate.getDate());
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return eventDay < today;
}

/**
 * ✅ NEW: Validiert und parsed ein Datum mit expliziter Berlin Timezone
 * Ersetzt validateAndParseDate() aus API-Dateien
 */
export function validateAndParseBerlinDate(dateString: string): Date | null {
  try {
    if (!dateString) return null;
    
    // Prüfe ob es ein ISO-Datum ist (YYYY-MM-DD)
    const isoPattern = /^\d{4}-\d{2}-\d{2}$/;
    if (isoPattern.test(dateString)) {
      const date = createBerlinDate(dateString);
      if (isNaN(date.getTime())) {
        console.error(`Invalid date: ${dateString}`);
        return null;
      }
      return date;
    }
    
    // Fallback: Parse als ISO DateTime String
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      console.error(`Invalid date: ${dateString}`);
      return null;
    }
    return date;
  } catch (error) {
    console.error(`Error parsing date: ${dateString}`, error);
    return null;
  }
}

/**
 * ✅ NEW: Erstellt einen ISO DateTime String für einen Termin
 * Format: "2026-01-16T10:30:00+01:00"
 */
export function createAppointmentDateTime(isoDate: string, time: string): string {
  const date = createBerlinDate(isoDate, time);
  
  // Format: YYYY-MM-DDTHH:MM:SS+01:00
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const [hours, minutes] = time.split(':');
  
  return `${year}-${month}-${day}T${hours}:${minutes}:00+01:00`;
}
