/**
 * Version Management
 * 
 * Zentrale Version für das gesamte Projekt
 */

export const APP_VERSION = 'v1.1.8';

export const CHANGELOG = [
  {
    version: 'v1.1.8',
    date: '2025-01-XX',
    changes: [
      '🐛 FIX: Doppelte ICS-Dateien in Bestätigungs-E-Mails behoben',
      '✅ ICS method Parameter komplett entfernt (backup-19-11 Verhalten wiederhergestellt)',
      '✅ Nur noch eine ICS-Datei (termin.ics) wird verschickt',
      '✅ Gilt für beide Bestätigungsmail-Typen (instant-booked + confirmed)'
    ]
  },
  {
    version: 'v1.1.7',
    date: '2025-01-XX',
    changes: [
      '🐛 FIX: Doppelte ICS-Dateien in Bestätigungs-E-Mails (method=PUBLISH)',
      '✅ Keine unerwünschten "mail-anhang.ics" oder "invite.ics" mehr',
      '🎨 Logo-URL auf neue URL aktualisiert'
    ]
  },
  {
    version: 'v1.1.6',
    date: '2025-01-XX',
    changes: [
      '🐛 FIX: Google Calendar E-Mail-Spam komplett verhindert',
      '✅ attendees-Feld aus Google Calendar Events entfernt',
      '✅ sendUpdates=none zu allen Google Calendar API Calls hinzugefügt',
      '✅ ICS-Dateien ohne attendees (verhindert unerwünschte E-Mails)',
      '🎨 Audit-Log IDs werden nun vollständig angezeigt'
    ]
  },
  {
    version: 'v1.1.5',
    date: '2025-01-XX',
    changes: [
      '🐛 FIX: Slot-Zähler zeigt jetzt korrekt 1/5, 2/5, 3/5 etc.',
      '✅ maxBookingsPerSlot nur aus Availability API laden (verhindert Race Conditions)',
      '✅ Google Calendar: Stornierte Events werden übersprungen',
      '✅ Audit-Log: Appointment-ID wird nun korrekt angezeigt'
    ]
  },
  {
    version: 'v1.1.4',
    date: '2025-01-XX',
    changes: [
      '🎨 Neue Audit-Log Funktion im Admin-Panel',
      '✅ Vollständige Nachverfolgung aller Systemaktionen',
      '✅ Filterfunktion nach Aktionen (Buchung, Bestätigung, Stornierung, etc.)',
      '✅ Automatische Bereinigung nach 90 Tagen'
    ]
  },
  {
    version: 'v1.1.3',
    date: '2025-01-XX',
    changes: [
      '🐛 FIX: E-Mail RSVP Spam behoben',
      '✅ RSVP aus ICS-Dateien entfernt',
      '✅ Keine unerwünschten Meeting-Einladungen mehr'
    ]
  },
  {
    version: 'v1.1.2',
    date: '2025-01-XX',
    changes: [
      '🎨 Verbesserte Admin-UI',
      '✅ Sortierung nach Datum',
      '✅ Besseres Responsive Design'
    ]
  },
  {
    version: 'v1.1.1',
    date: '2025-01-XX',
    changes: [
      '🐛 Bugfixes',
      '✅ Performance-Verbesserungen'
    ]
  },
  {
    version: 'v1.1.0',
    date: '2025-01-XX',
    changes: [
      '🚀 Initiales Release',
      '✅ Terminbuchung',
      '✅ Admin-Panel',
      '✅ Google Calendar Integration',
      '✅ E-Mail Benachrichtigungen'
    ]
  }
];
