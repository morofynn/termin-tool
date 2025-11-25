# 🏗️ System-Architektur

> Technischer Überblick über die Termin-Tool Architektur

---

## 📚 Tech Stack

| Komponente | Technologie | Version |
|------------|-------------|---------|
| **Framework** | Astro | 5.x |
| **UI Library** | React | 19.x |
| **Styling** | Tailwind CSS | 4.x |
| **UI Components** | shadcn/ui | Latest |
| **Runtime** | Cloudflare Workers | - |
| **Storage** | Cloudflare KV | - |
| **Calendar API** | Google Calendar API | v3 |
| **Email** | SMTP (Nodemailer) | - |

---

## 📁 Projekt-Struktur

```
/
├── src/
│   ├── components/          # React Components
│   │   ├── ui/             # shadcn/ui Komponenten
│   │   ├── Admin*.tsx      # Admin Panel Komponenten
│   │   └── Appointment*.tsx # Buchungs-Komponenten
│   │
│   ├── pages/              # Astro Pages & API Routes
│   │   ├── api/           # API Endpunkte
│   │   │   ├── admin/     # Admin-spezifische APIs
│   │   │   ├── appointment/ # Termin-APIs
│   │   │   └── auth/      # Google OAuth
│   │   ├── termin/        # Termin-Detail-Seiten
│   │   ├── index.astro    # Hauptseite (Buchung)
│   │   ├── admin.astro    # Admin Panel
│   │   └── embed.astro    # iFrame Embedding
│   │
│   ├── lib/               # Utility Functions
│   │   ├── date-utils.ts  # ✅ NEU: Datum-Funktionen
│   │   ├── slot-utils.ts  # ✅ NEU: Slot-Verwaltung
│   │   ├── kv-utils.ts    # ✅ NEU: KV Store Helpers
│   │   ├── email.ts       # E-Mail-Logik
│   │   ├── time-slots.ts  # Zeitslot-Generierung
│   │   ├── validation.ts  # Input-Validierung
│   │   ├── constants.ts   # Konstanten & Defaults
│   │   └── url-utils.ts   # URL-Generierung
│   │
│   ├── types/             # TypeScript Definitionen
│   │   └── appointments.ts
│   │
│   └── styles/            # Global CSS
│       ├── global.css
│       └── mobile-responsive.css
│
├── docs/                  # Dokumentation (Sie sind hier!)
├── .env                   # Environment Variables
├── wrangler.jsonc         # Cloudflare Worker Config
└── astro.config.mjs       # Astro Config
```

---

## 🔄 Datenfluss

### 1. Terminbuchung Flow
```
┌─────────┐
│  User   │
└────┬────┘
     │
     ▼
┌──────────────────────┐
│ AppointmentScheduler │  (React Component)
└──────────┬───────────┘
           │
           ▼
┌─────────────────────────┐
│ /api/book-appointment   │  (API Endpunkt)
└──────────┬──────────────┘
           │
           ├─► KV Store (Appointment speichern)
           │
           ├─► Slot reservieren (slot-utils)
           │
           ├─► Google Calendar Event erstellen
           │
           ├─► E-Mail senden (Kunde + Admin)
           │
           └─► Audit Log schreiben
```

### 2. Admin-Aktion Flow
```
┌─────────┐
│  Admin  │
└────┬────┘
     │
     ▼
┌──────────────────────┐
│ AdminAppointments    │  (React Component)
└──────────┬───────────┘
           │
           ▼
┌─────────────────────────────┐
│ /api/admin/appointments/*   │  (API Endpunkt)
└──────────┬────────────────Opti-
           │
           ├─► KV Store aktualisieren
           │
           ├─► Google Calendar aktualisieren
           │
           ├─► E-Mail senden (Kunde)
           │
           └─► Audit Log schreiben
```

### 3. Termin-Detail Flow
```
┌─────────┐
│  User   │
└────┬────┘
     │ (klickt Link in E-Mail)
     ▼
┌─────────────────┐
│ /termin/[id]    │  (Astro Page)
└────┬────────────┘
     │
     ├─► Appointment laden (kv-utils)
     │
     ├─► Status prüfen
     │
     └─► AppointmentDetail rendern
         └─► QR Code generieren
         └─► ICS Download anbieten
         └─► Stornieren-Button
```

---

## 💾 KV Store Schema

### Appointments
```typescript
Key: `appointment:${uuid}`
TTL: 90 Tage
Value: {
  id: string;               // UUID
  day: DayKey;              // 'friday' | 'saturday' | 'sunday'
  time: string;             // 'HH:MM'
  name: string;
  company?: string;
  phone: string;
  email: string;
  message?: string;
  appointmentDate: string;  // ISO DateTime mit Timezone
  status: 'confirmed' | 'cancelled';
  googleEventId?: string;
  createdAt: string;        // ISO Timestamp
}
```

### Appointments List
```typescript
Key: `appointments:list`
TTL: 90 Tage
Value: string[]  // Array von Appointment-IDs
```

### Slots
```typescript
Key: `slot:${day}:${time}:${dateKey}`
TTL: 90 Tage
Value: string[]  // Array von Appointment-IDs die diesen Slot nutzen
```

### Settings
```typescript
Key: `settings`
TTL: Kein (persistent)
Value: {
  companyName: string;
  companyAddress: string;
  appointmentDurationMinutes: number;
  maxAppointmentsPerSlot: number;
  autoConfirm: boolean;
  emailNotifications: boolean;
  adminEmail: string;
  eventDateFriday: string;  // ISO Date
  timeSlotsFriday: string[];
  timeSlotsSaturday: string[];
  timeSlotsSunday: string[];
}
```

