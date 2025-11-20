/**
 * Zentrale Konstanten für die Appointment-App
 * 
 * ⚠️ HINWEIS: Event-spezifische Daten (Datum, Jahr, Namen) sind in event-config.ts!
 * Diese Datei enthält nur app-weite Konstanten, die NICHT vom Event-Jahr abhängen.
 */

import type { DayKey } from '../types/appointments';
import { DEFAULT_EVENT_CONFIG } from './event-config';

/**
 * Tag-Namen für Anzeige
 */
export const DAY_NAMES: Record<string, string> = {
  friday: 'Freitag',
  saturday: 'Samstag',
  sunday: 'Sonntag',
};

/**
 * Verfügbare Zeitslots pro Tag
 */
export const TIME_SLOTS = [
  '09:00', '09:30', '10:00', '10:30', '11:00', '11:30',
  '12:00', '12:30', '13:00', '13:30', '14:00', '14:30',
  '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
] as const;

/**
 * Standard-Einstellungen
 * 
 * WICHTIG: Event-Daten werden aus DEFAULT_EVENT_CONFIG importiert
 * und können über Admin-Settings angepasst werden
 */
export const DEFAULT_SETTINGS = {
  // Branding
  companyName: 'MORO',
  companyAddress: 'Eupener Str. 124, 50933 Köln',
  companyPhone: '+49 221 292 40 500',
  companyEmail: 'info@moro-gmbh.de',
  companyWebsite: 'https://www.moroclub.com',
  logoUrl: 'https://cdn.prod.website-files.com/66c5b6f94041a6256d15cfa6/66d86596b9d572660f8b239d_moro-logo.svg',
  primaryColor: '#2d62ff',
  
  // Booking Settings
  maxAppointmentsPerSlot: 1,
  maxBookingsPerSlot: 1,
  bookingMode: 'manual' as const,
  autoConfirm: false,
  requireApproval: true,
  adminEmail: 'info@moro-gmbh.de',
  emailNotifications: true,
  
  // Termindauer in Minuten (Standard: 30)
  appointmentDurationMinutes: 30,
  
  // Days Configuration
  availableDays: {
    friday: true,
    saturday: true,
    sunday: true,
  },
  
  // UI Settings
  showSlotIndicator: true,
  messagePlaceholder: 'Ihre Nachricht...',
  preventDuplicateEmail: true,
  
  // Event Location - ✅ GEÄNDERT: C4.246
  standInfo: 'Stand C4.246, Messe München',
  eventLocation: 'Stand C4.246',
  eventHall: 'Messe München',
  
  // Event Status
  eventEnded: false,
  // Berechne eventEndDate dynamisch: Sonntag 23:59:59
  get eventEndDate() {
    const sunday = new Date(DEFAULT_EVENT_CONFIG.dates.sunday);
    sunday.setHours(23, 59, 59, 999);
    return sunday.toISOString();
  },
  
  // Event Configuration (für jährliche Anpassung)
  eventName: 'OPTI',
  eventYear: DEFAULT_EVENT_CONFIG.year,
  eventDateFriday: DEFAULT_EVENT_CONFIG.dates.friday,
  eventDateSaturday: DEFAULT_EVENT_CONFIG.dates.saturday,
  eventDateSunday: DEFAULT_EVENT_CONFIG.dates.sunday,
  
  // Maintenance
  maintenanceMode: false,
  maintenanceMessage: 'Das Buchungssystem ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.',
  
  // Rate Limiting
  rateLimitingEnabled: true,
  rateLimitMaxRequests: 5,
  rateLimitWindowMinutes: 15,
};

/**
 * KV Store Keys
 */
export const KV_KEYS = {
  APPOINTMENT: (id: string) => `appointment:${id}`,
  SLOT: (day: DayKey, time: string, date: string) => `slot:${day}:${time}:${date}`,
  SETTINGS: 'settings',
  AUDIT_LOG: (id: string) => `audit:${id}`,
  LAST_CHECK: 'last_check',
  RATE_LIMIT: (ip: string) => `ratelimit:${ip}`,
} as const;

/**
 * Email Subjects
 */
export const EMAIL_SUBJECTS = {
  CUSTOMER_REQUEST: 'Terminanfrage eingegangen',
  CUSTOMER_CONFIRMATION: 'Terminbestätigung',
  CUSTOMER_CANCELLATION: 'Termin storniert',
  CUSTOMER_REJECTION: 'Terminanfrage abgelehnt',
  CUSTOMER_REMINDER: 'Erinnerung: Ihr Termin morgen',
  ADMIN_NEW_REQUEST: 'Neue Terminanfrage',
  ADMIN_CONFIRMATION: 'Termin bestätigt',
  ADMIN_CANCELLATION: 'Termin storniert',
  ADMIN_REJECTION: 'Terminanfrage abgelehnt',
} as const;
