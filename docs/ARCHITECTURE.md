# 🏗️ System-Architektur

## Tech Stack

- **Framework**: Astro 5 + React 19
- **Styling**: Tailwind CSS 4
- **UI Components**: shadcn/ui
- **Deployment**: Cloudflare Workers
- **Storage**: Cloudflare KV
- **APIs**: Google Calendar API, Gmail API

---

## Ordnerstruktur

```
src/
├── components/          # React Components
│   ├── ui/             # shadcn/ui Components
│   ├── Admin*.tsx      # Admin Panel Components
│   └── Appointment*.tsx # Booking Components
├── pages/              # Astro Pages & API Routes
│   ├── api/           # API Endpoints
│   ├── termin/        # Appointment Detail Pages
│   └── *.astro        # Public Pages
├── lib/               # Utilities & Helpers
│   ├── email.ts       # E-Mail Logic
│   ├── time-slots.ts  # Slot Generation
│   └── validation.ts  # Input Validation
├── types/             # TypeScript Types
└── styles/            # Global CSS
```

---

## Datenfluss

### Terminbuchung
```
User → AppointmentScheduler → /api/book-appointment
  → KV Store
  → Google Calendar API
  → Gmail API (E-Mail)
  → Audit Log
```

### Admin-Aktion
```
Admin → AdminPanel → /api/admin/appointments/confirm
  → KV Store Update
  → Google Calendar Update
  → E-Mail an Kunde
  → Audit Log Entry
```

---

## KV Store Schema

### Appointments
```typescript
Key: `appointment:${uuid}`
Value: {
  id: string;
  name: string;
  email: string;
  phone: string;
  date: string;
  time: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  message?: string;
  googleEventId?: string;
  createdAt: string;
  confirmedAt?: string;
  cancelledAt?: string;
}
```

### Settings
```typescript
Key: `settings`
Value: {
  companyName: string;
  appointmentDurationMinutes: number;
  autoConfirm: boolean;
  eventDateFriday: string;
  ...
}
```

### Audit Log
```typescript
Key: `audit:${timestamp}`
Value: {
  timestamp: string;
  action: string;
  details: string;
  ip?: string;
}
```

### OAuth Tokens
```typescript
Key: `google_tokens`
Value: {
  access_token: string;
  refresh_token: string;
  expiry_date: number;
}
```

---

## Security

### Authentication
- Admin Panel: Password-based (bcrypt in production recommended)
- Google OAuth: OAuth 2.0 with refresh tokens
- API Routes: Header-based auth for admin endpoints

### Rate Limiting
- IP-based tracking via KV Store
- Configurable limits (default: 5 req/15min)
- Automatic cleanup of old entries

### Data Protection
- No PII in logs (emails/names redacted)
- HTTPS-only in production
- Environment variables for secrets

---

## Performance

### Caching Strategy
- Settings cached in KV with 24h TTL
- Availability slots calculated on-demand
- No database queries (KV is fast)

### Optimization
- Static assets via Cloudflare CDN
- Minimal bundle size (tree-shaking)
- Lazy loading of React components
- Native browser APIs where possible

---

## Monitoring

### Audit Log
- All admin actions logged
- E-Mail sending tracked (success/failure)
- Automatic cleanup after 30 days

### Error Handling
- Try-catch blocks in all API routes
- Graceful degradation for Google API failures
- User-friendly error messages
- Console errors for debugging