### Audit Log
```typescript
Key: `audit:${timestamp}:${uuid}`
TTL: 90 Tage
Value: {
  timestamp: string;
  action: string;
  details: string;
  ip?: string;
  userAgent?: string;
}
```

### Google OAuth Tokens
```typescript
Key: `google_tokens`
TTL: Kein (refresh via OAuth)
Value: {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}
```

### Rate Limiting
```typescript
Key: `rate:${ip}`
TTL: 15 Minuten
Value: number  // Request count
```

---

## 🔒 Sicherheit

### Authentication & Authorization
- **Admin Panel:** Passwort-basiert (`ADMIN_PASSWORD` ENV)
- **Google OAuth:** OAuth 2.0 mit Refresh Tokens
- **API Routes:** Keine Public Auth (KV-basierte Validierung)

### Rate Limiting
- **Mechanismus:** IP-basiert via KV Store
- **Limit:** 100 Requests pro Minute (konfigurierbar)
- **Scope:** Globale API-Endpunkte
- **Cleanup:** Automatisch via TTL

### Data Protection
- ✅ Keine PII in Logs
- ✅ HTTPS-only in Production
- ✅ Environment Variables für Secrets
- ✅ KV Store Encryption (Cloudflare-managed)

---

## ⚡ Performance

### Caching-Strategie
| Daten-Typ | Cache-Layer | TTL |
|-----------|-------------|-----|
| Settings | KV Store | Persistent |
| Appointments | KV Store | 90 Tage |
| Slots | KV Store | 90 Tage |
| Rate Limits | KV Store | 15 Minuten |
| Audit Logs | KV Store | 90 Tage |

### Optimierungen
- ✅ **Static Assets:** Via Cloudflare CDN
- ✅ **Bundle Size:** Tree-shaking + Code-splitting
- ✅ **React Components:** Lazy loading (`client:only`)
- ✅ **API Responses:** Minimale JSON-Payloads
- ✅ **KV Reads:** Batch-Operationen wo möglich

### Edge Computing
- **Runtime:** Cloudflare Workers (V8 Isolates)
- **Locations:** 200+ Cloudflare Edge-Locations weltweit
- **Cold Start:** < 5ms (V8 Isolates)
- **Execution:** < 50ms CPU Time (Workers Limit)

---

## 📊 Monitoring & Logging

### Audit Log
Protokolliert alle wichtigen Aktionen:
- ✅ Terminbuchungen
- ✅ Stornierungen
- ✅ Admin-Aktionen
- ✅ Settings-Änderungen
- ✅ Google Calendar-Fehler

### Error Handling
Zentrale Error-Handler in API-Routen:
- Try-Catch Blöcke
- Detaillierte Fehlermeldungen in Console
- User-friendly Responses
- Fallback-Mechanismen

### Analytics (via Cloudflare Dashboard)
- Request Count
- Error Rate
- Response Time
- CPU Time
- Bandwidth

---

## 🔗 API Endpunkte Übersicht

### Public APIs
| Endpunkt | Methode | Zweck |
|----------|---------|-------|
| `/api/availability` | GET | Verfügbare Slots laden |
| `/api/book-appointment` | POST | Termin buchen |
| `/api/appointment/[id]` | GET | Termin-Details laden |
| `/api/appointment/cancel` | POST | Termin stornieren |

### Admin APIs (Passwort-geschützt)
| Endpunkt | Methode | Zweck |
|----------|---------|-------|
| `/api/admin/appointments` | GET | Alle Termine laden |
| `/api/admin/appointments/cancel` | POST | Termin stornieren (Admin) |
| `/api/admin/appointments/delete-all` | DELETE | Alle Termine löschen |
| `/api/admin/settings` | GET/POST | Settings laden/speichern |
| `/api/admin/system-status` | GET | System-Status prüfen |
| `/api/admin/test-email` | POST | Test-E-Mail senden |
| `/api/admin/test-calendar` | POST | Google Calendar testen |

### OAuth APIs
| Endpunkt | Methode | Zweck |
|----------|---------|-------|
| `/api/auth/google-authorize` | GET | OAuth-Flow starten |
| `/api/auth/google-callback` | GET | OAuth-Callback |

---

## 🌐 Deployment-Architektur

```
┌──────────────────────────────────────────┐
│         Cloudflare Global Network        │
│              (200+ Locations)            │
└────────────────┬─────────────────────────┘
                 │
       ┌─────────┴─────────┐
       │                   │
┌──────▼──────┐    ┌───────▼────────┐
│   Worker    │    │   KV Store     │
│  (V8 Core)  │◄───┤  (Distributed) │
└──────┬──────┘    └────────────────┘
       │
       ├─► Google Calendar API
       │
       ├─► Gmail/SMTP API
       │
       └─► Static Assets (CDN)
```

---

## 📚 Weitere Infos

- **KV Lifecycle:** [11-KV-LIFECYCLE.md](./11-KV-LIFECYCLE.md)
- **Code-Struktur:** [40-CODE-STRUCTURE.md](./40-CODE-STRUCTURE.md)
- **API Docs:** [21-API.md](./21-API.md)

---

**Zurück zur Übersicht:** [README.md](./README.md)
