# ✅ VOLLSTÄNDIGE TEST-CHECKLISTE

**Datum:** 24. November 2025  
**Version:** 1.0

---

## 🧪 MANUELLE TESTS (für Live-System)

### 1️⃣ KUNDEN-BUCHUNG

#### Test 1.1: Normale Buchung
- [ ] Öffne Terminbuchung
- [ ] Wähle Tag & Zeit
- [ ] Fülle Formular aus (Name, Email, Telefon, Nachricht)
- [ ] Klicke "Termin buchen"
- [ ] **Erwartet:**
  - ✅ Bestätigungsmeldung
  - ✅ Bestätigungs-Email an Kunde
  - ✅ Benachrichtigungs-Email an Admin
  - ✅ Google Calendar Event erstellt (wenn aktiviert)
  - ✅ QR-Code in Email

#### Test 1.2: Doppelbuchung verhindern
- [ ] Buche Termin mit Email A
- [ ] Versuche nochmal mit Email A zu buchen
- [ ] **Erwartet:**
  - ❌ Fehler: "Mit dieser E-Mail-Adresse wurde bereits ein Termin gebucht"
  - ✅ Audit-Log Eintrag "Doppelbuchung verhindert"

#### Test 1.3: Slot ausgebucht
- [ ] Setze maxAppointmentsPerSlot = 1 (Admin → Einstellungen)
- [ ] Buche Slot aus
- [ ] Versuche denselben Slot erneut zu buchen
- [ ] **Erwartet:**
  - ❌ Fehler: "Dieser Zeitslot ist leider bereits ausgebucht"
  - ✅ Slot wird als "ausgebucht" angezeigt

#### Test 1.4: Rate-Limiting
- [ ] Buche 3 Termine schnell hintereinander (innerhalb von 10 Minuten)
- [ ] Versuche 4. Buchung
- [ ] **Erwartet:**
  - ❌ Fehler: "Zu viele Anfragen. Bitte versuchen Sie es um XX:XX Uhr erneut"
  - ✅ Audit-Log Eintrag "Rate Limit erreicht"

#### Test 1.5: Ungültige Eingaben
- [ ] Versuche mit ungültiger Email (z.B. "test@")
- [ ] **Erwartet:** ❌ "Bitte geben Sie eine gültige E-Mail-Adresse ein"
- [ ] Versuche ohne Name
- [ ] **Erwartet:** ❌ "Name ist erforderlich"
- [ ] Versuche mit sehr langem Text (>500 Zeichen in Nachricht)
- [ ] **Erwartet:** ❌ "Nachricht zu lang (max. 500 Zeichen)"

---

### 2️⃣ VERFÜGBARKEIT

#### Test 2.1: Slots anzeigen
- [ ] Öffne Terminbuchung
- [ ] Prüfe ob alle 3 Tage sichtbar (Fr, Sa, So)
- [ ] Prüfe ob alle Zeitslots sichtbar
- [ ] **Erwartet:**
  - ✅ Zeitplan mit allen konfigurierten Slots
  - ✅ Korrekte Daten aus Settings
  - ✅ Korrekte Uhrzeiten

#### Test 2.2: Ausgebuchte Slots
- [ ] Buche einen Slot
- [ ] Aktualisiere Seite
- [ ] **Erwartet:**
  - ✅ Gebuchter Slot als "ausgebucht" markiert
  - ✅ Button disabled
  - ✅ Andere Slots weiterhin buchbar

#### Test 2.3: Verfügbare Slots nach Stornierung
- [ ] Storniere einen Termin
- [ ] Aktualisiere Terminbuchung
- [ ] **Erwartet:**
  - ✅ Slot wieder als "verfügbar" angezeigt
  - ✅ Button wieder klickbar

---

### 3️⃣ KUNDEN-STORNIERUNG

#### Test 3.1: Email-Link
- [ ] Buche Termin
- [ ] Öffne Bestätigungs-Email
- [ ] Klicke "Termin verwalten"
- [ ] **Erwartet:**
  - ✅ Termindetails-Seite öffnet sich
  - ✅ Alle Termin-Informationen korrekt
  - ✅ "Stornieren" Button sichtbar

#### Test 3.2: Stornierung durchführen
- [ ] Klicke "Stornieren"
- [ ] Bestätige Dialog mit "Ja, stornieren"
- [ ] **Erwartet:**
  - ✅ Termin als "storniert" markiert
  - ✅ Stornieren-Button verschwindet
  - ✅ Meldung "bereits storniert" angezeigt
  - ✅ Email an Admin (Stornierungsbestätigung)
  - ✅ Email an Kunde (Stornierungsbestätigung)
  - ✅ Slot wieder verfügbar (prüfe Buchungsseite)
  - ✅ Google Calendar Event gelöscht
  - ✅ Audit-Log Eintrag

