# Test Checklist v1.1.7

**Version:** v1.1.7  
**Datum:** 25.11.2025  
**Fix:** Doppelte ICS-Dateien in Bestätigungs-E-Mails

---

## 🎯 Test Scope

### Was wurde gefixt?
- **Problem:** Bestätigungs-E-Mails enthielten zwei ICS-Dateien (`termin.ics` + `mail-anhang.ics`)
- **Lösung:** ICS `method=PUBLISH` korrekt implementiert
- **Erwartung:** Nur **EINE** ICS-Datei in E-Mails

---

## ✅ Test Cases

### 1. ✅ Sofortbestätigung (Auto-Confirm)

**Vorbereitung:**
- Admin-Panel → Settings → **Auto-Confirm aktiviert**

**Test-Schritte:**
1. Terminbuchung durchführen
2. Bestätigungs-E-Mail empfangen
3. E-Mail öffnen und Anhänge prüfen

**Erwartetes Ergebnis:**
- ✅ **NUR eine ICS-Datei** namens `termin.ics`
- ❌ KEINE zweite Datei namens `mail-anhang.ics` oder `invite.ics`

**Status:** [ ] PASS | [ ] FAIL

---

### 2. ✅ Manuelle Bestätigung

**Vorbereitung:**
- Admin-Panel → Settings → **Auto-Confirm deaktiviert**

**Test-Schritte:**
1. Terminbuchung durchführen
2. Admin-Panel → Termin manuell bestätigen
3. Bestätigungs-E-Mail empfangen
4. E-Mail öffnen und Anhänge prüfen

**Erwartetes Ergebnis:**
- ✅ **NUR eine ICS-Datei** namens `termin.ics`
- ❌ KEINE zweite Datei

**Status:** [ ] PASS | [ ] FAIL

---

### 3. ✅ ICS Import - Gmail

**Test-Schritte:**
1. ICS-Datei aus E-Mail herunterladen
2. In Gmail Kalender importieren:
   - Gmail öffnen
   - Kalender → Einstellungen → Import & Export
   - ICS-Datei hochladen

**Erwartetes Ergebnis:**
- ✅ Termin wird als **normaler Termin** importiert (nicht als Einladung)
- ✅ Keine Auto-Response an Absender
- ✅ Keine zusätzlichen E-Mails

**Status:** [ ] PASS | [ ] FAIL

---

### 4. ✅ ICS Import - Outlook

**Test-Schritte:**
1. ICS-Datei aus E-Mail herunterladen
2. In Outlook importieren:
   - Outlook öffnen
   - Datei → Öffnen & Exportieren → Kalender importieren
   - ICS-Datei auswählen

**Erwartetes Ergebnis:**
- ✅ Termin wird als **normaler Termin** importiert
- ✅ Keine Meeting-Einladung
- ✅ Keine Auto-Response

**Status:** [ ] PASS | [ ] FAIL

---

### 5. ✅ ICS Import - Apple Calendar (iOS)

**Test-Schritte:**
1. E-Mail auf iPhone/iPad öffnen
2. ICS-Anhang antippen
3. "Zu Kalender hinzufügen" wählen

**Erwartetes Ergebnis:**
- ✅ Termin wird als **normaler Termin** importiert
- ✅ Keine Einladung
- ✅ Kein RSVP-Dialog

**Status:** [ ] PASS | [ ] FAIL

---

### 6. ✅ ICS Import - Google Calendar (Web)

**Test-Schritte:**
1. ICS-Datei aus E-Mail herunterladen
2. Google Calendar öffnen
3. Einstellungen → Import & Export → Import
4. ICS-Datei hochladen

**Erwartetes Ergebnis:**
- ✅ Termin wird importiert
- ✅ Keine Meeting-Einladung
- ✅ Keine E-Mail-Benachrichtigungen

**Status:** [ ] PASS | [ ] FAIL

---

### 7. ✅ ICS Content Validation

**Test-Schritte:**
1. ICS-Datei aus E-Mail extrahieren
2. Mit Text-Editor öffnen
3. Inhalt prüfen

**Erwartete ICS-Struktur:**
```
BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//MORO//NONSGML Event Calendar//EN
METHOD:PUBLISH   ← Muss PUBLISH sein (NICHT REQUEST)
CALSCALE:GREGORIAN

BEGIN:VEVENT
UID:...
DTSTAMP:...
DTSTART:...
DTEND:...
SUMMARY:Termin: MORO - OPTI 26
DESCRIPTION:...
LOCATION:Stand C4.246, Messe München (OPTI 26)
ORGANIZER;CN=MORO:mailto:info@moro-gmbh.de
STATUS:CONFIRMED
END:VEVENT

END:VCALENDAR
```

**Prüfpunkte:**
- ✅ `METHOD:PUBLISH` vorhanden
- ✅ KEINE `ATTENDEE` Zeilen
- ✅ Nur `ORGANIZER` vorhanden
- ✅ `STATUS:CONFIRMED`

