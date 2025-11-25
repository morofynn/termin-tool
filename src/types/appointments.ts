/**
 * Zentrale Type Definitions für Appointments
 */

export type AppointmentStatus = 'pending' | 'confirmed' | 'cancelled' | 'rejected';

export type DayKey = 'friday' | 'saturday' | 'sunday';

export interface Appointment {
  id: string;
  day: DayKey;
  time: string;
  name: string;
  company?: string;
  phone: string;
  email: string;
  message?: string;
  appointmentDate: string;
  googleEventId?: string;
  status: AppointmentStatus;
  createdAt: string;
  updatedAt?: string;
}

export interface TimeSlot {
  time: string;
  available: boolean;
  appointmentCount: number;
}

export interface Settings {
  // Branding
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  companyWebsite?: string;
  logoUrl?: string;
  primaryColor?: string;
  
  // Booking Settings
  maxAppointmentsPerSlot: number;
  maxBookingsPerSlot?: number; // Alias for maxAppointmentsPerSlot
  bookingMode: 'manual' | 'automatic';
  autoConfirm?: boolean; // Derived from bookingMode
  requireApproval: boolean;
  adminEmail: string;
  emailNotifications?: boolean; // NEW
  appointmentDurationMinutes?: number; // Termindauer in Minuten
  
  // Days Configuration
  availableDays?: {
    friday: boolean;
    saturday: boolean;
    sunday: boolean;
  };
  
  // UI Settings
  showSlotIndicator?: boolean;
  messagePlaceholder?: string;
  preventDuplicateEmail?: boolean;
  
  // Event Location
  standInfo?: string;
  eventLocation?: string;
  eventHall?: string;
  
  // Event Status
  eventEnded?: boolean;
  eventEndDate?: string;
  
  // Event Configuration (NEW - für jährliche Anpassung)
  eventName?: string;          // z.B. "OPTI" - wird mit Jahr kombiniert zu "OPTI 26"
  eventYear?: number;
  eventDateFriday?: string;    // ISO Format: YYYY-MM-DD
  eventDateSaturday?: string;  // ISO Format: YYYY-MM-DD
  eventDateSunday?: string;    // ISO Format: YYYY-MM-DD
  
  // Maintenance
  maintenanceMode?: boolean;
  maintenanceMessage?: string;
  
  // Rate Limiting
  rateLimitingEnabled: boolean;
  rateLimitMaxRequests: number;
  rateLimitWindowMinutes: number;
}

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  appointmentId?: string;
  user: string;
}

export interface RateLimitEntry {
  ip: string;
  requests: number;
  firstRequest: string;
  lastRequest: string;
}