#### Test 3.3: Doppelte Stornierung
- [ ] Storniere Termin
- [ ] Versuche erneut zu stornieren (lade Seite neu)
- [ ] **Erwartet:**
  - ❌ Fehler: "Dieser Termin wurde bereits storniert"
  - ✅ Kein zweiter Audit-Log Eintrag

---

### 4️⃣ ICS-DOWNLOAD

#### Test 4.1: QR-Code scannen
- [ ] Buche Termin
- [ ] Öffne Bestätigungs-Email
- [ ] Scanne QR-Code mit Smartphone
- [ ] **Erwartet:**
  - ✅ ICS-Datei wird heruntergeladen
  - ✅ Kalender-App öffnet sich automatisch
  - ✅ Event kann hinzugefügt werden

#### Test 4.2: Link öffnen
- [ ] Öffne Email
- [ ] Klicke "Zum Kalender hinzufügen"
- [ ] **Erwartet:**
  - ✅ ICS-Download startet im Browser
  - ✅ Dateiname: `termin_apt_XXX.ics`

#### Test 4.3: ICS-Inhalt prüfen
- [ ] Download ICS-Datei
- [ ] Öffne in Texteditor
- [ ] **Erwartet:**
  - ✅ `SUMMARY:` enthält Name (+ Firma falls vorhanden)
  - ✅ `DTSTART:` korrektes Datum/Zeit (Format: YYYYMMDDTHHMMSS)
  - ✅ `DTEND:` korrektes End-Datum
  - ✅ `TZID:Europe/Berlin`
  - ✅ `DESCRIPTION:` enthält alle Kontaktdaten
  - ❌ KEINE Firmenadresse in `LOCATION:`
  - ❌ KEIN `ATTENDEE:` mit RSVP

---

### 5️⃣ ADMIN-PANEL

#### Test 5.1: Terminliste
- [ ] Öffne `/admin`
- [ ] **Erwartet:**
  - ✅ Liste aller Termine sichtbar
  - ✅ Sortierung nach Datum (neueste zuerst)
  - ✅ Status-Badge (Bestätigt/Ausstehend/Storniert)
  - ✅ Alle Details lesbar (Name, Email, Telefon, Tag, Zeit)

#### Test 5.2: Statistiken
- [ ] Prüfe Statistik-Box oben
- [ ] **Erwartet:**
  - ✅ **Gesamt:** Korrekte Anzahl aller Termine
  - ✅ **Bestätigt:** Nur confirmed Termine
  - ✅ **Ausstehend:** Nur pending Termine
  - ✅ **Storniert:** Nur cancelled Termine

#### Test 5.3: Filter nach Status
- [ ] Klicke "Alle" / "Bestätigt" / "Ausstehend" / "Storniert"
- [ ] **Erwartet:**
  - ✅ Nur Termine mit gewähltem Status angezeigt
  - ✅ Statistiken aktualisieren sich

#### Test 5.4: Slot-Übersicht (Zeitplan)
- [ ] Klicke "Zeitplan" Button
- [ ] **Erwartet:**
  - ✅ Dialog öffnet sich
  - ✅ Alle 3 Tage (Fr, Sa, So) sichtbar
  - ✅ Alle Zeitslots mit Anzahl Buchungen
  - ✅ Farbcodierung:
    - 🟢 Grün: 0 Buchungen (verfügbar)
    - 🟠 Orange: 1-X Buchungen (teilweise belegt)
    - 🔴 Rot: Max. Buchungen erreicht (ausgebucht)

#### Test 5.5: Termin-Details anzeigen
- [ ] Klicke auf einen Termin (erweitert Ansicht)
- [ ] **Erwartet:**
  - ✅ Alle Details sichtbar
  - ✅ Email-Link klickbar (öffnet Email-Client)
  - ✅ Telefon-Link klickbar (öffnet Telefon-App)
  - ✅ Nachricht angezeigt (falls vorhanden)
  - ✅ Status sichtbar
  - ✅ Erstellungsdatum sichtbar

---

### 6️⃣ ADMIN-STORNIERUNG

#### Test 6.1: Admin storniert Termin
- [ ] Öffne Admin-Panel
- [ ] Wähle einen bestätigten Termin
- [ ] Klicke "Stornieren" Button
- [ ] Bestätige Dialog
- [ ] **Erwartet:**
  - ✅ Termin wird als "Storniert" markiert
  - ✅ Slot wird freigegeben (prüfe Zeitplan)
  - ✅ **Email an ADMIN** (Stornierungsbestätigung)
  - ✅ Email an Kunde (Stornierungsbestätigung)
  - ✅ Google Calendar Event gelöscht
  - ✅ Audit-Log Eintrag "Admin hat Termin storniert"

