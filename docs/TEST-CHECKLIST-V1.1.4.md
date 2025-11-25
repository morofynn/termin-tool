# 🧪 Test-Checklist v1.1.4 - Google Calendar E-Mails

**Ziel**: Sicherstellen dass Google Calendar KEINE unerwünschten E-Mails sendet

---

## ✅ Pre-Testing Setup

- [ ] Code deployed (lokal oder production)
- [ ] `.env` konfiguriert mit Google Calendar Zugangsdaten
- [ ] Test-E-Mail-Adresse bereit (nicht die Admin-E-Mail!)
- [ ] Gmail/Inbox für Test-E-Mail bereit zum Überwachen

---

## 1️⃣ Test: Automatische Buchung

### Setup:
- Admin-Panel → Settings → Buchungsmodus: **Automatisch**
- Google Calendar Integration: **Aktiv**

### Schritte:
1. [ ] Neuen Termin über Buchungsformular buchen
2. [ ] Warten auf E-Mail (max. 2 Minuten)
3. [ ] **Prüfen**: Genau 1 E-Mail empfangen (von eigenem System)
4. [ ] **Prüfen**: KEINE Google Calendar Einladung empfangen
5. [ ] **Prüfen**: Google Calendar zeigt Event an
6. [ ] **Prüfen**: Event hat KEINE Attendees

**Erwartetes Resultat:**
```
✅ 1x E-Mail: "Ihr Termin wurde bestätigt" (eigenes System)
❌ 0x E-Mail: "You have been invited" (Google)
✅ Google Calendar: Event vorhanden
```

---

## 2️⃣ Test: Manuelle Bestätigung

### Setup:
- Admin-Panel → Settings → Buchungsmodus: **Manuell**

### Schritte:
1. [ ] Neuen Termin über Buchungsformular anfordern
2. [ ] Warten auf E-Mail (Anfrage-Bestätigung)
3. [ ] Admin-Panel öffnen → Termin bestätigen
4. [ ] Warten auf E-Mail (Bestätigung)
5. [ ] **Prüfen**: Genau 2 E-Mails empfangen (Anfrage + Bestätigung)
6. [ ] **Prüfen**: KEINE Google Calendar Einladung empfangen
7. [ ] **Prüfen**: Google Calendar zeigt Event an (erst nach Bestätigung)

**Erwartetes Resultat:**
```
✅ 1x E-Mail: "Ihre Anfrage wurde eingereicht"
✅ 1x E-Mail: "Ihr Termin wurde bestätigt"
❌ 0x E-Mail: Google Einladung
✅ Google Calendar: Event nach Bestätigung vorhanden
```

---

## 3️⃣ Test: Stornierung durch Kunden

### Setup:
- Bestätigter Termin vorhanden
- Stornierungslink aus E-Mail

### Schritte:
1. [ ] Stornierungslink im Browser öffnen
2. [ ] Termin stornieren
3. [ ] Warten auf E-Mail
4. [ ] **Prüfen**: 1x Stornierungsmail empfangen
5. [ ] **Prüfen**: KEINE Google "Event cancelled" Mail
6. [ ] **Prüfen**: Google Calendar Event ist gelöscht

**Erwartetes Resultat:**
```
✅ 1x E-Mail: "Ihr Termin wurde storniert"
❌ 0x E-Mail: "Event cancelled" (Google)
✅ Google Calendar: Event gelöscht
```

---

## 4️⃣ Test: Stornierung durch Admin

### Setup:
- Bestätigter Termin vorhanden
- Admin-Panel geöffnet

### Schritte:
1. [ ] Admin-Panel → Termine
2. [ ] Termin suchen → "Stornieren" klicken
3. [ ] Grund angeben (optional)
4. [ ] Warten auf E-Mail (Kunde)
5. [ ] **Prüfen**: 1x Stornierungsmail empfangen
6. [ ] **Prüfen**: KEINE Google Mail
7. [ ] **Prüfen**: Google Calendar Event ist gelöscht

**Erwartetes Resultat:**
```
✅ 1x E-Mail: "Ihr Termin wurde storniert"
❌ 0x E-Mail: Google Benachrichtigung
✅ Google Calendar: Event gelöscht
```

---

## 5️⃣ Test: Massenlöschung

### Setup:
- Mehrere Termine vorhanden (mind. 3)
- Admin-Panel geöffnet

### Schritte:
1. [ ] Admin-Panel → Settings → "Alles zurücksetzen"
2. [ ] Bestätigen
3. [ ] Warten (30 Sekunden)
4. [ ] **Prüfen**: KEINE Massen-E-Mails empfangen
5. [ ] **Prüfen**: Google Calendar alle Events gelöscht
6. [ ] **Prüfen**: Audit-Log zeigt Löschungen

**Erwartetes Resultat:**
```
❌ 0x E-Mail: Weder eigenes System noch Google
✅ Google Calendar: Alle Events gelöscht
✅ Audit-Log: Löschungen dokumentiert
```

