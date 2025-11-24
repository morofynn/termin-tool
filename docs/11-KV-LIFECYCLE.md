# 💾 KV Store Lifecycle Management

> Wie Daten im Cloudflare KV Store gespeichert, aktualisiert und gelöscht werden

---

## 📊 Übersicht KV Keys

| Key Pattern | Zweck | TTL | Erstellt in | Gelöscht in |
|-------------|-------|-----|-------------|-------------|
| `appointment:{id}` | Termin-Daten | 90d | book-appointment.ts | admin/appointments.ts |
| `appointments:list` | Liste aller IDs | 90d | book-appointment.ts | admin/appointments.ts |
| `slot:{day}:{time}:{date}` | Slot-Buchungen | 90d | book-appointment.ts | admin/appointments.ts |
| `settings` | App-Einstellungen | ∞ | admin/settings.ts | Nie (überschrieben) |
| `audit:{timestamp}:{id}` | Audit-Eintrag | 90d | audit-log.ts | admin/audit-log.ts |
| `audit:list` | Liste aller Audit-IDs | 90d | audit-log.ts | admin/audit-log.ts |
| `google_tokens` | OAuth Tokens | ∞ | auth/google-callback.ts | Nie (überschrieben) |
| `rate:{ip}` | Rate Limiting | 15m | rate-limit.ts | Automatisch (TTL) |

---

## 🔄 Lifecycle Flows

### 1. Terminbuchung (CREATE)

```typescript
// src/pages/api/book-appointment.ts

// 1. Appointment erstellen
const appointment = { id, name, email, ... };
await kv.put(
  `appointment:${id}`,
  JSON.stringify(appointment),
  { expirationTtl: 60 * 60 * 24 * 90 }  // 90 Tage
);

// 2. Zur Liste hinzufügen
const list = await kv.get('appointments:list');
const appointmentsList = list ? JSON.parse(list) : [];
appointmentsList.push(id);
await kv.put('appointments:list', JSON.stringify(appointmentsList));

// 3. Slot reservieren
const slotKey = `slot:${day}:${time}:${dateKey}`;
const slotData = await kv.get(slotKey);
const slotAppointments = slotData ? JSON.parse(slotData) : [];
slotAppointments.push(id);
await kv.put(slotKey, JSON.stringify(slotAppointments));

// 4. Audit Log
await createAuditLog(kv, 'booking_created', `Appointment ${id} created`);
```

**Ergebnis:**
- ✅ `appointment:{id}` existiert mit TTL 90d
- ✅ `appointments:list` enthält die neue ID
- ✅ `slot:friday:10:00:2026-01-16` enthält die ID
- ✅ `audit:{timestamp}:{uuid}` wurde erstellt

---

### 2. Termin stornieren (UPDATE + CLEANUP)

```typescript
// src/pages/api/appointment/cancel.ts

// 1. Appointment laden
const appointment = await kv.get(`appointment:${id}`);

// 2. Status aktualisieren
appointment.status = 'cancelled';
appointment.cancelledAt = new Date().toISOString();
await kv.put(`appointment:${id}`, JSON.stringify(appointment));

// 3. Slot freigeben
const slotKey = `slot:${day}:${time}:${dateKey}`;
const slotData = await kv.get(slotKey);
const slotAppointments = JSON.parse(slotData);
const updatedSlot = slotAppointments.filter(aptId => aptId !== id);

if (updatedSlot.length > 0) {
  // Slot hat noch andere Termine
  await kv.put(slotKey, JSON.stringify(updatedSlot));
} else {
  // Slot ist leer - löschen
  await kv.delete(slotKey);
}

// 4. Google Calendar Event löschen (falls vorhanden)
if (appointment.googleEventId) {
  await calendar.events.delete({ eventId: appointment.googleEventId });
}

// 5. Audit Log
await createAuditLog(kv, 'appointment_cancelled', `Appointment ${id} cancelled`);
```