#### Test 6.2: Email an Admin prüfen
- [ ] Storniere als Admin
- [ ] Prüfe Admin-Email-Postfach
- [ ] **Erwartet:**
  - ✅ Email mit Betreff "Terminbestätigung: Termin storniert"
  - ✅ Enthält alle Termin-Details
  - ✅ Status: "Storniert"
  - ✅ Format identisch zu Kunden-Stornierung

---

### 7️⃣ EINSTELLUNGEN

#### Test 7.1: Event-Daten ändern
- [ ] Öffne Admin → Einstellungen
- [ ] Ändere "Tag 1 Datum" auf neues Datum
- [ ] Klicke "Speichern"
- [ ] **Erwartet:**
  - ✅ Erfolgsmeldung
  - ✅ Prüfe Terminbuchung: Neues Datum angezeigt
  - ✅ Audit-Log Eintrag

#### Test 7.2: Zeitslots ändern
- [ ] Ändere "Startzeit" von 10:00 auf 09:00
- [ ] Ändere "Endzeit" von 18:00 auf 17:00
- [ ] Ändere "Intervall" von 30 auf 60 Minuten
- [ ] Speichern
- [ ] **Erwartet:**
  - ✅ Prüfe Terminbuchung: Neue Slots sichtbar
  - ✅ Weniger Slots (da 60 Min Intervall)
  - ✅ Slots starten um 09:00, enden um 17:00

#### Test 7.3: Slot-Limit ändern
- [ ] Setze "Max. Termine pro Slot" auf 2
- [ ] Speichern
- [ ] Buche 2 Termine im selben Slot
- [ ] Versuche 3. Buchung im selben Slot
- [ ] **Erwartet:**
  - ✅ Erste 2 Buchungen erfolgreich
  - ❌ 3. Buchung: "bereits ausgebucht"

#### Test 7.4: Automatische Bestätigung
- [ ] Setze "Buchungsmodus" auf "Automatisch"
- [ ] Speichern
- [ ] Buche Termin
- [ ] **Erwartet:**
  - ✅ Status: "Bestätigt" (nicht "Ausstehend")
  - ✅ Google Calendar Event SOFORT erstellt
  - ✅ Email sagt "Termin gebucht" (nicht "Anfrage")

#### Test 7.5: Manuelle Bestätigung
- [ ] Setze "Buchungsmodus" auf "Manuell"
- [ ] Speichern
- [ ] Buche Termin
- [ ] **Erwartet:**
  - ✅ Status: "Ausstehend"
  - ❌ KEIN Google Calendar Event
  - ✅ Email sagt "Anfrage eingegangen"

#### Test 7.6: Email-Benachrichtigungen deaktivieren
- [ ] Deaktiviere "Email-Benachrichtigungen"
- [ ] Speichern
- [ ] Buche Termin
- [ ] **Erwartet:**
  - ✅ Kunde erhält EMAIL (immer aktiv)
  - ❌ Admin erhält KEINE Email
  - ✅ Buchung funktioniert trotzdem

#### Test 7.7: Rate-Limiting anpassen
- [ ] Setze "Max. Requests" auf 5
- [ ] Setze "Zeitfenster" auf 15 Minuten
- [ ] Speichern
- [ ] Versuche 6 Buchungen in 15 Min
- [ ] **Erwartet:**
  - ✅ Erste 5 erfolgreich
  - ❌ 6. blockiert mit "Zu viele Anfragen"

---

### 8️⃣ GOOGLE CALENDAR

#### Test 8.1: Event-Erstellung
- [ ] Stelle sicher: bookingMode = "automatic"
- [ ] Buche Termin
- [ ] Öffne Google Calendar (admin@example.com)
- [ ] **Erwartet:**
  - ✅ Event sichtbar am korrekten Datum/Zeit
  - ✅ Titel: "Termin: [Name] ([Firma])"
  - ✅ Zeitzone: Europe/Berlin

#### Test 8.2: Event-Details prüfen
- [ ] Öffne Event in Google Calendar
- [ ] **Erwartet:**
  - ✅ **Titel:** "Termin: Max Mustermann (Musterfirma)"
  - ✅ **Beschreibung:** 
    - Name, Betrieb, Telefon, Email, Nachricht
    - "Termin verwalten:" Link
  - ✅ **Gäste:** Kunde-Email als Attendee
  - ✅ **Erinnerung:** 30 Minuten vorher (Popup)
  - ❌ KEINE 24h Email-Erinnerung