---

## 6️⃣ Test: 24h Monitoring

### Setup:
- Alle obigen Tests durchgeführt
- Test-E-Mail Inbox überwachen

### Schritte:
1. [ ] 24h warten
2. [ ] Inbox checken
3. [ ] **Prüfen**: KEINE verspäteten Google-Mails empfangen
4. [ ] **Prüfen**: Alle Google Calendar Events korrekt

**Erwartetes Resultat:**
```
❌ 0x verspätete E-Mails von Google
✅ Nur geplante E-Mails vom eigenen System
```

---

## 🔍 Spezielle Checks

### Check 1: Google Calendar Event Details
- [ ] Event öffnen im Google Calendar
- [ ] **Prüfen**: Feld "Guests" ist LEER (keine Attendees)
- [ ] **Prüfen**: Description enthält Kundendaten (Name, E-Mail, Telefon)
- [ ] **Prüfen**: Summary zeigt Kundenname

### Check 2: Gmail Spam Folder
- [ ] Gmail Spam Folder prüfen
- [ ] **Prüfen**: KEINE Google Calendar Einladungen im Spam

### Check 3: Audit-Log
- [ ] Admin-Panel → Audit-Log
- [ ] **Prüfen**: Alle Aktionen dokumentiert
- [ ] **Prüfen**: Keine "Google Calendar Fehler" Einträge

---

## 📊 Test-Matrix

| Test | E-Mail eigenes System | E-Mail Google | Google Calendar |
|------|----------------------|---------------|-----------------|
| Automatische Buchung | ✅ 1x | ❌ 0x | ✅ erstellt |
| Manuelle Bestätigung | ✅ 2x | ❌ 0x | ✅ erstellt |
| Kunden-Stornierung | ✅ 1x | ❌ 0x | ✅ gelöscht |
| Admin-Stornierung | ✅ 1x | ❌ 0x | ✅ gelöscht |
| Massenlöschung | ❌ 0x | ❌ 0x | ✅ alle gelöscht |
| 24h Monitoring | ✅ nur geplante | ❌ 0x | ✅ stabil |

---

## ❌ Fehlerfall: Was wenn Google doch E-Mails sendet?

**Symptome:**
- Kunde erhält "You have been invited" Mail
- Oder "Event cancelled" Mail

**Debugging:**
1. [ ] Logs prüfen: `wrangler tail` oder CloudFlare Dashboard
2. [ ] Prüfen: Wurde wirklich v1.1.4 deployed?
3. [ ] Code prüfen:
   - `grep -rn "attendees:" src/` → sollte nur auskommentiert sein
   - `grep -rn "sendUpdates" src/` → sollte 10x gefunden werden
4. [ ] Google API Call nachprüfen (Browser DevTools → Network)
5. [ ] Issue melden mit Logs

**Mögliche Ursachen:**
- Alter Code deployed
- Google API Cache (unwahrscheinlich)
- Andere Google-Integration (z.B. Zapier)

---

## ✅ Erfolgs-Kriterien

Test gilt als **BESTANDEN** wenn:
- ✅ ALLE Tests durchgeführt
- ✅ KEINE unerwünschten Google-Mails empfangen (0x)
- ✅ Eigene E-Mails funktionieren (wie erwartet)
- ✅ Google Calendar funktioniert (Events erstellt/gelöscht)
- ✅ Keine Fehler im Audit-Log

Test gilt als **FEHLGESCHLAGEN** wenn:
- ❌ Auch nur 1 unerwünschte Google-Mail empfangen
- ❌ Google Calendar Events nicht erstellt/gelöscht
- ❌ Fehler im Audit-Log

---

## 📝 Test-Protokoll

**Getestet von**: _________________  
**Datum**: _________________  
**Environment**: [ ] Local [ ] Staging [ ] Production  
**Version**: v1.1.4

### Ergebnisse:
- [ ] Test 1: ✅ Bestanden / ❌ Fehlgeschlagen
- [ ] Test 2: ✅ Bestanden / ❌ Fehlgeschlagen
- [ ] Test 3: ✅ Bestanden / ❌ Fehlgeschlagen
- [ ] Test 4: ✅ Bestanden / ❌ Fehlgeschlagen
- [ ] Test 5: ✅ Bestanden / ❌ Fehlgeschlagen
- [ ] Test 6: ✅ Bestanden / ❌ Fehlgeschlagen

### Gesamt-Bewertung:
- [ ] ✅ **ALLE TESTS BESTANDEN** → Production Ready
- [ ] ❌ **FEHLER GEFUNDEN** → Debugging erforderlich

### Notizen:
```
(hier Notizen eintragen)
```

---

**Status**: ⚠️ **Testing Required**  
**Next Step**: User-Tests durchführen & Protokoll ausfüllen
