# ⚙️ Setup & Installation

Detaillierte Anleitung zur Installation und Konfiguration des Terminbuchungssystems.

---

## 📋 Voraussetzungen

### Software
- **Node.js:** Version 18+ erforderlich
- **npm/pnpm:** Neueste Version empfohlen
- **Git:** Für Repository-Verwaltung

### Accounts (falls benötigt)
- **Gmail:** Für Email-Versand
- **Google Cloud:** Für Calendar-Integration (optional)
- **Cloudflare:** Für Produktion (KV Storage + Workers)

---

## 🔧 Installation

### 1. Repository klonen

```bash
git clone [repository-url]
cd [project-name]
```

### 2. Dependencies installieren

```bash
npm install
```

Dies installiert:
- Astro 5.x
- React 19
- TailwindCSS 4.x
- shadcn/ui Components
- Google Calendar API Client
- Weitere Dependencies

### 3. Environment-Datei erstellen

```bash
cp .env.example .env
```

Bearbeite `.env` - siehe [03-ENVIRONMENT.md](03-ENVIRONMENT.md) für Details.

### Minimale Konfiguration:

```env
# Email (ERFORDERLICH)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=deine-email@gmail.com
EMAIL_PASS=dein-app-passwort
ADMIN_EMAIL=admin@example.com

# Admin URL (für Links)
ADMIN_BASE_URL=http://localhost:4321
```

### Volle Konfiguration:

```env
# ======================
# EMAIL KONFIGURATION
# ======================
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=deine-email@gmail.com
EMAIL_PASS=dein-app-passwort
ADMIN_EMAIL=admin@example.com

# ======================
# GOOGLE CALENDAR (Optional)
# ======================
GOOGLE_CLIENT_ID=deine-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=dein-secret
GOOGLE_REFRESH_TOKEN=dein-refresh-token
GOOGLE_CALENDAR_ID=primary

# ======================
# ADMIN URLS
# ======================
# Development
ADMIN_BASE_URL=http://localhost:4321

# Production (beim Deploy ändern)
# ADMIN_BASE_URL=https://yourdomain.com
```

---

## 🗄️ Cloudflare KV Setup

### Development (Lokaler Test)

Das System nutzt in Development einen **In-Memory KV Store** - keine extra Konfiguration nötig!

### Production (Cloudflare Workers)

#### 1. KV Namespace erstellen

```bash
# Production Namespace
npx wrangler kv:namespace create APPOINTMENTS_KV

# Preview Namespace (für Staging)
npx wrangler kv:namespace create APPOINTMENTS_KV --preview
```

Du bekommst IDs zurück:
```
✅ Created namespace APPOINTMENTS_KV
  ID: abc123xyz456...
  Preview ID: def789uvw012...
```

#### 2. IDs in wrangler.jsonc eintragen

```jsonc
{
  "name": "appointment-tool",
  "main": "dist/_worker.js",
  "compatibility_date": "2024-11-01",
  
  "kv_namespaces": [
    {
      "binding": "APPOINTMENTS_KV",
      "id": "abc123xyz456...",           // Production ID
      "preview_id": "def789uvw012..."    // Preview ID
    }
  ]
}
```

Siehe [04-DEPLOYMENT.md](04-DEPLOYMENT.md) für vollständige Deployment-Anleitung.

---

## 🚀 Development Server starten

```bash
npm run dev
```

Das System ist jetzt erreichbar unter:

