# 📊 Datenmodell & TypeScript Types

Vollständige Übersicht aller Datenstrukturen im System.

---

## 🎫 Appointment (Termin)

```typescript
interface Appointment {
  id: string;                    // Eindeutige ID
  name: string;                  // Kundenname
  email: string;                 // Email-Adresse
  phone: string;                 // Telefonnummer
  appointmentDate: string;       // ISO-String: "2026-01-16"
  appointmentTime: string;       // HH:MM Format: "10:00"
  message?: string;              // Optionale Nachricht
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;             // ISO-Timestamp
  updatedAt?: string;            // ISO-Timestamp
  cancelledAt?: string;          // ISO-Timestamp (bei Stornierung)
}
```

### KV-Keys:

```
appointment:{id}                 // Einzelner Termin
appointments:date:{YYYY-MM-DD}   // Alle Termine eines Tags
appointments:status:{status}     // Alle Termine mit Status
```

**Beispiel:**
```typescript
const appointment: Appointment = {
  id: "apt_2026-01-16_10-00_abc123",
  name: "Max Mustermann",
  email: "max@example.com",
  phone: "+49 123 456789",
  appointmentDate: "2026-01-16",
  appointmentTime: "10:00",
  message: "Ich freue mich auf den Termin!",
  status: "confirmed",
  createdAt: "2025-11-24T10:30:00.000Z",
  updatedAt: "2025-11-24T11:00:00.000Z"
};
```

---

## 🎯 Slot (Zeitfenster)

```typescript
interface SlotKey {
  date: string;    // YYYY-MM-DD
  time: string;    // HH:MM
}

// Interner Key-String
type SlotKeyString = `slots:${string}:${string}`;  // "slots:2026-01-16:10:00"

// Set von Email-Adressen die diesen Slot gebucht haben
type SlotBookings = Set<string>;
```

### KV-Keys:

```
slots:{YYYY-MM-DD}:{HH:MM}      // Set von gebuchten Emails
```

**Beispiel:**
```typescript
// KV-Store:
// Key: "slots:2026-01-16:10:00"
// Value: Set(["max@example.com", "anna@example.com"])

// Max. 2 Buchungen pro Slot:
const bookings = await getSlotBookings("2026-01-16", "10:00");
console.log(bookings.size); // 2
console.log(bookings.has("max@example.com")); // true
```

---

## ⚙️ Settings (Einstellungen)

```typescript
interface Settings {
  // Event-Daten
  eventDates: string[];          // ["2026-01-16", "2026-01-17", "2026-01-18"]
  
  // Zeitslot-Konfiguration
  timeSlotSettings: {
    startTime: string;           // "10:00"
    endTime: string;             // "18:00"
    slotInterval: number;        // 30 (Minuten)
    slotDuration: number;        // 30 (Minuten)
  };
  
  // Slot-Limits
  maxBookingsPerSlot: number;    // 1-10
  
  // Buchungs-Modus
  autoConfirm: boolean;          // true = automatisch bestätigen
  
  // Email-Benachrichtigungen
  enableEmailNotifications: boolean;
  adminEmail: string;            // "admin@example.com"
  
  // Sicherheit
  rateLimitConfig: {
    maxRequests: number;         // 100
    windowMinutes: number;       // 10
  };
  
  // Features
  allowDoubleBooking: boolean;   // false (verhindert Email-Duplikate)
}
```

### KV-Key:

```
settings:global                  // Singleton
```

**Beispiel:**
```typescript
const settings: Settings = {
  eventDates: ["2026-01-16", "2026-01-17", "2026-01-18"],
  timeSlotSettings: {
    startTime: "10:00",
    endTime: "18:00",
    slotInterval: 30,
    slotDuration: 30
  },
  maxBookingsPerSlot: 1,
  autoConfirm: true,
  enableEmailNotifications: true,
  adminEmail: "admin@example.com",
  rateLimitConfig: {
    maxRequests: 100,
    windowMinutes: 10
  },
  allowDoubleBooking: false
};
```

---

## 📝 AuditLog (Protokoll)

```typescript
interface AuditLogEntry {
  id: string;                    // Eindeutige ID
  timestamp: string;             // ISO-Timestamp
  action: AuditAction;           // Siehe unten
  userId: string;                // Email oder IP
  appointmentId?: string;        // Optional: Bezug zu Termin
  details: Record<string, any>;  // Zusätzliche Infos
  ipAddress?: string;            // IP-Adresse
}

type AuditAction =
  | 'appointment_created'
  | 'appointment_confirmed'
  | 'appointment_cancelled'
  | 'appointment_deleted'
  | 'settings_updated'
  | 'email_sent'
  | 'email_failed'
  | 'google_calendar_event_created'
  | 'google_calendar_event_deleted'
  | 'rate_limit_exceeded';
```

### KV-Keys:

