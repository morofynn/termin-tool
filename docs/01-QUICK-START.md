# 🚀 Quick Start Guide

Starte das Terminbuchungssystem in **unter 10 Minuten**!

---

## Voraussetzungen

- Node.js 18+ installiert
- npm oder pnpm
- Gmail-Account (für Email-Versand)
- Google Calendar (optional, für automatische Events)

---

## Schritt 1: Installation

```bash
# Dependencies installieren
npm install

# Development-Server starten
npm run dev
```

➡️ Öffne [http://localhost:4321](http://localhost:4321)

---

## Schritt 2: Minimale Konfiguration

Erstelle eine `.env` Datei im Root:

```env
# Email-Versand (ERFORDERLICH)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=deine-email@gmail.com
EMAIL_PASS=dein-app-passwort
ADMIN_EMAIL=admin@example.com

# Admin URL (Für Links in Emails)
ADMIN_BASE_URL=http://localhost:4321
```

### Gmail App-Passwort erstellen:

1. Gehe zu [Google Account Security](https://myaccount.google.com/security)
2. Aktiviere "2-Schritt-Verifizierung"
3. Gehe zu "App-Passwörter"
4. Erstelle neues Passwort für "Mail"
5. Kopiere das Passwort in `.env`

---

## Schritt 3: Erste Buchung testen

1. **Öffne Terminbuchung:** [http://localhost:4321](http://localhost:4321)
2. **Wähle Tag & Zeit:** z.B. Freitag, 10:00 Uhr
3. **Fülle Formular aus:**
   - Name: Max Mustermann
   - Email: test@example.com
   - Telefon: +49 123 456789
4. **Klicke "Termin buchen"**

✅ **Erwartet:**
- Bestätigungsmeldung
- Email an Kunde (test@example.com)
- Email an Admin (ADMIN_EMAIL)

---

## Schritt 4: Admin-Panel öffnen

Öffne [http://localhost:4321/admin](http://localhost:4321/admin)

Du siehst:
- ✅ Liste aller Termine
- ✅ Statistiken
- ✅ Einstellungen
- ✅ Zeitplan-Übersicht

---

## Schritt 5: Einstellungen anpassen

Im Admin-Panel → **Einstellungen**:

### Event-Daten ändern:
```
Tag 1: 2026-01-16 (Freitag)
Tag 2: 2026-01-17 (Samstag)
Tag 3: 2026-01-18 (Sonntag)
```

### Zeitslots anpassen:
```
Startzeit: 10:00
Endzeit: 18:00
Intervall: 30 Minuten
Termindauer: 30 Minuten
```

### Slot-Limit:
```
Max. Termine pro Slot: 1
```

Klicke **Speichern** ✅

---

## Schritt 6: Stornierung testen

1. **Öffne Email** (test@example.com)
2. **Klicke "Termin verwalten"**
3. **Klicke "Stornieren"**
4. **Bestätige Dialog**

✅ **Erwartet:**
- Termin wird storniert
- Slot wieder verfügbar
- Email an Admin & Kunde

---

## Optional: Google Calendar Integration

Falls du automatische Calendar-Events möchtest:

### 1. Google Cloud Console Setup

1. Gehe zu [Google Cloud Console](https://console.cloud.google.com)
2. Erstelle neues Projekt
3. Aktiviere "Google Calendar API"
4. Erstelle OAuth 2.0 Credentials
   - Application Type: Web application
   - Authorized redirect URI: `http://localhost:4321/api/auth/google-callback`

### 2. OAuth-Flow durchführen

```bash
# Öffne Authorization URL
http://localhost:4321/api/auth/google-authorize
```

Folge den Schritten, kopiere Refresh-Token.

### 3. .env erweitern

```env
GOOGLE_CLIENT_ID=deine-client-id
GOOGLE_CLIENT_SECRET=dein-secret
GOOGLE_REFRESH_TOKEN=dein-refresh-token
GOOGLE_CALENDAR_ID=primary
```

Siehe [33-GOOGLE-CALENDAR.md](33-GOOGLE-CALENDAR.md) für Details.

---

## ✅ Fertig!

Dein System läuft jetzt lokal! 🎉

### Nächste Schritte:

1. **Mehr testen:** Siehe [40-TESTING-GUIDE.md](40-TESTING-GUIDE.md)
2. **Deployment:** Siehe [04-DEPLOYMENT.md](04-DEPLOYMENT.md)
3. **iFrame-Einbettung:** Siehe [20-IFRAME-INTEGRATION.md](20-IFRAME-INTEGRATION.md)

---

## 🆘 Probleme?

### Email wird nicht versendet?
➡️ Prüfe `EMAIL_HOST`, `EMAIL_PORT`, `EMAIL_USER`, `EMAIL_PASS`
➡️ Prüfe Console-Logs für Fehler

### Termine werden nicht gespeichert?
➡️ Prüfe ob KV-Store verfügbar (Development: In-Memory)
➡️ Prüfe Console-Logs

### Admin-Panel lädt nicht?
➡️ Stelle sicher dass `/admin` Route existiert
➡️ Prüfe Browser-Console für Fehler

Mehr Lösungen: [52-TROUBLESHOOTING.md](52-TROUBLESHOOTING.md)

---

**Geschafft? Weiter zu:** [02-SETUP.md](02-SETUP.md) für detaillierte Installation
