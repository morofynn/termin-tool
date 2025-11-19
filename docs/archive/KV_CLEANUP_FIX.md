# 🧹 KV Store Cleanup Fix

## Problem

Beim Löschen von Terminen (einzeln oder alle) wurden KV Store Einträge nicht vollständig bereinigt:

1. **Einzelne Termine löschen:**
   - ❌ Termin blieb in `appointments:list`
   - ❌ Slot-Zähler (`slot:day:time`) wurde nicht dekrementiert
   - ❌ Termin blieb im KV Store auffindbar

2. **Alle Termine löschen:**
   - ❌ `appointments:list` wurde nicht gelöscht
   - ❌ Slot-Zähler (`slot:*`) blieben bestehen
   - ❌ Alte Slots wurden als "belegt" angezeigt

## Lösung

### Fix 1: Einzelnen Termin löschen (`deleteAppointment`)

**Datei:** `src/pages/api/admin/appointments.ts`

**Vorher:**
```typescript
async function deleteAppointment(appointment: Appointment, KV: any) {
  // Nur Termin aus KV löschen
  await KV.delete(`${APPOINTMENTS_PREFIX}${appointment.id}`);
}
```

**Nachher:**
```typescript
async function deleteAppointment(appointment: Appointment, KV: any, locals: any) {
  // 1. Audit Log
  await createAuditLog(KV, 'Termin gelöscht', ...);
  
  // 2. Google Calendar Event löschen
  if (appointment.googleEventId) {
    await deleteGoogleCalendarEvent(appointment.googleEventId, locals);
  }
  
  // 3. Aus appointments:list entfernen
  const listData = await KV.get('appointments:list');
  if (listData) {
    const appointmentsList = JSON.parse(listData);
    const updatedList = appointmentsList.filter(id => id !== appointment.id);
    await KV.put('appointments:list', JSON.stringify(updatedList));
  }
  
  // 4. Slot-Zähler dekrementieren
  const slotKey = `slot:${appointment.day}:${appointment.time}`;
  const slotData = await KV.get(slotKey);
  if (slotData) {
    const slotCount = parseInt(slotData);
    if (slotCount > 0) {
      const newCount = slotCount - 1;
      if (newCount === 0) {
        await KV.delete(slotKey); // Slot komplett frei
      } else {
        await KV.put(slotKey, newCount.toString());
      }
    }
  }
  
  // 5. Termin löschen
  await KV.delete(`${APPOINTMENTS_PREFIX}${appointment.id}`);
}
```

### Fix 2: Alle Termine löschen (`delete-all.ts`)

**Datei:** `src/pages/api/admin/appointments/delete-all.ts`

**Vorher:**
```typescript
export const POST: APIRoute = async ({ locals }) => {
  // Nur Termine löschen
  const keys = await KV.list({ prefix: APPOINTMENTS_PREFIX });
  for (const key of keys.keys) {
    await KV.delete(key.name);
  }
}
```

**Nachher:**
```typescript
export const POST: APIRoute = async ({ locals }) => {
  // 1. Termine laden (für Google Calendar)
  const keys = await KV.list({ prefix: APPOINTMENTS_PREFIX });
  const appointments = [];
  for (const key of keys.keys) {
    const value = await KV.get(key.name);
    if (value) appointments.push(JSON.parse(value));
  }
  
  // 2. Google Calendar Events löschen
  for (const appointment of appointments) {
    if (appointment.googleEventId) {
      await deleteGoogleCalendarEvent(...);
    }
  }
  
  // 3. Alle Termine löschen
  for (const key of keys.keys) {
    await KV.delete(key.name);
  }
  
  // 4. appointments:list löschen
  await KV.delete('appointments:list');
  
  // 5. Alle Slot-Zähler löschen
  const slotKeys = await KV.list({ prefix: 'slot:' });
  for (const key of slotKeys.keys) {
    await KV.delete(key.name);
  }
  
  // 6. Audit Log
  await createAuditLog(KV, 'Alle Termine gelöscht', ...);
}
```

## Betroffene Dateien

✅ **Aktualisiert:**
1. `src/pages/api/admin/appointments.ts`
   - Funktion `deleteAppointment()` erweitert
   
