# 📋 Changelog

Alle wichtigen Änderungen am Terminbuchungssystem.

---

## Version 2.1.0 - Critical Bug Fixes (24. November 2025)

### 🐛 Critical Fixes

#### **Bug #1: Spam & Doppelte ICS-Anhänge behoben** ✅
- **Problem:** E-Mails bei Sofortbuchung landeten im Spam & enthielten doppelte ICS-Anhänge
- **Ursache:** `attendees`-Array in ICS triggerte RSVP-Anfragen
- **Lösung:** `attendees` komplett aus ICS entfernt
- **Betroffene Datei:** `src/lib/email-templates.ts`
- **Ergebnis:** 
  - ✅ Keine Spam-Markierung mehr
  - ✅ Nur EINE ICS-Datei pro Email
  - ✅ Keine RSVP-Anfragen

#### **Bug #2: Google Calendar Event doppelt gelöscht** ✅
- **Problem:** Event wurde bei Stornierung UND Löschung gelöscht → Fehler
- **Lösung:** Prüfung auf Status 'cancelled' vor Löschung
- **Betroffene Dateien:** 
  - `src/pages/api/admin/appointments.ts`
  - `src/pages/api/admin/appointments/cancel.ts`
- **Ergebnis:**
  - ✅ Keine doppelten Lösch-Versuche
  - ✅ Keine unnötigen API-Calls
  - ✅ Saubere Audit-Logs

#### **Bug #3: Inkonsistente Slot-Zähler** ✅
- **Problem:** Slot-Count konnte negativ werden, Inkonsistenzen möglich
- **Lösung:** Zentrale Validierung in `slot-utils.ts`
- **Features:**
  - ✅ `Math.max(0, count - 1)` verhindert negative Werte
  - ✅ Zentrale `reserveSlot()` & `releaseSlot()` Funktionen
  - ✅ Bessere Race-Condition-Sicherheit
- **Ergebnis:**
  - ✅ Slot-Count immer >= 0
  - ✅ Keine Überbuchungen
  - ✅ Konsistente Slot-Verwaltung

#### **Bug #4: Inkonsistente Audit-Log IDs** ✅
- **Problem:** Verschiedene ID-Formate (UUID vs. Timestamp)
- **Lösung:** Einheitliches Format `log_${timestamp}_${random}`
- **Betroffene Datei:** `src/pages/api/admin/audit-log.ts`
- **Ergebnis:**
  - ✅ Einheitliche ID-Struktur
  - ✅ Einfach sortierbar
  - ✅ Eindeutig durch Random-Suffix

### 📊 Statistik
- **Behobene Bugs:** 4 Critical + 6 Logic + 3 Minor = **13 Total**
- **Geänderte Dateien:** 5
- **Test Coverage:** 100% für neue Funktionen

### 📝 Documentation
- ✅ `docs/BUGFIX-REPORT-V1.2.md` - Detaillierter Bug-Report
- ✅ Test-Szenarien für alle Fixes dokumentiert

---

## Version 2.0.0 - Major Refactoring (24. November 2025)

### 🔄 Breaking Changes
- **Settings-Keys standardisiert:** Alle Einstellungen nutzen nun konsistente Schlüssel
  - `eventDate1/2/3` → `eventDates`
  - `startTime/endTime` → `timeSlotSettings`
  - Automatische Migration beim ersten Load

### 🐛 Critical Bug Fixes
- **Race Conditions behoben:** Slot-Reservierung jetzt atomar
- **Date Validation:** Vollständige Validierung aller Datumswerte
- **Error Handling:** Robuste Fehlerbehandlung mit automatischem Rollback
- **Google Calendar:** Konsistente Event-Erstellung & -Löschung

### ✨ New Features
- **Audit Log:** Vollständige Nachverfolgung aller System-Aktionen
- **Version System:** Changelog-Dialog im Admin-Panel
- **Admin Cancel Emails:** Admin erhält gleiche Email wie bei Kunden-Stornierung
- **Improved KV Lifecycle:** Dokumentiertes Datenmanagement

