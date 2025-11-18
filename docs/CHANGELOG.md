# 📋 Changelog

## Version 2.0 - UI & UX Optimierungen (17. Nov 2025)

### UI Fixes
- ✅ Toggle Buttons: Perfekte 2:1 Pillenform (44x24px) auf allen Geräten
- ✅ Button-Textfarben: Alle Buttons haben lesbare Kontraste
- ✅ Link-Styling: mailto/tel Links ohne unerwünschte Formatierung
- ✅ Gefahrenbereich: Optimierte Abstände zwischen Text und Buttons
- ✅ Mobile Responsive: Touch-optimierte Tap Targets (44x44px)

### Component Fixes
- ✅ Switch Component: Garantierte Dimensionen mit !important
- ✅ AlertDialog Buttons: Korrekte Textfarben (cancel = dunkel, action = weiß)
- ✅ Outline Buttons: Dunkler Text auf hellem Hintergrund
- ✅ Colored Buttons: Weiße Schrift auf farbigem Hintergrund

---

## Version 1.5 - E-Mail Fixes (17. Nov 2025)

### E-Mail System
- ✅ ICS-Anhänge: Base64-Encoding für multipart/mixed E-Mails
- ✅ Subject Line: RFC 2047 Encoding für UTF-8 Zeichen & Emojis
- ✅ Invalid Date: Behoben durch ISO-String-Validierung
- ✅ Audit Log: E-Mail-Fehlschläge werden protokolliert

### Bug Fixes
- ✅ Admin-E-Mails: ICS-Anhänge jetzt korrekt
- ✅ Bestätigungs-E-Mails: "Invalid Date" behoben
- ✅ Kalender-Link: In allen E-Mails enthalten
- ✅ Date-Parsing: Zentrale Validierung via date-utils.ts

---

## Version 1.0 - Initial Release (16. Nov 2025)

### Core Features
- ✅ 3-Tages-Event Support (Fr-So)
- ✅ Google Calendar Integration
- ✅ E-Mail-Benachrichtigungen via Gmail API
- ✅ Admin Panel mit Passwortschutz
- ✅ Audit Log für alle Aktionen
- ✅ Rate Limiting & Sicherheit
- ✅ Doppelbuchungsschutz
- ✅ Wartungsmodus

### Google Calendar
- ✅ OAuth 2.0 Integration
- ✅ Automatische Event-Erstellung
- ✅ Event-Updates & Löschung
- ✅ ICS-Datei-Export

### Admin Features
- ✅ Terminverwaltung (Bestätigen/Ablehnen)
- ✅ System-Einstellungen
- ✅ Google Calendar Status
- ✅ Audit Log Viewer
- ✅ Gefahrenbereich (Lösch-Funktionen)