**Ergebnis:**
- ✅ `appointment:{id}` Status ist jetzt 'cancelled'
- ✅ `slot:...` ID wurde entfernt (oder Slot gelöscht)
- ⚠️ `appointments:list` enthält ID NOCH (wird später gecleaned)

---

### 3. Termin löschen (DELETE)

```typescript
// src/pages/api/admin/appointments.ts - deleteAppointment()

// 1. Appointment löschen
await kv.delete(`appointment:${id}`);

// 2. Aus Liste entfernen
const listData = await kv.get('appointments:list');
const appointmentsList = JSON.parse(listData);
const updatedList = appointmentsList.filter(aptId => aptId !== id);
await kv.put('appointments:list', JSON.stringify(updatedList));

// 3. Slot freigeben (wie bei Stornierung)
const slotKey = `slot:${day}:${time}:${dateKey}`;
const slotData = await kv.get(slotKey);
if (slotData) {
  const slotAppointments = JSON.parse(slotData);
  const updatedSlot = slotAppointments.filter(aptId => aptId !== id);
  
  if (updatedSlot.length > 0) {
    await kv.put(slotKey, JSON.stringify(updatedSlot));
  } else {
    await kv.delete(slotKey);
  }
}

// 4. Google Calendar Event löschen
if (appointment.googleEventId) {
  await calendar.events.delete({ eventId: appointment.googleEventId });
}

// 5. Audit Log
await createAuditLog(kv, 'appointment_deleted', `Appointment ${id} deleted by admin`);
```

**Ergebnis:**
- ✅ `appointment:{id}` GELÖSCHT
- ✅ `appointments:list` ID entfernt
- ✅ `slot:...` ID entfernt (oder Slot gelöscht)
- ✅ Google Calendar Event gelöscht

---

### 4. Alle Termine löschen (BULK DELETE)

```typescript
// src/pages/api/admin/appointments/delete-all.ts

// 1. Liste laden
const listData = await kv.get('appointments:list');
const appointmentIds = JSON.parse(listData);

// 2. Jedes Appointment löschen
for (const id of appointmentIds) {
  // Appointment löschen
  await kv.delete(`appointment:${id}`);
  
  // Google Calendar Event löschen (falls vorhanden)
  const apt = await kv.get(`appointment:${id}`);
  if (apt?.googleEventId) {
    await calendar.events.delete({ eventId: apt.googleEventId });
  }
}

// 3. Liste leeren
await kv.put('appointments:list', JSON.stringify([]));

// 4. ALLE Slots löschen (Pattern-Suche nicht möglich in KV!)
// ⚠️ Problem: Slots bleiben erhalten!
// Lösung: TTL sorgt für automatisches Cleanup nach 90 Tagen

// 5. Audit Log
await createAuditLog(kv, 'all_appointments_deleted', 'All appointments deleted');
```

**Ergebnis:**
- ✅ Alle `appointment:{id}` GELÖSCHT
- ✅ `appointments:list` ist leer
- ⚠️ `slot:...` Keys bleiben erhalten (werden via TTL gecleaned)

---

## ⚠️ Bekannte Probleme & Lösungen

### Problem 1: Verwaiste Slots nach Bulk Delete
**Problem:** Nach "Alle löschen" bleiben Slot-Keys erhalten.

**Grund:** KV unterstützt keine Pattern-basierte Löschung (`slot:*`).

**Lösung:** 
- TTL von 90 Tagen sorgt für automatisches Cleanup
- Alternative: Liste aller aktiven Slots pflegen (aufwändig)

**Status:** ✅ Akzeptabel (TTL-basiertes Cleanup)

---

### Problem 2: appointments:list kann "tote" IDs enthalten
**Problem:** Nach manuellem KV-Cleanup oder Fehlern können IDs in der Liste sein, deren Appointments nicht mehr existieren.