**Status:** [ ] PASS | [ ] FAIL

---

### 8. ✅ E-Mail Spam Check

**Test-Schritte:**
1. Sofortbestätigung triggern
2. Warten auf E-Mails (5 Minuten)
3. Alle Postfächer prüfen (Kunde + Admin)

**Erwartetes Ergebnis:**
- ✅ Kunde erhält **nur** Bestätigungs-E-Mail
- ✅ Admin erhält **nur** Admin-Benachrichtigung
- ❌ KEINE Auto-Response E-Mails
- ❌ KEINE zusätzlichen Meeting-Einladungen
- ❌ KEINE Spam-Mails

**Status:** [ ] PASS | [ ] FAIL

---

### 9. ✅ Admin-E-Mail (mit ICS)

**Vorbereitung:**
- Admin erhält auch ICS bei Bestätigungen

**Test-Schritte:**
1. Termin bestätigen (auto oder manuell)
2. Admin-E-Mail empfangen
3. Anhänge prüfen

**Erwartetes Ergebnis:**
- ✅ **NUR eine ICS-Datei**
- ❌ KEINE zweite ICS

**Status:** [ ] PASS | [ ] FAIL

---

### 10. ✅ Mobile E-Mail Clients

**Test-Schritte:**
1. Bestätigungs-E-Mail auf verschiedenen Geräten öffnen:
   - iPhone Mail App
   - Android Gmail App
   - Outlook Mobile App

**Erwartetes Ergebnis:**
- ✅ **NUR eine ICS-Datei** sichtbar
- ✅ ICS kann geöffnet/importiert werden
- ❌ KEINE zweite ICS

**Status:** [ ] PASS | [ ] FAIL

---

## 🔍 Debugging

### ICS-Datei prüfen
```bash
# ICS aus E-Mail extrahieren und prüfen
cat termin.ics | grep "METHOD:"
# Sollte ausgeben: METHOD:PUBLISH

cat termin.ics | grep "ATTENDEE:"
# Sollte NICHTS ausgeben (keine ATTENDEES)

cat termin.ics | grep "ORGANIZER:"
# Sollte ausgeben: ORGANIZER;CN=MORO:mailto:info@moro-gmbh.de
```

### Gmail Raw E-Mail prüfen
1. E-Mail öffnen
2. "..." Menü → "Original anzeigen"
3. Suche nach `Content-Type: text/calendar`
4. Prüfe ob `method=` im Header (sollte NICHT da sein)

---

## 📊 Test Results

### Summary

| Test Case | Status | Notes |
|-----------|--------|-------|
| 1. Sofortbestätigung | [ ] | |
| 2. Manuelle Bestätigung | [ ] | |
| 3. Gmail Import | [ ] | |
| 4. Outlook Import | [ ] | |
| 5. Apple Calendar Import | [ ] | |
| 6. Google Calendar Import | [ ] | |
| 7. ICS Content | [ ] | |
| 8. Spam Check | [ ] | |
| 9. Admin E-Mail | [ ] | |
| 10. Mobile Clients | [ ] | |

**Overall Status:** [ ] PASS | [ ] FAIL

---

## 🐛 Known Issues

### Issues from v1.1.6
- [x] ~~Doppelte ICS-Dateien~~ → **FIXED in v1.1.7**

### New Issues (if any)
- [ ] N/A

---

## 📝 Test Notes

### Environment
- **Environment:** [ ] Development | [ ] Production
- **Browser:** _________________
- **OS:** _________________
- **E-Mail Client:** _________________
- **Tested by:** _________________
- **Date:** _________________

### Additional Notes
```
(Add any additional observations or issues here)
```

---

## ✅ Sign-Off

**Tester:** ___________________  
**Date:** ___________________  
**Signature:** ___________________

**Approved for Production:** [ ] YES | [ ] NO

---

## 🚀 Deployment

### Pre-Deployment
- [x] All tests PASS
- [x] Code reviewed
- [x] Version bumped
- [x] Documentation updated

### Deployment Steps
```bash
# Push to GitHub
git push origin main

# Deploy to Production
wrangler deploy

# Verify deployment
curl https://your-app.workers.dev/api/health
```

### Post-Deployment
- [ ] Smoke test in production
- [ ] Monitor error logs
- [ ] User feedback
- [ ] Metrics check

---

## 📚 References

- [BUGFIX-REPORT-V1.1.7.md](./BUGFIX-REPORT-V1.1.7.md)
- [BUGFIX-REPORT-V1.1.6.md](./BUGFIX-REPORT-V1.1.6.md)
- [RFC 5546 - iCalendar iTIP](https://datatracker.ietf.org/doc/html/rfc5546)

---

**Last Updated:** 25.11.2025  
**Version:** v1.1.7