```
audit:{id}                       // Einzelner Log-Eintrag
audit:appointment:{appointmentId}  // Alle Logs für einen Termin
audit:action:{action}            // Alle Logs für eine Aktion
```

**Beispiel:**
```typescript
const logEntry: AuditLogEntry = {
  id: "log_abc123",
  timestamp: "2025-11-24T10:30:00.000Z",
  action: "appointment_created",
  userId: "max@example.com",
  appointmentId: "apt_2026-01-16_10-00_abc123",
  details: {
    date: "2026-01-16",
    time: "10:00",
    name: "Max Mustermann"
  },
  ipAddress: "192.168.1.1"
};
```

---

## 🔐 RateLimit (Rate-Limiting)

```typescript
interface RateLimitEntry {
  ip: string;                    // IP-Adresse
  count: number;                 // Anzahl Requests
  windowStart: string;           // ISO-Timestamp
  expiresAt: string;             // ISO-Timestamp
}
```

### KV-Keys:

```
ratelimit:{ip}                   // Pro IP-Adresse
```

**Beispiel:**
```typescript
const rateLimitEntry: RateLimitEntry = {
  ip: "192.168.1.1",
  count: 5,
  windowStart: "2025-11-24T10:30:00.000Z",
  expiresAt: "2025-11-24T10:40:00.000Z"  // 10 Minuten später
};
```

---

## 🔄 API Request/Response Types

### Booking Request

```typescript
interface BookingRequest {
  name: string;         // Min 2, Max 100 Zeichen
  email: string;        // Valid email format
  phone: string;        // Min 5, Max 20 Zeichen
  appointmentDate: string;  // YYYY-MM-DD
  appointmentTime: string;  // HH:MM
  message?: string;     // Optional, Max 500 Zeichen
}
```

### Booking Response

```typescript
interface BookingResponse {
  success: boolean;
  appointmentId?: string;
  auditLogId?: string;
  error?: string;
  code?: string;        // Error-Code
}
```

### Availability Response

```typescript
interface AvailabilityResponse {
  date: string;         // YYYY-MM-DD
  slots: TimeSlot[];
}

interface TimeSlot {
  time: string;         // HH:MM
  available: boolean;
  bookings: number;     // Aktuelle Anzahl Buchungen
  maxBookings: number;  // Maximum pro Slot
}
```

---

## 🗂️ KV-Store Struktur

### Übersicht aller Keys:

```
# Termine
appointment:{id}                      → Appointment
appointments:date:{YYYY-MM-DD}        → Set<string> (Appointment-IDs)
appointments:status:{status}          → Set<string> (Appointment-IDs)
appointments:email:{email}            → Set<string> (Appointment-IDs)

# Slots
slots:{YYYY-MM-DD}:{HH:MM}           → Set<string> (Emails)

# Settings
settings:global                       → Settings

# Audit-Log
audit:{id}                           → AuditLogEntry
audit:appointment:{appointmentId}    → Set<string> (Log-IDs)
audit:action:{action}                → Set<string> (Log-IDs)

# Rate-Limiting
ratelimit:{ip}                       → RateLimitEntry
```

### Key-Expiration:

```typescript
// Automatische Löschung nach:
ratelimit:{ip}           → 10 Minuten (konfigurierbar)
audit:{id}               → 90 Tage (optional)
```

---

## 🔍 Type Guards & Validation

### Zod-Schemas:

```typescript
import { z } from 'zod';

// Booking-Schema
const bookingSchema = z.object({
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().min(5).max(20),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  appointmentTime: z.string().regex(/^\d{2}:\d{2}$/),
  message: z.string().max(500).optional()
});

// Settings-Schema
const settingsSchema = z.object({
  eventDates: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)),
  timeSlotSettings: z.object({
    startTime: z.string().regex(/^\d{2}:\d{2}$/),
    endTime: z.string().regex(/^\d{2}:\d{2}$/),
    slotInterval: z.number().min(5).max(120),
    slotDuration: z.number().min(5).max(120)
  }),
  maxBookingsPerSlot: z.number().min(1).max(10),
  autoConfirm: z.boolean(),
  enableEmailNotifications: z.boolean(),
  adminEmail: z.string().email(),
  rateLimitConfig: z.object({
    maxRequests: z.number().min(10).max(1000),
    windowMinutes: z.number().min(1).max(60)
  }),
  allowDoubleBooking: z.boolean()
});
```

---

## 📚 Siehe auch

- **Architecture:** [10-ARCHITECTURE.md](10-ARCHITECTURE.md)
- **KV Lifecycle:** [11-KV-LIFECYCLE.md](11-KV-LIFECYCLE.md)
- **API Reference:** [22-API-REFERENCE.md](22-API-REFERENCE.md)

---

**Letzte Aktualisierung:** 24. November 2025  
**Version:** 2.0.0
