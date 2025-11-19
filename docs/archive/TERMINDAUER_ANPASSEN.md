# Termindauer anpassen

## 📝 Übersicht

Die Dauer eines Termins kann jetzt über das **Admin-Panel** konfiguriert werden und ist nicht mehr fest auf 30 Minuten eingestellt.

---

## ⚙️ Termindauer ändern

### Im Admin-Panel

1. Öffne: `https://deine-app-url.workers.dev/secure-admin-panel-xyz789`
2. Gehe zu **"Einstellungen"** Tab
3. Scrolle zum Abschnitt **"Buchungseinstellungen"**
4. Finde das Feld: **"Termindauer (Minuten)"**
5. Gib die gewünschte Dauer ein (z.B. `15`, `30`, `45`, `60`)
6. Klicke auf **"Einstellungen speichern"**

### Erlaubte Werte

- **Minimum:** 5 Minuten
- **Maximum:** 120 Minuten (2 Stunden)
- **Standard:** 30 Minuten
- **Schritte:** 5 Minuten (empfohlen)

---

## 💡 Beispiele

| Dauer | Verwendungszweck |
|-------|------------------|
| **15 Min** | Kurze Beratungsgespräche, Quick-Checks |
| **30 Min** | Standard-Beratungstermine (Standard) |
| **45 Min** | Ausführliche Gespräche |
| **60 Min** | Intensive Beratung, Produktvorstellung |
| **90 Min** | Workshop, ausführliche Präsentation |

---

## 🔄 Auswirkungen

Die Termindauer beeinflusst:

1. **Google Calendar Events**
   - Endzeit wird automatisch berechnet
   - Beispiel: Start 10:00 Uhr + 15 Min = Ende 10:15 Uhr

2. **E-Mail-Benachrichtigungen**
   - Zeigt die korrekte Dauer an
   - Beispiel: "Ihr Termin dauert 15 Minuten"

3. **iCal-Dateien**
   - Download enthält korrekte Start- und Endzeit
   - Import in Outlook, Apple Calendar, etc.

---

## ⚠️ Wichtig

### Zeitslots bleiben gleich

Die **verfügbaren Zeitslots** (09:00, 09:30, 10:00, etc.) bleiben **unverändert**.

**Beispiel:**
- Termindauer: **15 Minuten**
- Verfügbare Slots: 09:00, 09:30, 10:00, ...
- Buchung um 09:00 → Termin endet 09:15
- Buchung um 09:30 → Termin endet 09:45

### Überschneidungen vermeiden

Wenn du die Termindauer erhöhst (z.B. auf 60 Minuten), solltest du:

1. **Weniger Slots pro Tag aktivieren**
   - Nur jede zweite Stunde (10:00, 12:00, 14:00, etc.)
   
2. **Oder: Maximal 1 Termin pro Slot**
   - Verhindert Überschneidungen

**Beispiel-Problem:**
```
❌ 09:00 - 10:00 (Kunde A)
❌ 09:30 - 10:30 (Kunde B)  ← Überschneidung!
```

**Lösung:**
- Setze "Maximale gleichzeitige Termine pro Zeitslot" auf **1**
- Oder deaktiviere jeden zweiten Slot

---

## 🛠️ Technische Details

### Wo wird die Dauer verwendet?

#### 1. Termin-Buchung (`/api/book-appointment.ts`)
```typescript
const endDate = new Date(appointmentDate);
endDate.setMinutes(
  appointmentDate.getMinutes() + 
  (settings.appointmentDurationMinutes || 30)
);
```

#### 2. Admin-Bestätigung (`/api/admin/appointments.ts`)
```typescript
const endDate = new Date(startDate);
endDate.setMinutes(
  endDate.getMinutes() + 
  (settings.appointmentDurationMinutes || 30)
);
```

#### 3. Google Calendar Event
```json
{
  "start": {
    "dateTime": "2026-01-16T10:00:00+01:00"
  },
  "end": {
    "dateTime": "2026-01-16T10:15:00+01:00"  // +15 Min
  }
}
```

---

## 📋 Default-Wert

In `src/lib/constants.ts`:

```typescript
export const DEFAULT_SETTINGS = {
  // ...
  appointmentDurationMinutes: 30,  // Standard: 30 Minuten
  // ...
};
```