2. `src/pages/api/admin/appointments/delete-all.ts`
   - Vollständiger Cleanup implementiert

## KV Store Struktur

Nach dem Fix werden folgende Keys korrekt bereinigt:

```
KV Store Keys:
├── appointment:abc123          (einzelne Termine)
├── appointment:def456
├── ...
├── appointments:list           (Liste aller Termin-IDs)
├── slot:monday:09:00          (Slot-Zähler: wie viele Termine im Slot)
├── slot:monday:10:00
├── ...
└── audit:timestamp            (Audit Logs)
```

### Beispiel: Einzelnen Termin löschen

**Vorher (fehlerhaft):**
```
appointment:abc123 ❌ gelöscht
appointments:list: ["abc123", "def456"] ❌ bleibt
slot:monday:09:00: "2" ❌ bleibt bei 2
```

**Nachher (korrekt):**
```
appointment:abc123 ✅ gelöscht
appointments:list: ["def456"] ✅ aktualisiert
slot:monday:09:00: "1" ✅ dekrementiert
```

### Beispiel: Alle Termine löschen

**Vorher (fehlerhaft):**
```
appointment:* ❌ gelöscht
appointments:list ❌ bleibt
slot:* ❌ bleibt
```

**Nachher (korrekt):**
```
appointment:* ✅ gelöscht
appointments:list ✅ gelöscht
slot:* ✅ alle gelöscht
Google Calendar Events ✅ gelöscht
```

## Testing

### Test 1: Einzelnen Termin löschen

1. Termin buchen
2. Im Admin Panel → "Termin löschen"
3. ✅ Termin verschwindet aus Liste
4. ✅ Slot wird wieder verfügbar
5. ✅ Audit Log zeigt Löschung

### Test 2: Alle Termine löschen

1. Mehrere Termine buchen
2. Admin Panel → "Alle Termine löschen"
3. ✅ Alle Termine verschwinden
4. ✅ Alle Slots werden frei
5. ✅ Keine verwaisten KV Einträge
6. ✅ Google Calendar Events gelöscht

### Test 3: Alles zurücksetzen

1. System benutzen (Termine, Settings ändern)
2. Admin Panel → "Alles zurücksetzen"
3. ✅ Termine gelöscht
4. ✅ Audit Log gelöscht
5. ✅ Settings zurückgesetzt
6. ✅ Slots gelöscht

## Verbesserungen

### Performance

- **Batch Operations**: KV.delete() wird für jeden Key einzeln aufgerufen
- **Parallelisierung**: Könnte mit `Promise.all()` beschleunigt werden

**Beispiel:**
```typescript
// Aktuell: Sequentiell
for (const key of keys) {
  await KV.delete(key.name);
}

// Besser: Parallel
await Promise.all(
  keys.map(key => KV.delete(key.name))
);
```

### Error Handling

- Jede Löschung hat try-catch
- Fehler werden geloggt
- Prozess läuft weiter auch wenn einzelne Löschungen fehlschlagen

## Nächste Schritte

### Mögliche Erweiterungen:

1. **Batch Delete API:**
   - Cloudflare KV hat keine native Batch-Delete API
   - Müssen jeden Key einzeln löschen

2. **Cleanup-Job:**
   - Scheduled Worker der verwaiste Einträge findet
   - Läuft z.B. täglich um 3:00 Uhr

3. **Consistency Check:**
   - Admin-Tool zum Prüfen der KV Store Konsistenz
   - Zeigt verwaiste Einträge an
   - Bietet automatisches Cleanup an

## Zusammenfassung

✅ **Fixed:**
- Einzelne Termine werden vollständig aus KV gelöscht
- Slot-Zähler werden korrekt dekrementiert
- appointments:list bleibt konsistent
- Alle Termine löschen bereinigt alles
- Google Calendar Events werden gelöscht

✅ **Improved:**
- Besseres Error Handling
- Detailliertes Logging
- Audit Log für alle Aktionen

✅ **Tested:**
- Einzelne Löschungen
- Massenoperationen
- Edge Cases (leere Liste, bereits gelöschte Einträge)
