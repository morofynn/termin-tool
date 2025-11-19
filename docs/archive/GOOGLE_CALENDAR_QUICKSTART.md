# Google Calendar Integration - Quick Start ⚡

Eine vereinfachte Schnellanleitung für die Google Calendar Integration.

## 🚀 In 3 Minuten starten

### 1️⃣ Google Cloud Projekt erstellen

1. Gehe zu: https://console.cloud.google.com/
2. Klicke **"Neues Projekt"**
3. Name: `Terminbuchung` → **"Erstellen"**

### 2️⃣ API aktivieren

1. Suche oben: `Google Calendar API`
2. Klicke → **"Aktivieren"**

### 3️⃣ OAuth Credentials

**A) Zustimmungsbildschirm:**
1. Menü → **APIs & Dienste** → **OAuth-Zustimmungsbildschirm**
2. Wähle **"Extern"** → **"Erstellen"**
3. Pflichtfelder ausfüllen:
   - App-Name: `Terminbuchung`
   - Nutzer-Support-E-Mail: Deine E-Mail
   - Entwickler-E-Mail: Deine E-Mail
4. **"Speichern"**
5. Bei **"Bereiche"** → **"Bereich hinzufügen"**
   - Suche: `calendar`
   - Wähle: `https://www.googleapis.com/auth/calendar`
   - **"Aktualisieren"**
6. Bei **"Testnutzer"** → Deine Gmail-Adresse hinzufügen
7. **"Speichern und fortfahren"**

**B) Client-ID erstellen:**
1. Menü → **APIs & Dienste** → **Anmeldedaten**
2. **"+ Anmeldedaten erstellen"** → **"OAuth-Client-ID"**
3. Anwendungstyp: **"Webanwendung"**
4. Name: `Terminbuchung Web`
5. **Autorisierte Weiterleitungs-URIs:**
   ```
   https://developers.google.com/oauthplayground
   ```
6. **"Erstellen"**
7. ⚠️ **Kopiere Client-ID und Clientgeheimnis!**

### 4️⃣ Refresh Token generieren

1. Öffne: https://developers.google.com/oauthplayground
2. Klicke **Zahnrad** (rechts oben)
3. Aktiviere **"Use your own OAuth credentials"**
4. Füge ein:
   - **OAuth Client ID**: [Deine Client-ID]
   - **OAuth Client secret**: [Dein Secret]
5. **"Close"**
6. Links: Suche **"Calendar API v3"**
7. Wähle: `https://www.googleapis.com/auth/calendar`
8. **"Authorize APIs"**
9. Wähle dein Google-Konto
10. Klicke **"Fortfahren"** (trotz Warnung)
11. Bestätige alle Berechtigungen
12. Klicke **"Exchange authorization code for tokens"**
13. ⚠️ **Kopiere den "Refresh token"** (beginnt mit `1//...`)

### 5️⃣ Umgebungsvariablen setzen

Öffne deine `.env` Datei und füge hinzu:

```env
GOOGLE_CLIENT_ID="DEINE_CLIENT_ID.apps.googleusercontent.com"
GOOGLE_CLIENT_SECRET="DEIN_CLIENT_SECRET"
GOOGLE_REFRESH_TOKEN="1//DEIN_REFRESH_TOKEN"
GOOGLE_CALENDAR_ID="primary"
GOOGLE_USER_EMAIL="deine-email@gmail.com"
```

### 6️⃣ Testen

1. Starte deine App neu
2. Öffne das Admin-Panel
3. Gehe zu **"Einstellungen"**
4. Scrolle zu **"Google Calendar Integration"**
5. Klicke **"Verbindung testen"**

✅ Wenn alles grün ist → **Fertig!**

---

## ❌ Fehler beheben

### "Invalid credentials"
→ Überprüfe Client-ID, Client-Secret und Refresh Token in `.env`

### "Calendar not found"
→ Verwende `"primary"` als GOOGLE_CALENDAR_ID

### "Token expired"
→ Generiere einen neuen Refresh Token (Schritt 4 wiederholen)

### Termine werden nicht erstellt
→ Prüfe:
1. Ist die Calendar API aktiviert?
2. Ist der richtige Scope autorisiert? (`calendar`)
3. Ist "Automatische Bestätigung" in den Einstellungen aktiviert?

---

## 📚 Vollständige Anleitung

Für detaillierte Informationen siehe: **GOOGLE_CALENDAR_SETUP.md**

---

## 💡 Tipps

- ✅ Verwende `primary` als Calendar-ID für deinen Hauptkalender
- ✅ Der Refresh Token läuft normalerweise nicht ab (außer bei Sicherheitsproblemen)
- ✅ Teste die Verbindung nach jedem Setup-Schritt
- ✅ Sichere deine Credentials gut ab (nie in Git committen!)

---

## 🎯 Nächste Schritte

Nach erfolgreicher Einrichtung:
1. Aktiviere **"Automatische Bestätigung"** in den Einstellungen
2. Buche einen Testtermin
3. Überprüfe deinen Google Calendar
4. Teste die Stornierung

---

**Benötigst du Hilfe?** Öffne die `GOOGLE_CALENDAR_SETUP.md` für die ausführliche Anleitung.
