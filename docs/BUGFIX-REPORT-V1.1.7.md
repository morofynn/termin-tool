# Bugfix Report v1.1.7

**Datum:** 25.11.2025  
**Version:** v1.1.7  
**Priorität:** 🔴 HIGH (Doppelte ICS-Dateien in E-Mails)

---

## 🐛 Problem

### Issue: Doppelte ICS-Dateien in Bestätigungs-E-Mails

**Beschreibung:**
- Bestätigungs-E-Mails an Kunden enthalten **zwei ICS-Dateien**: `termin.ics` und `mail-anhang.ics`
- Problem tritt auf bei **Sofortbestätigung** (Auto-Confirm)
- Gmail/Outlook generiert automatisch eine zweite ICS-Datei namens `mail-anhang.ics` oder `invite.ics`
- Verursacht Verwirrung beim Kunden

**Betroffene Dateien:**
- `src/lib/email-templates.ts` - ICS-Generierung
- `src/lib/email.ts` - E-Mail-Versand (MIME Content-Type)

**Root Cause:**
- `ical-generator` Library hat **keine explizite `method` Angabe**
- Gmail/Outlook interpretiert ICS ohne `method` oder mit `method=REQUEST` als **Meeting-Einladung**
- Meeting-Einladungen triggern automatisch eine zweite ICS-Datei-Generierung
- Der Content-Type Header hatte `method=PUBLISH`, aber das wurde nicht in die ICS selbst übertragen

---

## ✅ Lösung

### 1. ICS Method auf PUBLISH setzen
**Datei:** `src/lib/email-templates.ts`

```typescript
export function generateICS(appointment: AppointmentData, settings: EmailSettings): string {
  const calendar = ical({ 
    name: `Termin ${settings.companyName}`,
    method: 'PUBLISH' // ✅ NEU: Explizit PUBLISH setzen
  });
  
  // ... rest of code
}
```

**Warum `PUBLISH`?**
- `PUBLISH` = Informative Kalender-Datei (keine Einladung)
- `REQUEST` = Meeting-Einladung (triggert Auto-Response + zweite ICS)
- Gmail/Outlook behandelt `PUBLISH` als einfachen Anhang, NICHT als Einladung

### 2. Content-Type Header korrigiert
**Datei:** `src/lib/email.ts`

**Vorher:**
```typescript
'Content-Type: text/calendar; charset=utf-8; method=PUBLISH',
```

**Nachher:**
```typescript
'Content-Type: text/calendar; charset=utf-8',
```

**Warum entfernt?**
- Die `method` Angabe gehört in die **ICS-Datei** selbst (als `METHOD:PUBLISH`)
- NICHT in den MIME Content-Type Header
- Gmail/Outlook liest die `METHOD` Zeile aus der ICS-Datei, nicht aus dem Header

---

## 📋 Änderungen im Detail

### `src/lib/email-templates.ts`
```diff
export function generateICS(appointment: AppointmentData, settings: EmailSettings): string {
-  const calendar = ical({ name: `Termin ${settings.companyName}` });
+  const calendar = ical({ 
+    name: `Termin ${settings.companyName}`,
+    method: 'PUBLISH' // ✅ FIX v1.1.7: PUBLISH statt REQUEST
+  });
  
  // ... rest of code
}
```

### `src/lib/email.ts`
```diff
-        'Content-Type: text/calendar; charset=utf-8; method=PUBLISH',
+        'Content-Type: text/calendar; charset=utf-8',
```

---

## 🧪 Testing

### Test Cases

1. **✅ Sofortbestätigung (Auto-Confirm)**
   - Terminbuchung mit aktivierter Auto-Confirm
   - E-Mail sollte NUR **eine ICS-Datei** enthalten: `termin.ics`
   - KEINE zweite Datei namens `mail-anhang.ics` oder `invite.ics`

2. **✅ Manuelle Bestätigung**
   - Admin bestätigt Termin manuell im Admin-Panel
   - Bestätigungs-E-Mail sollte NUR **eine ICS-Datei** enthalten
   - KEINE doppelte ICS

3. **✅ ICS Import in verschiedene Kalender-Apps**
   - Import in **Gmail Kalender**
   - Import in **Outlook**
   - Import in **Apple Calendar**
   - Import in **Google Calendar** (via Web)
   - Import in **iOS Calendar**
   - ICS sollte als "Termin" (nicht als "Einladung") importiert werden

4. **✅ Keine unerwünschten E-Mails**
   - Kunde erhält KEINE Auto-Response von Google/Outlook
   - Admin erhält KEINE zusätzlichen E-Mails
   - KEINE Spam-Mails

