# Changelog

Alle wichtigen Änderungen am Terminbuchungs-Tool werden hier dokumentiert.

## [1.1.0] - 2025-11-19

### Neue Features
- **QR-Code für Kalender-Import**: Terminbestätigungsseite zeigt jetzt QR-Code zum Scannen
- **ICS-Download via QR-Code**: QR-Code enthält Download-Link statt embedded ICS-Daten (bessere Android-Kompatibilität)
- **Optimiertes Design**: Kompakterer QR-Code (200px), weiß auf blau, kleinere Überschriften
- **ICS-Download-Endpoint**: Neuer API-Endpunkt `/api/appointment/[id]/download-ics` für direkten ICS-Download
- **Verbesserte ICS-Formatierung**: Absätze nach "Kontakt:" für bessere Lesbarkeit
- **Terminansicht-Link in ICS**: Jede ICS-Datei enthält nun Link zur Terminverwaltung

### Verbesserungen
- ICS-Description mit Zeilenumbrüchen nach jedem Kontaktfeld
- QR-Code funktioniert jetzt auch auf Android (vorher nur iOS)
- Kompakteres UI für QR-Code-Bereich

---

## [1.0.0] - 2025-11-19

### Features
- **Terminbuchung**: Interaktive Kalender-Ansicht zur Terminauswahl
- **Admin-Dashboard**: Verwaltung aller Termine mit Bestätigen/Ablehnen/Stornieren
- **Google Calendar Integration**: OAuth 2.0 mit automatischer Sync
- **E-Mail-Benachrichtigungen**: Automatischer Versand via Gmail API
- **ICS-Attachments**: Alle Termin-E-Mails enthalten ICS-Datei
- **Konfigurierbare Zeiten**: Arbeitszeiten und Termindauer anpassbar
- **Rate Limiting**: Max 5 Buchungen pro IP/Tag
- **Audit-Log**: Alle Admin-Aktionen werden protokolliert
- **Mobile-optimiert**: Responsive Design für alle Geräte

### Design
- Modernes UI mit Tailwind CSS 4
- shadcn/ui Komponenten-Bibliothek
- Animierte Übergänge und Feedback
- Touch-optimierte mobile UI

### Sicherheit
- Passwort-geschütztes Admin-Panel
- Dynamischer Admin-Pfad (konfigurierbar)
- Input-Validierung mit Zod
- HTTP-only Cookies für Sessions
- Environment Variables für Secrets

### Performance
- Cloudflare Workers Edge Computing
- Cloudflare KV Store
- Optimierte Bundle-Größe
- Lazy Loading für React Components

### Integration
- Embed-Modus für iFrame-Einbettung
- Popup-Modus für Modal-Integration
- Multi-Tenant Support (White-Label)

---

## Geplant für [1.2.0]

### Features in Planung
- **Termin Umbuchungsfunktion**: Kunden können Termine selbst umbuchen
- **CSV/Excel Export**: Export aller Termine für Reporting
