# 📅 Terminbuchungs-App für Webflow

> **Multi-Tenant fähige Webapp** für Event-Terminbuchungen mit Google Calendar Integration und automatischem E-Mail-Versand

[![Astro](https://img.shields.io/badge/Astro-5.x-FF5D01?style=flat&logo=astro)](https://astro.build)
[![React](https://img.shields.io/badge/React-19.x-61DAFB?style=flat&logo=react)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=flat&logo=typescript)](https://www.typescriptlang.org)
[![Cloudflare Workers](https://img.shields.io/badge/Cloudflare-Workers-F38020?style=flat&logo=cloudflare)](https://workers.cloudflare.com)

---

## ✨ Features

- 🎯 **Einfache Terminbuchung** - Besucher können Termine direkt buchen
- 📧 **Automatische E-Mails** - Bestätigungen & Erinnerungen via Gmail API
- 📅 **Google Calendar Sync** - Termine werden automatisch in Google Calendar erstellt
- 🔐 **Admin Panel** - Verwaltung aller Termine mit Audit-Log
- 🏢 **Multi-Tenant** - Eine Code-Basis für mehrere Unternehmen/Events
- 📱 **Responsive Design** - Funktioniert auf allen Geräten
- 🎨 **White-Label** - Firmenspezifisches Branding konfigurierbar
- ⚡ **Cloudflare Workers** - Blazing fast & skalierbar

---

## 🚀 Quick Start

### 1. Repository klonen

```bash
git clone https://github.com/DEIN-USERNAME/DEIN-REPO-NAME.git
cd DEIN-REPO-NAME
npm install
```

### 2. Environment Variables

Erstelle `.env` Datei:

```bash
# Google Calendar & Gmail
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=http://localhost:3000/api/auth/google-callback
GOOGLE_USER_EMAIL=termine@deine-firma.de

# Admin Panel
ADMIN_PASSWORD=DeinSicheresPasswort123!

# Cloudflare KV (automatisch in Production)
APPOINTMENTS_KV=appointments-kv
```

### 3. Google Calendar Setup

Siehe → **[docs/GOOGLE_CALENDAR_OAUTH_SETUP.md](docs/GOOGLE_CALENDAR_OAUTH_SETUP.md)**

Kurzfassung:
1. Google Cloud Console → Neues Projekt
2. Calendar API + Gmail API aktivieren
3. OAuth 2.0 Client erstellen
4. Credentials in `.env` eintragen

### 4. Development

```bash
npm run dev
# App läuft auf http://localhost:3000
```

### 5. Admin Panel aufrufen

```
http://localhost:3000/secure-admin-panel-xyz789
Passwort: DeinSicheresPasswort123!
```

---

## 📦 Deployment auf Webflow

### Option A: Direktes Deployment

1. In Webflow: **Apps** → **Neue App erstellen**
2. Code hochladen oder Git-Integration nutzen
3. Environment Variables in Webflow setzen
4. Deployen ✅

### Option B: Multi-Tenant Setup

Für mehrere Firmen/Events:

1. Webflow: **"Create New Instance"**
2. Pro Instanz: Eigene Environment Variables
3. Pro Instanz: Eigenes Google Cloud Projekt

Siehe → **[docs/MULTI-TENANT-SETUP.md](docs/MULTI-TENANT-SETUP.md)**

---

## 📚 Dokumentation

### Hauptdokumentation
- **[docs/INDEX.md](docs/INDEX.md)** - Dokumentations-Übersicht
- **[docs/SETUP.md](docs/SETUP.md)** - Detaillierte Setup-Anleitung
- **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** - System-Architektur
- **[docs/API.md](docs/API.md)** - API-Dokumentation

### Setup-Guides
- **[docs/GOOGLE_CALENDAR_OAUTH_SETUP.md](docs/GOOGLE_CALENDAR_OAUTH_SETUP.md)** - Google OAuth Setup
- **[docs/GMAIL_SETUP.md](docs/GMAIL_SETUP.md)** - Gmail API Setup
- **[docs/MULTI-TENANT-SETUP.md](docs/MULTI-TENANT-SETUP.md)** - Multi-Tenant Konfiguration

### Troubleshooting
- **[docs/archive/CALENDAR_NOT_WORKING_FIX.md](docs/archive/CALENDAR_NOT_WORKING_FIX.md)** - Google Calendar Probleme
- **[docs/CHANGELOG.md](docs/CHANGELOG.md)** - Version History

---

## 🏗️ Tech Stack

- **Frontend**: React 19 + Astro 5
- **Styling**: Tailwind CSS 4 + shadcn/ui
- **Backend**: Cloudflare Workers (Astro Cloudflare Adapter)
- **Database**: Cloudflare KV Store
- **APIs**: Google Calendar API, Gmail API
- **Email**: Gmail API (ICS-Attachments)
- **Deployment**: Webflow Cloud

---

## 📁 Projekt-Struktur

```
├── src/
│   ├── components/          # React Components
│   │   ├── AppointmentScheduler.tsx
│   │   ├── AdminAppointments.tsx
│   │   ├── AdminSettings.tsx
│   │   └── ui/             # shadcn/ui Components
│   ├── pages/
│   │   ├── index.astro     # Hauptseite
│   │   ├── embed.astro     # Embed-Version
│   │   ├── popup.astro     # Popup-Version
│   │   └── api/            # API Routes
│   ├── lib/                # Utilities
│   │   ├── email.ts        # E-Mail-Versand
│   │   ├── time-slots.ts   # Zeitslot-Logik
│   │   └── validation.ts   # Input-Validierung
│   └── styles/             # Global Styles
├── docs/                   # Dokumentation
├── generated/              # Webflow CSS/Fonts
└── backups/               # Code-Backups
```

---

## 🔧 Konfiguration

### Einstellungen im Admin Panel

- **Event-Details**: Name, Ort, Beschreibung
- **Arbeitszeiten**: Mo-Fr, benutzerdefinierte Zeiten
- **Termindauer**: 5-120 Minuten (Standard: 30 Min)
- **Firmen-Branding**: Logo, Farben, Kontaktdaten
- **Google Calendar**: OAuth-Autorisierung

### Environment Variables

| Variable | Beschreibung | Erforderlich |
|----------|-------------|--------------|
| `GOOGLE_CLIENT_ID` | Google OAuth Client ID | ✅ |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Secret | ✅ |
| `GOOGLE_REDIRECT_URI` | OAuth Callback URL | ✅ |
| `GOOGLE_USER_EMAIL` | Gmail für E-Mail-Versand | ✅ |
| `ADMIN_PASSWORD` | Admin Panel Passwort | ✅ |
| `APPOINTMENTS_KV` | KV Namespace (auto) | ✅ |

---

## 🔐 Sicherheit

- ✅ Admin Panel mit Passwort-Schutz
- ✅ Rate Limiting (max 5 Buchungen/IP/Tag)
- ✅ Input-Validierung (Zod)
- ✅ OAuth 2.0 für Google APIs
- ✅ Keine Secrets im Client-Code
- ✅ Environment Variables nicht im Git

**⚠️ WICHTIG**: `.env` ist in `.gitignore` - wird NICHT committet!

---

## 🧪 Testing

### API Endpoints testen

```bash
# Verfügbare Slots abrufen
curl http://localhost:3000/api/availability?date=2025-11-20

# System-Status prüfen
curl http://localhost:3000/api/admin/system-status

# Google Calendar Test (Admin Panel)
http://localhost:3000/secure-admin-panel-xyz789
→ Google Calendar Tab → "Verbindung testen"
```

### E-Mail-Versand testen

Admin Panel → Google Calendar → "Test-E-Mails senden"

---

## 📊 Features im Detail

### Terminbuchung
- Kalender-Ansicht mit verfügbaren Zeitslots
- Echtzeit-Validierung der Eingaben
- Duplikats-Prüfung (selber Name/Zeit)
- Automatische Bestätigungs-E-Mail
- ICS-Datei als Anhang

### Admin Panel
- ✅ Übersicht aller Termine
- ✅ Termine bestätigen/ablehnen
- ✅ Termine stornieren
- ✅ Audit-Log (alle Aktionen)
- ✅ System-Status Dashboard
- ✅ Google Calendar Management

### E-Mail-Benachrichtigungen
- 📧 Buchungsanfrage (an Admin)
- 📧 Bestätigung (an Kunde)
- 📧 Ablehnung (an Kunde)
- 📧 Stornierung (an Kunde & Admin)
- 📧 Erinnerung 24h vorher

Alle E-Mails mit ICS-Anhang für Kalender!

### Google Calendar Integration
- 🔗 OAuth 2.0 Autorisierung
- 🔗 Automatische Event-Erstellung
- 🔗 Link zum Termin in Event-Beschreibung
- 🔗 E-Mail-Erinnerungen über Google

---

## 🐛 Troubleshooting

### Google Calendar funktioniert nicht
→ [docs/archive/CALENDAR_NOT_WORKING_FIX.md](docs/archive/CALENDAR_NOT_WORKING_FIX.md)

### E-Mails werden nicht gesendet
1. Gmail API aktiviert? → Google Cloud Console
2. `GOOGLE_USER_EMAIL` gesetzt?
3. OAuth autorisiert? → Admin Panel
4. Scopes korrekt? → Sollten sein: `calendar`, `gmail.send`

### Admin Panel nicht erreichbar
1. URL korrekt? → `/secure-admin-panel-xyz789`
2. Passwort korrekt? → Check `.env` → `ADMIN_PASSWORD`

### Build-Fehler
```bash
# Dependencies neu installieren
rm -rf node_modules package-lock.json
npm install

# Type-Checking
npm run build
```

---

## 🤝 Contributing

1. Fork das Repository
2. Feature Branch erstellen (`git checkout -b feature/AmazingFeature`)
3. Änderungen committen (`git commit -m 'Add some AmazingFeature'`)
4. Branch pushen (`git push origin feature/AmazingFeature`)
5. Pull Request öffnen

---

## 📝 Changelog

Siehe **[docs/CHANGELOG.md](docs/CHANGELOG.md)**

### Latest (v1.2.0)
- ✅ Multi-Tenant Support
- ✅ Gmail API Integration
- ✅ Konfigurierbare Termindauer
- ✅ ICS-Attachments für alle E-Mails
- ✅ Verbesserte Fehlerbehandlung
- ✅ Audit-Log für failed E-Mails

---

## 📄 Lizenz

Proprietary - Alle Rechte vorbehalten

---

## 🆘 Support & Kontakt

- **Dokumentation**: [docs/INDEX.md](docs/INDEX.md)
- **Issues**: GitHub Issues
- **E-Mail**: [Deine Support-E-Mail]

---

## 🎯 Roadmap

- [ ] SMS-Benachrichtigungen
- [ ] Mehrsprachigkeit (i18n)
- [ ] Warteliste für ausgebuchte Zeiten
- [ ] Automatische Reminder (2h vorher)
- [ ] Analytics Dashboard
- [ ] Export als CSV/Excel
- [ ] Webhook-Integration
- [ ] REST API für externe Systeme

---

**Made with ❤️ for Webflow Cloud**

Deploy auf: [Webflow](https://webflow.com) | Powered by: [Astro](https://astro.build) + [Cloudflare Workers](https://workers.cloudflare.com)
