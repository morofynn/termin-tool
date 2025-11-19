# 🚀 Deployment-Guide

Schritt-für-Schritt-Anleitung für das Deployment der MORO Terminbuchungs-App auf Cloudflare Workers.

## 📋 Voraussetzungen

- Node.js 18+ installiert
- npm oder yarn installiert
- Cloudflare-Account (kostenlos)
- Resend-Account (kostenlos für 100 E-Mails/Tag)

## 1️⃣ Projekt-Setup

### Repository klonen
```bash
git clone <repository-url>
cd <project-folder>
npm install
```

### Umgebungsvariablen konfigurieren

Erstelle eine `.env` Datei im Projektroot:

```env
# Resend API Key (https://resend.com/api-keys)
RESEND_API_KEY=re_xxxxxxxxxxxxx

# Admin-Zugangsdaten
ADMIN_PASSWORD=dein-sicheres-passwort-hier
ADMIN_SESSION_SECRET=ein-zufälliger-secret-key-mindestens-32-zeichen

# Optional: Webflow CMS
WEBFLOW_CMS_SITE_API_TOKEN=xxxxxxxxxxxxx
WEBFLOW_API_HOST=https://api.webflow.com
```

**Wichtig**: 
- `ADMIN_PASSWORD`: Mindestens 12 Zeichen, Groß-/Kleinbuchstaben, Zahlen
- `ADMIN_SESSION_SECRET`: Zufälliger String, min. 32 Zeichen (z.B. generiert mit `openssl rand -base64 32`)

## 2️⃣ Resend E-Mail Setup

