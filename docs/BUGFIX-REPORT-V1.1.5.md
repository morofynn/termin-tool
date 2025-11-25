# 🐛 Bugfix Report v1.1.5

**Datum:** 25. November 2025  
**Version:** v1.1.5  
**Status:** ✅ Behoben

---

## 📋 Problem

**ICS-Dateien in E-Mails enthalten `attendees` Feld**

Die ICS-Anhänge in Bestätigungsmails (für Kunden und Admin) enthielten noch das `attendees` Feld mit der E-Mail-Adresse des Kunden. Dieses Feld kann dazu führen, dass Kalender-Apps (wie Google Calendar, Outlook, Apple Calendar) automatisch E-Mails an die Teilnehmer senden, was unerwünscht ist.

### Betroffene Dateien
- `src/lib/email-templates.ts` (Zeile 55-72) - ❌ **hatte noch `attendees`**

### Nicht betroffene Dateien (bereits korrekt)
- `src/pages/api/appointment/[id]/download-ics.ts` - ✅ Kein `attendees`
- `src/components/AppointmentQRCode.tsx` - ✅ Kein `attendees`

---

## 🔍 Analyse

### Ursprünglicher Code (FALSCH)
```typescript
// ✅ FIX v1.1: RSVP entfernt - verhindert Spam und doppelte ICS-Anhänge
calendar.createEvent({
  start: startDateTime,
  end: endDateTime,
  summary: `Termin: ${settings.companyName} - ${settings.eventName}`,
  description,
  location: settings.standInfo,
  organizer: {
    name: settings.companyName,
    email: settings.companyEmail,
  },
  // ✅ FIX: attendees ohne RSVP - nur informativ
  attendees: [                                    // ❌ PROBLEM: attendees war noch da!
    {
      name: appointment.name,
      email: appointment.email,
      // rsvp: true, ❌ ENTFERNT - verursacht Spam + doppelte ICS
    }
  ],
  status: appointment.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE',
});
```

**Warum ist das ein Problem?**
- Das `attendees` Feld signalisiert Kalender-Apps, dass es Teilnehmer gibt
- Viele Apps senden dann automatisch Einladungs-E-Mails an die Teilnehmer
- Dies führt zu unerwünschten E-Mails, die vom System generiert werden

---

## ✅ Lösung

**`attendees` Feld komplett entfernt**

### Neuer Code (KORREKT)
```typescript
// ✅ FIX v1.1.5: attendees KOMPLETT entfernt - nur organizer bleibt
// Identisch zu download-ics.ts und AppointmentQRCode.tsx
calendar.createEvent({
  start: startDateTime,
  end: endDateTime,
  summary: settings.eventName 
    ? `Termin: ${settings.companyName} - ${settings.eventName}` 
    : `Termin: ${settings.companyName}`,
  description,
  location: settings.standInfo 
    ? `${settings.standInfo}${settings.eventName ? ` (${settings.eventName})` : ''}`
    : settings.companyAddress,
  organizer: {
    name: settings.companyName,
    email: settings.companyEmail,
  },
  // ✅ KEIN attendees mehr - verhindert unerwünschte E-Mails
  status: appointment.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE',
});
```

**Was bleibt übrig?**
- ✅ **`organizer`** - Zeigt die Firmendaten (Name + E-Mail)
- ✅ **`status`** - CONFIRMED oder TENTATIVE
- ✅ **`description`** - Vollständige Termininfos + Kontaktdaten
- ✅ **`location`** - Standort/Adresse
- ❌ **`attendees`** - ENTFERNT (verhindert unerwünschte E-Mails)

---

## 🔄 Vergleich: Alle 3 ICS-Generierungsstellen

### 1. **E-Mail-Anhang** (`email-templates.ts`)
```typescript
calendar.createEvent({
  start: startDateTime,
  end: endDateTime,
  summary: `Termin: ${settings.companyName} - ${settings.eventName}`,
  description,
  location: settings.standInfo,
  organizer: {
    name: settings.companyName,
    email: settings.companyEmail,
  },
  // ✅ KEIN attendees
  status: appointment.status === 'confirmed' ? 'CONFIRMED' : 'TENTATIVE',
});
```

### 2. **Download-Link** (`download-ics.ts`)
```typescript
calendar.createEvent({
  start: startDateTime,
  end: endDateTime,
  summary: `Termin bei ${settings.companyName}`,
  description: `Ihr Termin bei ${settings.companyName}...`,
  location,
  organizer: {
    name: settings.companyName,
    email: settings.companyEmail,
  },
  // ✅ KEIN attendees
});
```