#### Test 8.3: Event-Löschung bei Stornierung
- [ ] Buche Termin (automatic mode)
- [ ] Prüfe Google Calendar (Event vorhanden)
- [ ] Storniere Termin
- [ ] Prüfe Google Calendar erneut
- [ ] **Erwartet:**
  - ❌ Event NICHT mehr vorhanden (gelöscht)

#### Test 8.4: Kein Event bei manual mode
- [ ] Setze bookingMode = "manual"
- [ ] Buche Termin
- [ ] Prüfe Google Calendar
- [ ] **Erwartet:**
  - ❌ KEIN Event erstellt (da manual mode)

---

### 9️⃣ AUDIT-LOG

#### Test 9.1: Buchung geloggt
- [ ] Buche Termin
- [ ] Öffne Admin → Audit-Log
- [ ] **Erwartet:**
  - ✅ Eintrag: "Termin gebucht" (oder "Terminanfrage")
  - ✅ Details: Name, Email, Tag, Zeit, Status
  - ✅ Timestamp
  - ✅ Termin-ID

#### Test 9.2: Stornierung geloggt
- [ ] Storniere Termin (als Kunde)
- [ ] Prüfe Audit-Log
- [ ] **Erwartet:**
  - ✅ Eintrag: "Termin storniert"
  - ✅ Details: Wer, Wann, Welcher Termin

#### Test 9.3: Admin-Stornierung geloggt
- [ ] Storniere Termin (als Admin)
- [ ] Prüfe Audit-Log
- [ ] **Erwartet:**
  - ✅ Eintrag: "Admin hat Termin storniert"

#### Test 9.4: Settings-Änderung geloggt
- [ ] Ändere Setting (z.B. Datum)
- [ ] Prüfe Audit-Log
- [ ] **Erwartet:**
  - ✅ Eintrag: "Einstellungen aktualisiert"
  - ✅ Details: Welches Setting, alter Wert, neuer Wert

#### Test 9.5: Rate-Limit geloggt
- [ ] Überschreite Rate-Limit
- [ ] Prüfe Audit-Log
- [ ] **Erwartet:**
  - ✅ Eintrag: "Rate Limit erreicht"
  - ✅ IP-Adresse geloggt

#### Test 9.6: Doppelbuchung geloggt
- [ ] Versuche Doppelbuchung
- [ ] Prüfe Audit-Log
- [ ] **Erwartet:**
  - ✅ Eintrag: "Doppelbuchung verhindert"
  - ✅ Email & bestehende Termin-ID

---

### 🔟 ERROR-HANDLING

#### Test 10.1: Google Calendar Fehler
- [ ] Verwende ungültiges Refresh-Token
- [ ] Buche Termin (automatic mode)
- [ ] **Erwartet:**
  - ✅ Buchung TROTZDEM erfolgreich
  - ❌ KEIN Google Calendar Event
  - ✅ Audit-Log: "Google Calendar Fehler"
  - ✅ Console-Log mit Fehlerdetails

#### Test 10.2: Email-Fehler
- [ ] Verwende ungültigen SMTP-Server (ENV-Variable ändern)
- [ ] Buche Termin
- [ ] **Erwartet:**
  - ✅ Buchung erfolgreich
  - ❌ Email wird NICHT versendet
  - ✅ Console-Log mit Fehler
  - ❌ KEIN System-Absturz

#### Test 10.3: Ungültige Termin-ID
- [ ] Öffne `/termin/ungueltige-id`
- [ ] **Erwartet:**
  - ❌ Fehler: "Termin nicht gefunden"
  - ✅ Keine Stack-Trace sichtbar

---

## 📊 AUTOMATISCHE TESTS (Code-Level)

### TypeScript-Kompilierung
```bash
npm run build
```
**Erwartet:** ✅ Keine Fehler

### Type-Check
```bash
npx tsc --noEmit
```
**Erwartet:** ⚠️ Nur bekannte `unknown`-Warnings (nicht kritisch)

---

## 🎯 PERFORMANCE-TESTS

### Test P1: Buchungszeit messen
- [ ] Öffne Browser DevTools (Network Tab)
- [ ] Buche Termin
- [ ] Messe Zeit von Klick bis Bestätigung
- [ ] **Ziel:** < 2 Sekunden

### Test P2: Admin-Ladezeit
- [ ] Erstelle 50+ Termine
- [ ] Öffne Admin-Panel
- [ ] Messe Ladezeit
- [ ] **Ziel:** < 3 Sekunden

