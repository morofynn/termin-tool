# 🚀 Deployment Guide

Vollständige Anleitung zum Deployment auf Cloudflare Workers.

---

## 📋 Voraussetzungen

Bevor du deployst, stelle sicher:

- ✅ Lokale Entwicklung läuft einwandfrei
- ✅ Alle Tests erfolgreich
- ✅ Environment-Variablen dokumentiert
- ✅ Cloudflare Account vorhanden
- ✅ Wrangler CLI installiert

---

## 🔧 Schritt 1: Wrangler einrichten

### Wrangler installieren (falls noch nicht vorhanden)

```bash
npm install -g wrangler

# Oder lokal im Projekt
npm install wrangler --save-dev
```

### Bei Cloudflare anmelden

```bash
npx wrangler login
```

Dies öffnet einen Browser → Authorisiere die App.

---

## 🗄️ Schritt 2: KV Namespaces erstellen

### Production Namespace

```bash
npx wrangler kv:namespace create APPOINTMENTS_KV
```

**Ausgabe:**
```
✅ Created namespace APPOINTMENTS_KV
  id: abc123def456...
```

Kopiere die `id`!

### Preview Namespace (für Staging)

```bash
npx wrangler kv:namespace create APPOINTMENTS_KV --preview
```

**Ausgabe:**
```
✅ Created namespace APPOINTMENTS_KV (preview)
  preview_id: xyz789uvw012...
```

Kopiere die `preview_id`!

### IDs in wrangler.jsonc eintragen

Öffne `wrangler.jsonc` und füge ein:

```jsonc
{
  "name": "appointment-tool",
  "main": "dist/_worker.js",
  "compatibility_date": "2024-11-01",
  
  "kv_namespaces": [
    {
      "binding": "APPOINTMENTS_KV",
      "id": "abc123def456...",        // Deine Production ID
      "preview_id": "xyz789uvw012..."  // Deine Preview ID
    }
  ]
}
```

---

## 🔐 Schritt 3: Environment-Variablen setzen

### Methode 1: Via Wrangler CLI (Empfohlen)

```bash
# Email-Konfiguration
npx wrangler secret put EMAIL_HOST
# Eingeben: smtp.gmail.com

npx wrangler secret put EMAIL_PORT
# Eingeben: 587

npx wrangler secret put EMAIL_USER
# Eingeben: deine-email@gmail.com

npx wrangler secret put EMAIL_PASS
# Eingeben: dein-app-passwort

npx wrangler secret put ADMIN_EMAIL
# Eingeben: admin@yourdomain.com

# Admin Base URL (WICHTIG!)
npx wrangler secret put ADMIN_BASE_URL
# Eingeben: https://appointment-tool.yourdomain.workers.dev
# (OHNE trailing slash!)

# Optional: Google Calendar
npx wrangler secret put GOOGLE_CLIENT_ID
npx wrangler secret put GOOGLE_CLIENT_SECRET
npx wrangler secret put GOOGLE_REFRESH_TOKEN
npx wrangler secret put GOOGLE_CALENDAR_ID
```

### Methode 2: Via Cloudflare Dashboard

