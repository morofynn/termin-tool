/**
 * Version Configuration
 * 
 * Update this file when releasing a new version.
 */

export const VERSION = '1.1.11';
export const APP_VERSION = VERSION; // Alias für Kompatibilität
export const VERSION_DATE = '2025-01-25';
export const CHANGELOG = [
  {
    version: '1.1.11',
    date: '2025-01-25',
    changes: [
      '🔧 ICS-Anhänge aus E-Mails entfernt (Final)',
      '📧 E-Mail-Account Einstellungen führten zu doppelten ICS',
      '💡 ICS-Download weiterhin über QR-Code & Termin-Detailseite',
      '✅ Google Calendar API bleibt primäre Integration',
      '📝 Hinweis in Bestätigungs-E-Mail auf ICS-Download via QR-Code'
    ]
  },
  {
    version: '1.1.10',
    date: '2025-01-25',
    changes: [
      '📧 ICS-Anhänge wieder aktiviert für Bestätigungs-E-Mails',
      '✅ Nur für Customer Confirmation (instant-booked + confirmed)',
      '❌ Kein ICS für: requested, cancelled, rejected, reminder, admin',
      '🔧 Google Calendar API bleibt primäre Integration',
      '📎 ICS ist Backup/Alternative für Kunden ohne Google'
    ]
  },
  {
    version: '1.1.9',
    date: '2025-01-25',
    changes: [
      '🔧 ICS-Generierung vereinfacht (Test 1)',
      '📧 Alle ICS-Anhänge aus E-Mails entfernt',
      '✅ Google Calendar API generiert automatisch ICS',
      '📎 ICS nur noch für Download-Links (QR-Code, Detail-Seite)'
    ]
  },
  {
    version: '1.1.8',
    date: '2025-01-25',
    changes: [
      '🔧 ICS-Generierung zurück zu backup-24-11 Verhalten',
      '📧 Minimalistisches ICS: KEIN attendees, KEIN method',
      '✅ Problem liegt an Gmail-Konto Einstellungen, nicht am Code'
    ]
  },
  {
    version: '1.1.7',
    date: '2025-01-25',
    changes: [
      '🔧 ICS method auf PUBLISH gesetzt',
      '📧 Verhindert doppelte ICS-Dateien durch Gmail/Outlook',
      '✅ Fix für mail-anhang.ics Problem'
    ]
  },
  {
    version: '1.1.6',
    date: '2025-01-24',
    changes: [
      '🔧 method=REQUEST aus ICS entfernt',
      '📧 Verhindert doppelte ICS-Dateien (mail-anhang.ics)',
      '🎨 Logo-URL auf neue URL geändert'
    ]
  },
  {
    version: '1.1.5',
    date: '2025-01-24',
    changes: [
      '🔧 attendees komplett aus ICS entfernt',
      '📧 Verhindert unerwünschte E-Mails von Google Calendar',
      '✅ sendUpdates=none zu allen Google Calendar API Calls hinzugefügt'
    ]
  },
  {
    version: '1.1.4',
    date: '2025-01-24',
    changes: [
      '🔧 Slot-Zähler Fix: Dynamische Anzeige basierend auf Admin-Einstellungen',
      '📊 Slot-Status-Indikator zeigt korrekte Anzahl',
      '🎨 Visuelle Verbesserungen bei Slot-Status'
    ]
  },
  {
    version: '1.1.3',
    date: '2025-01-24',
    changes: [
      '🔧 Google Calendar Event-Erstellung ohne RSVP',
      '📧 sendUpdates=none für alle Google Calendar API Calls',
      '✅ Audit-Log Bugfixes'
    ]
  },
  {
    version: '1.1.2',
    date: '2025-01-24',
    changes: [
      '🔧 Slot-Berechnung korrekt implementiert',
      '🐛 maxBookingsPerSlot vs maxAppointmentsPerSlot geklärt',
      '📧 E-Mail-Versand Fehlerbehandlung verbessert'
    ]
  },
  {
    version: '1.1.1',
    date: '2025-01-24',
    changes: [
      '🔧 RSVP aus ICS entfernt',
      '📧 Verhindert Spam durch doppelte E-Mails',
      '✅ ICS-Dateien werden sauber generiert'
    ]
  },
  {
    version: '1.1.0',
    date: '2025-01-24',
    changes: [
      '🎉 Erste stabile Version nach Migration',
      '✅ Alle Features funktionsfähig',
      '📧 E-Mail-System mit ICS-Anhängen',
      '📅 Google Calendar Integration'
    ]
  }
];
