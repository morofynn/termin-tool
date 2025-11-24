# 🔐 Environment-Variablen

Vollständige Dokumentation aller Umgebungsvariablen für das Terminbuchungssystem.

---

## 📝 .env Datei erstellen

Erstelle eine `.env` Datei im Projekt-Root:

```bash
cp .env.example .env
```

---

## 🔑 Alle Variablen im Überblick

```env
# ==========================================
# EMAIL KONFIGURATION (ERFORDERLICH)
# ==========================================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=deine-email@gmail.com
EMAIL_PASS=dein-app-passwort
ADMIN_EMAIL=admin@example.com

# ==========================================
# ADMIN URL (WICHTIG)
# ==========================================
# OHNE trailing slash!
# Development:
ADMIN_BASE_URL=http://localhost:4321

# Production (beim Deploy ändern):
# ADMIN_BASE_URL=https://yourdomain.com

# ==========================================
# GOOGLE CALENDAR (OPTIONAL)
# ==========================================
GOOGLE_CLIENT_ID=deine-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=dein-secret
GOOGLE_REFRESH_TOKEN=dein-refresh-token
GOOGLE_CALENDAR_ID=primary

# ==========================================
# WEBFLOW API (OPTIONAL)
# ==========================================
# Nur für CMS-Integration
WEBFLOW_API_HOST=https://api.webflow.com
WEBFLOW_CMS_SITE_API_TOKEN=
```

---

## 📧 Email-Konfiguration

### `EMAIL_HOST` ⚠️ **Erforderlich**

**Zweck:** SMTP-Server für Email-Versand

**Beispiele:**
```env
# Gmail
EMAIL_HOST=smtp.gmail.com

# Outlook/Hotmail
EMAIL_HOST=smtp-mail.outlook.com

# Mailgun
EMAIL_HOST=smtp.mailgun.org

# SendGrid
EMAIL_HOST=smtp.sendgrid.net

# Custom SMTP
EMAIL_HOST=mail.yourdomain.com
```

---

### `EMAIL_PORT`

**Zweck:** SMTP-Port

**Standard:** `587` (TLS/STARTTLS)

**Alternativen:**
- `465` - SSL
- `25` - Unverschlüsselt (nicht empfohlen)

---

### `EMAIL_USER` ⚠️ **Erforderlich**

**Zweck:** SMTP-Benutzername (meist deine Email-Adresse)

**Beispiel:**
```env
EMAIL_USER=booking@yourdomain.com
```

---

### `EMAIL_PASS` ⚠️ **Erforderlich**

**Zweck:** SMTP-Passwort

**Für Gmail:** Nutze ein **App-Passwort**, nicht dein normales Passwort!

#### Gmail App-Passwort erstellen:

