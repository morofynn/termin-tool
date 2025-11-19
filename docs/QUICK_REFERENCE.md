# 🚀 Quick Reference - URL Generierung

## Setup in 3 Schritten

### 1. Environment Variable setzen

```bash
# In .env Datei
ADMIN_BASE_URL="https://opti-termin.webflow.io/master"
```

**Wichtig:** Kein trailing slash!

### 2. Cloudflare konfigurieren

1. Cloudflare Dashboard öffnen
2. Workers & Pages → Dein Worker
3. Settings → Environment Variables
4. Hinzufügen:
   - **Name:** `ADMIN_BASE_URL`
   - **Value:** `https://opti-termin.webflow.io/master`

### 3. Testen

```bash
# Test-E-Mail senden
curl -X POST https://your-domain/api/admin/test-email \
  -H "Content-Type: application/json" \
  -d '{"emailType": "confirmed"}'
```

Prüfe die URL in der E-Mail!

---

## Code Verwendung

```typescript
import { getAppointmentUrl } from '../../lib/url-utils';

// In API Route:
const appointmentUrl = getAppointmentUrl(
  appointmentId,           // z.B. 'apt_123'
  locals?.runtime?.env,    // Environment
  url.origin              // Fallback
);
// → https://opti-termin.webflow.io/master/termin/apt_123
```

---

## Wo wird es verwendet?

- ✅ Buchungsbestätigungen
- ✅ Stornierungsbestätigungen
- ✅ Erinnerungs-E-Mails
- ✅ Admin-Benachrichtigungen
- ✅ ICS-Kalender-Dateien
- ✅ Google Calendar Events
- ✅ Test-E-Mails

---

## Troubleshooting

### URLs sind immer noch Worker-URLs

```bash
# Prüfe Environment Variable
echo $ADMIN_BASE_URL

# Prüfe Cloudflare Dashboard
# → Settings → Environment Variables

# Deploy neu
npm run build
wrangler deploy
```

### 404 Fehler bei Links

```bash
# Prüfe Base URL (ohne trailing slash!)
ADMIN_BASE_URL="https://opti-termin.webflow.io/master"  ✅
ADMIN_BASE_URL="https://opti-termin.webflow.io/master/" ❌

# Teste URL direkt im Browser
https://opti-termin.webflow.io/master/termin/test-123
```

---

## Weitere Dokumentation

- **Vollständig:** [URL_GENERATION_MIGRATION.md](./URL_GENERATION_MIGRATION.md)
- **Setup:** [ENV_SETUP_UPDATE.md](./ENV_SETUP_UPDATE.md)
- **Admin-Panel:** [ADMIN_BASE_URL_SETUP.md](./ADMIN_BASE_URL_SETUP.md)