**Lösung:** 
```typescript
// In admin/appointments.ts - getAppointments()
const appointmentIds = await kv.get('appointments:list');
const appointments = [];

for (const id of appointmentIds) {
  const data = await kv.get(`appointment:${id}`);
  if (data) {  // ✅ Nur wenn Appointment existiert
    appointments.push(JSON.parse(data));
  } else {
    // ⚠️ "Tote" ID gefunden - könnte aus Liste entfernt werden
    console.warn(`Dead appointment ID found: ${id}`);
  }
}
```

**Status:** ✅ Implementiert (Null-Check vorhanden)

---

### Problem 3: Rate Limiting Keys sammeln sich an
**Problem:** `rate:{ip}` Keys werden für jede IP erstellt.

**Lösung:**
- TTL von 15 Minuten sorgt für automatisches Cleanup
- Keine manuelle Bereinigung nötig

**Status:** ✅ Kein Problem (TTL-basiert)

---

## 🧹 Cleanup-Strategien

### Automatisches Cleanup (via TTL)
| Key Type | TTL | Cleanup-Mechanismus |
|----------|-----|---------------------|
| `appointment:{id}` | 90d | Automatisch nach 90 Tagen |
| `slot:...` | 90d | Automatisch nach 90 Tagen |
| `audit:...` | 90d | Automatisch nach 90 Tagen |
| `rate:{ip}` | 15m | Automatisch nach 15 Minuten |

### Manuelles Cleanup (Admin-Funktionen)
| Funktion | Was wird gelöscht | Aufruf |
|----------|-------------------|--------|
| **Termin löschen** | Einzelner Termin + Slot | Admin Panel → Löschen Button |
| **Alle löschen** | Alle Termine | Admin Panel → "Alle Termine löschen" |
| **Audit Log leeren** | Alle Audit-Einträge | Admin Panel → "Audit-Log leeren" |

---

## 📈 Best Practices

### ✅ DO
- **Immer TTL setzen** für zeitlich begrenzte Daten
- **Liste pflegen** (`appointments:list`) für schnellen Zugriff
- **Audit Log schreiben** für alle wichtigen Aktionen
- **Null-Checks** beim Laden aus KV (Daten können fehlen)
- **Cleanup in Transaktion** (Appointment + Slot + Liste)

### ❌ DON'T
- **Kein Pattern-Delete** (KV unterstützt das nicht)
- **Keine unendlichen TTLs** für Transaktionsdaten
- **Keine sensiblen Daten** ohne Verschlüsselung
- **Keine großen Objekte** (KV Limit: 25 MB)

---

## 🛠️ Utility Functions

Die App nutzt jetzt zentrale Utility-Funktionen:

### kv-utils.ts
```typescript
import { getAppointment, saveAppointment, deleteAppointment } from './lib/kv-utils';

// Sicher laden (mit Null-Check)
const appointment = await getAppointment(kv, id);
if (!appointment) {
  return new Response('Not found', { status: 404 });
}

// Speichern (mit TTL)
await saveAppointment(kv, appointment, 90);

// Löschen
await deleteAppointment(kv, id);
```

### slot-utils.ts
```typescript
import { reserveSlot, releaseSlot, isSlotAvailable } from './lib/slot-utils';

// Slot reservieren
await reserveSlot(kv, 'friday', '10:00', '2026-01-16', appointmentId);

// Slot freigeben
await releaseSlot(kv, 'friday', '10:00', '2026-01-16', appointmentId);

// Verfügbarkeit prüfen
const available = await isSlotAvailable(kv, 'friday', '10:00', '2026-01-16', maxSlots);
```

---

## 📚 Weitere Infos

- **Architektur:** [10-ARCHITECTURE.md](./10-ARCHITECTURE.md)
- **Code-Struktur:** [40-CODE-STRUCTURE.md](./40-CODE-STRUCTURE.md)
- **Utilities:** [41-UTILITIES.md](./41-UTILITIES.md)

---

**Zurück zur Übersicht:** [README.md](./README.md)
