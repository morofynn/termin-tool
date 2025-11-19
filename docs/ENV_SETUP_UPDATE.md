# 🔧 Environment Variable Update

## Neue Variable: ADMIN_BASE_URL

Füge folgende Zeilen zu deiner `.env` Datei hinzu:

```bash
# Base URLs für Links in E-Mails, ICS-Dateien und Google Calendar
# WICHTIG: Ohne trailing slash!
# Beispiel: https://opti-termin.webflow.io/master
#
# ADMIN_BASE_URL: Wird für alle öffentlichen Links verwendet (Termine, Admin-Panel)
# Wenn nicht gesetzt, wird automatisch die Worker-URL verwendet (weniger schön)
ADMIN_BASE_URL=""
```

## Setup Anleitung

### 1. Finde deine Webflow App URL

Deine App läuft unter einer URL wie:
```
https://opti-termin.webflow.io/master
```

### 2. Trage die URL ein (OHNE trailing slash!)

```bash
# ✅ RICHTIG
ADMIN_BASE_URL="https://opti-termin.webflow.io/master"

# ❌ FALSCH (trailing slash)
ADMIN_BASE_URL="https://opti-termin.webflow.io/master/"
```

### 3. Setze auch in Cloudflare Dashboard

Gehe zu:
1. Cloudflare Dashboard
2. Workers & Pages
3. Dein Worker
4. Settings → Environment Variables
5. Füge hinzu:
   - **Name:** `ADMIN_BASE_URL`
   - **Value:** `https://opti-termin.webflow.io/master`

### 4. Teste die Konfiguration

```bash
# Sende Test-E-Mail
curl -X POST https://your-domain/api/admin/test-email \
  -H "Content-Type: application/json" \
  -d '{"emailType": "confirmed"}'

# Prüfe die URL in der E-Mail:
# ✅ Sollte sein: https://opti-termin.webflow.io/master/termin/test-123
# ❌ Nicht:      https://worker-id.wf-app-prod.cosmic.webflow.services/termin/test-123
```

## Was wird geändert?

### Vorher (ohne ADMIN_BASE_URL)
```
E-Mail Link: https://3b6e870e-6908-4e0d-85e1-8e465f8edc70.wf-app-prod.cosmic.webflow.services/termin/apt_123
ICS Datei:   https://3b6e870e-6908-4e0d-85e1-8e465f8edc70.wf-app-prod.cosmic.webflow.services/termin/apt_123
Google Cal:  https://3b6e870e-6908-4e0d-85e1-8e465f8edc70.wf-app-prod.cosmic.webflow.services/termin/apt_123
```

### Nachher (mit ADMIN_BASE_URL)
```
E-Mail Link: https://opti-termin.webflow.io/master/termin/apt_123
ICS Datei:   https://opti-termin.webflow.io/master/termin/apt_123
Google Cal:  https://opti-termin.webflow.io/master/termin/apt_123
```

## Wo werden die URLs verwendet?

✅ **E-Mail Templates**
- Bestätigungsmails
- Stornierungsbestätigungen
- Erinnerungsmails
- Admin-Benachrichtigungen

✅ **ICS Kalender-Dateien**
- Anhang in E-Mails
- "In Kalender eintragen" Button

✅ **Google Calendar Events**
- Event-Beschreibung
- "Termin verwalten" Link

✅ **API Responses**
- Nach Buchung
- Nach Stornierung

## Vollständige .env Datei

```bash
# Webflow API
WEBFLOW_API_HOST="https://api-cdn.webflow.com/v2"
WEBFLOW_SITE_API_TOKEN=""
WEBFLOW_CMS_SITE_API_TOKEN=""

# Google OAuth (für Calendar + Gmail)
GOOGLE_CLIENT_ID=""
GOOGLE_CLIENT_SECRET=""
GOOGLE_REFRESH_TOKEN=""
GOOGLE_CALENDAR_ID=""
GOOGLE_USER_EMAIL=""

# Admin Panel
ADMIN_SECRET_PATH="secure-admin-panel-xyz789"
ADMIN_PASSWORD="MeinSicheresPasswort123!"

# Base URLs (NEU!)
ADMIN_BASE_URL="https://opti-termin.webflow.io/master"
```

## Troubleshooting

### Problem: URLs sind immer noch Worker-URLs

**Lösung:**
1. Prüfe dass `ADMIN_BASE_URL` gesetzt ist
2. Prüfe dass KEIN trailing slash vorhanden ist
3. Deploye den Worker neu
4. Teste mit neuer Buchung

### Problem: 404 Fehler bei Termin-Links

**Lösung:**
1. Prüfe dass die Base URL korrekt ist
2. Stelle sicher dass deine App unter dieser URL läuft
3. Teste die URL im Browser: `https://deine-url/master/termin/test-123`

### Problem: E-Mails kommen nicht an

**Ursache:** Dies ist ein anderes Problem (Google OAuth)
**Lösung:** Siehe `docs/GOOGLE_CALENDAR_SETUP.md`

## Support

Bei Fragen:
1. Prüfe System Status im Admin-Panel
2. Schaue in Browser Console (F12)
3. Prüfe Cloudflare Logs