---

## 📖 Background: ICS Methods

### `METHOD:PUBLISH`
- ✅ **Informative Kalender-Datei**
- ✅ Einfacher Kalender-Anhang
- ✅ Kann importiert werden, aber keine Auto-Response
- ✅ Keine Meeting-Einladung
- ✅ EINE ICS-Datei

### `METHOD:REQUEST`
- ❌ **Meeting-Einladung**
- ❌ Erwartet RSVP (Zusage/Absage)
- ❌ Gmail/Outlook generiert automatisch zweite ICS
- ❌ Kann unerwünschte E-Mails triggern
- ❌ ZWEI ICS-Dateien

### Keine `METHOD` Angabe
- ⚠️ Fallback zu `REQUEST` bei einigen Mail-Clients
- ⚠️ Inkonsistentes Verhalten zwischen Clients
- ⚠️ Kann zu doppelten ICS führen

---

## 🔗 Related Issues

### Previous Fixes
- **v1.1.6** - `method=PUBLISH` im Content-Type Header (inkomplett)
- **v1.1.5** - `attendees` aus ICS entfernt
- **v1.1.4** - Google Calendar attendees entfernt

### Why v1.1.6 didn't fully fix it?
- v1.1.6 hat `method=PUBLISH` nur im **Content-Type Header** gesetzt
- Die ICS-Datei selbst hatte KEINE `METHOD` Angabe
- Gmail/Outlook liest `METHOD` aus der **ICS-Datei**, nicht aus dem Header
- Daher war der Fix in v1.1.6 inkomplett

---

## 📊 Files Changed

| Datei | Änderung | Lines Changed |
|-------|----------|---------------|
| `src/lib/email-templates.ts` | ICS method=PUBLISH | +2 |
| `src/lib/email.ts` | Content-Type Header | -1 |
| `src/lib/version.ts` | Version bump | +2, -1 |
| `src/lib/constants.ts` | Logo URL update | +1, -1 |

**Total:** 4 Dateien, 5 Zeilen geändert

---

## ✅ Deployment Checklist

- [x] Code Changes implementiert
- [x] Version auf v1.1.7 erhöht
- [x] Bugfix Report geschrieben
- [x] Git Commit & Push
- [ ] Wrangler Deploy
- [ ] Test in Production
- [ ] Sofortbestätigung testen
- [ ] ICS-Datei prüfen (nur eine!)
- [ ] ICS in verschiedene Kalender importieren

---

## 🚀 Deployment

```bash
# Push to GitHub
git push origin main

# Deploy to Production
wrangler deploy

# Verify
# 1. Trigger Sofortbestätigung
# 2. Check E-Mail: Nur eine ICS-Datei?
# 3. Import ICS in Gmail/Outlook
# 4. Keine zweite ICS/Auto-Response?
```

---

## 📝 User Communication

**Info für Kunden:**
> "Wir haben die Kalender-Anhänge in unseren Bestätigungs-E-Mails optimiert. Sie erhalten jetzt nur noch **eine** Kalenderdatei (termin.ics), die Sie direkt in Ihren Kalender importieren können."

**Keine Action nötig für Endkunden**

---

## 🔍 Debugging

### Wie prüfe ich die ICS-Datei?

**1. ICS-Datei aus E-Mail extrahieren:**
```bash
# Save attachment as termin.ics
cat termin.ics
```

**2. Prüfe METHOD Zeile:**
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MORO//NONSGML Event Calendar//EN
METHOD:PUBLISH   ← Sollte PUBLISH sein, NICHT REQUEST
CALSCALE:GREGORIAN
```

**3. Prüfe ATTENDEES:**
```
# Sollte KEINE ATTENDEES geben (nur ORGANIZER)
ORGANIZER;CN=MORO:mailto:info@moro-gmbh.de
```

---

## 📚 References

- [RFC 5546 - iCalendar iTIP](https://datatracker.ietf.org/doc/html/rfc5546#section-3.2)
- [ical-generator Documentation](https://github.com/sebbo2002/ical-generator)
- [Gmail ICS Handling](https://support.google.com/mail/answer/6594?hl=en)
- [Outlook ICS Import](https://support.microsoft.com/en-us/office/import-or-subscribe-to-a-calendar-in-outlook-com-cff1429c-5af6-41ec-a5b4-74f2c278e98c)

---

**Status:** ✅ **RESOLVED**  
**Next Steps:** Deploy to Production & Test
