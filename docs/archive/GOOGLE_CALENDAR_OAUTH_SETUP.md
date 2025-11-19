# Google Calendar OAuth Setup - Einfache Anleitung

Diese Anleitung zeigt Ihnen, wie Sie Google Calendar OAuth **direkt in Ihrer App** einrichten - ohne manuelles Token-Management.

## 🚀 Vorteile dieser Methode

✅ **Einfacher**: Ein Klick im Admin-Panel  
✅ **Sicherer**: Tokens bleiben in Ihrer App  
✅ **Schneller**: Setup in unter 5 Minuten  
✅ **Automatisch**: Refresh Token wird automatisch gespeichert  

---

## 📋 Setup in 4 Schritten

### Schritt 1: Google Cloud Projekt erstellen

1. Gehen Sie zu: https://console.cloud.google.com/
2. Klicken Sie auf **"Neues Projekt"** (oben links)
3. Geben Sie einen Projektnamen ein (z.B. "Terminbuchung")
4. Klicken Sie auf **"Erstellen"**

---

### Schritt 2: Google Calendar API aktivieren

1. Wählen Sie Ihr Projekt aus (oben links)
2. Gehen Sie zu: **APIs & Dienste → Bibliothek**
3. Suchen Sie nach **"Google Calendar API"**
4. Klicken Sie auf die API und dann auf **"Aktivieren"**

---

### Schritt 3: OAuth-Credentials erstellen

#### 3.1 OAuth-Zustimmungsbildschirm konfigurieren

1. Gehen Sie zu: **APIs & Dienste → OAuth-Zustimmungsbildschirm**
2. Wählen Sie **"Extern"** und klicken Sie auf **"Erstellen"**
3. Füllen Sie die Pflichtfelder aus:
   - **App-Name**: "Terminbuchungssystem"
   - **E-Mail für Nutzer-Support**: Ihre E-Mail
   - **Entwickler-Kontaktinformationen**: Ihre E-Mail
4. Klicken Sie auf **"Speichern und fortfahren"**

5. Bei **"Bereiche"**: Klicken Sie auf **"Bereich hinzufügen oder entfernen"**
   - Suchen Sie nach: `calendar`
   - Wählen Sie diese Bereiche aus:
     - ✅ `https://www.googleapis.com/auth/calendar`
     - ✅ `https://www.googleapis.com/auth/calendar.events`
   - Klicken Sie auf **"Aktualisieren"**
   - Klicken Sie auf **"Speichern und fortfahren"**

6. Bei **"Testnutzer"**: 
   - Klicken Sie auf **"+ ADD USERS"**
   - Fügen Sie Ihre Google-E-Mail-Adresse hinzu
   - Klicken Sie auf **"Speichern und fortfahren"**

7. Überprüfen Sie die Zusammenfassung und klicken Sie auf **"Zurück zum Dashboard"**

#### 3.2 OAuth-Client-ID erstellen

1. Gehen Sie zu: **APIs & Dienste → Anmeldedaten**
2. Klicken Sie auf **"+ Anmeldedaten erstellen"** → **"OAuth-Client-ID"**
3. Wählen Sie **"Webanwendung"**
4. Geben Sie einen Namen ein (z.B. "Terminbuchung Web Client")

5. **Wichtig:** Fügen Sie unter **"Autorisierte Weiterleitungs-URIs"** Ihre Callback-URL hinzu:
   
   **Für lokale Entwicklung:**
   ```
   http://localhost:3000/api/auth/google-callback
   ```
   
   **Für Production (ersetzen Sie `ihre-domain.com`):**
   ```
   https://ihre-domain.com/api/auth/google-callback
   ```
   
   💡 **Tipp**: Sie können beide URLs gleichzeitig hinzufügen!

6. Klicken Sie auf **"Erstellen"**

7. **Wichtig**: Ein Pop-up erscheint mit Ihren Credentials:
   - Kopieren Sie die **Client-ID** (endet mit `.apps.googleusercontent.com`)
   - Kopieren Sie das **Clientgeheimnis**
   - ⚠️ **Speichern Sie diese sicher!** Sie werden nur einmal angezeigt.

---

### Schritt 4: Credentials in .env eintragen

1. Öffnen Sie Ihre `.env` Datei im Projekt-Root
2. Fügen Sie die kopierten Werte ein:

```env
# Google Calendar OAuth Credentials
GOOGLE_CLIENT_ID="1234567890-abcdefghijklmnop.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-AbCdEfGhIjKlMnOpQrStUvWx"
```

3. **Speichern Sie die Datei**
4. **Starten Sie Ihren Development Server neu**

---

## 🎯 App autorisieren

### Option A: Über das Admin-Panel (empfohlen)

1. Öffnen Sie Ihr Admin-Panel: `/secure-admin-panel-xyz789`
2. Gehen Sie zu **"Einstellungen"**
3. Scrollen Sie zu **"Google Calendar Integration"**
4. Klicken Sie auf **"Mit Google autorisieren"**
5. Ein neues Fenster öffnet sich:
   - Wählen Sie Ihr Google-Konto aus
   - Klicken Sie auf **"Fortfahren"** (trotz Warnung - das ist normal im Test-Modus)
   - Bestätigen Sie die Berechtigungen
6. Sie werden zur Callback-Seite weitergeleitet:
   - **Kopieren Sie den Refresh Token**
   - Fügen Sie ihn in Ihre `.env` Datei ein:
   ```env
   GOOGLE_REFRESH_TOKEN="1//0abcdefghijklmnopqrstuvwxyz..."
   ```
