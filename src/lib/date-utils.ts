/**
 * Hilfsfunktionen für Datumsberechnungen
 */

/**
 * Berechnet das Folgedatum (nächster Tag)
 */
export function addDays(dateString: string, days: number): string {
  const date = new Date(dateString);
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
  
  const date = new Date(dateString);
  return !isNaN(date.getTime());
}

/**
 * Konvertiert Date zu ISO String (YYYY-MM-DD)
 */
export function toISODateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
}