1. Gehe zu [Cloudflare Dashboard](https://dash.cloudflare.com)
2. **Workers & Pages**
3. Wähle deinen Worker (oder erstelle neuen)
4. **Settings** → **Variables**
5. Klicke **"Add variable"**

**Als "Secret" markieren:**
- `EMAIL_PASS`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`

**Als "Environment Variable":**
- Alle anderen (nicht sensitiven) Variablen

---

## 📦 Schritt 4: Build & Deploy

### Production Build erstellen

```bash
npm run build
```

Dies erstellt:
- `dist/` - Compiled Astro App
- `dist/_worker.js` - Cloudflare Worker Entry Point

### Deployen

```bash
npx wrangler deploy
```

**Erfolgreiche Ausgabe:**
```
⛅️ wrangler 3.x.x
---
Total Upload: XX.XX KiB / gzip: XX.XX KiB
Uploaded appointment-tool (1.23 sec)
Published appointment-tool (1.45 sec)
  https://appointment-tool.yourdomain.workers.dev
```

✅ **Deine App ist jetzt live!**

---

## 🌐 Schritt 5: Custom Domain einrichten (Optional)

### Via Wrangler

```bash
npx wrangler domains add booking.yourdomain.com
```

### Via Dashboard

1. **Workers & Pages** → Dein Worker
2. **Settings** → **Domains & Routes**
3. **Add Custom Domain**
4. Domain eingeben: `booking.yourdomain.com`
5. DNS-Records wie angezeigt konfigurieren

**Cloudflare DNS:**
```
Type: CNAME
Name: booking
Target: appointment-tool.yourdomain.workers.dev
Proxy: ON (orange cloud)
```

---

## ✅ Schritt 6: Deployment testen

### 1. Öffne die Worker-URL

```
https://appointment-tool.yourdomain.workers.dev
```

✅ **Erwartetes Ergebnis:**
- Terminbuchungs-Interface lädt
- Keine Console-Errors
- Zeitslots werden angezeigt

### 2. Teste Buchungsflow

1. Wähle Tag & Zeit
2. Fülle Formular aus
3. Klicke "Buchen"

✅ **Erwartetes Ergebnis:**
- Erfolgsmeldung
- Email an Kunde & Admin
- Termin im Admin-Panel sichtbar

### 3. Teste Admin-Panel

```
https://appointment-tool.yourdomain.workers.dev/admin
```

✅ **Erwartetes Ergebnis:**
- Dashboard lädt
- Termin aus vorherigem Test sichtbar
- Alle Tabs funktionieren

### 4. Teste Google Calendar (falls konfiguriert)

Admin-Panel → **Google Calendar** → "Status prüfen"

✅ **Erwartetes Ergebnis:**
- Status: "Verbunden" (grün)
- Neuer Termin erstellt automatisch Calendar-Event

### 5. Teste Email-Benachrichtigungen

Admin-Panel → **Einstellungen** → "Test-E-Mail senden"

✅ **Erwartetes Ergebnis:**
- Toast-Meldung "Test-Email versendet"
- Email kommt innerhalb 30 Sekunden an

---

## 🔄 Updates deployen

### Standard Update

```bash
# 1. Code ändern
# 2. Build erstellen
npm run build

# 3. Deployen
npx wrangler deploy
```

### Mit Preview-Umgebung

```bash
# Preview deployen (ohne Production zu beeinflussen)
npx wrangler deploy --env preview

# Testen auf:
# https://preview.appointment-tool.yourdomain.workers.dev

# Wenn OK: Production deployen
npx wrangler deploy
```

---

## 📊 Monitoring & Logs

### Live-Logs anzeigen

```bash
npx wrangler tail
```

**Ausgabe:**
```
GET https://appointment-tool.yourdomain.workers.dev/
  Status: 200
  Duration: 45ms
```

### Logs im Dashboard

1. **Workers & Pages** → Dein Worker
2. **Logs** Tab
3. Zeitraum wählen
4. Fehler filtern

### Analytics

1. **Workers & Pages** → Dein Worker
2. **Analytics** Tab

**Metriken:**
- Requests/Stunde
- Fehlerrate
- CPU-Zeit
- KV-Zugriffe

---

## 🐛 Troubleshooting

### Fehler: KV Namespace nicht gefunden

```
Error: KV namespace APPOINTMENTS_KV not available
```

**Lösung:**
1. Prüfe `wrangler.jsonc` → IDs korrekt?
2. Liste KV Namespaces:
   ```bash
   npx wrangler kv:namespace list
   ```
3. Erstelle neu falls nötig:
   ```bash
   npx wrangler kv:namespace create APPOINTMENTS_KV
   ```

---

### Fehler: Environment-Variable fehlt

```
Error: EMAIL_HOST is not defined
```

**Lösung:**
```bash
# Liste alle Secrets
npx wrangler secret list

# Setze fehlende Variable
npx wrangler secret put EMAIL_HOST
```

---

### Fehler: Build schlägt fehl

```
Error: Build failed with X errors
```

**Lösung:**
```bash
# Cache löschen
rm -rf node_modules dist .astro

# Neu installieren
npm install

# Build versuchen
npm run build

# Type-Check
npx astro check
```

---

### 502 Bad Gateway

**Mögliche Ursachen:**
- Worker wirft unbehandelten Fehler
- KV Namespace falsch konfiguriert
- Environment-Variablen fehlen

**Lösung:**
```bash
# Live-Logs prüfen
npx wrangler tail

# Lokal testen
npm run preview

# Dashboard-Logs prüfen
```

---

### Email wird nicht versendet

**Prüfe:**
1. Sind `EMAIL_*` Variablen korrekt gesetzt?
   ```bash
   npx wrangler secret list
   ```
2. Ist `EMAIL_PASS` ein App-Passwort (Gmail)?
3. Check Live-Logs:
   ```bash
   npx wrangler tail
   ```

---

### Admin-Panel lädt nicht

**Prüfe:**
1. Route existiert: `https://deine-url/admin`
2. Console-Fehler im Browser (F12)
3. Live-Logs:
   ```bash
   npx wrangler tail
   ```

---

## 🔒 Sicherheits-Checkliste

Vor Production-Launch:

- [ ] Alle Secrets als "Secret" markiert (nicht als env var)
- [ ] `.env` ist **nicht** in Git committed
- [ ] `ADMIN_BASE_URL` korrekt gesetzt (ohne trailing slash)
- [ ] Email-Credentials getestet
- [ ] Rate-Limiting aktiv (Standard: 100 req/min/IP)
- [ ] Google Calendar Permissions korrekt
- [ ] Custom Domain nutzt HTTPS
- [ ] Audit-Log aktiviert
- [ ] Backup-Strategie vorhanden (KV-Daten)

---

## 🔄 Rollback durchführen

Falls ein Deployment Probleme verursacht:

### Via Wrangler

```bash
# Liste aller Deployments
npx wrangler deployments list

# Ausgabe:
# 2025-01-15 10:30:00 - abc123... (current)
# 2025-01-14 15:20:00 - def456...
# 2025-01-13 12:10:00 - ghi789...

# Rollback zur vorherigen Version
npx wrangler rollback
```

### Via Dashboard

1. **Workers & Pages** → Dein Worker
2. **Deployments** Tab
3. Finde funktionierende Version
4. Klicke **"Rollback"**

---

## 📈 Performance-Optimierungen

### 1. KV-Caching

Das System nutzt bereits optimierte KV-Zugriffe:
- O(1) Slot-Lookups
- Batch-Reads wo möglich
- Minimale Write-Operationen

### 2. CDN für Assets

Statische Assets (CSS, JS, Images) werden automatisch über Cloudflare CDN gecached.

### 3. Edge Computing

Worker läuft an 300+ Edge-Locations weltweit → Niedrige Latenz!

### 4. Bundle-Size überwachen

```bash
# Bundle-Größe prüfen
npm run build
# Schau nach: dist/_worker.js Size

# Sollte < 1MB sein
```

---

## 📦 Backup-Strategie

### KV-Daten exportieren

```bash
# Alle Keys listen
npx wrangler kv:key list --namespace-id abc123def456

# Einzelnen Wert lesen
npx wrangler kv:key get "appointments:2026-01-16:10:00" --namespace-id abc123def456

# Bulk-Export (Script)
npx wrangler kv:bulk get appointments_backup.json --namespace-id abc123def456
```

### Automatisches Backup

Erstelle Cron-Job für regelmäßige Backups:

```bash
# backup.sh
#!/bin/bash
DATE=$(date +%Y-%m-%d)
npx wrangler kv:bulk get "backups/appointments_$DATE.json" --namespace-id abc123def456
```

---

## 🌍 Multi-Region Deployment

Cloudflare Workers laufen automatisch in allen Regionen!

**Keine extra Konfiguration nötig** ✅

Traffic wird automatisch zum nächsten Edge-Server geroutet.

---

## 📚 Weiterführende Dokumentation

- **Environment-Variablen:** [03-ENVIRONMENT.md](03-ENVIRONMENT.md)
- **iFrame-Integration:** [20-IFRAME-INTEGRATION.md](20-IFRAME-INTEGRATION.md)
- **API-Referenz:** [22-API-REFERENCE.md](22-API-REFERENCE.md)
- **Troubleshooting:** [52-TROUBLESHOOTING.md](52-TROUBLESHOOTING.md)

---

## 🎉 Deployment erfolgreich!

Dein Terminbuchungssystem läuft jetzt in der Cloud! 🚀

**Nächste Schritte:**
1. Monitoring einrichten
2. Backup-Strategie implementieren
3. In Website einbetten
4. Performance überwachen

---

**Zurück zu:** [03-ENVIRONMENT.md](03-ENVIRONMENT.md) | **Weiter zu:** [20-IFRAME-INTEGRATION.md](20-IFRAME-INTEGRATION.md)
