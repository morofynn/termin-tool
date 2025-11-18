# Google OAuth Flow - Technische Übersicht

## 🔄 OAuth 2.0 Authorization Code Flow

```
┌─────────────┐                                           ┌──────────────┐
│             │                                           │              │
│   Browser   │                                           │   Google     │
│             │                                           │   OAuth      │
└──────┬──────┘                                           └──────┬───────┘
       │                                                         │
       │  1. User klickt "Mit Google autorisieren"              │
       │     im Admin Panel                                     │
       │                                                         │
       │  GET /api/auth/google-authorize                        │
       ├─────────────────────────────────────────────────────>  │
       │                                                         │
       │  2. Redirect zu Google OAuth                           │
       │     mit client_id, redirect_uri, scopes                │
       │  <──────────────────────────────────────────────────   │
       │                                                         │
       │  3. User autorisiert App                               │
       │     und gewährt Kalender-Zugriff                       │
       ├─────────────────────────────────────────────────────>  │
       │                                                         │
       │  4. Google redirected mit authorization_code           │
       │     GET /api/auth/google-callback?code=XXX             │
       │  <──────────────────────────────────────────────────   │
       │                                                         │
┌──────▼──────┐                                                  │
│             │                                                  │
│   Server    │  5. Exchange authorization code for tokens      │
│             │                                                  │
└──────┬──────┘  POST https://oauth2.googleapis.com/token      │
       │         {                                               │
       │           code: "authorization_code",                   │
       │           client_id: "...",                             │
       │           client_secret: "...",                         │
       │           redirect_uri: "http://localhost:3000/...",    │
       │           grant_type: "authorization_code"              │
       │         }                                               │
       ├─────────────────────────────────────────────────────>  │
       │                                                         │
       │  6. Google returns tokens:                             │
       │     {                                                   │
       │       access_token: "ya29.a0...",  (expires in 1h)     │
       │       refresh_token: "1//0...",    (never expires)     │
       │       expires_in: 3600,                                │
       │       token_type: "Bearer"                             │
       │     }                                                   │
       │  <──────────────────────────────────────────────────   │
       │                                                         │
       │  7. Show tokens in beautiful HTML page                 │
       │     User copies refresh_token                          │
       ├──────────────────────────────────>                     │
       │                                   Browser              │
       │                                                         │
```

---

## 🔑 Token-Typen

### Access Token
- **Lebensdauer**: 1 Stunde
- **Verwendung**: API-Aufrufe an Google Calendar
- **Format**: `ya29.a0AfH6SMBq...` (ca. 200 Zeichen)
- **Refresh**: Automatisch mit Refresh Token

### Refresh Token
- **Lebensdauer**: Unbegrenzt (bis widerrufen)
- **Verwendung**: Neue Access Tokens generieren
- **Format**: `1//0gDz7k...` (ca. 100-200 Zeichen)
- **Erhalt**: Nur beim ersten OAuth-Flow mit `access_type=offline`

---

## 📁 Implementierte Dateien

### Backend (API Routes)

#### `/src/pages/api/auth/google-authorize.ts`
```typescript
// Startet OAuth Flow
// ✅ Baut Google OAuth URL
// ✅ Setzt access_type=offline (für Refresh Token)
// ✅ Setzt prompt=consent (erzwingt Consent Screen)
// ✅ Leitet zu Google weiter
```

#### `/src/pages/api/auth/google-callback.ts`
```typescript
// Empfängt Authorization Code
// ✅ Tauscht Code gegen Tokens (POST zu Google)
// ✅ Zeigt Tokens in schöner HTML UI
// ✅ Ermöglicht Copy & Paste
// ✅ Validiert Refresh Token
// ✅ Auto-Close nach 5 Minuten (Sicherheit)
```

#### `/src/pages/api/admin/test-calendar.ts`
```typescript
// Testet Calendar-Verbindung
// ✅ Validiert alle Credentials
// ✅ Lädt Kalender-Informationen
// ✅ Zeigt Kalender-Name, ID, Zeitzone
// ✅ Error Handling mit Details
```

---

### Frontend (React Components)

#### `/src/components/AdminGoogleCalendar.tsx`
```tsx
// Admin UI für Calendar Integration
// ✅ Status-Anzeige (konfiguriert/nicht konfiguriert)
// ✅ "Mit Google autorisieren" Button
// ✅ "Verbindung testen" Button
// ✅ Zeigt Kalender-Informationen
// ✅ Zeigt fehlende Credentials
// ✅ Error Messages mit Details
// ✅ Feature-Liste
```

---

## 🔐 Sicherheitsfeatures

### CSRF Protection
```typescript
// In google-authorize.ts
authUrl.searchParams.set('state', Math.random().toString(36).substring(7));

// In google-callback.ts
const state = url.searchParams.get('state');
// Validate state parameter
```

### Token Security
```typescript
// Cache-Control Headers
headers: { 
  'Cache-Control': 'no-store, no-cache, must-revalidate',
  'Pragma': 'no-cache'
}

// Auto-Close nach 5 Minuten
setTimeout(() => {
  if (confirm('Diese Seite enthält sensible Daten...')) {
    window.close();
  }
}, 5 * 60 * 1000);
```

### Environment Variables
```env
# Credentials werden NIEMALS im Code gespeichert
GOOGLE_CLIENT_ID="..."      # Nur in .env
GOOGLE_CLIENT_SECRET="..."  # Nur in .env
GOOGLE_REFRESH_TOKEN="..."  # Nur in .env
```

