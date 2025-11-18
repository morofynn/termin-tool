# 🔧 Google Calendar Termine erscheinen nicht - LÖSUNG

## Das Problem

Termine werden erfolgreich gebucht, aber erscheinen **nicht** im Google Calendar. Das liegt an 2 Problemen:

### Problem 1: Calendar Event wird nur bei Auto-Confirm erstellt

In `src/pages/api/book-appointment.ts` wird das Calendar Event nur erstellt wenn `autoConfirm === true` ist.

**Zeile 134:**
```typescript
// Google Calendar Event erstellen (optional)
if (autoConfirm && googleClientId && googleClientSecret && googleRefreshToken) {
  // ...
}
```

**Lösung:** Ändere zu:
```typescript
// Google Calendar Event erstellen (optional)
if (googleClientId && googleClientSecret && googleRefreshToken) {
  // ... (ohne autoConfirm Check!)
}
```

---

### Problem 2: GOOGLE_USER_EMAIL fehlt

Die Environment Variable `GOOGLE_USER_EMAIL` wurde noch nicht gesetzt!

**Status:**
```json
{
  "GOOGLE_USER_EMAIL": {
    "set": false,
    "value": "NOT SET"
  }
}
```

---

## ✅ SCHNELLE LÖSUNG

### Schritt 1: GOOGLE_USER_EMAIL setzen

1. **Webflow Dashboard** öffnen
2. Deine App → **Settings** → **Environment Variables**
3. **Add Variable**:
   - **Name:** `GOOGLE_USER_EMAIL`
   - **Value:** `fynn.klinkow@moro-gmbh.de`
   - **Type:** Plain Text (Public)
   - **Environment:** Production

4. **Save and Deploy**

### Schritt 2: Warten

Nach dem Speichern wird die App automatisch neu deployed. **Warte 1-2 Minuten.**

### Schritt 3: Teste das Booking Mode Setting

1. Öffne Admin Panel: `/secure-admin-panel-xyz789`
2. Tab: **Einstellungen**
3. Scrolle zu **"Buchungsmodus"**
4. Stelle sicher dass einer der Modi ausgewählt ist:
   - **Sofortbuchung** (empfohlen) → Termine gehen direkt in Calendar
   - **Manuelle Bestätigung** → Admin muss bestätigen, dann kommt Event in Calendar

### Schritt 4: Teste einen Termin

1. Öffne die Hauptseite
2. Buche einen Test-Termin
3. Prüfe:
   - ✅ **Sofortbuchung:** Event sollte sofort im Calendar sein
   - ✅ **Manuelle Bestätigung:** Nach Admin-Bestätigung im Calendar

---

## 🔍 Debugging

### Check 1: Debug-Endpoint

```bash
https://deine-app-url.com/api/debug-google
```

**Erwartetes Ergebnis:**
```json
{
  "config": {
    "GOOGLE_USER_EMAIL": {
      "set": true,
      "value": "fynn.klinkow@moro-gmbh.de"
    }
  },
  "tests": {
    "gmailAccess": {
      "success": true,
      "canSend": true
    }
  },
  "recommendations": [
    "✅ Google Calendar ist vollständig konfiguriert und funktioniert!",
    "✅ Gmail API ist vollständig konfiguriert und funktioniert!"
  ]
}
```

### Check 2: Browser Console Logs

Öffne die **Browser Developer Tools** (F12) → **Console**

Nach Termin-Buchung solltest du sehen:
```
✅ Email sent successfully via Gmail
```

Wenn du siehst:
```
⚠️ Gmail API not configured. Skipping email notification.
```

→ Dann fehlt noch `GOOGLE_USER_EMAIL`!

### Check 3: Cloudflare Logs

1. **Webflow Dashboard** → Deine App
2. **Settings** → **View Logs** (falls verfügbar)
3. Suche nach:
   ```
   📅 Creating Google Calendar event for...
   ✅ Google Calendar Event created successfully!
   ```

Wenn du siehst:
```
❌ Google credentials not configured
```

