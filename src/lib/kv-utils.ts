/**
 * ✅ NEW: KV Store Utility Functions
 * 
 * Zentrale Funktionen für typsicheren KV-Zugriff
 * mit konsistenten Null-Checks und Error-Handling
 */

import type { Appointment, Settings } from '../types/appointments';
import { DEFAULT_SETTINGS } from './constants';

/**
 * ✅ NEW: Sicher ein Appointment aus KV laden
 * 
 * @param kv - KV Namespace
 * @param appointmentId - ID des Termins
 * @returns Appointment oder null wenn nicht gefunden
 */
export async function getAppointment(
  kv: KVNamespace,
  appointmentId: string
): Promise<Appointment | null> {
  try {
    const data = await kv.get(`appointment:${appointmentId}`);
    if (!data) {
      return null;
    }
    return JSON.parse(data) as Appointment;
  } catch (error) {
    console.error(`Error loading appointment ${appointmentId}:`, error);
    return null;
  }
}

/**
 * ✅ NEW: Speichert ein Appointment in KV
 * 
 * @param kv - KV Namespace
 * @param appointment - Appointment-Objekt
 * @param ttlDays - TTL in Tagen (default: 90)
 * @returns Erfolg (true/false)
 */
export async function saveAppointment(
  kv: KVNamespace,
  appointment: Appointment,
  ttlDays: number = 90
): Promise<boolean> {
  try {
    await kv.put(
      `appointment:${appointment.id}`,
      JSON.stringify(appointment),
      { expirationTtl: 60 * 60 * 24 * ttlDays }
    );
    return true;
  } catch (error) {
    console.error(`Error saving appointment ${appointment.id}:`, error);
    return false;
  }
}

/**
 * ✅ NEW: Aktualisiert ein existierendes Appointment in KV
 * Alias für saveAppointment - semantisch klarer für Updates
 * 
 * @param kv - KV Namespace
 * @param appointment - Appointment-Objekt
 * @param ttlDays - TTL in Tagen (default: 90)
 * @returns Erfolg (true/false)
 */
export async function updateAppointment(
  kv: KVNamespace,
  appointment: Appointment,
  ttlDays: number = 90
): Promise<boolean> {
  return await saveAppointment(kv, appointment, ttlDays);
}

/**
 * ✅ NEW: Löscht ein Appointment aus KV (inkl. aus appointments:list)
 * 
 * @param kv - KV Namespace
 * @param appointmentId - ID des Termins
 * @returns Erfolg (true/false)
 */
export async function deleteAppointment(
  kv: KVNamespace,
  appointmentId: string
): Promise<boolean> {
  try {
    // 1. Aus Liste entfernen
    await removeFromAppointmentsList(kv, appointmentId);
    
    // 2. Appointment selbst löschen
    await kv.delete(`appointment:${appointmentId}`);
    
    return true;
  } catch (error) {
    console.error(`Error deleting appointment ${appointmentId}:`, error);
    return false;
  }
}

/**
 * ✅ NEW: Lädt Settings aus KV mit Fallback zu Defaults
 * ✅ FIX #13: Normalisiert Settings und synchronisiert alte/neue Feldnamen
 * 
 * @param kv - KV Namespace
 * @returns Settings (immer definiert, nie null)
 */
export async function getSettings(kv: KVNamespace): Promise<Settings> {
  try {
    const data = await kv.get('settings');
    
    let rawSettings: Partial<Settings>;
    
    if (!data) {
      console.log('No settings found, using defaults');
      rawSettings = {};
    } else {
      rawSettings = JSON.parse(data) as Partial<Settings>;
    }
    
    // ✅ FIX #13: Normalisiere Settings mit Sync zwischen alten/neuen Feldnamen
    const settings: Settings = {
      ...DEFAULT_SETTINGS,
      ...rawSettings,
      // Sync zwischen maxBookingsPerSlot und maxAppointmentsPerSlot
      maxBookingsPerSlot: rawSettings.maxBookingsPerSlot ?? rawSettings.maxAppointmentsPerSlot ?? DEFAULT_SETTINGS.maxAppointmentsPerSlot,
      maxAppointmentsPerSlot: rawSettings.maxAppointmentsPerSlot ?? rawSettings.maxBookingsPerSlot ?? DEFAULT_SETTINGS.maxAppointmentsPerSlot,
      // Sync zwischen autoConfirm und bookingMode
      autoConfirm: rawSettings.autoConfirm ?? (rawSettings.bookingMode === 'automatic'),
      bookingMode: rawSettings.autoConfirm ? 'automatic' : (rawSettings.bookingMode ?? 'manual'),
      // Event Dates mit Defaults
      eventYear: rawSettings.eventYear ?? DEFAULT_SETTINGS.eventYear,
      eventDateFriday: rawSettings.eventDateFriday ?? DEFAULT_SETTINGS.eventDateFriday,
      eventDateSaturday: rawSettings.eventDateSaturday ?? DEFAULT_SETTINGS.eventDateSaturday,
      eventDateSunday: rawSettings.eventDateSunday ?? DEFAULT_SETTINGS.eventDateSunday,
    };
    
    return settings;
  } catch (error) {
    console.error('Error loading settings:', error);
    return { ...DEFAULT_SETTINGS };
  }
}

