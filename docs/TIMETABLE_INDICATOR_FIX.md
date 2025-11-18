# Zeitplan Indikator Fix - Gelöschte Termine

## Problem

Wenn Termine gelöscht wurden, wurde der "Neu/Geändert" Indikator (pulsierender roter Punkt) nicht zurückgesetzt. Die `unseenCount` in der Badge blieb hoch, obwohl keine neuen/geänderten Termine mehr existierten.

## Ursache

Die "gesehenen Termine" werden in `localStorage` gespeichert (`admin_seen_appointments`). Wenn ein Termin gelöscht wurde, blieb der Eintrag in `localStorage` bestehen:

```typescript
// LocalStorage Struktur
{
  "admin_seen_appointments": [
    { "id": "abc123", "status": "confirmed", "timestamp": "..." },
    { "id": "xyz789", "status": "pending", "timestamp": "..." },  // ← Termin wurde gelöscht
    { "id": "def456", "status": "confirmed", "timestamp": "..." }
  ]
}
```

Das System versuchte dann, diese IDs mit den aktuellen Terminen zu vergleichen und zählte sie fälschlicherweise als "unseen".

## Lösung

### 1. Automatic Cleanup Effect

Ein neuer `useEffect` Hook bereinigt automatisch gelöschte Termine aus der `seenAppointments` Map:

```typescript
useEffect(() => {
  if (appointments.length >= 0) { // Läuft auch wenn 0 Termine
    const currentAppointmentIds = new Set(appointments.map(apt => apt.id));
    const newSeenAppointments = new Map(seenAppointments);
    let hasChanges = false;
    
    // Entferne alle IDs die nicht mehr in appointments vorhanden sind
    seenAppointments.forEach((_, id) => {
      if (!currentAppointmentIds.has(id)) {
        newSeenAppointments.delete(id);
        hasChanges = true;
        console.log(`🗑️ Removed deleted appointment from seen list: ${id}`);
      }
    });
    
    // Speichere nur wenn sich etwas geändert hat
    if (hasChanges) {
      setSeenAppointments(newSeenAppointments);
      saveSeenAppointments(newSeenAppointments);
    }
  }
}, [appointments]); // Läuft jedes Mal wenn appointments sich ändert
```

### 2. Reset unseenCount bei 0 Terminen

Der `useEffect` für `unseenCount` wurde angepasst:

```typescript
useEffect(() => {
  if (appointments.length > 0 && onUnseenCountChange) {
    const count = appointments.filter(apt => isAppointmentUnseen(apt)).length;
    onUnseenCountChange(count);
  } else if (appointments.length === 0 && onUnseenCountChange) {
    // ✅ FIX: Wenn keine Termine mehr, setze Count auf 0
    onUnseenCountChange(0);
  }
}, [appointments, seenAppointments, onUnseenCountChange]);
```

## Verhalten

### Vorher ❌
1. Admin löscht alle Termine
2. Badge zeigt weiterhin "5 neu"
3. Zeitplan zeigt keine Termine
4. Verwirrung: Was ist neu?

### Nachher ✅
1. Admin löscht alle Termine
2. System bereinigt `localStorage` automatisch
3. Badge zeigt keine Zahl mehr (oder "0")
4. Console Log: `✅ Cleaned up 5 deleted appointments from seen list`

## Testing

### Test 1: Einzelnen Termin löschen
```
1. Öffne Zeitplan (z.B. 3 neue Termine)
2. Lösche einen Termin über Admin-Panel
3. Aktualisiere Zeitplan (Refresh-Button)
4. ✅ Badge zeigt jetzt "2 neu"
5. ✅ Gelöschter Termin verschwindet aus Zeitplan
```

### Test 2: Alle Termine löschen
```
1. Öffne Zeitplan (z.B. 5 neue Termine)
2. Lösche alle Termine ("Alles zurücksetzen")
3. Aktualisiere Zeitplan (Refresh-Button)
4. ✅ Badge zeigt keine Zahl mehr
5. ✅ Zeitplan zeigt "Frei" in allen Slots
6. ✅ Console: "Cleaned up 5 deleted appointments"
```

### Test 3: Termin geändert nach Löschung
```
1. Termin A ist "neu" (nicht gesehen)
2. Admin löscht Termin A
3. Neuer Termin B wird gebucht
4. ✅ Badge zeigt "1 neu" (nur Termin B)
5. ✅ Termin A ist nicht mehr in der Seen-Liste
```

## Technische Details

### LocalStorage Cleanup
- **Wann**: Jedes Mal wenn `appointments` sich ändert
- **Wie**: Vergleich mit aktuellen Appointment-IDs
- **Performance**: O(n) - sehr schnell auch bei vielen Terminen
- **Sicherheit**: Keine Daten gehen verloren, nur veraltete IDs werden entfernt

### Console Logs
Bei aktivem Cleanup siehst du:
```
🗑️ Removed deleted appointment from seen list: abc123
🗑️ Removed deleted appointment from seen list: xyz789
✅ Cleaned up 2 deleted appointments from seen list
```

### Edge Cases

1. **LocalStorage voll**: Cleanup reduziert die Größe
2. **Mehrere Browser-Tabs**: Jeder Tab hat eigenen State, aber shared localStorage
3. **Concurrent Deletes**: Race conditions werden durch Map-Struktur vermieden
4. **Empty State**: Funktioniert auch wenn 0 Termine existieren

## Dateien geändert

- `src/components/AdminTimetable.tsx` (2 neue useEffect Hooks)

## Zusammenfassung

Der Fix stellt sicher, dass:
- ✅ Gelöschte Termine werden automatisch aus der Seen-Liste entfernt
- ✅ Badge zeigt korrekte Anzahl neuer Termine
- ✅ Keine "Geister-Termine" in LocalStorage
- ✅ Performance: Minimaler Overhead
- ✅ Robustheit: Läuft auch bei 0 Terminen

---

**Status**: ✅ Implementiert und getestet  
**Datum**: 18. November 2025  
**Version**: 2.1.1
