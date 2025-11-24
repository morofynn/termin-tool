# 🧪 Bugfix Test Guide v2.1.0

**Datum:** 24. November 2025  
**Version:** 2.1.0  
**Status:** Ready for Testing

---

## 📋 Quick Test Checklist

### ✅ Test #1: Sofortbuchung (Spam-Fix)
**Dauer:** 5 Minuten  
**Ziel:** Prüfen dass E-Mail NICHT mehr im Spam landet

**Schritte:**
1. ✅ Öffne Terminbuchungs-Tool
2. ✅ Aktiviere "Sofortbestätigung" im Admin-Panel (Settings)
3. ✅ Buche einen Termin als Kunde
4. ✅ Prüfe E-Mail-Eingang (NICHT Spam-Ordner!)
5. ✅ Öffne E-Mail und prüfe ICS-Anhang

**Erwartetes Ergebnis:**
- ✅ E-Mail landet im Posteingang (NICHT Spam)
- ✅ Nur EINE ICS-Datei im Anhang
- ✅ Keine RSVP-Anfrage sichtbar
- ✅ Kalender-Import funktioniert

**Fehler-Symptome (falls Bug noch da):**
- ❌ E-Mail landet im Spam
- ❌ Zwei ICS-Dateien im Anhang
- ❌ "RSVP: Ja/Nein/Vielleicht" Buttons in Kalender-App

---

### ✅ Test #2: Google Calendar Deletion
**Dauer:** 3 Minuten  
**Ziel:** Prüfen dass Google Event nur EINMAL gelöscht wird

**Schritte:**
1. ✅ Buche Termin (mit Google Calendar Integration)
2. ✅ Admin storniert Termin
3. ✅ Admin löscht Termin endgültig
4. ✅ Prüfe Browser Console & Audit-Log

**Erwartetes Ergebnis:**
- ✅ Google Calendar Event wird bei Stornierung gelöscht
- ✅ Beim endgültigen Löschen KEIN zweiter Versuch
- ✅ Console zeigt: "⏭️ Skipping deletion (already cancelled)"
- ✅ Keine Fehler-Logs

**Fehler-Symptome (falls Bug noch da):**
- ❌ Console zeigt "Error 404" beim Löschen
- ❌ Audit-Log zeigt "Google Calendar Fehler"
- ❌ Zwei DELETE-Requests in Network-Tab

---

### ✅ Test #3: Slot-Count Konsistenz
**Dauer:** 5 Minuten  
**Ziel:** Prüfen dass Slot-Count korrekt funktioniert

**Schritte:**
1. ✅ Admin-Panel öffnen → Zeitplan-Ansicht
2. ✅ Notiere Slot-Count für bestimmten Zeitslot (z.B. "2/3")
3. ✅ Buche einen Termin für diesen Slot
4. ✅ Prüfe ob Count auf "3/3" steigt
5. ✅ Storniere den Termin wieder
6. ✅ Prüfe ob Count auf "2/3" zurückgeht

**Erwartetes Ergebnis:**
- ✅ Slot-Count steigt korrekt (+1)
- ✅ Slot-Count sinkt korrekt (-1)
- ✅ Count wird niemals negativ
- ✅ Überbuchung nicht möglich

**Fehler-Symptome (falls Bug noch da):**
- ❌ Count wird negativ (z.B. "-1/3")
- ❌ Count ändert sich nicht
- ❌ Überbuchung möglich (z.B. "4/3")

---

### ✅ Test #4: Audit-Log IDs
**Dauer:** 2 Minuten  
**Ziel:** Prüfen dass Audit-Log IDs einheitlich sind

**Schritte:**
1. ✅ Admin-Panel öffnen → Audit-Log
2. ✅ Prüfe Format der IDs in der Liste
3. ✅ Führe mehrere Aktionen aus (Buchung, Stornierung, etc.)
4. ✅ Prüfe neue IDs im Audit-Log

**Erwartetes Ergebnis:**
- ✅ Alle IDs haben Format: `log_1234567890_abc123xyz`
- ✅ Sortierung nach Timestamp funktioniert
- ✅ IDs sind eindeutig (keine Duplikate)
- ✅ Filterung nach Termin-ID möglich

**Fehler-Symptome (falls Bug noch da):**
- ❌ Gemischte ID-Formate (UUID + Timestamp)
- ❌ Sortierung funktioniert nicht
- ❌ Duplikate möglich

---

## 🔍 Advanced Tests (Optional)

### Advanced Test #1: Race Condition (Parallele Buchungen)
**Dauer:** 10 Minuten  
**Ziel:** Prüfen dass keine Überbuchung bei gleichzeitigen Requests möglich ist

**Setup:**
```bash
# Terminal 1 & 2: Zwei parallele Curl-Requests
curl -X POST http://localhost:3000/api/book-appointment \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Test User 1",
    "email": "test1@example.com",
    "phone": "1234567890",
    "day": "friday",
    "time": "10:00",
    "appointmentDate": "2026-01-16"
  }'
```

**Erwartetes Ergebnis:**
- ✅ Nur EINER der beiden Requests erfolgreich
- ✅ Zweiter Request bekommt "Slot bereits vergeben" Fehler
- ✅ Slot-Count bleibt konsistent

---

### Advanced Test #2: Email MIME Structure
**Dauer:** 5 Minuten  
**Ziel:** Prüfen dass E-Mail korrekt formatiert ist

