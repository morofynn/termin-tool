# 🔧 Troubleshooting Guide

Häufige Probleme und ihre Lösungen.

---

## 📧 Email-Probleme

### Email wird nicht versendet

**Symptome:**
- Keine Email kommt an
- Toast-Meldung "Fehler beim Senden"
- Console-Error: "Email failed"

**Lösungen:**

1. **Prüfe Environment-Variablen:**
   ```bash
   # In .env
   EMAIL_HOST=smtp.gmail.com
   EMAIL_PORT=587
   EMAIL_USER=deine-email@gmail.com
   EMAIL_PASS=dein-app-passwort  # NICHT normales Passwort!
   ADMIN_EMAIL=admin@example.com
   ```

2. **Gmail: App-Passwort prüfen:**
   - Gehe zu [Google App-Passwörter](https://myaccount.google.com/apppasswords)
   - Erstelle neues Passwort für "Mail"
   - Kopiere in `EMAIL_PASS` (ohne Leerzeichen!)

3. **Test-Email senden:**
   - Admin-Panel → Einstellungen → "Test-E-Mail senden"
   - Prüfe Console-Logs:
     ```bash
     npm run dev
     # Schau nach Email-Errors
     ```

4. **SMTP-Port prüfen:**
   ```env
   EMAIL_PORT=587  # TLS (empfohlen)
   # Oder:
   EMAIL_PORT=465  # SSL
   ```

5. **Firewall/Netzwerk:**
   - Prüfe ob Port 587/465 offen ist
   - Teste mit `telnet smtp.gmail.com 587`

---

### "Invalid Date" in Emails

**Symptom:** Email enthält "Invalid Date" statt korrektem Datum

**Lösung:**
```typescript
// Stelle sicher dass Datum als ISO-String vorliegt
const date = new Date('2026-01-16T10:00:00');
console.log(date.toISOString()); // Sollte valide sein
```

Prüfe in `src/lib/date-utils.ts`:
- `parseToDate()` wird verwendet
- `isValidDate()` returned true

---

### ICS-Anhang fehlt/kaputt

**Symptom:** Kalender-Datei kann nicht importiert werden

**Lösung:**
1. Prüfe dass `ical-generator` korrekt installiert ist
2. Prüfe dass ICS-Content Base64-encodiert ist
3. Prüfe Email-Logs für Encoding-Fehler

---

## 🗄️ KV Store Probleme

### "KV namespace not available"

**Development:**
```bash
# KV läuft in-memory - kein Setup nötig!
# Falls Fehler: Server neu starten
npm run dev
```

**Production:**
```bash
# Prüfe ob KV Namespace existiert
npx wrangler kv:namespace list

# Erstelle falls fehlt
npx wrangler kv:namespace create APPOINTMENTS_KV

# Prüfe wrangler.jsonc
cat wrangler.jsonc
# Sollte "kv_namespaces" mit korrekten IDs enthalten
```

---

### Termine verschwinden nach Server-Restart

**Development:**
- Normal! In-Memory KV wird beim Restart geleert
- Für persistente Daten: Nutze Preview-Namespace
  ```bash
  npx wrangler dev --remote
  ```

**Production:**
- Sollte nicht passieren
- Prüfe ob KV-Namespace korrekt konfiguriert
- Prüfe Cloudflare Dashboard → Workers → KV

---

### Slot wird nicht als "vergeben" markiert

**Symptom:** Mehrfache Buchungen möglich

**Ursache:** Race Condition

**Lösung:** Bereits gefixt in v2.0!
- Slot wird WÄHREND der Buchung reserviert
- Bei Fehler: Automatischer Rollback
- Prüfe Code in `src/pages/api/book-appointment.ts`

---

## 📆 Google Calendar Probleme

### Status zeigt "Nicht verbunden"

**Prüfe:**

1. **Environment-Variablen:**
   ```env
   GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com
   GOOGLE_CLIENT_SECRET=xxx
   GOOGLE_REFRESH_TOKEN=xxx
   GOOGLE_CALENDAR_ID=primary
   ```

2. **OAuth-Flow wiederholen:**
   ```bash
   # Öffne
   http://localhost:4321/api/auth/google-authorize
   
   # Folge Schritten
   # Kopiere neuen Refresh-Token
   ```

3. **Permissions prüfen:**
   - Google Cloud Console → APIs & Services
   - Credentials → OAuth 2.0 Client
   - Scopes: `https://www.googleapis.com/auth/calendar`

4. **API aktiviert?**
   - Google Cloud Console → APIs & Services → Library
   - Suche "Google Calendar API"
   - Sollte "Aktiviert" sein

---

### Events werden nicht erstellt

**Symptome:**
- Buchung erfolgreich
- Aber kein Event in Google Calendar

**Lösungen:**

1. **Prüfe Status:**
   - Admin-Panel → Google Calendar → "Status prüfen"

2. **Test-Event erstellen:**
   ```bash
   # API direkt testen
   curl -X POST http://localhost:4321/api/admin/test-calendar
   ```

3. **Logs prüfen:**
   ```bash
   # Development
   npm run dev
   # Schau nach "Google Calendar" errors
   
   # Production
   npx wrangler tail
   ```

4. **Kalender-ID prüfen:**
   ```env
   # Haupt-Kalender
   GOOGLE_CALENDAR_ID=primary
   
   # Oder spezifischer Kalender
   GOOGLE_CALENDAR_ID=bookings@group.calendar.google.com
   ```

---

### Token expired / Refresh failed

**Symptom:** Error "Token has been expired or revoked"

**Lösung:**
1. Revoke Token in [Google Account Settings](https://myaccount.google.com/permissions)
2. OAuth-Flow neu durchführen
3. Neuen Refresh-Token setzen

---

## 🌐 Admin-Panel Probleme

### Admin-Panel lädt nicht

**Symptome:**
- White Screen
- 404 Error
- Console-Errors

**Lösungen:**

1. **Route existiert?**
   ```
   http://localhost:4321/admin
   ```
   Sollte Admin-Panel zeigen

2. **Console-Errors prüfen:**
   - F12 → Console Tab
   - Schaue nach JavaScript-Errors

3. **Build-Fehler?**
   ```bash
   # Type-Check
   npx astro check
   
   # Neu builden
   npm run build
   ```

4. **React-Hydration-Fehler?**
   - Prüfe `src/pages/admin.astro`
   - Stelle sicher `client:only="react"` ist gesetzt

---

### Settings werden nicht gespeichert

**Symptom:** Änderungen gehen verloren nach Reload

**Lösungen:**

1. **Prüfe KV-Store:**
   ```bash
   # Development
   # KV ist in-memory - nach Restart leer!
   
   # Production
   # Sollte persistent sein
   ```

2. **Console-Errors:**
   - Admin-Panel → F12 → Network Tab
   - Klicke "Speichern"
   - Prüfe API-Call `/api/admin/settings`
   - Sollte 200 OK sein

3. **Validierung schlägt fehl:**
   - Prüfe dass Daten im korrekten Format
   - Datümer als `YYYY-MM-DD`
   - Zeiten als `HH:MM`

---

## 🖼️ iFrame Probleme

### iFrame scrollt nicht richtig

**Symptom:** iFrame zeigt Scrollbar, Parent-Page scrollt nicht

**Lösung:**
Nutze korrekten iFrame-Code:
```html
<iframe
  id="appointment-iframe"
  src="https://your-url.com"
  style="width: 100%; border: none; min-height: 600px;"
  scrolling="no"
></iframe>

<script>
window.addEventListener('message', function(event) {
  if (event.data.type === 'resize') {
    document.getElementById('appointment-iframe').style.height = event.data.height + 'px';
  }
});
</script>
```

Siehe [20-IFRAME-INTEGRATION.md](20-IFRAME-INTEGRATION.md)

---

### iFrame-Höhe passt sich nicht an

**Symptom:** Content ist abgeschnitten oder zu viel Whitespace

**Lösungen:**

1. **Parent-Script prüfen:**
   - Lauscht auf `message` Event?
   - Setzt height ohne `Math.max()`?

2. **Console-Logs:**
   ```javascript
   // In Parent-Page
   window.addEventListener('message', function(event) {
     console.log('Received:', event.data);  // Debug
   });
   ```

3. **Test-Seite nutzen:**
   ```html
   <!-- Siehe docs/EINFACH-TESTEN.html -->
   ```

---

## 🚀 Deployment Probleme

### Build schlägt fehl

**Symptome:**
```
Error: Build failed with X errors
```

**Lösungen:**

1. **Type-Check:**
   ```bash
   npx astro check
   ```

2. **Dependencies neu installieren:**
   ```bash
   rm -rf node_modules dist .astro
   npm install
   npm run build
   ```

3. **Node-Version:**
   ```bash
   node --version
   # Sollte >= 18.0.0 sein
   ```

4. **Spezifischer Error:**
   - Lese Error-Message genau
   - Suche nach Datei + Zeile
   - Prüfe TypeScript-Typen

---

### 502 Bad Gateway nach Deploy

**Symptom:** Worker deployed, aber Site zeigt 502

**Ursachen:**

1. **Environment-Variablen fehlen:**
   ```bash
   npx wrangler secret list
   # Sollte alle erforderlichen Variablen zeigen
   ```

2. **KV-Namespace fehlt:**
   ```bash
   npx wrangler kv:namespace list
   # Sollte dein Namespace zeigen
   ```

3. **Worker wirft Error:**
   ```bash
   npx wrangler tail
   # Schaue nach Errors beim Request
   ```

4. **wrangler.jsonc falsch:**
   ```jsonc
   {
     "kv_namespaces": [
       {
         "binding": "APPOINTMENTS_KV",
         "id": "...",  // Korrekte ID?
         "preview_id": "..."
       }
     ]
   }
   ```

---

### Custom Domain funktioniert nicht

**Symptom:** Domain zeigt 522/523 Error

**Lösungen:**

1. **DNS-Records prüfen:**
   ```
   Type: CNAME
   Name: booking (oder @)
   Target: your-worker.workers.dev
   Proxy: ON (orange cloud)
   ```

2. **SSL/TLS:**
   - Cloudflare Dashboard → SSL/TLS
   - Sollte "Full" oder "Full (strict)" sein

3. **Worker-Route:**
   - Dashboard → Workers → Routes
   - Sollte `booking.yourdomain.com/*` → Your Worker

---

## ⚡ Performance Probleme

### Langsame Buchung (> 3 Sekunden)

**Symptome:**
- Ladekreisel dreht lange
- "Bitte warten..." länger als 3 Sekunden

**Lösungen:**

1. **Google Calendar deaktivieren:**
   ```env
   # Temporär entfernen
   # GOOGLE_CLIENT_ID=...
   ```
   Wenn schneller → Google Calendar ist langsam

2. **Email-Versand:**
   - Teste ohne Email
   - Wenn schneller → SMTP-Server langsam

3. **KV-Store:**
   ```bash
   # Prüfe KV-Response-Zeit
   npx wrangler tail
   # Sollte < 50ms sein
   ```

4. **Network:**
   - Browser DevTools → Network Tab
   - Schaue nach langsamen Requests

---

### Admin-Panel lädt langsam

**Lösungen:**

1. **Zu viele Termine?**
   - Admin-Panel lädt ALLE Termine
   - Bei > 1000 Terminen: Implementiere Pagination

2. **Audit-Log zu groß?**
   - Implementiere Cleanup-Job
   - Lösche alte Logs

3. **KV-Queries optimieren:**
   - Nutze `list()` mit Limit
   - Cache Daten client-side

---

## 🔒 Sicherheitsprobleme

### Rate Limit zu streng

**Symptom:** "Too many requests" obwohl nur normale Nutzung

**Lösung:**
Anpassen in `src/lib/rate-limit.ts`:
```typescript
// Standard: 100 req/min
// Erhöhen auf z.B. 200
const limit = 200;
```

---

### CORS Errors im iFrame

**Symptom:** "Blocked by CORS policy"

**Lösung:**
iFrame braucht KEINE CORS-Config (same-origin)!

Wenn Cross-Origin:
```typescript
// In API-Route
return new Response(JSON.stringify(data), {
  headers: {
    'Access-Control-Allow-Origin': '*',
    'Content-Type': 'application/json'
  }
});
```

---

## 🆘 Weitere Hilfe

### Debug-Mode aktivieren

```env
# In .env
DEBUG=true
LOG_LEVEL=debug
```

### Logs sammeln

**Development:**
```bash
npm run dev > debug.log 2>&1
```

**Production:**
```bash
npx wrangler tail > production.log
```

### Support kontaktieren

1. **Prüfe erst:**
   - Alle Lösungen in diesem Guide
   - [Testing-Guide](40-TESTING-GUIDE.md)
   - [FAQ](51-FINAL-ANALYSIS.md)

2. **Info sammeln:**
   - Fehlermeldung (exakt)
   - Browser + Version
   - Environment (Dev/Prod)
   - Reproduction Steps

3. **Kontakt:**
   - GitHub Issues: [Link]
   - Email: support@example.com
   - Community: [Link]

---

**Letzte Aktualisierung:** 24. November 2025  
**Für Version:** 2.0.0+