1. Gehe zu [Google Account Security](https://myaccount.google.com/security)
2. Aktiviere "2-Schritt-Verifizierung"
3. Gehe zu [App-Passwörter](https://myaccount.google.com/apppasswords)
4. Wähle "Mail" → "Anderes Gerät"
5. Name: "Terminbuchungssystem"
6. Kopiere das generierte Passwort

**Beispiel:**
```env
# Format: 16 Zeichen ohne Leerzeichen
EMAIL_PASS=abcdefghijklmnop
```

---

### `ADMIN_EMAIL` ⚠️ **Erforderlich**

**Zweck:** Email-Adresse für Admin-Benachrichtigungen

**Erhält Benachrichtigungen bei:**
- ✅ Neuen Buchungen
- ❌ Stornierungen (von Kunden)
- ❌ Stornierungen (vom Admin)

**Beispiel:**
```env
ADMIN_EMAIL=admin@yourdomain.com
```

---

## 🌐 Admin URL

### `ADMIN_BASE_URL` ⚠️ **Wichtig**

**Zweck:** Basis-URL für alle Links im System

**Verwendet in:**
- Email-Links zu Terminen
- ICS-Kalender-Dateien
- Google Calendar Event-Beschreibungen
- QR-Codes

**Format:** OHNE trailing slash (`/`)

**Beispiele:**
```env
# Development
ADMIN_BASE_URL=http://localhost:4321

# Production (Cloudflare Workers)
ADMIN_BASE_URL=https://appointment-tool.yourdomain.workers.dev

# Production (Webflow Embedded App)
ADMIN_BASE_URL=https://yourdomain.webflow.io/appointments

# Custom Domain
ADMIN_BASE_URL=https://booking.yourdomain.com
```

**❌ Häufiger Fehler:**
```env
# FALSCH - Mit trailing slash
ADMIN_BASE_URL=https://yourdomain.com/

# RICHTIG - Ohne trailing slash
ADMIN_BASE_URL=https://yourdomain.com
```

---

## 📆 Google Calendar (Optional)

### `GOOGLE_CLIENT_ID`

**Zweck:** OAuth 2.0 Client ID von Google Cloud Console

**Format:** `xxx.apps.googleusercontent.com`

**Wie erstellen:** Siehe [33-GOOGLE-CALENDAR.md](33-GOOGLE-CALENDAR.md)

---

### `GOOGLE_CLIENT_SECRET`

**Zweck:** OAuth 2.0 Client Secret

**Sicherheit:** ⚠️ Als Secret behandeln! Niemals commiten!

---

### `GOOGLE_REFRESH_TOKEN`

**Zweck:** OAuth Refresh Token für dauerhaften Zugriff

**Wie erhalten:**
1. Starte OAuth-Flow: `/api/auth/google-authorize`
2. Authorisiere die App
3. Kopiere Refresh Token aus Callback

Siehe [33-GOOGLE-CALENDAR.md](33-GOOGLE-CALENDAR.md) für Details.

---

### `GOOGLE_CALENDAR_ID`

**Zweck:** ID des Zielkalenders

**Standard:** `primary` (Haupt-Kalender)

**Für spezifischen Kalender:**
1. Öffne Google Calendar
2. Gehe zu Kalender-Einstellungen
3. Kopiere "Kalender-ID" (z.B. `abc123@group.calendar.google.com`)

```env
# Haupt-Kalender
GOOGLE_CALENDAR_ID=primary

# Spezifischer Kalender
GOOGLE_CALENDAR_ID=bookings@group.calendar.google.com
```

---

## 🔧 Webflow API (Optional)

### `WEBFLOW_API_HOST`

**Zweck:** Webflow API Endpoint

**Standard:** `https://api.webflow.com`

**Nur ändern wenn:** Du einen Custom API Endpoint nutzt

---

### `WEBFLOW_CMS_SITE_API_TOKEN`

**Zweck:** API Token für Webflow CMS Zugriff

**Benötigt:** Nur wenn du CMS-Daten nutzt (aktuell nicht implementiert)

---

## 🚀 Environment für Cloudflare Workers

Für Production musst du die Variablen in Cloudflare setzen:

### Via Wrangler CLI

```bash
# Einzelne Variable setzen
npx wrangler secret put EMAIL_PASS

# Mehrere Variablen aus .env
npx wrangler secret bulk .env
```

### Via Cloudflare Dashboard

1. Gehe zu [Cloudflare Dashboard](https://dash.cloudflare.com)
2. **Workers & Pages** → Dein Worker
3. **Settings** → **Variables**
4. Klicke **"Add variable"**

**Als "Secret" markieren:**
- `EMAIL_PASS`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- Alle anderen sensiblen Daten

**Als "Environment Variable":**
- `EMAIL_HOST`
- `EMAIL_PORT`
- `EMAIL_USER`
- `ADMIN_EMAIL`
- `ADMIN_BASE_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CALENDAR_ID`

---

## ✅ Konfiguration testen

### 1. Email-Test

Im Admin-Panel:
1. Gehe zu **Einstellungen**
2. Scrolle zu "Email-Benachrichtigungen"
3. Klicke **"Test-E-Mail senden"**

✅ **Erfolgreich:** Toast-Meldung + Email innerhalb 30 Sekunden

❌ **Fehler:** Prüfe Console-Logs:
```bash
# Im Terminal (Development)
npm run dev
# Schau nach Fehlern
```

### 2. Google Calendar Test

Im Admin-Panel:
1. Gehe zu **Google Calendar**
2. Klicke **"Status prüfen"**

✅ **Verbunden:** Grüner Status

❌ **Fehler:** "Nicht verbunden" - Prüfe Credentials

### 3. Base URL Test

1. Buche Test-Termin
2. Prüfe Email: Link sollte mit `ADMIN_BASE_URL` beginnen
3. Klicke Link: Sollte zu Termin-Detail führen

---

## 🔒 Sicherheits-Best-Practices

### ⚠️ Niemals committen!

Die `.env` Datei darf **NIEMALS** in Git landen!

Prüfe `.gitignore`:
```gitignore
# Environment
.env
.env.*
.env.local
.env.production
```

### 🔐 Secrets nutzen

Für sensible Daten in Cloudflare **immer** Secrets verwenden:
```bash
npx wrangler secret put EMAIL_PASS
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GOOGLE_REFRESH_TOKEN
```

### 🔄 Regelmäßig rotieren

**Email-Passwörter:**
- Alle 6 Monate
- Nach Sicherheitsvorfällen
- Bei Teammitglied-Wechsel

**OAuth-Tokens:**
- Alle 12 Monate
- Nach verdächtiger Aktivität

### 📝 Dokumentieren

Halte fest wo Credentials gespeichert sind:
- Passwort-Manager
- Cloudflare Dashboard
- Team-Dokumentation

---

## 🆘 Troubleshooting

### Email wird nicht versendet

**Prüfe:**
1. Sind alle `EMAIL_*` Variablen gesetzt?
2. Ist `EMAIL_PASS` ein App-Passwort (Gmail)?
3. Ist Port `587` korrekt?
4. Check Console-Logs für Fehler

**Test:**
```bash
# Im Terminal
npm run dev

# Im Browser Console (F12)
# Schaue nach Fehlern beim Test-Email-Versand
```

### Links in Emails sind falsch

**Prüfe:**
1. Ist `ADMIN_BASE_URL` korrekt?
2. Hat URL trailing slash? (Sollte NICHT!)
3. Entspricht URL der Production-Umgebung?

### Google Calendar Events werden nicht erstellt

**Prüfe:**
1. Sind alle `GOOGLE_*` Variablen gesetzt?
2. Ist `GOOGLE_REFRESH_TOKEN` noch gültig?
3. Sind Permissions in Google Cloud richtig?

**Testen:**
```bash
# API-Route direkt aufrufen
curl http://localhost:4321/api/admin/calendar-status
```

Mehr Lösungen: [52-TROUBLESHOOTING.md](52-TROUBLESHOOTING.md)

---

## 📚 Weiterführende Dokumentation

- **Setup:** [02-SETUP.md](02-SETUP.md)
- **Google Calendar:** [33-GOOGLE-CALENDAR.md](33-GOOGLE-CALENDAR.md)
- **Email System:** [34-EMAIL-SYSTEM.md](34-EMAIL-SYSTEM.md)
- **Deployment:** [04-DEPLOYMENT.md](04-DEPLOYMENT.md)

---

**Zurück zu:** [02-SETUP.md](02-SETUP.md) | **Weiter zu:** [04-DEPLOYMENT.md](04-DEPLOYMENT.md)
