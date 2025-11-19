# Gmail API statt Resend verwenden

## ✅ Vorteile

- Keine zusätzliche Service (Resend) erforderlich
- Nutzt deine bestehende Gmail-Adresse
- Gleiche OAuth-Credentials wie Google Calendar
- Kostenlos (Gmail Limits: 500 E-Mails/Tag)

---

## 🔧 Setup

Du hast bereits fast alles! Es fehlt nur **eine** Environment Variable:

### In Webflow setzen:

```
Name:  GOOGLE_USER_EMAIL
Type:  Plain Text (oder Secret)
Value: fynn.klinkow@moro-gmbh.de
Environment: Production (oder Both)
```

**Das war's!** 🎉

---

## 📊 Aktueller Status

Deine aktuelle Konfiguration (aus `/api/debug-google`):

```json
{
  "GOOGLE_CLIENT_ID": "✅ Gesetzt",
  "GOOGLE_CLIENT_SECRET": "✅ Gesetzt", 
  "GOOGLE_REFRESH_TOKEN": "✅ Gesetzt",
  "GOOGLE_CALENDAR_ID": "✅ Gesetzt (fynn.klinkow@moro-gmbh.de)",
  "GOOGLE_USER_EMAIL": "❌ Fehlt - MUSS GESETZT WERDEN"
}
```

Deine Scopes:
```json
[
  "https://www.googleapis.com/auth/calendar",
  "https://mail.google.com/"  ✅ Perfekt für Gmail!
]
```

---

## 🚀 Deployment

### 1. Environment Variable setzen

**Webflow Dashboard:**
1. Deine App → **Settings** → **Environment Variables**
2. **Add Variable**:
   - **Name:** `GOOGLE_USER_EMAIL`
   - **Value:** `fynn.klinkow@moro-gmbh.de`
   - **Type:** Plain Text (Public) oder Secret (beide OK)
   - **Environment:** Production

3. **Save and Deploy**

### 2. Warten (1-2 Minuten)

Webflow deployed automatisch neu.

### 3. Testen

**Debug-Check:**
```
https://deine-app.com/api/debug-google
```

Sollte jetzt zeigen:
```json
{
  "GOOGLE_USER_EMAIL": {
    "set": true,
    "value": "fynn.klinkow@moro-gmbh.de"
  }
}
```

**Test-Termin buchen:**
1. Hauptseite öffnen
2. Termin buchen
3. E-Mail sollte ankommen von: `fynn.klinkow@moro-gmbh.de`

---

## 📧 E-Mail-Versand Details

### Absender

E-Mails werden versendet als:
```
From: MORO <fynn.klinkow@moro-gmbh.de>
```

### Empfänger

- **Kunde:** Die E-Mail-Adresse aus dem Buchungsformular
- **Admin:** Die E-Mail aus den Einstellungen (`companyEmail`)

### Anhang

Bei Terminbestätigungen:
- **ICS-Datei** (Kalender-Einladung)
- Kann in Outlook, Apple Mail, Google Calendar importiert werden

---

## ⚙️ Wie funktioniert es?

Die App nutzt **Gmail API** statt SMTP:

1. **OAuth Token** wird verwendet (gleicher wie für Calendar)
2. **Gmail API** erstellt die E-Mail
3. E-Mail wird über **dein Gmail-Konto** versendet
4. Erscheint in deinem **"Gesendet"** Ordner

**Vorteil:** Alle E-Mails sind in deinem Gmail nachvollziehbar!

---

## 🔍 Troubleshooting

### Problem: "GOOGLE_USER_EMAIL not set"

**Lösung:** Environment Variable in Webflow hinzufügen (siehe oben)

---

### Problem: E-Mails kommen nicht an

**Debug:**
```
https://deine-app.com/api/debug-google
```

**Prüfe:**
1. `GOOGLE_USER_EMAIL` ist gesetzt ✅
2. `tokenExchange.success` ist `true` ✅
3. Scopes enthalten `https://mail.google.com/` ✅

**Wenn alle ✅:** Prüfe Gmail "Gesendet" Ordner - E-Mail sollte dort sein!

---

### Problem: E-Mails landen im Spam

**Ursache:** Gmail API sendet von deiner persönlichen Adresse

**Lösung:**

#### Option A: SPF Record hinzufügen (empfohlen)

Wenn du DNS-Zugriff auf `moro-gmbh.de` hast:

```
Type: TXT
Name: @
Value: v=spf1 include:_spf.google.com ~all
```

#### Option B: Absenderadresse anpassen

In **Admin → Einstellungen**:
```
Firma E-Mail: fynn.klinkow@moro-gmbh.de
```

So wird die E-Mail von der gleichen Adresse versendet, mit der du autorisiert bist.

---

### Problem: "Insufficient permissions"

