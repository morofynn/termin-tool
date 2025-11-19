# Google OAuth Callback - Test & Verify

## ✅ Was wurde implementiert?

### Neue API-Routen

1. **`/api/auth/google-authorize`** (GET)
   - Startet OAuth Flow
   - Leitet zu Google weiter
   - Garantiert Refresh Token

2. **`/api/auth/google-callback`** (GET)
   - Empfängt Authorization Code
   - Tauscht gegen Tokens
   - Zeigt schöne UI mit Tokens

---

## 🧪 Test-Anleitung

### Voraussetzungen

Bevor Sie testen, stellen Sie sicher:

1. ✅ Google Cloud Projekt erstellt
2. ✅ Google Calendar API aktiviert
3. ✅ OAuth Client-ID erstellt
4. ✅ **Callback-URL registriert:**
   ```
   http://localhost:3000/api/auth/google-callback
   ```
5. ✅ `.env` konfiguriert:
   ```env
   GOOGLE_CLIENT_ID="1234567890-abc...apps.googleusercontent.com"
   GOOGLE_CLIENT_SECRET="GOCSPX-..."
   ```

---

### Test 1: Direkte URL

1. **Starten Sie den Dev Server:**
   ```bash
   npm run dev
   ```

2. **Öffnen Sie im Browser:**
   ```
   http://localhost:3000/api/auth/google-authorize
   ```

3. **Erwartetes Verhalten:**
   - Sie werden zu Google weitergeleitet
   - Google zeigt Consent Screen (Berechtigungen)
   - Nach Autorisierung: Redirect zu Callback-Route
   - Schöne HTML-Seite mit Tokens erscheint

4. **Prüfpunkte:**
   - ✅ Refresh Token wird angezeigt
   - ✅ Access Token wird angezeigt
   - ✅ Copy-Buttons funktionieren
   - ✅ Tokens sind vollständig (kein Abschneiden)

---

### Test 2: Via Admin Panel

1. **Öffnen Sie das Admin Panel:**
   ```
   http://localhost:3000/secure-admin-panel-xyz789
   ```

2. **Gehen Sie zu "Einstellungen"**

3. **Scrollen Sie zu "Google Calendar Integration"**

4. **Klicken Sie auf "Mit Google autorisieren"**

5. **Erwartetes Verhalten:**
   - Neues Fenster öffnet sich (Popup)
   - OAuth Flow startet
   - Nach Autorisierung: Tokens werden angezeigt
   - Sie können Fenster schließen

6. **Prüfpunkte:**
   - ✅ Button ist sichtbar
   - ✅ Popup öffnet sich (nicht blockiert)
   - ✅ OAuth läuft durch
   - ✅ Tokens sind verfügbar

---

### Test 3: Token verwenden

1. **Kopieren Sie den Refresh Token**

2. **Fügen Sie ihn in `.env` ein:**
   ```env
   GOOGLE_REFRESH_TOKEN="1//0abcdefghijklmnopqrstuvwxyz..."
   ```

3. **Starten Sie den Server neu:**
   ```bash
   # Ctrl+C, dann:
   npm run dev
   ```

4. **Testen Sie die Verbindung:**
   - Gehen Sie zu Admin Panel → Einstellungen
   - Klicken Sie auf "Verbindung testen"

5. **Erwartetes Verhalten:**
   - ✅ Status: "Verbindung erfolgreich"
   - ✅ Kalender-Name wird angezeigt
   - ✅ Kalender-ID wird angezeigt
   - ✅ Zeitzone wird angezeigt

---

### Test 4: End-to-End (Terminbuchung)

1. **Buchen Sie einen Test-Termin:**
   ```
   http://localhost:3000/
   ```

2. **Füllen Sie das Formular aus:**
   - Name: "Max Mustermann"
   - E-Mail: "test@example.com"
   - Telefon: "+49123456789"
   - Datum: Wählen Sie ein Datum
   - Uhrzeit: Wählen Sie eine Zeit
   - Service: "Beratung"

3. **Klicken Sie auf "Termin buchen"**

4. **Prüfen Sie Google Calendar:**
   - Öffnen Sie: https://calendar.google.com
   - Suchen Sie den Termin
   - Event sollte existieren