7. **Starten Sie den Server erneut neu**
8. Klicken Sie auf **"Verbindung testen"** im Admin-Panel

✅ **Fertig!** Ihre Google Calendar Integration ist jetzt aktiv.

---

### Option B: Direkter Link

Alternativ können Sie direkt zu dieser URL gehen:
```
http://localhost:3000/api/auth/google-authorize
```

(In Production ersetzen Sie `localhost:3000` mit Ihrer Domain)

---

## 🔧 Fehlerbehebung

### "redirect_uri_mismatch" Fehler

**Problem**: Die Callback-URL stimmt nicht überein.

**Lösung**:
1. Gehen Sie zur Google Cloud Console
2. **APIs & Dienste → Anmeldedaten**
3. Klicken Sie auf Ihre OAuth-Client-ID
4. Überprüfen Sie die **"Autorisierte Weiterleitungs-URIs"**
5. Fügen Sie die exakte URL hinzu, die in der Fehlermeldung steht
6. Klicken Sie auf **"Speichern"**
7. Warten Sie 5 Minuten (Google-Cache)
8. Versuchen Sie es erneut

### "invalid_client" Fehler

**Problem**: Client-ID oder Client-Secret ist falsch.

**Lösung**:
1. Überprüfen Sie Ihre `.env` Datei
2. Stellen Sie sicher, dass keine Leerzeichen oder Anführungszeichen falsch sind
3. Kopieren Sie die Werte erneut aus der Google Cloud Console
4. Starten Sie den Server neu

### Kein Refresh Token erhalten

**Problem**: Nur Access Token, aber kein Refresh Token.

**Warum**: Sie haben der App bereits Zugriff gewährt.

**Lösung**:
1. Gehen Sie zu: https://myaccount.google.com/permissions
2. Suchen Sie nach Ihrer App ("Terminbuchungssystem")
3. Klicken Sie auf **"Zugriff entfernen"**
4. Gehen Sie zurück zur Autorisierung und starten Sie erneut
5. Diesmal sollten Sie einen Refresh Token erhalten

### "Access blocked: This app's request is invalid"

**Problem**: OAuth Consent Screen ist nicht korrekt konfiguriert.

**Lösung**:
1. Gehen Sie zu: **APIs & Dienste → OAuth-Zustimmungsbildschirm**
2. Stellen Sie sicher, dass:
   - Die Calendar Scopes hinzugefügt sind
   - Ihre E-Mail als Testnutzer hinzugefügt ist
3. Speichern Sie die Änderungen
4. Warten Sie 5 Minuten
5. Versuchen Sie es erneut

---

## 🔐 Sicherheit

### Production-Checkliste

Bevor Sie live gehen:

- [ ] **OAuth App auf "Production" stellen** (in Google Cloud Console)
- [ ] **Nur HTTPS verwenden** für Callback-URLs
- [ ] **Secrets niemals in Git committen** (`.env` muss in `.gitignore` sein)
- [ ] **Environment Variables auf Production Server** setzen
- [ ] **Regelmäßige Logs prüfen** (Google Cloud Console → Logs)

### App-Status ändern (Production Mode)

1. Gehen Sie zu: **APIs & Dienste → OAuth-Zustimmungsbildschirm**
2. Klicken Sie auf **"App veröffentlichen"**
3. Bestätigen Sie die Veröffentlichung
4. **Optional**: Beantragen Sie eine Verifizierung (nicht nötig für eigene App)

---

## 📚 Technische Details

### Implementierte Routen

#### `/api/auth/google-authorize` (GET)
- Startet den OAuth-Flow
- Leitet zu Google weiter
- Parameter:
  - `access_type=offline` → Garantiert Refresh Token
  - `prompt=consent` → Erzwingt Consent Screen

#### `/api/auth/google-callback` (GET)
- Empfängt Authorization Code von Google
- Tauscht Code gegen Tokens
- Zeigt Tokens in schöner UI an
- Parameter:
  - `code` → Authorization Code
  - `state` → CSRF Protection

### Verwendete Scopes

```
https://www.googleapis.com/auth/calendar
https://www.googleapis.com/auth/calendar.events
```

Diese Scopes erlauben:
- ✅ Kalender lesen
- ✅ Events erstellen
- ✅ Events aktualisieren
- ✅ Events löschen
- ✅ Teilnehmer hinzufügen

---

## 🎓 Weiterführende Dokumentation

- [Google OAuth 2.0 Dokumentation](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google Calendar API](https://developers.google.com/calendar/api/v3/reference)
- [OAuth Consent Screen](https://support.google.com/cloud/answer/10311615)

---

## ✅ Zusammenfassung

Nach diesem Setup haben Sie:

1. ✅ Google Cloud Projekt erstellt
2. ✅ Calendar API aktiviert
3. ✅ OAuth Consent Screen konfiguriert
4. ✅ OAuth Client-ID erstellt
5. ✅ Callback-URL registriert
6. ✅ Client-ID und Secret in .env eingetragen
7. ✅ App mit Google autorisiert
8. ✅ Refresh Token erhalten und gespeichert

**Ihre App kann jetzt automatisch:**
- Termine in Google Calendar erstellen
- Termine aktualisieren
- Termine löschen
- Erinnerungen setzen
- Teilnehmer hinzufügen

**Viel Erfolg! 🚀**