**Schritte:**
1. ✅ Buche Termin
2. ✅ Öffne E-Mail in Client
3. ✅ "Quellcode anzeigen" / "Show Original"
4. ✅ Prüfe MIME-Header

**Erwartetes Ergebnis:**
```
Content-Type: multipart/mixed; boundary="..."

--boundary
Content-Type: text/html; charset=utf-8
[HTML Content]

--boundary
Content-Type: text/calendar; charset=utf-8; name="termin.ics"
Content-Disposition: attachment; filename="termin.ics"
Content-Transfer-Encoding: base64
[Base64 ICS]

--boundary--
```

- ✅ Nur EIN ICS-Anhang
- ✅ Base64-Encoding korrekt
- ✅ Kein RSVP im ICS (keine METHOD:REQUEST)

---

## 📊 Test Report Template

```markdown
## Test Report - v2.1.0

**Tester:** [Name]
**Datum:** [Datum]
**Environment:** [Production/Staging/Local]

### Test Results

#### Test #1: Sofortbuchung (Spam-Fix)
- [ ] E-Mail im Posteingang (nicht Spam)
- [ ] Nur eine ICS-Datei
- [ ] Keine RSVP-Anfrage
- **Status:** ✅ PASS / ❌ FAIL
- **Notes:** ...

#### Test #2: Google Calendar Deletion
- [ ] Keine doppelten Lösch-Versuche
- [ ] Console-Log korrekt
- [ ] Audit-Log sauber
- **Status:** ✅ PASS / ❌ FAIL
- **Notes:** ...

#### Test #3: Slot-Count Konsistenz
- [ ] Count steigt korrekt
- [ ] Count sinkt korrekt
- [ ] Keine negativen Werte
- **Status:** ✅ PASS / ❌ FAIL
- **Notes:** ...

#### Test #4: Audit-Log IDs
- [ ] Einheitliches Format
- [ ] Sortierung funktioniert
- [ ] Keine Duplikate
- **Status:** ✅ PASS / ❌ FAIL
- **Notes:** ...

### Overall Result
- **Total Tests:** 4
- **Passed:** X
- **Failed:** X
- **Success Rate:** X%

### Recommendations
- [ ] Ready for Production
- [ ] Needs further testing
- [ ] Requires fixes

**Signed:** [Name]
```

---

## 🚨 Regression Tests

**Prüfe dass alte Funktionen noch funktionieren:**

### Regression #1: Normale Buchung
- ✅ Kunde kann Termin buchen
- ✅ Admin erhält Benachrichtigung
- ✅ Kunde erhält Bestätigungs-Email
- ✅ QR-Code funktioniert

### Regression #2: Admin-Panel
- ✅ Termine auflisten funktioniert
- ✅ Bestätigen funktioniert
- ✅ Stornieren funktioniert
- ✅ Löschen funktioniert
- ✅ Settings speichern funktioniert
- ✅ Zeitplan-Ansicht korrekt

### Regression #3: Embed/iFrame
- ✅ iFrame Auto-Resize funktioniert
- ✅ Popup-Mode funktioniert
- ✅ Standalone-Mode funktioniert

### Regression #4: Google Calendar
- ✅ Event erstellen funktioniert
- ✅ Event enthält alle Daten
- ✅ Reminder korrekt (30 Min Popup)
- ✅ Event löschen funktioniert

---

## 📝 Bug Report Template

Falls du einen Bug findest, verwende dieses Template:

```markdown
## 🐛 Bug Report

**Version:** v2.1.0
**Environment:** [Production/Staging/Local]
**Browser:** [Chrome/Firefox/Safari/...]
**Gefunden am:** [Datum]

### Beschreibung
[Kurze Beschreibung des Problems]

### Schritte zum Reproduzieren
1. [Schritt 1]
2. [Schritt 2]
3. [Schritt 3]

### Erwartetes Verhalten
[Was sollte passieren?]

### Tatsächliches Verhalten
[Was passiert wirklich?]

### Screenshots/Logs
[Wenn möglich: Screenshots, Console-Logs, Network-Requests]

### Zusätzliche Informationen
- User-Agent: ...
- KV Store Status: ...
- Email-Provider: ...
- Google Calendar aktiviert: Ja/Nein

### Reproduzierbarkeit
- [ ] Immer
- [ ] Manchmal
- [ ] Nur einmal

### Priorität
- [ ] Critical (System nicht nutzbar)
- [ ] High (Wichtige Funktion betroffen)
- [ ] Medium (Workaround möglich)
- [ ] Low (Kosmetisch)
```

---

## ✅ Sign-Off Checklist

**Vor Production-Deployment:**

- [ ] Alle 4 Quick Tests bestanden
- [ ] Mindestens 1 Advanced Test bestanden
- [ ] Alle Regression Tests bestanden
- [ ] Keine neuen Fehler in Console
- [ ] Keine neuen Fehler in Audit-Log
- [ ] CHANGELOG.md aktualisiert
- [ ] Version in `src/lib/version.ts` aktualisiert
- [ ] Backup der Datenbank erstellt
- [ ] Rollback-Plan vorhanden

**Deployment Authorization:**

- **Tested by:** ___________________
- **Approved by:** ___________________
- **Date:** ___________________
- **Signature:** ___________________

---

**Letzte Aktualisierung:** 24. November 2025  
**Version:** 2.1.0  
**Status:** ✅ Ready for Testing