---

## 📊 Ablauf einer Terminbuchung

```
User bucht Termin
       │
       ▼
POST /api/book-appointment
       │
       ├─ Validierung
       │  (Name, Email, Datum, etc.)
       │
       ├─ Rate Limiting
       │  (max 10 Termine/Stunde pro IP)
       │
       ├─ Datenbank-Speicherung
       │  (SQLite/Cloudflare D1)
       │
       ▼
Ist GOOGLE_REFRESH_TOKEN konfiguriert?
       │
       ├─ JA ──────────────────────────┐
       │                                 │
       ▼                                 ▼
1. Access Token generieren      Event in Google Calendar erstellen
   mit Refresh Token             {
   │                               summary: "Termin: Max Mustermann",
   ▼                               start: { dateTime: "2025-01-15T14:00:00" },
POST https://oauth2.             end: { dateTime: "2025-01-15T14:30:00" },
googleapis.com/token             attendees: [{ email: "kunde@example.com" }],
{                                 reminders: {
  refresh_token: "1//0...",        overrides: [
  client_id: "...",                  { method: 'email', minutes: 1440 },
  client_secret: "...",              { method: 'popup', minutes: 30 }
  grant_type: "refresh_token"      ]
}                                  }
   │                             }
   ▼                                 │
Response:                            ▼
{                            POST https://www.googleapis.com
  access_token: "ya29...",   /calendar/v3/calendars/{calendarId}/events
  expires_in: 3600           Authorization: Bearer ya29...
}                                    │
   │                                 ▼
   └────────> Use Access Token      Event ID: "abc123..."
                                    Link: calendar.google.com/event?eid=...
                                         │
       ┌─────────────────────────────────┘
       │
       ▼
Erfolg! Termin erstellt
- In Datenbank ✅
- In Google Calendar ✅
- Kunde erhält Bestätigung ✅
```

---

## 🧪 Testing Workflow

### 1. Credentials Setup
```bash
# .env Datei
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
# GOOGLE_REFRESH_TOKEN ist noch leer
```

### 2. OAuth Flow testen
```bash
# Starte Dev Server
npm run dev

# Öffne Browser
http://localhost:3000/api/auth/google-authorize

# Oder via Admin Panel
http://localhost:3000/secure-admin-panel-xyz789
→ Einstellungen
→ "Mit Google autorisieren"
```

### 3. Tokens erhalten
```
1. Google Consent Screen erscheint
2. User autorisiert App
3. Callback-Page zeigt Tokens
4. User kopiert Refresh Token
5. User fügt Token in .env ein
```

### 4. Connection testen
```bash
# Im Admin Panel
→ "Verbindung testen"

# Oder via API
curl http://localhost:3000/api/admin/test-calendar
```

### 5. Termin buchen
```bash
# Test-Buchung
curl -X POST http://localhost:3000/api/book-appointment \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User",
    "email": "test@example.com",
    "phone": "+49123456789",
    "date": "2025-01-20",
    "time": "14:00",
    "service": "Beratung"
  }'
```

### 6. Kalender prüfen
```
→ Öffne calendar.google.com
→ Event sollte sichtbar sein:
   "Termin: Test User"
   14:00 - 14:30
   Teilnehmer: test@example.com
```

---

## 🚨 Error Handling

### Common Errors

| Error Code | Bedeutung | Lösung |
|------------|-----------|--------|
| `invalid_client` | Client-ID/Secret falsch | Credentials in .env prüfen |
| `invalid_grant` | Refresh Token ungültig | Neu autorisieren |
| `redirect_uri_mismatch` | Callback-URL falsch | Google Console überprüfen |
| `insufficient_permissions` | Fehlende Scopes | Calendar Scopes hinzufügen |
| `rate_limit_exceeded` | Zu viele Requests | Warten oder Quota erhöhen |

### Error Response Format
```json
{
  "success": false,
  "configured": false,
  "message": "User-friendly error message",
  "error": "technical_error_code",
  "errorDescription": "Detailed technical description",
  "missing": {
    "clientId": false,
    "clientSecret": false,
    "refreshToken": true
  }
}
```

---

## 🎯 Nächste Schritte nach Setup

1. ✅ **Test-Termin buchen**: Verifizieren dass Calendar-Integration funktioniert
2. ✅ **Erinnerungen testen**: 24h + 30min vor Termin
3. ✅ **Stornierung testen**: Event sollte aus Calendar verschwinden
4. ✅ **Fehlerbehandlung**: Teste mit ungültigen Daten
5. ✅ **Production**: OAuth App auf "Production" stellen

---

## 📚 Weiterführende Themen

### Token Refresh automatisieren
```typescript
// In src/lib/google-calendar.ts könnte man implementieren:
async function getValidAccessToken() {
  // 1. Prüfe ob Access Token noch gültig
  // 2. Wenn abgelaufen: Refresh
  // 3. Cache neuen Access Token
  // 4. Return valid token
}
```

### Webhook für Calendar Events
```typescript
// Optional: Google Calendar Notifications
// Wenn sich im Calendar etwas ändert → Update Datenbank
```

### Multi-User Support
```typescript
// Jeder User hat eigenen Refresh Token
// Speichern in Datenbank statt .env
```

---

**Vollständige Setup-Anleitung**: `GOOGLE_CALENDAR_OAUTH_SETUP.md`  
**Troubleshooting**: Siehe jeweilige Setup-Dokumente  
**Support**: Siehe GOOGLE_CALENDAR_SETUP_SUMMARY.md
