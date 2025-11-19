# 🚀 Setup Guide - MORO Terminbuchungssystem

## Schnellstart

### 1. Google Calendar OAuth Setup

1. **Google Cloud Console** öffnen: https://console.cloud.google.com
2. **Neues Projekt** erstellen oder bestehendes wählen
3. **APIs aktivieren**:
   - Google Calendar API
   - Gmail API (für E-Mail-Versand)

4. **OAuth 2.0 Client erstellen**:
   - Credentials → Create Credentials → OAuth Client ID
   - Application Type: **Web Application**
   - Authorized redirect URIs:
     ```
     https://your-domain.com/api/auth/google-callback
     http://localhost:4321/api/auth/google-callback
     ```

5. **Credentials herunterladen** → Client ID & Secret notieren

### 2. Umgebungsvariablen konfigurieren

In Webflow unter **App Settings → Environment Variables**:

```bash
# Google OAuth (ERFORDERLICH)
GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=your-client-secret
GOOGLE_REDIRECT_URI=https://your-domain.com/api/auth/google-callback
GOOGLE_USER_EMAIL=your-email@gmail.com

# Admin Panel (ERFORDERLICH)
ADMIN_PASSWORD=MeinSicheresPasswort123!

# KV Namespace (Automatisch in Webflow)
APPOINTMENTS_KV=automatisch-gesetzt
```

### 3. Google Calendar autorisieren

1. Admin Panel öffnen: `https://your-domain.com/secure-admin-panel-xyz789`
2. Passwort eingeben
3. **Settings** → Google Calendar Sektion
4. **"Google Calendar verbinden"** Button klicken
5. Google Account auswählen und Zugriff erlauben

✅ **Fertig!** Das System ist einsatzbereit.

---

## Features

### Terminbuchung
- ✅ 3-Tages-Event (Fr-So) Support
- ✅ Flexible Termindauer (5-240 Min, Standard: 30 Min)
- ✅ Automatische oder manuelle Bestätigung
- ✅ Doppelbuchungsschutz
- ✅ Rate Limiting

### Google Calendar Integration
- ✅ Automatische Event-Erstellung
- ✅ ICS-Dateianhänge in E-Mails
- ✅ Event-Updates bei Terminänderungen
- ✅ Automatische Löschung bei Stornierung

### E-Mail Benachrichtigungen
- ✅ Buchungsbestätigung an Kunden
- ✅ Admin-Benachrichtigung bei neuen Anfragen
- ✅ Stornierungsbestätigung
- ✅ ICS-Kalenderanhänge
- ✅ UTF-8 und Emoji-Support

### Admin Panel
- ✅ Terminverwaltung (Bestätigen/Ablehnen/Löschen)
- ✅ Audit Log (vollständige Historie)
- ✅ System-Einstellungen
- ✅ Google Calendar Status
- ✅ Wartungsmodus

---

## Termindauer anpassen

**Admin Panel → Settings → Event-Konfiguration**

1. Feld: **"Termindauer (Minuten)"**
2. Wert eingeben: 5-240 Minuten (Schritte: 5 Min)
3. Standard: 30 Minuten
4. **Speichern** klicken

Die neue Dauer gilt für **alle zukünftigen Termine**.

---

## Deployment

### Webflow Cloud
1. Code in Webflow hochladen
2. Environment Variables setzen (siehe oben)
3. Deploy ausführen
4. Google Calendar autorisieren (siehe Setup Schritt 3)

### Cloudflare Workers (Alternative)
```bash
npm run build
wrangler publish
```

---

## Troubleshooting

### Google Calendar funktioniert nicht
1. **Admin Panel → Settings** → System-Status prüfen
2. **Environment Variables** in Webflow kontrollieren
3. **Google Console** → OAuth Consent Screen Status prüfen
4. Neu autorisieren: Settings → "Google Calendar verbinden"

### E-Mails werden nicht versendet
1. `GOOGLE_USER_EMAIL` korrekt gesetzt?
2. Gmail API in Google Console aktiviert?
3. OAuth Scopes korrekt? (calendar.events + gmail.send)
4. **Audit Log** für Fehlermeldungen prüfen

### Termine erscheinen nicht im Kalender
1. Google Calendar autorisiert?
2. Richtiger Google Account verwendet?
3. **Test Calendar** im Admin Panel ausführen
4. OAuth-Token abgelaufen? → Neu autorisieren

---

## Support & Weiterentwicklung

- **Admin Panel**: `/secure-admin-panel-xyz789`
- **API Dokumentation**: Siehe `docs/API.md`
- **Änderungshistorie**: Siehe `docs/CHANGELOG.md`
