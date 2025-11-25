# ✅ Test-Checklist v1.1.6

**Version:** v1.1.6  
**Fix:** Doppelte ICS-Dateien in E-Mails  
**Datum:** 25.11.2025

---

## 🎯 Hauptziel

**Stelle sicher, dass:**
- ✅ Nur **1 ICS-Datei** (`termin.ics`) verschickt wird
- ✅ Keine `mail-anhang.ics` oder `invite.ics` mehr existiert
- ✅ E-Mails landen im **Posteingang** (nicht Spam)

---

## 🧪 Testing-Schritte

### 1️⃣ Setup
- [ ] Code deployed: `git push origin main` → `wrangler deploy`
- [ ] Admin-Panel öffnen: `/{ADMIN_SECRET_PATH}`
- [ ] Einloggen mit Admin-Credentials

---

### 2️⃣ Test-E-Mail verschicken

#### A. Über Admin-Panel (Test-Funktion)
- [ ] Admin → **"Einstellungen"** → **"E-Mail Test"**
- [ ] **"Bestätigungs-E-Mail an Kunde"** verschicken
- [ ] E-Mail-Adresse eingeben (deine Test-E-Mail)
- [ ] **"Senden"** klicken

#### B. Über echte Buchung (Optional)
- [ ] Termin buchen über Frontend (`/`)
- [ ] Termin im Admin-Panel bestätigen
- [ ] Bestätigungs-E-Mail wird automatisch verschickt

---

### 3️⃣ E-Mail prüfen (WICHTIG!)

#### Schritt 1: Anhänge zählen
- [ ] E-Mail öffnen
- [ ] **Anhänge-Bereich** prüfen
- [ ] **ERWARTET:** Genau **1 Anhang** (`termin.ics`)
- [ ] **FEHLER wenn:** 2 Anhänge (`termin.ics` + `mail-anhang.ics`)

#### Schritt 2: ICS-Datei prüfen
- [ ] `termin.ics` herunterladen
- [ ] Datei öffnen mit Texteditor
- [ ] Prüfen ob korrekte Daten enthalten:
  - `BEGIN:VCALENDAR`
  - `SUMMARY:Termin: MORO - OPTI 26`
  - `DTSTART:...`
  - `DTEND:...`
  - `ORGANIZER:...`
  - Kein `ATTENDEE` Feld (sollte entfernt sein)

#### Schritt 3: Kalender-Import testen
- [ ] `termin.ics` in Google Calendar importieren
- [ ] Termin erscheint korrekt mit allen Details
- [ ] Datum, Uhrzeit, Ort korrekt angezeigt

#### Schritt 4: Spam-Check
- [ ] E-Mail landet im **Posteingang** (nicht Spam)
- [ ] Wenn Spam: Prüfe Spam-Ordner und markiere als "Kein Spam"

---

### 4️⃣ Admin-E-Mail prüfen

- [ ] Admin-E-Mail wurde verschickt (check Admin-Posteingang)
- [ ] Admin-E-Mail enthält ebenfalls nur **1 ICS-Datei**
- [ ] Admin-E-Mail landet im Posteingang (nicht Spam)

---

### 5️⃣ Cross-Client Testing

#### Gmail (Desktop)
- [ ] E-Mail öffnen
- [ ] Anhang-Vorschau prüfen
- [ ] Nur **1 ICS-Datei** sichtbar
- [ ] ICS-Download funktioniert
- [ ] Kalender-Import erfolgreich

#### Gmail (Mobile)
- [ ] E-Mail auf Smartphone öffnen
- [ ] Anhänge prüfen (nur 1!)
- [ ] ICS-Download & Import testen

#### Outlook (Optional)
- [ ] E-Mail in Outlook öffnen
- [ ] Anhänge prüfen
- [ ] ICS-Import testen

#### Apple Mail (Optional)
- [ ] E-Mail in Apple Mail öffnen
- [ ] Anhänge prüfen
- [ ] ICS-Import in Apple Calendar

---

## 🐛 Fehlersuche

### Problem: Immer noch 2 ICS-Dateien

**Mögliche Ursachen:**
1. **Code nicht deployed:** `git pull` + `wrangler deploy`
2. **Cache:** E-Mail-Client cached alte Version → Neue E-Mail verschicken
3. **Alte E-Mail:** Du schaust auf alte E-Mail → Neue Test-E-Mail verschicken

**Fix:**
```bash
# 1. Sicherstellen dass Code aktuell ist
git pull origin main
git log --oneline -1 # Sollte v1.1.6 sein

# 2. Neu deployen
wrangler deploy

# 3. Neue Test-E-Mail verschicken
# Admin → Einstellungen → E-Mail Test
```

---

### Problem: E-Mail landet im Spam

**Mögliche Ursachen:**
1. **Zu viele Test-E-Mails:** Gmail markiert als Spam wenn zu viele E-Mails von neuem Sender
2. **SPF/DKIM nicht konfiguriert:** Domain-Authentifizierung fehlt
3. **Content-Filter:** E-Mail-Inhalt triggert Spam-Filter

**Fix:**
1. **Gmail:** Markiere E-Mail als "Kein Spam" → Trainiert Gmail
2. **Warte 24h:** Gmail lernt dass E-Mails legitim sind
3. **Produktions-Domain:** Deploy auf echter Domain mit SPF/DKIM

---

## 📊 Erfolgs-Kriterien

### ✅ Test erfolgreich wenn:
- [x] Nur **1 ICS-Datei** (`termin.ics`) in E-Mail
- [x] Kein `mail-anhang.ics` oder `invite.ics`
- [x] E-Mail landet im **Posteingang**
- [x] ICS-Import funktioniert in allen Kalender-Apps
- [x] Termin-Details korrekt angezeigt

### ❌ Test fehlgeschlagen wenn:
- [ ] **2 ICS-Dateien** in E-Mail
- [ ] E-Mail landet im **Spam**
- [ ] ICS-Import schlägt fehl
- [ ] Termin-Details fehlen oder falsch

---

## 📝 Test-Protokoll

**Datum:** _______  
**Tester:** _______

| Test | Status | Notizen |
|------|--------|---------|
| E-Mail verschickt | ⬜ ✅ ❌ | |
| Nur 1 ICS-Datei | ⬜ ✅ ❌ | |
| Posteingang (nicht Spam) | ⬜ ✅ ❌ | |
| ICS-Import erfolgreich | ⬜ ✅ ❌ | |
| Gmail Desktop | ⬜ ✅ ❌ | |
| Gmail Mobile | ⬜ ✅ ❌ | |
| Admin-E-Mail OK | ⬜ ✅ ❌ | |

**Gesamt-Status:** ⬜ ✅ PASSED | ❌ FAILED

**Notizen:**
_________________________________________________
_________________________________________________
_________________________________________________

---

## 🚀 Nach erfolgreichem Test

- [ ] Test-Checklist ausgefüllt
- [ ] Screenshots gemacht (optional)
- [ ] Version als **STABLE** markieren
- [ ] Production Deployment freigeben
- [ ] Monitoring aktivieren (Spam-Rate prüfen)
- [ ] User-Feedback sammeln

---

**Version:** v1.1.6  
**Status:** ⏳ Waiting for Testing  
**Next:** v1.1.7 (wenn weitere Bugs gefunden)
