# 📋 Changelog - Terminbuchungs-Tool

Alle wichtigen Änderungen an diesem Projekt werden in dieser Datei dokumentiert.

Das Format basiert auf [Keep a Changelog](https://keepachangelog.com/de/1.0.0/).

---

## [v1.0] - 2025-11-19

### ✨ Features
- **Interaktive Terminbuchung** mit Kalender-Ansicht und Tag-Tabs
- **Admin-Dashboard** zur Verwaltung aller Termine
- **Google Calendar Integration** mit vollständigem OAuth 2.0 Flow
- **Automatischer E-Mail-Versand** via Gmail API
- **ICS-Attachments** für alle Termin-E-Mails
- **Konfigurierbare Arbeitszeiten** und Termindauer
- **Rate Limiting** (max 5 Buchungen pro IP pro Tag)
- **Audit-Log** für alle Admin-Aktionen
- **Mobile-optimiertes Design** mit Touch-Support
- **Embed & Popup Modi** für externe Integration
- **Multi-Tenant Support** (White-Label)
- **Dynamischer Admin-Pfad** (konfigurierbar per ENV)
- **Wartungsmodus** mit Toggle im Admin-Panel
- **Event-Ende Status** mit automatischer & manueller Steuerung
- **Versionsverwaltung** mit Changelog-Dialog

### 🎨 Design
- Moderne UI mit **Tailwind CSS 4**
- **shadcn/ui** Komponenten-Bibliothek
- Animierte Übergänge mit **Framer Motion**
- Responsive Layout für alle Bildschirmgrößen
- Dark Mode Support (optional)

### 🔐 Sicherheit
- Passwort-geschütztes Admin-Panel
- Dynamischer Admin-Pfad (Security by Obscurity)
- Input-Validierung mit **Zod**
- HTTP-only Cookies für Sessions
- Environment Variables für Secrets
- Rate Limiting gegen Spam

### ⚡ Performance
- **Cloudflare Workers** für Edge Computing
- **Cloudflare KV Store** für Datenspeicherung
- Optimierte Bundle-Größe
- Lazy Loading für React Components
- Server-Side Rendering mit **Astro**

### 📱 Integration
- **iFrame-Einbettung** mit responsive Design
- **Popup/Modal-Modus** für Overlay-Integration
- **Direkter Link** für externe Verlinkung
- URL-Parameter für Pre-Fill & Tracking
- PostMessage API für Parent-Communication

### 🔧 Admin-Features
- Termin-Verwaltung (Bestätigen, Ablehnen, Stornieren)
- Live-Terminübersicht mit Filter & Suche
- Google Calendar Status & Sync-Info
- System-Einstellungen (Arbeitszeiten, Kapazität, etc.)
- Test-Funktionen für E-Mail & Calendar
- Audit-Log für Nachverfolgung
- Bulk-Actions (Alle löschen, Alle ablehnen)
- Dokumentation direkt im Admin-Panel
- **Versionsnummer** mit Changelog (klickbar)

### 📧 E-Mail-Features
- Buchungsbestätigung für Kunden
- Admin-Benachrichtigung bei neuer Buchung
- Erinnerungen (24h vorher)
- Stornierungsbestätigung
- ICS-Kalender-Anhang für alle Mails
- Responsive HTML-Templates
- Fallback Text-Version

### 📅 Calendar-Features
- Google Calendar OAuth 2.0
- Automatische Event-Erstellung
- Event-Updates bei Änderungen
- Event-Löschung bei Stornierung
- Konflikt-Erkennung
- Teilnehmer-Verwaltung

### 🔄 Cron Jobs
- Automatische Erinnerungs-E-Mails (Cloudflare Cron)
- Configurable via `wrangler.jsonc`

### 📚 Dokumentation
- Vollständige Setup-Anleitung
- API-Dokumentation
- Architektur-Übersicht
- Deployment-Guide
- Troubleshooting-Guide
- **Embed-Integration Guide** (neu in v1.0)
- Multi-Tenant Setup Guide

### 🐛 Bugfixes
- Fix: Switch-Komponente behält jetzt 2:1 Verhältnis
- Fix: Buttons in Gefahrenbereichen sind lesbar
- Fix: mailto/tel Links haben kein Padding mehr
- Fix: AlertDialog Cancel Buttons sind sichtbar
- Fix: Mobile Touch-Targets sind >= 44px
- Fix: Zeitslots in Vergangenheit werden ausgegraut
- Fix: Event-Ende wird automatisch basierend auf Datum erkannt

---

## [Unreleased] - v1.1 (Geplant)

### 🚀 Geplante Features
- [ ] SMS-Benachrichtigungen (Twilio Integration)
- [ ] Mehrsprachigkeit (i18n - DE/EN)
- [ ] Warteliste für ausgebuchte Zeiten
- [ ] Export als CSV/Excel
- [ ] Analytics Dashboard (Statistiken)
- [ ] Webhook-Integration
- [ ] Custom Branding pro Tenant
- [ ] Recurring Events Support
- [ ] Group Bookings (mehrere Personen)
- [ ] Payment Integration (Stripe)

### 🎯 Geplante Verbesserungen
- [ ] Performance-Optimierungen
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] E2E-Tests mit Playwright
- [ ] Storybook für Komponenten
- [ ] OpenAPI/Swagger Docs

---

## Wie Version ändern?

1. **Öffne** `src/lib/version.ts`
2. **Ändere** `APP_VERSION` z.B. von `'v1.0'` zu `'v1.1'`
3. **Update** `VERSION_INFO` mit Release Date & Name
4. **Aktualisiere** dieses CHANGELOG.md
5. **Öffne** `src/components/ChangelogDialog.tsx` und füge neuen Eintrag hinzu
6. **Commit & Push** zu GitHub
7. **Deploy** zur Production

---

## Version History

- **v1.0** (2025-11-19) - Initial Release 🎉
- **v0.9** (2025-11-15) - Beta Testing
- **v0.8** (2025-11-10) - Alpha Release
- **v0.1** (2025-11-01) - First Prototype

---

**Made with ❤️ for seamless appointment booking**
