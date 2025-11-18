# Google Calendar Integration - Setup Anleitung

Diese Anleitung zeigt Ihnen Schritt für Schritt, wie Sie Google Calendar mit Ihrem Terminbuchungssystem verbinden.

## 📋 Übersicht

Mit der Google Calendar Integration werden:
- ✅ Termine automatisch in Ihrem Google Calendar erstellt
- ✅ Terminabsagen automatisch im Calendar gelöscht
- ✅ Erinnerungen für Termine konfiguriert
- ✅ Teilnehmer (Kunden) zum Calendar-Event hinzugefügt

## 🚀 Setup in 5 Schritten

### Schritt 1: Google Cloud Projekt erstellen

1. Gehen Sie zu: https://console.cloud.google.com/
2. Klicken Sie auf **"Neues Projekt"** (oben links)
3. Geben Sie einen Projektnamen ein (z.B. "Terminbuchung")
4. Klicken Sie auf **"Erstellen"**

### Schritt 2: Google Calendar API aktivieren

1. Wählen Sie Ihr Projekt aus (oben links)
2. Gehen Sie zu: **APIs & Dienste → Bibliothek**
3. Suchen Sie nach **"Google Calendar API"**
4. Klicken Sie auf die API und dann auf **"Aktivieren"**

### Schritt 3: OAuth-Anmeldedaten erstellen

#### 3.1 OAuth-Zustimmungsbildschirm konfigurieren

1. Gehen Sie zu: **APIs & Dienste → OAuth-Zustimmungsbildschirm**
2. Wählen Sie **"Extern"** und klicken Sie auf **"Erstellen"**
3. Füllen Sie die Pflichtfelder aus:
   - **App-Name**: "Terminbuchungssystem"
   - **E-Mail für Nutzer-Support**: Ihre E-Mail
   - **Entwickler-Kontaktinformationen**: Ihre E-Mail
4. Klicken Sie auf **"Speichern und fortfahren"**
5. Bei **"Bereiche"**: Klicken Sie auf **"Bereich hinzufügen oder entfernen"**
   - Suchen Sie nach: `https://www.googleapis.com/auth/calendar`
   - Wählen Sie: **Google Calendar API - .../auth/calendar** aus
   - Klicken Sie auf **"Aktualisieren"**
6. Klicken Sie auf **"Speichern und fortfahren"**
7. Bei **"Testnutzer"**: Fügen Sie Ihre Google-E-Mail-Adresse hinzu
8. Klicken Sie auf **"Speichern und fortfahren"**

#### 3.2 OAuth-Client-ID erstellen

1. Gehen Sie zu: **APIs & Dienste → Anmeldedaten**
2. Klicken Sie auf **"+ Anmeldedaten erstellen"** → **"OAuth-Client-ID"**
3. Wählen Sie **"Webanwendung"**
4. Geben Sie einen Namen ein (z.B. "Terminbuchung Web Client")
5. Fügen Sie unter **"Autorisierte Weiterleitungs-URIs"** hinzu:
   ```
   https://developers.google.com/oauthplayground
   ```
6. Klicken Sie auf **"Erstellen"**
7. **Wichtig**: Kopieren Sie sich die **Client-ID** und das **Clientgeheimnis**

### Schritt 4: Refresh Token generieren

1. Gehen Sie zu: https://developers.google.com/oauthplayground
2. Klicken Sie rechts oben auf das **Zahnrad-Symbol** (Settings)
3. Aktivieren Sie **"Use your own OAuth credentials"**
4. Fügen Sie Ihre **OAuth Client ID** und **OAuth Client secret** ein
5. Klicken Sie auf **"Close"**

6. Links unter **"Step 1 - Select & authorize APIs"**:
   - Scrollen Sie zu **"Calendar API v3"**
   - Wählen Sie: `https://www.googleapis.com/auth/calendar` aus
   - Klicken Sie auf **"Authorize APIs"**

7. Sie werden zu Google weitergeleitet:
   - Wählen Sie Ihr Google-Konto aus
   - Klicken Sie auf **"Fortfahren"** (trotz der Warnung - Sie haben die App erstellt)
   - Bestätigen Sie die Berechtigung

8. Nach der Weiterleitung zurück zum Playground:
   - Klicken Sie auf **"Exchange authorization code for tokens"**
   - Kopieren Sie den **"Refresh token"** (beginnt mit `1//...`)

### Schritt 5: Umgebungsvariablen konfigurieren

Fügen Sie folgende Variablen in Ihre `.env` Datei ein:

```env
# Google Calendar Integration
GOOGLE_CLIENT_ID="Ihre-Client-ID.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="Ihr-Client-Secret"
GOOGLE_REFRESH_TOKEN="1//Ihr-Refresh-Token"
GOOGLE_CALENDAR_ID="primary"
GOOGLE_USER_EMAIL="ihre-email@gmail.com"
```