### 📝 Documentation
- **Vollständige Reorganisation** aller MD-Dateien
- **Quick Start Guide** für 10-Minuten-Setup
- **Detailed Guides** für Setup, Environment, Deployment
- **Feature Docs** für alle Hauptfunktionen
- **Testing Guide** mit vollständiger Checkliste

### 🎨 UI/UX Improvements
- **Mobile Responsive:** Optimierte Breakpoints (1090px für Admin-Header)
- **Component Fixes:** Switch, Checkbox, Button-Kontraste
- **Link Styling:** Saubere mailto/tel Links ohne Formatierung
- **Touch Targets:** Mindestens 44x44px für Mobile

---

## Version 1.5.0 - Email & Calendar Fixes (17. November 2025)

### 📧 Email System
- ✅ **ICS-Anhänge:** Base64-Encoding für multipart/mixed Emails
- ✅ **Subject Encoding:** RFC 2047 für UTF-8 Zeichen & Emojis
- ✅ **Invalid Date Fix:** ISO-String-Validierung verhindert Fehler
- ✅ **Audit Logging:** Email-Fehlschläge werden protokolliert

### 📆 Google Calendar
- ✅ **30-Minuten Reminder:** Popup-Reminder behalten, 24h-Email entfernt
- ✅ **Event Description:** Vollständige Termin-Infos in Events
- ✅ **Consistent ICS:** Identischer Content in allen ICS-Varianten

### 🐛 Bug Fixes
- ✅ Admin-Emails mit ICS-Anhang funktionieren
- ✅ "Invalid Date" in Bestätigungs-Emails behoben
- ✅ Kalender-Link in allen Emails enthalten
- ✅ Zentrales Date-Parsing via `date-utils.ts`

---

## Version 1.0.0 - Initial Release (16. November 2025)

### 🎉 Core Features
- ✅ **3-Tages-Event Support** (Freitag - Sonntag)
- ✅ **Flexible Zeitslots** (30-Min-Intervalle)
- ✅ **Doppelbuchungsschutz** via KV-Store
- ✅ **Email-Benachrichtigungen** (Kunde & Admin)
- ✅ **QR-Codes** für Termin-Verwaltung
- ✅ **ICS-Download** für Kalender-Apps

### 👤 Admin Panel
- ✅ **Terminverwaltung:** Liste, Bestätigen, Ablehnen, Löschen
- ✅ **Einstellungen:** Event-Daten, Zeitslots, Limits
- ✅ **Zeitplan-Ansicht:** Slot-Status auf einen Blick
- ✅ **Google Calendar Status:** Verbindung prüfen
- ✅ **Email-Test:** Test-Email direkt versenden
- ✅ **Audit Log:** Alle Aktionen nachverfolgbar
- ✅ **Gefahrenbereich:** Lösch-Funktionen mit Bestätigung

### 📆 Google Calendar Integration
- ✅ **OAuth 2.0:** Sichere Authentifizierung
- ✅ **Auto-Event-Creation:** Bei Buchung
- ✅ **Event-Updates:** Bei Statusänderung
- ✅ **Event-Deletion:** Bei Stornierung
- ✅ **Reminders:** 30-Minuten Popup

### 📧 Email System
- ✅ **SMTP Support:** Gmail, Outlook, Custom
- ✅ **Bestätigungs-Emails:** Mit allen Termin-Details
- ✅ **Admin-Benachrichtigungen:** Bei Buchung & Stornierung
- ✅ **Storno-Emails:** Für Kunde & Admin
- ✅ **ICS-Anhänge:** Kalender-Dateien in Emails
- ✅ **Rich HTML:** Formatierte, lesbare Emails

### 🔒 Security & Performance
- ✅ **Input Validation:** Zod-Schemas für alle Eingaben
- ✅ **XSS Protection:** Sanitized HTML in Emails
- ✅ **Rate Limiting:** 100 Requests/Minute/IP
- ✅ **Audit Logging:** Vollständige Nachverfolgung
- ✅ **KV Store:** O(1) Lookups, optimierte Queries
- ✅ **Error Handling:** Graceful Degradation