/**
 * ✅ NEW: Speichert Settings in KV
 * 
 * @param kv - KV Namespace
 * @param settings - Settings-Objekt
 * @returns Erfolg (true/false)
 */
export async function saveSettings(
  kv: KVNamespace,
  settings: Settings
): Promise<boolean> {
  try {
    await kv.put('settings', JSON.stringify(settings));
    return true;
  } catch (error) {
    console.error('Error saving settings:', error);
    return false;
  }
}

/**
 * ✅ NEW: Lädt die Appointments-Liste aus KV
 * 
 * @param kv - KV Namespace
 * @returns Array von Appointment-IDs
 */
export async function getAppointmentsList(kv: KVNamespace): Promise<string[]> {
  try {
    const data = await kv.get('appointments:list');
    if (!data) {
      return [];
    }
    return JSON.parse(data) as string[];
  } catch (error) {
    console.error('Error loading appointments list:', error);
    return [];
  }
}

/**
 * ✅ NEW: Speichert die Appointments-Liste in KV
 * 
 * @param kv - KV Namespace
 * @param appointmentIds - Array von Appointment-IDs
 * @returns Erfolg (true/false)
 */
export async function saveAppointmentsList(
  kv: KVNamespace,
  appointmentIds: string[],
  ttlDays: number = 90
): Promise<boolean> {
  try {
    await kv.put(
      'appointments:list',
      JSON.stringify(appointmentIds),
      { expirationTtl: 60 * 60 * 24 * ttlDays }
    );
    return true;
  } catch (error) {
    console.error('Error saving appointments list:', error);
    return false;
  }
}

/**
 * ✅ NEW: Fügt einen Termin zur Liste hinzu
 * 
 * @param kv - KV Namespace
 * @param appointmentId - ID des Termins
 * @returns Erfolg (true/false)
 */
export async function addToAppointmentsList(
  kv: KVNamespace,
  appointmentId: string
): Promise<boolean> {
  try {
    const list = await getAppointmentsList(kv);
    list.push(appointmentId);
    return await saveAppointmentsList(kv, list);
  } catch (error) {
    console.error('Error adding to appointments list:', error);
    return false;
  }
}

/**
 * ✅ NEW: Entfernt einen Termin aus der Liste
 * 
 * @param kv - KV Namespace
 * @param appointmentId - ID des Termins
 * @returns Erfolg (true/false)
 */
export async function removeFromAppointmentsList(
  kv: KVNamespace,
  appointmentId: string
): Promise<boolean> {
  try {
    const list = await getAppointmentsList(kv);
    const updatedList = list.filter(id => id !== appointmentId);
    
    // Nur speichern wenn sich was geändert hat
    if (updatedList.length !== list.length) {
      return await saveAppointmentsList(kv, updatedList);
    }
    
    return true;
  } catch (error) {
    console.error('Error removing from appointments list:', error);
    return false;
  }
}

/**
 * ✅ NEW: Lädt alle Appointments aus KV
 * 
 * @param kv - KV Namespace
 * @returns Array von Appointments (nie null)
 */
export async function getAllAppointments(kv: KVNamespace): Promise<Appointment[]> {
  try {
    const appointmentIds = await getAppointmentsList(kv);
    const appointments: Appointment[] = [];
    
    for (const id of appointmentIds) {
      const appointment = await getAppointment(kv, id);
      if (appointment) {
        appointments.push(appointment);
      }
    }
    
    return appointments;
  } catch (error) {
    console.error('Error loading all appointments:', error);
    return [];
  }
}
