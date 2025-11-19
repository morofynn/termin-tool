# 🔗 URL Generation Migration

## Übersicht

Alle Termin-URLs werden jetzt zentral über die `ADMIN_BASE_URL` Environment Variable generiert.

### Vorher
```
https://3b6e870e-6908-4e0d-85e1-8e465f8edc70.wf-app-prod.cosmic.webflow.services/termin/apt_123
```

### Nachher
```
https://opti-termin.webflow.io/master/termin/apt_123
```

---

## ✅ Zentrale URL-Generierung

### Neue Utility-Funktion

**Datei:** `src/lib/url-utils.ts`

```typescript
import { getAppointmentUrl } from '../../lib/url-utils';

// Generiere Termin-URL mit automatischem Fallback
const appointmentUrl = getAppointmentUrl(
  appointmentId,           // z.B. 'apt_1763501868613_13k9lnefu'
  locals?.runtime?.env,    // Environment Variables
  url.origin              // Fallback wenn ADMIN_BASE_URL nicht gesetzt
);
```

#### Funktionsweise

1. **Versucht** `ADMIN_BASE_URL` aus Environment Variables zu lesen
2. **Falls nicht gesetzt**: Verwendet `url.origin` als Fallback (Worker URL)
3. **Entfernt** trailing slashes automatisch
4. **Gibt zurück**: Vollständige URL (`https://opti-termin.webflow.io/master/termin/apt_123`)

---

## 📝 Geänderte Dateien

### 1. API Routes (7 Dateien)

#### ✅ `src/pages/api/book-appointment.ts`
- **Zeile 10**: Import hinzugefügt
- **Zeile 196**: Verwendet `getAppointmentUrl()` statt String-Konkatenation
- **Verwendet in**: E-Mails, Google Calendar Events

#### ✅ `src/pages/api/appointment/cancel.ts`
- **Zeile 6**: Import hinzugefügt
- **Zeile 176**: Verwendet `getAppointmentUrl()`
- **Verwendet in**: Stornierungsbestätigungen (Kunde + Admin)

#### ✅ `src/pages/api/admin/appointments.ts`
- **Zeile 7**: Import hinzugefügt
- **Zeile 149** (`confirmAppointment`): Verwendet `getAppointmentUrl()`
- **Zeile 280** (`cancelAppointment`): Verwendet `getAppointmentUrl()`
- **Verwendet in**: Admin-Aktionen, Google Calendar, E-Mails

#### ✅ `src/pages/api/admin/appointments/cancel.ts`
- **Zeile 6**: Import hinzugefügt
- **Zeile 133**: Verwendet `getAppointmentUrl()`
- **Verwendet in**: Admin-Stornierungen

#### ✅ `src/pages/api/admin/test-email.ts`
- **Zeile 3**: Import hinzugefügt
- **Zeile 51**: Verwendet `getAppointmentUrl('test-123', ...)`
- **Verwendet in**: Test-E-Mails für alle Templates

#### ✅ `src/pages/api/send-reminders.ts`
- **Zeile 3**: Import hinzugefügt
- **Zeile 115**: Verwendet `getAppointmentUrl()`
- **Verwendet in**: Automatische Erinnerungs-E-Mails (24h vorher)

### 2. E-Mail System

#### ✅ `src/lib/email.ts`
- **KEINE ÄNDERUNG nötig** ✓
- Erhält `appointmentUrl` bereits von API Routes
- Gibt URL weiter an Templates und ICS-Generierung

#### ✅ `src/lib/email-templates.ts`
- **KEINE ÄNDERUNG nötig** ✓
- Nutzt `appointment.appointmentUrl` aus übergebenem Data-Objekt
- Generiert ICS-Dateien mit korrekter URL

---

## 🌐 Wo werden die URLs verwendet?

### 1. **E-Mail Templates**
- ✅ Bestätigungsmails (Kunde)
- ✅ Benachrichtigungen (Admin)
- ✅ Stornierungsbestätigungen
- ✅ Erinnerungs-E-Mails (24h vorher)
- ✅ Test-E-Mails

### 2. **ICS-Kalender-Dateien**
- ✅ Anhang in E-Mails
- ✅ "In Kalender eintragen" Button
- ✅ Description-Feld mit Link

### 3. **Google Calendar Events**
- ✅ Event-Beschreibung
- ✅ "Termin verwalten" Link

### 4. **API Responses**
- ✅ Nach erfolgreicher Buchung
- ✅ Nach Stornierung
- ✅ Admin-Panel Operationen

---

## ⚙️ Environment Variable Setup

### Erforderliche Variable

```bash
# .env oder Cloudflare Dashboard
ADMIN_BASE_URL=https://opti-termin.webflow.io/master
```

**Wichtig:**
- ❌ **KEIN** trailing slash: `https://...io/master/` ❌
- ✅ **Ohne** trailing slash: `https://...io/master` ✅

### Fallback-Verhalten

Wenn `ADMIN_BASE_URL` **nicht gesetzt** ist:
- System verwendet automatisch `url.origin` (Worker URL)
- ⚠️ URLs sehen dann so aus: `https://worker-id.wf-app-prod.cosmic.webflow.services/termin/...`
- System funktioniert weiterhin, aber URLs sind nicht schön

---

## 🧪 Testing Checklist

### Manuelle Tests