### Account erstellen
1. Gehe zu [resend.com](https://resend.com)
2. Erstelle einen kostenlosen Account
3. Verifiziere deine E-Mail-Adresse

### API Key generieren
1. Dashboard → **API Keys**
2. **Create API Key**
3. Name: "MORO Booking App"
4. Permission: **Sending access**
5. Kopiere den Key → `.env` als `RESEND_API_KEY`

### Sender-Domain verifizieren (optional, aber empfohlen)

**Mit eigener Domain**:
1. Dashboard → **Domains**
2. **Add Domain**
3. Domain eingeben (z.B. `mg.moro.de`)
4. DNS-Records hinzufügen (SPF, DKIM, DMARC)
5. Warten auf Verifizierung (~15 Min)

**Ohne eigene Domain**:
- Nutze die Test-Domain: `onboarding@resend.dev`
- Limit: 100 E-Mails/Tag
- E-Mails können im Spam landen

## 3️⃣ Cloudflare Workers Setup

### Wrangler CLI installieren (falls noch nicht vorhanden)
```bash
npm install -g wrangler
```

### Cloudflare Login
```bash
wrangler login
```
→ Browser öffnet sich → Mit Cloudflare-Account anmelden

### KV-Namespaces erstellen

Das Projekt benötigt 3 KV-Namespaces:

```bash
# Production
wrangler kv:namespace create APPOINTMENTS
wrangler kv:namespace create SETTINGS
wrangler kv:namespace create AUDIT_LOG

# Preview (für Entwicklung)
wrangler kv:namespace create APPOINTMENTS --preview
wrangler kv:namespace create SETTINGS --preview
wrangler kv:namespace create AUDIT_LOG --preview
```

Die Commands geben IDs zurück. Notiere diese!

### wrangler.jsonc konfigurieren

Öffne `wrangler.jsonc` und ersetze die Placeholder-IDs:

```jsonc
{
  "name": "moro-booking-app",
  "compatibility_date": "2024-11-01",
  "pages_build_output_dir": "./dist",
  "kv_namespaces": [
    { 
      "binding": "APPOINTMENTS", 
      "id": "DEINE_APPOINTMENTS_ID",
      "preview_id": "DEINE_APPOINTMENTS_PREVIEW_ID"
    },
    { 
      "binding": "SETTINGS", 
      "id": "DEINE_SETTINGS_ID",
      "preview_id": "DEINE_SETTINGS_PREVIEW_ID"
    },
    { 
      "binding": "AUDIT_LOG", 
      "id": "DEINE_AUDIT_LOG_ID",
      "preview_id": "DEINE_AUDIT_LOG_PREVIEW_ID"
    }
  ],
  "durable_objects": {
    "bindings": [
      {
        "name": "SESSION",
        "class_name": "Session",
        "script_name": "moro-booking-app"
      }
    ]
  }
}
```

## 4️⃣ Secrets konfigurieren

Secrets sind sensible Daten, die NICHT in Git committed werden:

```bash
# Resend API Key
wrangler secret put RESEND_API_KEY
# Wenn prompt erscheint: Key eingeben und Enter

# Admin-Passwort
wrangler secret put ADMIN_PASSWORD
# Passwort eingeben und Enter

# Admin Session Secret
wrangler secret put ADMIN_SESSION_SECRET
# Secret eingeben und Enter
```

Für Webflow (optional):
```bash
wrangler secret put WEBFLOW_CMS_SITE_API_TOKEN
wrangler secret put WEBFLOW_API_HOST
```

## 5️⃣ Build & Deploy

### Projekt bauen
```bash
npm run build
```

**Erfolg**: Sollte ohne Fehler durchlaufen und `dist/` Ordner erstellen

### Deployment
```bash
wrangler deploy
```

**Erfolg**: Am Ende siehst du die URL deiner App:
```
Published moro-booking-app
  https://moro-booking-app.<dein-subdomain>.workers.dev
```

## 6️⃣ Erste Schritte nach Deployment

### Admin-Panel testen
1. Öffne: `https://deine-app-url.workers.dev/secure-admin-panel-xyz789`
2. Logge dich mit `ADMIN_PASSWORD` ein
3. Prüfe alle Tabs (Termine, Stundenplan, Einstellungen, etc.)

### Event-Konfiguration
1. Admin → **Einstellungen**
2. **Event-Jahr** setzen (z.B. 2026)
3. **Startdatum (Freitag)** des Events eingeben
4. **Firmeninformationen** anpassen (Name, E-Mail, Telefon, Adresse)
5. **Speichern**

### Test-Buchung durchführen
1. Hauptseite öffnen: `https://deine-app-url.workers.dev`
2. Tag und Zeit auswählen
3. Formular ausfüllen (echte E-Mail!)
4. Absenden
5. **Prüfen**:
   - E-Mail erhalten?
   - Termin im Admin sichtbar?
   - Audit-Log Eintrag vorhanden?

### E-Mail-Templates anpassen
1. Admin → **Einstellungen** → **E-Mail-Templates**
2. Betreff und Texte anpassen
3. Platzhalter verwenden: `{name}`, `{date}`, `{time}`, etc.
4. **Speichern** → **Test senden**

## 7️⃣ Custom Domain (optional)

### Cloudflare Dashboard
1. Workers & Pages → Deine App → **Custom Domains**
2. **Add Custom Domain**
3. Domain eingeben (z.B. `booking.moro.de`)
4. DNS-Records werden automatisch erstellt (wenn Domain bei Cloudflare)
5. Warte auf SSL-Zertifikat (~15 Min)

### Externe Domain
Falls Domain nicht bei Cloudflare:
1. Erstelle CNAME bei deinem DNS-Provider:
   ```
   booking.moro.de → moro-booking-app.<subdomain>.workers.dev
   ```
2. Füge Domain in Cloudflare hinzu
3. Warte auf Verifizierung

## 8️⃣ Monitoring & Wartung

### Logs anzeigen
```bash
wrangler tail
```
→ Zeigt Live-Logs der Worker-Instanz

### Metriken
- Cloudflare Dashboard → Workers & Pages → Deine App
- **Analytics**: Requests, Errors, Execution Time
- **Logs**: Fehler und Console-Logs

### KV-Storage prüfen
```bash
# Alle Keys anzeigen
wrangler kv:key list --namespace-id=DEINE_APPOINTMENTS_ID

# Wert abrufen
wrangler kv:key get "appointments:2026-01-16" --namespace-id=DEINE_APPOINTMENTS_ID
```

### Datenbank-Backup

**Wichtig**: Regelmäßige Backups der KV-Daten!

```bash
# Alle Termine exportieren
wrangler kv:key list --namespace-id=DEINE_APPOINTMENTS_ID > backup_keys.json

# Einzelne Termine sichern
for key in $(cat backup_keys.json | jq -r '.[].name'); do
  wrangler kv:key get "$key" --namespace-id=DEINE_APPOINTMENTS_ID > "backup_$key.json"
done
```

## 9️⃣ Troubleshooting

### "Build failed"
```bash
rm -rf node_modules package-lock.json dist
npm install
npm run build
```

### "KV namespace not found"
→ IDs in `wrangler.jsonc` prüfen
→ Namespaces neu erstellen falls nötig

### "Email not sent"
→ Resend API Key prüfen: `wrangler secret list`
→ Resend Dashboard: Rate Limits prüfen
→ E-Mail-Adresse verifiziert?

### "Admin login not working"
→ Secret prüfen: `wrangler secret list`
→ Secret neu setzen: `wrangler secret put ADMIN_PASSWORD`

### "App shows white screen"
→ Browser Console öffnen (F12)
→ Fehler lesen und beheben
→ Wrangler logs prüfen: `wrangler tail`

## 🔄 Updates deployen

Bei Code-Änderungen:

```bash
npm run build
wrangler deploy
```

**Hinweis**: Secrets und KV-Daten bleiben erhalten!

## 📊 Kosten

### Cloudflare Workers (Free Tier)
- ✅ 100.000 Requests/Tag
- ✅ Unbegrenzter KV-Storage (bis 1GB)
- ✅ Durable Objects: 10 GB-Stunden/Monat

### Resend (Free Tier)
- ✅ 100 E-Mails/Tag
- ✅ 3.000 E-Mails/Monat

**Für mehr Traffic**: Upgrade zu Cloudflare Workers Paid (~$5/Monat)

## 🛡️ Sicherheits-Checklist

- ✅ Starkes Admin-Passwort gesetzt
- ✅ Session-Secret ist zufällig und lang
- ✅ Secrets nicht in Git committed
- ✅ `.env` in `.gitignore`
- ✅ Admin-URL geheim halten (nicht verlinken!)
- ✅ HTTPS aktiv (automatisch bei Cloudflare)
- ✅ Rate Limiting aktiv (Standard: 10 Requests/Min)
- ✅ Audit-Log überwachen

## 📞 Support

- **Cloudflare Docs**: https://developers.cloudflare.com/workers/
- **Resend Docs**: https://resend.com/docs
- **Astro Docs**: https://docs.astro.build
- **Wrangler CLI**: https://developers.cloudflare.com/workers/wrangler/

---

**Version**: 2.0.0  
**Stand**: November 2025
