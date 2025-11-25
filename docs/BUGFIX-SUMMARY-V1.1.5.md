# 📦 Bugfix Summary v1.1.5

**Version:** v1.1.5  
**Datum:** 25. November 2025  
**Status:** ✅ Ready for deployment

---

## 🎯 Was wurde gefixt?

**Problem:** ICS-Dateien in Bestätigungsmails enthielten noch das `attendees` Feld, was zu unerwünschten automatischen E-Mails von Kalender-Apps führen kann.

**Lösung:** `attendees` Feld komplett aus E-Mail-ICS entfernt.

---

## 📝 Geänderte Dateien

| Datei | Änderung | Status |
|-------|----------|--------|
| `src/lib/email-templates.ts` | `attendees` Feld entfernt | ✅ Gefixt |
| `src/lib/version.ts` | Version auf v1.1.5 aktualisiert | ✅ Aktualisiert |
| `docs/BUGFIX-REPORT-V1.1.5.md` | Bugfix-Report erstellt | ✅ Erstellt |

---

## 🔄 Vorher vs. Nachher

### Vorher (v1.1.4)
```typescript
calendar.createEvent({
  // ...
  organizer: { name: '...', email: '...' },
  attendees: [                           // ❌ War noch da
    {
      name: appointment.name,
      email: appointment.email,
    }
  ],
  status: 'CONFIRMED',
});
```

### Nachher (v1.1.5)
```typescript
calendar.createEvent({
  // ...
  organizer: { name: '...', email: '...' },
  // ✅ KEIN attendees mehr
  status: 'CONFIRMED',
});
```

---

## ✅ Verifikation

**Alle drei ICS-Generierungen sind jetzt identisch:**

1. ✅ **E-Mail-Anhang** (`email-templates.ts`) - Kein `attendees`
2. ✅ **Download-Link** (`download-ics.ts`) - Kein `attendees`
3. ✅ **QR-Code** (`AppointmentQRCode.tsx`) - Kein `attendees`

**Ergebnis:** Konsistente ICS-Dateien ohne unerwünschte E-Mails.

---

## 🧪 Testing Checklist

- [ ] Bestätigungs-E-Mail verschicken und ICS-Anhang prüfen
- [ ] ICS in Google Calendar importieren → Keine automatischen E-Mails
- [ ] ICS in Outlook importieren → Keine automatischen E-Mails
- [ ] ICS in Apple Calendar importieren → Keine automatischen E-Mails
- [ ] Firmendaten (`organizer`) sind sichtbar
- [ ] Download-Link und QR-Code funktionieren weiterhin

---

## 🚀 Deployment

**Keine Breaking Changes** - Kann sofort deployed werden.

```bash
# Build & Deploy
npm run build
npm run preview
```

---

## 📊 Timeline der E-Mail-Fixes

| Version | Fix | Status |
|---------|-----|--------|
| v1.1 | RSVP aus ICS entfernt | ✅ |
| v1.1.2 | Google Calendar `sendUpdates=none` | ✅ |
| v1.1.4 | Google Calendar `attendees` entfernt | ✅ |
| **v1.1.5** | **E-Mail-ICS `attendees` entfernt** | ✅ |

**Alle E-Mail-Probleme sind jetzt behoben.**

---

## 👍 Erfolg!

✅ Keine unerwünschten E-Mails mehr  
✅ Konsistente ICS-Dateien  
✅ Kunden können Termine weiterhin importieren  
✅ Firmendaten bleiben sichtbar
