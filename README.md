# 🗓️ Terminbuchungs-System

Ein vollständiges, produktionsbereites Terminbuchungssystem mit Google Calendar Integration, Email-Benachrichtigungen und Admin-Panel.

---

## ✨ Features

### Für Kunden:
- ✅ **Einfache Terminbuchung** - Intuitive Auswahl von Tag & Zeit
- ✅ **Sofortige Bestätigung** - Email mit Termindetails & QR-Code
- ✅ **ICS-Download** - Direkt in Kalender-App importieren
- ✅ **Einfache Stornierung** - Über Link in Email
- ✅ **Doppelbuchungsschutz** - Verhindert mehrfache Buchungen

### Für Administratoren:
- ✅ **Terminverwaltung** - Übersicht aller Termine mit Statistiken
- ✅ **Zeitplan-Ansicht** - Slot-Status auf einen Blick
- ✅ **Flexible Einstellungen** - Daten, Zeiten, Limits konfigurierbar
- ✅ **Google Calendar Integration** - Automatische Event-Erstellung
- ✅ **Audit-Log** - Vollständige Nachverfolgung aller Aktionen
- ✅ **Email-Benachrichtigungen** - Bei Buchungen & Stornierungen

---

## 🚀 Quick Start

### 1. Installation

```bash
# Repository klonen
git clone [repository-url]
cd [project-name]

# Dependencies installieren
npm install
```

### 2. Environment-Variablen

Erstelle eine `.env` Datei:

```env
# Google Calendar (Optional)
GOOGLE_CLIENT_ID=your_client_id
GOOGLE_CLIENT_SECRET=your_secret
GOOGLE_REFRESH_TOKEN=your_token
GOOGLE_CALENDAR_ID=primary

# Email (Erforderlich)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=587
EMAIL_USER=your-email@gmail.com
EMAIL_PASS=your-app-password
ADMIN_EMAIL=admin@example.com

# Admin URLs (Für Produktion)
ADMIN_BASE_URL=https://yourdomain.com
```

Siehe [03-ENVIRONMENT.md](docs/03-ENVIRONMENT.md) für Details.

### 3. Entwicklungs-Server starten

```bash
npm run dev
```

Öffne [http://localhost:4321](http://localhost:4321)

### 4. Build & Deploy

```bash
npm run build
npm run preview
```

Siehe [04-DEPLOYMENT.md](docs/04-DEPLOYMENT.md) für Deployment-Anleitung.

---

## 📚 Dokumentation

### Für Einsteiger:
- [📖 Quick Start](docs/01-QUICK-START.md) - Schnellstart-Anleitung
- [⚙️ Setup](docs/02-SETUP.md) - Detaillierte Installation
- [🔐 Environment](docs/03-ENVIRONMENT.md) - Konfiguration
- [🚀 Deployment](docs/04-DEPLOYMENT.md) - Live-Deployment

### Für Entwickler:
- [🏗️ Architecture](docs/10-ARCHITECTURE.md) - System-Architektur
- [💾 KV Lifecycle](docs/11-KV-LIFECYCLE.md) - Datenspeicherung
- [📊 Data Model](docs/12-DATA-MODEL.md) - Datenstrukturen

### Integration:
- [🖼️ iFrame Integration](docs/20-IFRAME-INTEGRATION.md) - Einbettung in Webflow
- [🔌 API Reference](docs/22-API-REFERENCE.md) - API-Dokumentation

### Features:
- [📅 Booking Flow](docs/30-BOOKING-FLOW.md) - Buchungsablauf
- [❌ Cancellation](docs/31-CANCELLATION.md) - Stornierungen
- [👤 Admin Panel](docs/32-ADMIN-PANEL.md) - Admin-Funktionen
- [📆 Google Calendar](docs/33-GOOGLE-CALENDAR.md) - Calendar-Integration
- [📧 Email System](docs/34-EMAIL-SYSTEM.md) - Email-Benachrichtigungen

### Testing & Qualität:
- [✅ Testing Guide](docs/40-TESTING-GUIDE.md) - Vollständige Tests
- [⚡ Performance](docs/41-PERFORMANCE.md) - Optimierung
- [🔒 Security](docs/42-SECURITY.md) - Sicherheit

### Referenz:
- [📝 Changelog](docs/50-CHANGELOG.md) - Alle Änderungen
- [📊 Final Analysis](docs/51-FINAL-ANALYSIS.md) - Status & Bewertung
- [🔧 Troubleshooting](docs/52-TROUBLESHOOTING.md) - Problemlösungen

---

## 🎯 Status

**Version:** 2.0.0  
**Status:** ✅ Produktionsbereit  
**Bewertung:** 8.5/10 ⭐⭐⭐⭐⭐⭐⭐⭐☆☆

Siehe [51-FINAL-ANALYSIS.md](docs/51-FINAL-ANALYSIS.md) für Details.

---

## 🛠️ Tech Stack

- **Framework:** Astro 5.x + React 19
- **Styling:** TailwindCSS 4.x + shadcn/ui
- **Deployment:** Cloudflare Workers
- **Storage:** Cloudflare KV
- **Calendar:** Google Calendar API
- **Email:** SMTP (Gmail/Custom)
- **TypeScript:** Vollständig typisiert

---

## 📋 Wichtige Funktionen

### Sicherheit
- ✅ Input-Validierung (XSS-Schutz)
- ✅ Rate-Limiting (IP-basiert)
- ✅ Environment-Variablen für Secrets
- ✅ Audit-Logging aller Aktionen

### Performance
- ✅ Buchung: < 2 Sekunden
- ✅ Verfügbarkeit: < 500ms
- ✅ Admin-Panel: < 1 Sekunde
- ✅ Optimierte KV-Zugriffe (O(1))

### Zuverlässigkeit
- ✅ Race-condition-sicher
- ✅ Vollständiger Rollback bei Fehler
- ✅ Comprehensive Error-Handling
- ✅ Audit-Log für Nachverfolgung

---

## 🤝 Support

Bei Fragen oder Problemen:
1. Prüfe [52-TROUBLESHOOTING.md](docs/52-TROUBLESHOOTING.md)
2. Siehe [40-TESTING-GUIDE.md](docs/40-TESTING-GUIDE.md) für Tests
3. Kontaktiere Support

---

## 📄 Lizenz

[Deine Lizenz hier]

---

## 🙏 Credits

Entwickelt mit ❤️ für effiziente Terminverwaltung.

**Letzte Aktualisierung:** 24. November 2025