Dieser Wert wird verwendet, wenn:
- Noch keine Einstellung im Admin gespeichert wurde
- Der Wert ungültig ist (z.B. 0 oder negativ)

---

## 🧪 Testen

### 1. Lokale Entwicklung

```bash
npm run dev
```

1. Gehe zu Admin → Einstellungen
2. Ändere Termindauer auf **15 Minuten**
3. Speichern
4. Buche einen Test-Termin
5. Prüfe Google Calendar:
   - Start: 10:00
   - Ende: 10:15 ✅

### 2. Production

Nach dem Deployment:

```bash
wrangler deploy
```

1. Gehe zu Admin-Panel
2. Ändere Termindauer
3. Buche Test-Termin
4. Prüfe:
   - Google Calendar Event
   - E-Mail-Bestätigung
   - iCal-Download

---

## 🔧 Troubleshooting

### Problem: Dauer wird nicht gespeichert

**Symptom:** Änderungen im Admin werden nicht übernommen

**Lösung:**
1. Browser-Cache leeren
2. Seite neu laden
3. Erneut versuchen

---

### Problem: Google Calendar zeigt falsche Dauer

**Symptom:** Event endet immer nach 30 Minuten

**Ursache:** Alte Events wurden mit alter Dauer erstellt

**Lösung:**
1. Admin → Termine
2. Termin neu bestätigen
3. Oder: Manuell in Google Calendar anpassen

---

### Problem: Validierungsfehler

**Symptom:** "Bitte geben Sie eine gültige Dauer ein"

**Ursache:** Wert außerhalb erlaubtem Bereich

**Lösung:**
- Verwende Werte zwischen 5 und 120 Minuten
- Verwende Schritte von 5 Minuten (empfohlen)

---

## 📊 Empfohlene Konfigurationen

### Kurze Termine (15 Min)

```
Termindauer: 15 Minuten
Max. Termine pro Slot: 1
Verfügbare Zeitslots: 09:00 - 17:30 (alle 30 Min)
```

**Ideal für:**
- Schnelle Beratungen
- Informationsgespräche
- Produktdemos

---

### Standard-Termine (30 Min)

```
Termindauer: 30 Minuten
Max. Termine pro Slot: 1
Verfügbare Zeitslots: 09:00 - 17:30 (alle 30 Min)
```

**Ideal für:**
- Standardberatung
- Verkaufsgespräche
- Erste Kontakte

---

### Lange Termine (60 Min)

```
Termindauer: 60 Minuten
Max. Termine pro Slot: 1
Verfügbare Zeitslots: 09:00 - 17:00 (jede Stunde)
```

**Ideal für:**
- Ausführliche Beratungen
- Workshops
- Produktschulungen

**Wichtig:** Reduziere verfügbare Slots!

---

## 🎯 Best Practices

### 1. Passende Slot-Abstände

- **15 Min Dauer:** Slots alle 15 oder 30 Min ✅
- **30 Min Dauer:** Slots alle 30 Min ✅
- **60 Min Dauer:** Slots jede Stunde ✅

### 2. Puffer einplanen

Füge Buffer zwischen Terminen ein:

```
10:00 - 10:30 (Termin 1)
10:30 - 10:45 (Pause)
10:45 - 11:15 (Termin 2)
```

### 3. Realistische Zeiten

- Nicht zu kurz: Mindestens 10 Minuten
- Nicht zu lang: Maximal 2 Stunden
- Puffer für Überzug einplanen

---

## 🔄 Migration

Wenn du bereits Termine gebucht hast:

### Automatisch

Neue Termine verwenden automatisch die neue Dauer.

### Bestehende Termine

Bestehende Termine behalten ihre ursprüngliche Dauer.

**Um zu ändern:**
1. Admin → Termine
2. Termin auswählen
3. Neu bestätigen → verwendet neue Dauer

---

## ✅ Checkliste

Nach Änderung der Termindauer:

- [ ] Einstellung im Admin gespeichert
- [ ] Test-Termin gebucht
- [ ] Google Calendar geprüft (korrekte Endzeit)
- [ ] E-Mail-Benachrichtigung geprüft
- [ ] iCal-Download getestet
- [ ] Slots angepasst (falls nötig)
- [ ] Max. Termine pro Slot angepasst (falls nötig)

---

**Stand:** November 2025  
**Version:** 2.1.0