5. **Erwartetes Verhalten:**
   - ✅ Event: "Termin: Max Mustermann"
   - ✅ Zeit: Korrekt (30 Minuten)
   - ✅ Teilnehmer: test@example.com
   - ✅ Erinnerungen: 24h (Email) + 30min (Popup)

---

## 🚨 Mögliche Fehler & Lösungen

### Fehler 1: "redirect_uri_mismatch"

**Symptom:**
```
Error 400: redirect_uri_mismatch
```

**Ursache:** Callback-URL ist nicht in Google Console registriert

**Lösung:**
1. Gehen Sie zu: https://console.cloud.google.com/
2. APIs & Dienste → Anmeldedaten
3. Klicken Sie auf Ihre OAuth Client-ID
4. Fügen Sie hinzu:
   ```
   http://localhost:3000/api/auth/google-callback
   ```
5. Klicken Sie auf "Speichern"
6. Warten Sie 5 Minuten (Google Cache)
7. Versuchen Sie es erneut

---

### Fehler 2: "invalid_client"

**Symptom:**
```json
{
  "error": "invalid_client",
  "error_description": "The OAuth client was not found."
}
```

**Ursache:** Client-ID oder Client-Secret ist falsch

**Lösung:**
1. Öffnen Sie `.env`
2. Überprüfen Sie:
   - `GOOGLE_CLIENT_ID` ist vollständig (endet mit `.apps.googleusercontent.com`)
   - `GOOGLE_CLIENT_SECRET` ist vollständig (beginnt mit `GOCSPX-`)
   - Keine Leerzeichen oder Anführungszeichen
3. Kopieren Sie Werte erneut aus Google Console
4. Starten Sie Server neu
5. Versuchen Sie es erneut

---

### Fehler 3: Kein Refresh Token

**Symptom:**
```
⚠️ Kein Refresh Token erhalten
```

**Ursache:** Sie haben der App bereits Zugriff gewährt

**Lösung:**
1. Gehen Sie zu: https://myaccount.google.com/permissions
2. Suchen Sie nach Ihrer App ("Terminbuchungssystem")
3. Klicken Sie auf "Zugriff entfernen"
4. Gehen Sie zurück zu `/api/auth/google-authorize`
5. Autorisieren Sie erneut
6. Diesmal sollten Sie Refresh Token erhalten

**Alternative Lösung:**
```
# Fügen Sie prompt=consent zur URL hinzu (bereits implementiert)
```

---

### Fehler 4: "Access blocked: This app's request is invalid"

**Symptom:** Google zeigt rote Fehlerseite

**Ursache:** OAuth Consent Screen nicht korrekt konfiguriert

**Lösung:**
1. Gehen Sie zu: Google Cloud Console
2. APIs & Dienste → OAuth-Zustimmungsbildschirm
3. Stellen Sie sicher:
   - App-Name ist gesetzt
   - Support-Email ist gesetzt
   - Scopes sind hinzugefügt:
     - `https://www.googleapis.com/auth/calendar`
     - `https://www.googleapis.com/auth/calendar.events`
   - Ihre E-Mail ist als Testnutzer hinzugefügt
4. Speichern und fortfahren
5. Warten Sie 5 Minuten
6. Versuchen Sie es erneut

---

### Fehler 5: "insufficient_permissions"

**Symptom:**
```json
{
  "error": {
    "code": 403,
    "message": "Insufficient Permission"
  }
}
```

**Ursache:** Calendar-Scopes fehlen

**Lösung:**
1. Gehen Sie zu: OAuth Consent Screen
2. Fügen Sie Scopes hinzu:
   - `https://www.googleapis.com/auth/calendar`
   - `https://www.googleapis.com/auth/calendar.events`
3. Widerrufen Sie App-Zugriff (myaccount.google.com/permissions)
4. Autorisieren Sie erneut

---

## 🔍 Debug-Tipps

### Console Logs prüfen

**Im Browser:**
```javascript
// Öffnen Sie Developer Tools (F12)
// Tab: Console
// Suchen Sie nach:
- "Google OAuth"
- "Authorization"
- "Token"
```