**Erklärung:**
- `GOOGLE_CLIENT_ID`: Die Client-ID aus Schritt 3.2
- `GOOGLE_CLIENT_SECRET`: Das Clientgeheimnis aus Schritt 3.2
- `GOOGLE_REFRESH_TOKEN`: Der Refresh Token aus Schritt 4
- `GOOGLE_CALENDAR_ID`: Lassen Sie dies auf `"primary"` für Ihren Hauptkalender
- `GOOGLE_USER_EMAIL`: Die E-Mail-Adresse Ihres Google-Kontos

## 🧪 Integration testen

### Im Admin-Panel testen

1. Öffnen Sie Ihr Admin-Panel
2. Gehen Sie zu **"Einstellungen"**
3. Scrollen Sie zu **"Google Calendar Integration"**
4. Sie sehen den Status der Verbindung
5. Klicken Sie auf **"Verbindung testen"**

### Testtermin buchen

1. Buchen Sie einen Testtermin über Ihr Formular
2. Öffnen Sie Ihren Google Calendar
3. Der Termin sollte automatisch erscheinen

## 🔧 Fehlerbehebung

### "Invalid credentials" Fehler

**Problem**: Die Anmeldedaten werden nicht akzeptiert.

**Lösung**:
- Überprüfen Sie, ob alle Umgebungsvariablen korrekt gesetzt sind
- Stellen Sie sicher, dass keine Leerzeichen in den Werten sind
- Generieren Sie einen neuen Refresh Token

### "Calendar not found" Fehler

**Problem**: Der Calendar kann nicht gefunden werden.

**Lösung**:
- Verwenden Sie `"primary"` als GOOGLE_CALENDAR_ID
- Oder finden Sie Ihre Calendar-ID:
  1. Öffnen Sie Google Calendar
  2. Gehen Sie zu **Einstellungen**
  3. Wählen Sie den gewünschten Kalender
  4. Scrollen Sie zu **"Kalender-ID"**
  5. Kopieren Sie die ID (z.B. `ihre-email@gmail.com`)

### Termine werden nicht erstellt

**Prüfen Sie**:
1. Ist die Google Calendar API aktiviert? (Schritt 2)
2. Haben Sie den richtigen Scope autorisiert? (`calendar`)
3. Ist der Refresh Token noch gültig?
4. Checken Sie die Browser-Konsole/Logs für Fehlermeldungen

### Refresh Token abgelaufen

**Symptom**: Nach einiger Zeit funktioniert die Integration nicht mehr.

**Lösung**:
- Gehen Sie zurück zum OAuth Playground (Schritt 4)
- Generieren Sie einen neuen Refresh Token
- Aktualisieren Sie die `.env` Datei

## 🔐 Sicherheitshinweise

1. **Secrets schützen**: Teilen Sie niemals Ihre Client-ID, Client Secret oder Refresh Token
2. **Production Mode**: Stellen Sie die OAuth-App in der Google Cloud Console auf "Production"
3. **Zugriffskontrolle**: Beschränken Sie die API-Bereiche auf das Minimum (nur `calendar`)
4. **Regelmäßige Prüfung**: Überprüfen Sie regelmäßig die Zugriffslogs in der Google Cloud Console

## 📱 Mehrere Kalender verwenden

Wenn Sie Termine in verschiedene Kalender eintragen möchten:

1. Erstellen Sie mehrere Calendar-IDs in Google Calendar
2. Notieren Sie sich die Calendar-IDs
3. In Zukunft können Sie die GOOGLE_CALENDAR_ID dynamisch setzen

## 🎯 Erweiterte Funktionen

### Erinnerungen anpassen

Die Standard-Erinnerungen sind:
- 24 Stunden vorher (E-Mail)
- 30 Minuten vorher (Popup)

Sie können diese im Code anpassen in `src/pages/api/book-appointment.ts`:

```typescript
reminders: {
  useDefault: false,
  overrides: [
    { method: 'email', minutes: 24 * 60 },    // 24 Stunden
    { method: 'popup', minutes: 30 },          // 30 Minuten
  ],
}
```

### Zeitzone ändern

Die Standard-Zeitzone ist `Europe/Berlin`. Ändern Sie diese bei Bedarf:

```typescript
start: {
  dateTime: appointmentDate.toISOString(),
  timeZone: 'Europe/Berlin',  // Ändern Sie dies
}
```

## ✅ Checkliste

- [ ] Google Cloud Projekt erstellt
- [ ] Google Calendar API aktiviert
- [ ] OAuth-Zustimmungsbildschirm konfiguriert
- [ ] OAuth-Client-ID erstellt
- [ ] Refresh Token generiert
- [ ] Umgebungsvariablen in `.env` eingetragen
- [ ] Integration im Admin-Panel getestet
- [ ] Testtermin erfolgreich erstellt

## 💡 Hilfe benötigt?

Bei Problemen:
1. Überprüfen Sie die Logs in der Browser-Konsole
2. Checken Sie die Google Cloud Console Logs
3. Testen Sie die Verbindung im Admin-Panel

## 📚 Weiterführende Dokumentation

- [Google Calendar API Dokumentation](https://developers.google.com/calendar/api/v3/reference)
- [OAuth 2.0 für Webanwendungen](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Google Cloud Console](https://console.cloud.google.com/)
