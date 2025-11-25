/**
 * ✅ NEW: Zentrale Slot-Management Utilities
 * 
 * Extrahiert die Slot-Verwaltungs-Logic aus den API-Endpunkten
 * um Code-Duplikation zu vermeiden.
 */

import type { DayKey, Appointment } from '../types/appointments';

/**
 * Generiert den Slot-Key für KV Store
 * Format: slot:{day}:{time}:{dateKey}
 */
export function generateSlotKey(day: DayKey, time: string, dateKey: string): string {
  return `slot:${day}:${time}:${dateKey}`;
}

/**
 * Extrahiert das Datum aus appointmentDate ISO-String
 * @param appointmentDate - ISO DateTime String (z.B. "2026-01-16T10:30:00+01:00")
 * @returns Date-Key im Format YYYY-MM-DD
 */
export function extractDateKey(appointmentDate: string): string {
  return appointmentDate.split('T')[0];
}

/**
 * ✅ NEW: Reserviert einen Slot für einen Termin
 * Fügt die Appointment-ID zum Slot-Array hinzu
 * 
 * @param kv - KV Namespace
 * @param day - Tag (friday/saturday/sunday)
 * @param time - Zeit (HH:MM)
 * @param dateKey - Datum (YYYY-MM-DD)
 * @param appointmentId - ID des Termins
 * @returns Erfolg (true/false)
 */
export async function reserveSlot(
  kv: KVNamespace,
  day: DayKey,
  time: string,
  dateKey: string,
  appointmentId: string
): Promise<boolean> {
  try {
    const slotKey = generateSlotKey(day, time, dateKey);
    
    // Hole existierende Slot-Daten
    const existingSlotData = await kv.get(slotKey);
    const slotAppointments: string[] = existingSlotData 
      ? JSON.parse(existingSlotData) 
      : [];
    
    // Füge Appointment-ID hinzu
    slotAppointments.push(appointmentId);
    
    // Speichere mit TTL (90 Tage)
    await kv.put(
      slotKey,
      JSON.stringify(slotAppointments),
      { expirationTtl: 60 * 60 * 24 * 90 }
    );
    
    console.log(`✅ Slot reserved: ${slotKey} (${slotAppointments.length} appointments)`);
    return true;
  } catch (error) {
    console.error('❌ Error reserving slot:', error);
    return false;
  }
}

/**
 * ✅ NEW: Gibt einen Slot frei
 * Entfernt die Appointment-ID aus dem Slot-Array
 * Löscht den Slot wenn leer
 * 
 * @param kv - KV Namespace
 * @param day - Tag (friday/saturday/sunday)
 * @param time - Zeit (HH:MM)
 * @param dateKey - Datum (YYYY-MM-DD)
 * @param appointmentId - ID des Termins
 * @returns Erfolg (true/false)
 */
export async function releaseSlot(
  kv: KVNamespace,
  day: DayKey,
  time: string,
  dateKey: string,
  appointmentId: string
): Promise<boolean> {
  try {
    const slotKey = generateSlotKey(day, time, dateKey);
    
    // Hole existierende Slot-Daten
    const existingSlotData = await kv.get(slotKey);
    if (!existingSlotData) {
      console.warn(`⚠️ Slot not found during release: ${slotKey}`);
      return true; // Kein Fehler wenn Slot nicht existiert
    }
    
    const slotAppointments: string[] = JSON.parse(existingSlotData);
    const updatedSlotAppointments = slotAppointments.filter(id => id !== appointmentId);
    
    // Wenn noch Appointments im Slot, speichern
    if (updatedSlotAppointments.length > 0) {
      await kv.put(
        slotKey,
        JSON.stringify(updatedSlotAppointments),
        { expirationTtl: 60 * 60 * 24 * 90 }
      );
      console.log(`✅ Slot released: ${slotKey} (${slotAppointments.length} -> ${updatedSlotAppointments.length})`);
    } else {
      // Slot ist leer, lösche ihn
      await kv.delete(slotKey);
      console.log(`✅ Empty slot deleted: ${slotKey}`);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error releasing slot:', error);
    return false;
  }
}

/**
 * ✅ NEW: Hole alle Appointment-IDs aus einem Slot
 * 
 * @param kv - KV Namespace
 * @param day - Tag (friday/saturday/sunday)
 * @param time - Zeit (HH:MM)
 * @param dateKey - Datum (YYYY-MM-DD)
 * @returns Array von Appointment-IDs
 */
export async function getSlotAppointments(
  kv: KVNamespace,
  day: DayKey,
  time: string,
  dateKey: string
): Promise<string[]> {
  try {
    const slotKey = generateSlotKey(day, time, dateKey);
    const slotData = await kv.get(slotKey);
    
    if (!slotData) {
      return [];
    }
    
    return JSON.parse(slotData);
  } catch (error) {
    console.error('❌ Error getting slot appointments:', error);
    return [];
  }
}

/**
 * ✅ NEW: Alias für getSlotAppointments() (für Klarheit in unterschiedlichen Kontexten)
 */
export const getSlotBookings = getSlotAppointments;

/**
 * ✅ NEW: Zählt aktive Buchungen in einem Slot
 * Ignoriert stornierte Termine
 * 
 * @param kv - KV Namespace
 * @param day - Tag (friday/saturday/sunday)
 * @param time - Zeit (HH:MM)
 * @param dateKey - Datum (YYYY-MM-DD)
 * @returns Anzahl aktiver Buchungen
 */
export async function getActiveSlotCount(
  kv: KVNamespace,
  day: DayKey,
  time: string,
  dateKey: string
): Promise<number> {
  try {
    const slotKey = generateSlotKey(day, time, dateKey);
    const slotData = await kv.get(slotKey);
    
    if (!slotData) {
      return 0;
    }
    
    const appointmentIds: string[] = JSON.parse(slotData);
    
    // Zähle nur aktive Termine (nicht cancelled/rejected)
    let activeCount = 0;
    for (const aptId of appointmentIds) {
      const aptData = await kv.get(`appointment:${aptId}`);
      if (aptData) {
        const apt: Appointment = JSON.parse(aptData);
        if (apt.status !== 'cancelled' && apt.status !== 'rejected') {
          activeCount++;
        }
      }
    }
    
    return activeCount;
  } catch (error) {
    console.error('❌ Error counting active bookings:', error);
    return 0;
  }
}

/**
 * ✅ NEW: Prüft ob ein Slot verfügbar ist
 * 
 * @param kv - KV Namespace
 * @param day - Tag (friday/saturday/sunday)
 * @param time - Zeit (HH:MM)
 * @param dateKey - Datum (YYYY-MM-DD)
 * @param maxAppointments - Max. Anzahl Termine pro Slot
 * @returns true wenn verfügbar, false wenn ausgebucht
 */
export async function isSlotAvailable(
  kv: KVNamespace,
  day: DayKey,
  time: string,
  dateKey: string,
  maxAppointments: number
): Promise<boolean> {
  const activeCount = await getActiveSlotCount(kv, day, time, dateKey);
  return activeCount < maxAppointments;
}