**Symptom:** Gmail API gibt 403 Error zurück

**Ursache:** Token hat nicht den Gmail-Scope

**Lösung:**

Du hast bereits den richtigen Scope! ✅
```json
"scopes": [
  "https://mail.google.com/"
]
```

Falls es trotzdem nicht funktioniert:
1. Gehe zu: `https://deine-app.com/api/auth/google-authorize`
2. Autorisiere erneut
3. Kopiere neuen `REFRESH_TOKEN`
4. Setze in Webflow

---

### Problem: Gmail Limit erreicht

**Symptom:** "Daily sending quota exceeded"

**Ursache:** Gmail erlaubt 500 E-Mails/Tag

**Lösung:**

#### Für mehr E-Mails:

Nutze Google Workspace (ehemals G Suite):
- 2.000 E-Mails/Tag (Standard)
- 10.000 E-Mails/Tag (mit Google Workspace Business)

**Oder:** Wechsel zu Resend/SendGrid/AWS SES

---

## 📊 Gmail vs Resend Vergleich

| Feature | Gmail API | Resend |
|---------|-----------|--------|
| **Setup** | 1 Variable | 1 Variable + Account |
| **Kosten** | Kostenlos | Kostenlos (100/Tag) |
| **Limit** | 500/Tag | 100/Tag (Free) |
| **Absender** | Deine Gmail | Beliebig |
| **Spam-Score** | Mittel | Niedrig (mit Domain) |
| **Tracking** | Gmail "Gesendet" | Resend Dashboard |
| **Domain** | Nicht nötig | Empfohlen |

**Empfehlung:**
- **Für Event (3 Tage):** Gmail reicht vollkommen! ✅
- **Für Dauerbetrieb:** Resend mit eigener Domain besser

---

## 🔢 E-Mail-Anzahl schätzen

**Für OPTI 2026 Event:**

Annahme:
- 3 Tage Event
- 10 Zeitslots pro Tag = 30 Slots
- 1 Termin pro Slot = 30 Termine

**E-Mails pro Termin:**
- 1× Bestätigung an Kunde
- 1× Benachrichtigung an Admin
- 1× Erinnerung (1 Tag vorher)
= **3 E-Mails pro Termin**

**Gesamt:** 30 Termine × 3 = **90 E-Mails**

✅ **Weit unter dem Gmail Limit (500/Tag)!**

---

## 🎯 Quick Start Checklist

- [x] GOOGLE_CLIENT_ID gesetzt
- [x] GOOGLE_CLIENT_SECRET gesetzt
- [x] GOOGLE_REFRESH_TOKEN gesetzt
- [x] Token hat Gmail-Scope ✅
- [ ] **GOOGLE_USER_EMAIL setzen** ← JETZT!
- [ ] Deployment abwarten (1-2 Min)
- [ ] Test-Termin buchen
- [ ] E-Mail prüfen

---

## ✅ Nach dem Setup

**Test 1: Debug-Check**
```
https://deine-app.com/api/debug-google
```

Erwartetes Ergebnis:
```json
{
  "GOOGLE_USER_EMAIL": {
    "set": true,
    "value": "fynn.klinkow@moro-gmbh.de"
  },
  "recommendations": [
    "✅ Google Calendar ist vollständig konfiguriert und funktioniert!",
    "✅ Gmail API ist konfiguriert. E-Mails sollten funktionieren."
  ]
}
```

**Test 2: Test-E-Mail**
1. Admin Panel → Einstellungen
2. Scrolle zu "E-Mail-Benachrichtigungen"
3. Klicke "Test-E-Mail senden"
4. Prüfe Posteingang

**Test 3: Echter Termin**
1. Termin buchen
2. E-Mail erhalten? ✅
3. Google Calendar aktualisiert? ✅
4. Admin-Benachrichtigung? ✅

---

## 🔐 Sicherheit

### Wo sind meine Daten?

- **Credentials:** In Webflow Environment Variables (verschlüsselt)
- **E-Mails:** In deinem Gmail-Konto (unter "Gesendet")
- **Logs:** Cloudflare Workers Logs

### Wer kann E-Mails senden?

Nur deine App kann E-Mails über dein Gmail-Konto senden, weil:
1. OAuth Token ist secret
2. Token ist auf deine Domain beschränkt
3. Token kann jederzeit widerrufen werden

### Token widerrufen

Gehe zu: https://myaccount.google.com/permissions
→ Finde "MORO Booking App"
→ "Zugriff entfernen"

---

## 📞 Support

**Gmail API Docs:** https://developers.google.com/gmail/api
**OAuth Scopes:** https://developers.google.com/identity/protocols/oauth2/scopes#gmail

---

**Viel Erfolg! 🚀**

Nach dem Setzen von `GOOGLE_USER_EMAIL` sollte alles funktionieren!