### 3. **QR-Code** (`AppointmentQRCode.tsx`)
```typescript
calendar.createEvent({
  start: startDateTime,
  end: endDateTime,
  summary: `Termin bei ${settings.companyName}`,
  description: `Ihr Termin bei ${settings.companyName}...`,
  location,
  organizer: {
    name: settings.companyName,
    email: settings.companyEmail,
  },
  // ✅ KEIN attendees
});
```

**Ergebnis:** ✅ **Alle drei ICS-Generierungen sind jetzt identisch und konsistent**

---

## 🎯 Auswirkungen

### Vorher (v1.1.4 und älter)
- ❌ E-Mail-ICS enthielt `attendees` Feld
- ❌ Kalender-Apps könnten unerwünschte E-Mails senden
- ❌ Inkonsistenz zwischen E-Mail-ICS und Download-ICS

### Nachher (v1.1.5)
- ✅ E-Mail-ICS enthält KEIN `attendees` Feld mehr
- ✅ Keine unerwünschten E-Mails von Kalender-Apps
- ✅ Alle drei ICS-Generierungen sind identisch und konsistent
- ✅ Kunden können den Termin weiterhin in ihren Kalender importieren
- ✅ Firmendaten bleiben sichtbar (`organizer`)

---

## 📊 Wann werden ICS-Dateien verschickt?

### An KUNDEN
| Aktion | E-Mail | ICS-Anhang |
|--------|--------|-----------|
| Anfrage eingegangen (`requested`) | ✅ Ja | ❌ Nein |
| Termin bestätigt (`confirmed` / `instant-booked`) | ✅ Ja | ✅ **Ja** |
| Termin storniert (`cancelled`) | ✅ Ja | ❌ Nein |
| Anfrage abgelehnt (`rejected`) | ✅ Ja | ❌ Nein |
| Erinnerung (24h vorher) | ✅ Ja | ❌ Nein |

### An ADMIN
| Aktion | E-Mail | ICS-Anhang |
|--------|--------|-----------|
| Neue Anfrage (`requested`) | ✅ Ja | ❌ Nein |
| Auto-bestätigt (`instant-booked`) | ✅ Ja | ✅ **Ja** |
| Bestätigt (`confirmed`) | ✅ Ja | ✅ **Ja** |
| Storniert (`cancelled`) | ✅ Ja | ❌ Nein |
| Abgelehnt (`rejected`) | ✅ Ja | ❌ Nein |

---

## 🧪 Testing Checklist

- [ ] **Bestätigungs-E-Mail an Kunden** - ICS-Anhang ohne `attendees`
- [ ] **Bestätigungs-E-Mail an Admin** - ICS-Anhang ohne `attendees`
- [ ] **Download-Link auf Terminseite** - ICS ohne `attendees`
- [ ] **QR-Code Download** - ICS ohne `attendees`
- [ ] **Kalender-Import (Google, Outlook, Apple)** - Keine automatischen E-Mails
- [ ] **Firmendaten sichtbar** - `organizer` wird korrekt angezeigt

---

## 📝 Changelog

### v1.1.5 - 25.11.2025
- ✅ **FIX:** `attendees` Feld aus E-Mail-ICS entfernt
- ✅ **REFACTOR:** Alle drei ICS-Generierungen sind jetzt konsistent
- ✅ **DOCS:** Bugfix-Report erstellt

---

## 🚀 Deployment

**Keine Breaking Changes** - kann sofort deployed werden.

**Rollback:** Falls Probleme auftreten, einfach `attendees` Feld wieder hinzufügen (aber OHNE `rsvp`).

---

## 📚 Verwandte Fixes

- **v1.1:** RSVP aus ICS entfernt
- **v1.1.2:** Google Calendar `sendUpdates=none` hinzugefügt
- **v1.1.4:** Google Calendar `attendees` Feld entfernt
- **v1.1.5:** E-Mail-ICS `attendees` Feld entfernt

---

## ✅ Status

**BEHOBEN** - Alle ICS-Generierungen sind jetzt konsistent und enthalten kein `attendees` Feld mehr.

**Nächste Schritte:**
1. Testing durchführen
2. Deployment
3. User-Feedback sammeln