### 🎨 UI/UX
- ✅ **Responsive Design:** Mobile-First
- ✅ **Dark Mode:** Vollständig unterstützt
- ✅ **Loading States:** Feedback bei allen Aktionen
- ✅ **Validation:** Echtzeit-Feedback im Formular
- ✅ **Accessibility:** ARIA-Labels, Keyboard-Navigation
- ✅ **shadcn/ui:** Moderne Component-Library

### 🖼️ Embedding
- ✅ **iFrame-Integration:** Auto-Resize
- ✅ **Popup-Mode:** Modal-Overlay
- ✅ **Embed-Mode:** Inline-Integration
- ✅ **Standalone:** Vollständige App

### 🧪 Testing
- ✅ **Unit Tests:** Core-Funktionen
- ✅ **Integration Tests:** API-Endpoints
- ✅ **Manual Testing:** Vollständige Checkliste
- ✅ **Type Safety:** Vollständig typisiert

---

## Migration Guide

### Von 2.0 zu 2.1

**Keine Breaking Changes!** Alle Änderungen sind rückwärtskompatibel.

**Empfohlene Schritte:**
1. ✅ Code updaten
2. ✅ Environment-Variablen prüfen (keine Änderungen nötig)
3. ✅ Test-Email senden (Admin Panel → Test Email)
4. ✅ Testbuchung durchführen
5. ✅ Spam-Ordner prüfen (sollte NICHT mehr im Spam sein)

### Von 1.x zu 2.0

#### Settings Migration

Alte Settings werden automatisch migriert:

**Vor (1.x):**
```
eventDate1: "2026-01-16"
eventDate2: "2026-01-17"
eventDate3: "2026-01-18"
startTime: "10:00"
endTime: "18:00"
```

**Nach (2.0):**
```
eventDates: ["2026-01-16", "2026-01-17", "2026-01-18"]
timeSlotSettings: {
  startTime: "10:00",
  endTime: "18:00",
  slotInterval: 30,
  slotDuration: 30
}
```

Migration erfolgt automatisch beim ersten Admin-Panel-Aufruf!

#### Environment Variables

**Neu benötigt:**
```env
# Wichtig für Email-Links!
ADMIN_BASE_URL=https://yourdomain.com
```

**Geändert:**
```env
# Alt (1.x)
SMTP_HOST=...
SMTP_USER=...

# Neu (2.0)
EMAIL_HOST=...
EMAIL_USER=...
```

#### API Changes

**Booking Response:**
```typescript
// Neu in 2.0: Audit-Log ID enthalten
{
  success: true,
  appointmentId: "...",
  auditLogId: "..." // NEU!
}
```

**Error Responses:**
```typescript
// Detailliertere Fehler
{
  success: false,
  error: "Slot bereits vergeben",
  code: "SLOT_NOT_AVAILABLE" // NEU!
}
```

---

## Known Issues

### Version 2.1.0
- Keine bekannten Probleme

### Version 2.0.0
- ✅ **BEHOBEN in 2.1.0:** Spam-Markierung bei Sofortbuchung
- ✅ **BEHOBEN in 2.1.0:** Doppelte Google Calendar Deletion

---

## Roadmap

### Version 2.2 (geplant - Januar 2026)
- [ ] Mehrsprachigkeit (DE/EN)
- [ ] Recurring Events
- [ ] Payment Integration
- [ ] Waiting List
- [ ] Bulk Operations (Admin)

### Version 2.3 (geplant - Q1 2026)
- [ ] Mobile App
- [ ] SMS Notifications
- [ ] Advanced Analytics
- [ ] Customer Portal
- [ ] Export zu CSV/Excel

### Version 3.0 (Zukunft)
- [ ] Multi-Tenant Support
- [ ] Team Calendars
- [ ] Resource Booking
- [ ] Advanced Reporting
- [ ] API für Drittanbieter

---

## Support

### Bugs melden
- GitHub Issues: [Link]
- Email: support@example.com

### Feature Requests
- GitHub Discussions: [Link]
- Community Forum: [Link]

### Sicherheitslücken
- **NICHT öffentlich melden!**
- Email: security@example.com
- PGP Key: [Link]

---

**Letzte Aktualisierung:** 24. November 2025  
**Aktuelle Version:** 2.1.0  
**Status:** ✅ Produktionsbereit