- **Terminbuchung:** [http://localhost:4321](http://localhost:4321)
- **Admin-Panel:** [http://localhost:4321/admin](http://localhost:4321/admin)
- **Embed-Test:** [http://localhost:4321/embed](http://localhost:4321/embed)
- **Popup-Test:** [http://localhost:4321/popup](http://localhost:4321/popup)

---

## ✅ Installation verifizieren

### 1. Hauptseite prüfen

Öffne [http://localhost:4321](http://localhost:4321)

✅ **Erwartetes Ergebnis:**
- Terminbuchungs-Interface lädt
- Wochenansicht zeigt Tage
- Zeitslots sind auswählbar

### 2. Admin-Panel prüfen

Öffne [http://localhost:4321/admin](http://localhost:4321/admin)

✅ **Erwartetes Ergebnis:**
- Dashboard lädt
- Statistiken zeigen (0 Termine)
- Alle Tabs (Termine, Einstellungen, etc.) sind klickbar

### 3. Test-Buchung durchführen

1. Wähle Tag & Zeit
2. Fülle Formular aus:
   - Name: Test User
   - Email: test@example.com
   - Telefon: +49 123 456789
3. Klicke "Buchen"

✅ **Erwartetes Ergebnis:**
- Erfolgsmeldung erscheint
- Termin erscheint im Admin-Panel
- (Bei konfiguriertem Email) Bestätigungs-Email wird versendet

### 4. Email-Test (falls konfiguriert)

Im Admin-Panel → **Einstellungen** → Scrollen nach unten:
- Klicke **"Test-E-Mail senden"**

✅ **Erwartetes Ergebnis:**
- Erfolgsmeldung
- Email erhältst du innerhalb 30 Sekunden

---

## 🔐 Gmail App-Passwort erstellen

Für Email-Versand benötigst du ein **App-Passwort** (nicht dein normales Gmail-Passwort!):

### Schritt-für-Schritt:

1. **Gehe zu Google Account Security:**
   [https://myaccount.google.com/security](https://myaccount.google.com/security)

2. **Aktiviere "2-Schritt-Verifizierung"**
   - Falls noch nicht aktiviert
   - Folge dem Setup-Prozess

3. **Erstelle App-Passwort:**
   - Gehe zu [https://myaccount.google.com/apppasswords](https://myaccount.google.com/apppasswords)
   - Wähle "Mail" als App
   - Wähle "Anderes Gerät"
   - Name: "Terminbuchungssystem"
   - Klicke "Generieren"

4. **Kopiere das Passwort:**
   ```
   Beispiel: abcd efgh ijkl mnop
   ```

5. **Füge in .env ein:**
   ```env
   EMAIL_PASS=abcdefghijklmnop
   ```
   (Ohne Leerzeichen!)

---

## 🎨 Styling anpassen (Optional)

### Webflow-Variablen nutzen

Das System nutzt CSS-Variablen aus `generated/webflow.css`:

```css
/* Beispiel: Eigene Farben definieren */
:root {
  --primary: #2d62ff;
  --secondary: #def5ff;
  --destructive: #e03939;
  /* ... mehr in webflow.css */
}
```

Diese Variablen werden automatisch von shadcn/ui Components genutzt.

### Globale Styles ändern

Editiere `src/styles/global.css`:

```css
/* Eigene Styles hinzufügen */
.custom-button {
  background: var(--primary);
  color: white;
}
```

---

## 🧪 Tests ausführen (Optional)

```bash
# Unit-Tests
npm test

# Tests mit UI
npm run test:ui

# Coverage Report
npm run test:coverage
```

Siehe [40-TESTING-GUIDE.md](40-TESTING-GUIDE.md) für Details.

---

## 🚨 Häufige Probleme

### Port bereits belegt

```bash
# Port freigeben
npx kill-port 4321

# Oder anderen Port nutzen
npm run dev -- --port 4322
```

### TypeScript Fehler

```bash
# Type-Check durchführen
npm run astro check

# Build versuchen
npm run build
```

### Node Version Fehler

```bash
# Node Version prüfen
node --version

# Sollte >= 18.0.0 sein
```

### Umgebungsvariablen werden nicht geladen

1. Prüfe ob `.env` im Root-Verzeichnis liegt
2. Starte Dev-Server neu
3. Prüfe ob Variablen korrekt formatiert sind (keine Leerzeichen!)

### Email wird nicht versendet

1. Prüfe `EMAIL_HOST`, `EMAIL_PORT`
2. Prüfe ob App-Passwort korrekt ist
3. Prüfe Console-Logs für Fehler
4. Teste mit "Test-E-Mail senden" im Admin-Panel

Mehr Lösungen: [52-TROUBLESHOOTING.md](52-TROUBLESHOOTING.md)

---

## 📚 Nächste Schritte

Nach erfolgreicher Installation:

1. **Konfiguration vervollständigen:** [03-ENVIRONMENT.md](03-ENVIRONMENT.md)
2. **Google Calendar einrichten:** [33-GOOGLE-CALENDAR.md](33-GOOGLE-CALENDAR.md)
3. **In Website einbetten:** [20-IFRAME-INTEGRATION.md](20-IFRAME-INTEGRATION.md)
4. **Deployen:** [04-DEPLOYMENT.md](04-DEPLOYMENT.md)

---

**Zurück zu:** [01-QUICK-START.md](01-QUICK-START.md) | **Weiter zu:** [03-ENVIRONMENT.md](03-ENVIRONMENT.md)