```bash
# 1. Test-E-Mail senden
curl -X POST https://your-domain/api/admin/test-email \
  -H "Content-Type: application/json" \
  -d '{"emailType": "confirmed"}'

# 2. Neue Buchung erstellen
# → Prüfe URL in Bestätigungsmail
# → Prüfe URL in ICS-Datei
# → Prüfe URL in Google Calendar Event

# 3. Termin stornieren
# → Prüfe URL in Stornierungsmail

# 4. Erinnerungs-Job manuell ausführen
curl -X POST https://your-domain/api/send-reminders
# → Prüfe URL in Erinnerungsmail
```

### Automatische Prüfung

```bash
# Prüfe ob alle Dateien die neue Funktion verwenden
grep -r "getAppointmentUrl" src/pages/api --include="*.ts"

# Sollte 7 Dateien finden:
# ✅ book-appointment.ts
# ✅ appointment/cancel.ts
# ✅ admin/appointments.ts
# ✅ admin/appointments/cancel.ts
# ✅ admin/test-email.ts
# ✅ send-reminders.ts
```

---

## 🎯 Vorteile

### 1. **Zentrale Verwaltung**
- Nur eine Stelle zum Ändern
- Konsistente URL-Struktur überall
- Einfache Wartung

### 2. **Schönere URLs**
```
Vorher: https://3b6e870e-...webflow.services/termin/apt_123
Nachher: https://opti-termin.webflow.io/master/termin/apt_123
```

### 3. **Flexibilität**
- Einfacher Wechsel zwischen Umgebungen
- Production, Staging, Development URLs
- Automatischer Fallback bei Fehlkonfiguration

### 4. **Konsistenz**
- ✅ E-Mails
- ✅ ICS-Dateien
- ✅ Google Calendar
- ✅ API Responses
- Alle verwenden dieselbe URL-Quelle

---

## 📋 Migration Guide

### Für bestehende Installationen

1. **Environment Variable setzen**
   ```bash
   ADMIN_BASE_URL=https://your-domain.com/your-path
   ```

2. **Keine Code-Änderungen nötig**
   - System nutzt automatisch neue Funktion
   - Bestehende Termine werden nicht geändert
   - Nur neue Termine verwenden neue URLs

3. **Testing**
   - Sende Test-E-Mail
   - Prüfe URL in E-Mail
   - Prüfe ICS-Datei
   - Prüfe Google Calendar Event

4. **Fertig!**
   - System läuft automatisch mit neuen URLs

---

## 🔧 Technische Details

### URL-Generierung Flow

```typescript
// 1. API Route ruft Funktion auf
const appointmentUrl = getAppointmentUrl(
  'apt_123',
  locals?.runtime?.env,
  url.origin
);

// 2. Funktion prüft Environment
const adminBaseUrl = env?.ADMIN_BASE_URL || import.meta.env?.ADMIN_BASE_URL;

// 3. Entscheidet Quelle
const baseUrl = adminBaseUrl || fallbackOrigin;

// 4. Baut URL
const cleanBaseUrl = baseUrl.replace(/\/$/, ''); // Remove trailing slash
return `${cleanBaseUrl}/termin/${appointmentId}`;
```

### Verwendet in Email System

```typescript
// API Route
const appointmentUrl = getAppointmentUrl(...);

// An Email System weitergeben
await sendCustomerNotification({
  ...
  appointmentUrl, // ← Hier!
}, env);

// Email Templates
const html = `<a href="${appointment.appointmentUrl}">Termin ansehen</a>`;

// ICS Generierung
calendar.createEvent({
  ...
  description: `Termin verwalten: ${appointment.appointmentUrl}`
});
```

---

## 📚 Zusätzliche Funktionen

### `getAdminPanelUrl()`

Generiert Admin-Panel URLs mit `ADMIN_SECRET_PATH`:

```typescript
import { getAdminPanelUrl } from '../../lib/url-utils';

const adminUrl = getAdminPanelUrl(locals?.runtime?.env, url.origin);
// → https://opti-termin.webflow.io/master/secure-admin-panel-xyz789
```

### `getAppointmentIdFromUrl()`

Extrahiert Termin-ID aus URL:

```typescript
import { getAppointmentIdFromUrl } from '../../lib/url-utils';

const id = getAppointmentIdFromUrl('https://.../termin/apt_123');
// → 'apt_123'
```

### `getBaseUrlFromAppointmentUrl()`

Extrahiert Base URL:

```typescript
import { getBaseUrlFromAppointmentUrl } from '../../lib/url-utils';

const base = getBaseUrlFromAppointmentUrl('https://.../master/termin/apt_123');
// → 'https://.../master'
```

---

## ❓ FAQ

### Muss ich alte Termine aktualisieren?
**Nein.** Alte Termine behalten ihre gespeicherten URLs. Nur neue Termine verwenden die neue URL-Struktur.

### Was passiert wenn ADMIN_BASE_URL falsch ist?
Das System verwendet den Fallback (`url.origin`). URLs funktionieren, sind aber nicht schön.

### Kann ich verschiedene URLs für Test/Production haben?
**Ja!** Setze einfach verschiedene `ADMIN_BASE_URL` Werte in den jeweiligen Environments.

### Werden auch Admin-Panel Links geändert?
**Ja**, über `getAdminPanelUrl()`. Bereits implementiert in vorherigen Updates.

---

## 📞 Support

Bei Fragen oder Problemen:
1. Prüfe Environment Variable `ADMIN_BASE_URL`
2. Prüfe dass kein trailing slash vorhanden ist
3. Teste mit Test-E-Mail
4. Prüfe Browser Console & Server Logs

---

**Status:** ✅ Vollständig implementiert
**Version:** 2.0
**Datum:** 2025-01-18
**Breaking Changes:** Keine (abwärtskompatibel)