**Im Server:**
```bash
# Terminal wo npm run dev läuft
# Suchen Sie nach:
- "Google OAuth Callback Error"
- "Token exchange failed"
```

---

### Network Tab überprüfen

1. Öffnen Sie Developer Tools (F12)
2. Tab: Network
3. Filtern Sie: `google`
4. Prüfen Sie:
   - Request zu `/api/auth/google-authorize` (sollte 302 sein)
   - Redirect zu `accounts.google.com` (sollte 200 sein)
   - Callback zu `/api/auth/google-callback` (sollte 200 sein)
   - POST zu `oauth2.googleapis.com/token` (sollte 200 sein)

---

### Manuelle Token-Generierung (Fallback)

Falls OAuth Flow nicht funktioniert:

1. **Verwenden Sie OAuth Playground:**
   ```
   https://developers.google.com/oauthplayground
   ```

2. **Folgen Sie der alten Anleitung:**
   ```
   Siehe: GOOGLE_CALENDAR_SETUP.md → Schritt 4
   ```

---

## ✅ Erfolgs-Checkliste

Nach erfolgreichem Setup sollten Sie folgendes haben:

- [ ] OAuth Flow funktioniert (keine Fehler)
- [ ] Refresh Token erhalten (beginnt mit `1//0`)
- [ ] Refresh Token in `.env` eingetragen
- [ ] "Verbindung testen" ist erfolgreich
- [ ] Test-Termin erscheint in Google Calendar
- [ ] Event enthält korrekte Informationen
- [ ] Erinnerungen sind gesetzt
- [ ] Teilnehmer ist eingetragen

---

## 📊 Erwartete Werte

### GOOGLE_CLIENT_ID
```
Format: 1234567890-abcdefghijklmnopqrstuvwxyz.apps.googleusercontent.com
Länge: ~70 Zeichen
Beispiel: 123456789012-abc123def456ghi789jkl012mno345pq.apps.googleusercontent.com
```

### GOOGLE_CLIENT_SECRET
```
Format: GOCSPX-AbCdEfGhIjKlMnOpQrStUvWx
Länge: ~35 Zeichen
Beispiel: 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
```

### GOOGLE_REFRESH_TOKEN
```
Format: 1//0abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789
Länge: ~140-200 Zeichen
Beispiel: 1//0gDz7k8qN5xK2yR3pT4vU5wX6zA7bB8cC9dD0eE1fF2gG3hH4iI5jJ6kK7lL8mM9nN
```

---

## 🎯 Nächste Schritte

Nachdem alles funktioniert:

1. ✅ **Production Setup:**
   - OAuth App auf "Production" stellen
   - Production Callback-URL hinzufügen
   - Environment Variables auf Server setzen

2. ✅ **Testing:**
   - Mehrere Termine buchen
   - Termine stornieren (sollten aus Calendar verschwinden)
   - Erinnerungen prüfen

3. ✅ **Monitoring:**
   - Google Cloud Console → Logs
   - Quota überwachen (Calendar API Limits)

---

## 📚 Weitere Dokumentation

- **Setup-Anleitung**: `GOOGLE_CALENDAR_OAUTH_SETUP.md`
- **Flow-Diagramm**: `GOOGLE_OAUTH_FLOW.md`
- **Schnellübersicht**: `GOOGLE_CALENDAR_SETUP_SUMMARY.md`
- **Originale Anleitung**: `GOOGLE_CALENDAR_SETUP.md`

---

## 💡 Hilfe benötigt?

**Wenn nichts funktioniert:**

1. Überprüfen Sie alle Voraussetzungen oben
2. Lesen Sie Error Messages sorgfältig
3. Checken Sie Console Logs (Browser & Server)
4. Vergleichen Sie mit erwarteten Werten
5. Verwenden Sie OAuth Playground als Fallback

**Bei spezifischen Fehlern:**
- Siehe "Mögliche Fehler & Lösungen" oben
- Siehe `GOOGLE_CALENDAR_OAUTH_SETUP.md` → Fehlerbehebung

---

**Viel Erfolg beim Testen! 🚀**