### Test P3: Verfügbarkeits-Check
- [ ] Öffne Terminbuchung
- [ ] Messe API-Call `/api/availability`
- [ ] **Ziel:** < 500ms

---

## 🔐 SICHERHEITS-TESTS

### Test S1: XSS-Schutz
- [ ] Versuche `<script>alert('xss')</script>` in Name-Feld
- [ ] Buche Termin
- [ ] Prüfe Admin-Panel
- [ ] **Erwartet:** 
  - ✅ Kein Alert-Popup
  - ✅ Text escaped angezeigt

### Test S2: Rate-Limiting
- [ ] Schreibe Script für 10 Buchungen in 1 Minute
- [ ] **Erwartet:** Blockierung nach konfiguriertem Limit

### Test S3: Secret-Exposure
- [ ] Öffne Browser DevTools (Sources Tab)
- [ ] Prüfe JavaScript-Dateien
- [ ] **Erwartet:** 
  - ❌ KEINE Google API-Keys
  - ❌ KEINE SMTP-Passwörter
  - ❌ KEINE OAuth-Secrets

### Test S4: Direct Object Reference
- [ ] Buche Termin mit ID `apt_123`
- [ ] Versuche `/termin/apt_124` zu öffnen (fremde ID)
- [ ] **Erwartet:**
  - ✅ Termin-Details werden angezeigt (okay - kein Auth)
  - ✅ Stornierung nur mit korrektem Link möglich

---

## 📱 MOBILE/RESPONSIVE

### Test M1: iPhone
- [ ] Öffne auf iPhone (Safari)
- [ ] Buche Termin
- [ ] **Erwartet:**
  - ✅ Alle Felder erreichbar
  - ✅ Buttons groß genug (Touch-Target)
  - ✅ Keine horizontalen Scrollbars
  - ✅ Formular passt auf Screen

### Test M2: Android
- [ ] Öffne auf Android (Chrome)
- [ ] Buche Termin
- [ ] **Erwartet:** Wie Test M1

### Test M3: Tablet (iPad)
- [ ] Öffne auf iPad
- [ ] **Erwartet:** Optimierte Darstellung (größere Touch-Targets)

---

## 🌐 BROWSER-KOMPATIBILITÄT

- [ ] **Chrome** (latest)
- [ ] **Firefox** (latest)
- [ ] **Safari** (latest) - Wichtig für iOS!
- [ ] **Edge** (latest)

**Test für jeden Browser:**
1. Öffne Terminbuchung
2. Buche Termin
3. Öffne Admin-Panel
4. Storniere Termin

---

## 🎉 FINALE ABNAHME

### Checkliste vor Go-Live:

#### Environment-Variablen:
- [ ] `GOOGLE_CLIENT_ID` gesetzt
- [ ] `GOOGLE_CLIENT_SECRET` gesetzt
- [ ] `GOOGLE_REFRESH_TOKEN` gesetzt
- [ ] `GOOGLE_CALENDAR_ID` gesetzt
- [ ] `EMAIL_HOST` gesetzt
- [ ] `EMAIL_PORT` gesetzt
- [ ] `EMAIL_USER` gesetzt
- [ ] `EMAIL_PASS` gesetzt
- [ ] `ADMIN_BASE_URL` gesetzt (für Production)

#### Funktionalität:
- [ ] Terminbuchung funktioniert
- [ ] Email-Versand funktioniert (Admin + Kunde)
- [ ] Google Calendar funktioniert
- [ ] Stornierung funktioniert
- [ ] ICS-Download funktioniert
- [ ] Admin-Panel erreichbar

#### Sicherheit:
- [ ] Secrets NICHT im Client-Code
- [ ] Rate-Limiting aktiv
- [ ] Input-Validierung funktioniert
- [ ] Audit-Log läuft

#### Performance:
- [ ] Buchung < 2 Sekunden
- [ ] Admin-Panel < 3 Sekunden
- [ ] Keine Memory-Leaks

#### Dokumentation:
- [ ] User-Guide vorhanden
- [ ] Admin-Handbuch vorhanden
- [ ] Setup-Anleitung aktuell

---

**Status nach Tests:** ☐ Bestanden ☐ Fehlgeschlagen

**Getestet von:** _________________  
**Datum:** _________________

**Notizen:**
```
_______________________________________________
_______________________________________________
_______________________________________________
```

---

## 📝 BEKANNTE PROBLEME

*(Hier eintragen falls Tests fehlschlagen)*

| # | Problem | Priorität | Status |
|---|---------|-----------|--------|
|   |         |           |        |

---

**Letzte Aktualisierung:** 24. November 2025