→ Environment Variables wurden noch nicht deployed!

---

## 🎯 Häufige Fehler

### Fehler: "Gmail API not configured"

**Bedeutung:** `GOOGLE_USER_EMAIL` fehlt

**Lösung:** Siehe Schritt 1 oben

---

### Fehler: Events erscheinen nur bei Auto-Confirm

**Bedeutung:** Code-Änderung in Schritt 1 wurde nicht gemacht

**Workaround:** 
1. Admin Panel → Einstellungen
2. **Buchungsmodus:** Auf **"Sofortbuchung"** setzen
3. Neue Termine gehen jetzt automatisch in Calendar

---

### Fehler: "insufficient permissions"

**Bedeutung:** Token hat keine Calendar-Scopes

**Lösung:**
1. Gehe zu: `/api/auth/google-authorize`
2. Autorisiere erneut
3. Kopiere neuen `REFRESH_TOKEN`
4. Setze in Webflow

---

## 💡 Empfohlene Einstellung

**Für OPTI Event empfehle ich:**

```
Buchungsmodus: Sofortbuchung
```

**Vorteile:**
- ✅ Termine gehen **sofort** in Google Calendar
- ✅ Kunden erhalten **sofort** Bestätigungs-E-Mail
- ✅ Keine manuelle Arbeit erforderlich
- ✅ ICS-Datei im E-Mail-Anhang

**Nachteile:**
- ⚠️ Du kannst Termine nicht vorher prüfen
- ⚠️ Spam-Anfragen gehen direkt in Calendar

---

## 📊 Was passiert nach dem Fix?

### Sofortbuchung aktiviert:

1. **Kunde bucht Termin**
2. ✅ Event wird **sofort** in Google Calendar erstellt
3. ✅ Kunde erhält **Bestätigungs-E-Mail** mit ICS-Datei
4. ✅ Admin erhält **Benachrichtigungs-E-Mail**

### Manuelle Bestätigung aktiviert:

1. **Kunde bucht Termin**
2. ⏳ Termin hat Status "**Ausstehend**"
3. ✅ Kunde erhält **Anfrage-E-Mail** (keine ICS)
4. ✅ Admin erhält **Benachrichtigungs-E-Mail**
5. **Admin bestätigt im Admin-Panel**
6. ✅ Event wird in Google Calendar erstellt
7. ✅ Kunde erhält **Bestätigungs-E-Mail** mit ICS-Datei

---

## 🚀 Nach dem Fix testen

1. **Debug-Check:**
   ```
   https://deine-app-url.com/api/debug-google
   ```
   → Alle ✅ grün?

2. **Test-Termin buchen:**
   - Vorname: "Test"
   - E-Mail: deine-email@test.de
   - Wähle beliebigen Zeitslot

3. **Prüfe Google Calendar:**
   - Öffne: https://calendar.google.com
   - Event sollte sichtbar sein!

4. **Prüfe E-Mail:**
   - Posteingang checken
   - Bestätigungs-E-Mail sollte da sein
   - ICS-Anhang anklicken → Öffnet sich im Kalender

---

## 🔄 Rollback (falls etwas schief geht)

Falls nach den Änderungen Probleme auftreten:

1. **Environment Variable entfernen:**
   - Webflow → Settings → Environment Variables
   - `GOOGLE_USER_EMAIL` → Delete

2. **Oder auf Resend umsteigen:**
   - Siehe: `GMAIL_SETUP.md` → "Resend als Alternative"

---

## 📞 Support

**Wenn es immer noch nicht funktioniert:**

1. Führe Debug-Check aus
2. Kopiere das Ergebnis
3. Schicke es mir

Ich kann dann sehen wo genau das Problem liegt!

---

**Zusammenfassung:**
1. ✅ `GOOGLE_USER_EMAIL` in Webflow setzen
2. ⏱️ 1-2 Minuten warten (Deployment)
3. 🧪 Test-Termin buchen
4. 📅 Google Calendar prüfen

**Das sollte es fixen!** 🎉
