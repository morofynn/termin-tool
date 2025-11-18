# Google Calendar Setup - Schnellübersicht

## 🎯 Zwei Wege zur Integration

### ⚡ Weg 1: OAuth Flow (Empfohlen - Schnell & Einfach)

**Dokument**: `GOOGLE_CALENDAR_OAUTH_SETUP.md`

**Vorteile**:
- ✅ Setup in unter 5 Minuten
- ✅ Ein Klick zur Autorisierung
- ✅ Automatische Token-Generierung
- ✅ Keine manuelle Token-Verwaltung

**Schritte**:
1. Google Cloud Projekt erstellen
2. Calendar API aktivieren
3. OAuth Client-ID erstellen
4. Callback-URL hinzufügen: `/api/auth/google-callback`
5. Client-ID und Secret in `.env` eintragen
6. Im Admin-Panel auf "Mit Google autorisieren" klicken
7. Refresh Token kopieren und in `.env` eintragen
8. Fertig! 🎉

---

### 📚 Weg 2: OAuth Playground (Manuell)

**Dokument**: `GOOGLE_CALENDAR_SETUP.md`

**Wann verwenden**:
- Wenn Sie OAuth Playground bevorzugen
- Für manuelle Token-Verwaltung
- Als Fallback-Methode

**Schritte**:
1. Google Cloud Projekt erstellen
2. Calendar API aktivieren
3. OAuth Client-ID erstellen
4. OAuth Playground verwenden
5. Manuell Refresh Token generieren
6. Token in `.env` eintragen

---

## 🚀 Implementierte Routen

### `/api/auth/google-authorize`
- Startet OAuth Flow
- Leitet zu Google weiter
- Garantiert Refresh Token durch `access_type=offline`

### `/api/auth/google-callback`
- Empfängt Authorization Code
- Tauscht gegen Tokens
- Zeigt Refresh Token in schöner UI

### `/api/admin/test-calendar`
- Testet Google Calendar Verbindung
- Zeigt Kalender-Informationen
- Validiert Credentials

---

## 🔑 Benötigte Umgebungsvariablen

```env
# OAuth Credentials
GOOGLE_CLIENT_ID="1234567890-abc...apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="GOCSPX-..."

# Nach Autorisierung:
GOOGLE_REFRESH_TOKEN="1//0..."

# Optional (Standard: "primary" & Ihre Email)
GOOGLE_CALENDAR_ID="primary"
GOOGLE_USER_EMAIL="ihre-email@gmail.com"
```

---

## 📍 Callback URLs für Google Cloud Console

**Lokale Entwicklung:**
```
http://localhost:3000/api/auth/google-callback
```

**Production:**
```
https://ihre-domain.com/api/auth/google-callback
```

💡 **Tipp**: Sie können beide URLs gleichzeitig in Google Cloud Console eintragen!

---

## ✅ Was funktioniert nach dem Setup?

✅ **Automatische Kalendererstellung** bei Terminbuchung  
✅ **Teilnehmer hinzufügen** (Kunde wird eingetragen)  
✅ **Erinnerungen**:
   - 24 Stunden vorher (E-Mail)
   - 30 Minuten vorher (Popup)  
✅ **Stornierung** löscht Event automatisch  
✅ **30 Minuten Standarddauer** pro Termin  

---

## 🎯 Empfohlener Workflow

1. **Setup starten**: Lesen Sie `GOOGLE_CALENDAR_OAUTH_SETUP.md`
2. **Google Cloud Console**: OAuth Credentials erstellen
3. **Callback URL**: `/api/auth/google-callback` registrieren
4. **`.env` konfigurieren**: Client-ID & Secret eintragen
5. **Autorisieren**: Button im Admin-Panel oder direkter Link
6. **Refresh Token**: Kopieren und in `.env` eintragen
7. **Testen**: "Verbindung testen" im Admin-Panel
8. **Fertig**: Buchen Sie einen Test-Termin

---

## 🔧 Troubleshooting

### Häufige Fehler

| Fehler | Lösung |
|--------|--------|
| `redirect_uri_mismatch` | Callback-URL in Google Console überprüfen |
| `invalid_client` | Client-ID/Secret in `.env` überprüfen |
| Kein Refresh Token | Zugriff widerrufen und neu autorisieren |
| `invalid_grant` | Neuen Refresh Token generieren |

**Detaillierte Lösungen**: Siehe `GOOGLE_CALENDAR_OAUTH_SETUP.md` → Fehlerbehebung

---

## 📚 Dokumentation

- **Schnellstart**: `GOOGLE_CALENDAR_OAUTH_SETUP.md`
- **Detailliert**: `GOOGLE_CALENDAR_SETUP.md`
- **Quickstart**: `GOOGLE_CALENDAR_QUICKSTART.md`

**Externe Links**:
- [Google OAuth 2.0](https://developers.google.com/identity/protocols/oauth2/web-server)
- [Calendar API](https://developers.google.com/calendar/api/v3/reference)

---

## 🎉 Zusammenfassung

**Zeit**: 5-10 Minuten  
**Schwierigkeit**: Einfach  
**Resultat**: Vollautomatische Google Calendar Integration

**Bei Fragen**: Siehe detaillierte Setup-Guides oder Fehlerbehebung

**Viel Erfolg! 🚀**
