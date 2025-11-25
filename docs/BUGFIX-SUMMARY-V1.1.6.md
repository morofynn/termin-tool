# 🎯 Bugfix Summary v1.1.6

**Datum:** 25.11.2025  
**Version:** v1.1.6  
**Commit:** `80ff9b9`

---

## 🐛 Problem

**Doppelte ICS-Dateien in Bestätigungs-E-Mails:**
- E-Mails enthielten **2 ICS-Dateien**: `termin.ics` + `mail-anhang.ics`
- Die zweite ICS wurde **automatisch von Gmail/Outlook** generiert
- **Folge:** E-Mails landeten im Spam

---

## ✅ Lösung

**`method=PUBLISH` statt `method=REQUEST`:**

```typescript
// ❌ Vorher (src/lib/email.ts)
'Content-Type: text/calendar; charset=utf-8; method=REQUEST'

// ✅ Jetzt
'Content-Type: text/calendar; charset=utf-8; method=PUBLISH'
```

**Warum?**
- `method=REQUEST` = Meeting-Einladung → Gmail/Outlook erstellen automatisch zweite ICS
- `method=PUBLISH` = Kalender-Information → Nur **eine ICS-Datei** (`termin.ics`)

---

## 📊 Ergebnis

| Vorher | Nachher |
|--------|---------|
| 2 ICS-Dateien | 1 ICS-Datei ✅ |
| Spam-Problem | Posteingang ✅ |
| `method=REQUEST` | `method=PUBLISH` ✅ |

---

## 🔄 Geänderte Dateien

- **`src/lib/email.ts`** - ICS Content-Type von `method=REQUEST` auf `method=PUBLISH`
- **`docs/BUGFIX-REPORT-V1.1.6.md`** - Detaillierter Report

---

## 🧪 Testing

**Vor dem Deployment:**
1. Test-E-Mail verschicken (Admin → Einstellungen → E-Mail Test)
2. E-Mail prüfen: Nur **1 ICS-Datei** (`termin.ics`)
3. ICS in Kalender importieren → Termin korrekt angezeigt
4. E-Mail landet im Posteingang (nicht Spam)

---

## 📝 Version History

| Version | Fix | Status |
|---------|-----|--------|
| v1.1.5 | `attendees` aus ICS entfernt | ✅ Deployed |
| v1.1.6 | `method=PUBLISH` statt `REQUEST` | ⏳ Ready for Deploy |

---

## 🚀 Deployment

```bash
# Staging
git add .
git commit -m "v1.1.6"
git push origin main

# Testing
- Test-E-Mail verschicken
- ICS-Dateien prüfen (nur 1!)
- Spam-Check

# Production Deploy
wrangler deploy
```

---

**Status:** ✅ Ready for Production
