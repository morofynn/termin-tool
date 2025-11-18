# Email Test Fixes - Sofortbuchung & Formulierungen

## Zusammenfassung der Probleme & Fixes

### 1. ❌ Sofortbuchung: Keine Admin-Mail
**Problem**: Bei `instant-booked` wurde keine Admin-Benachrichtigung gesendet.

**Fix**:
- `email.ts`: `sendAdminNotification()` akzeptiert jetzt `instant-booked` als Action
- `test-email.ts`: Test für `instant-booked` sendet jetzt BEIDE Mails (Kunde + Admin)
- ICS-Anhang wird auch bei `instant-booked` an Admin gesendet

### 2. ❌ Termin bestätigt: Falsche Formulierung
**Problem**: Admin-Mail für manuelle Bestätigung zeigte "wurde **automatisch** bestätigt"

**Fix**:
- `email-templates.ts`: Neuer Action-Type `instant-booked` unterscheidet zwischen:
  - `action: 'instant-booked'` → "✅ Termin automatisch bestätigt" + "wurde automatisch bestätigt"
  - `action: 'confirmed'` → "✅ Termin bestätigt" + "wurde bestätigt"

### 3. ✅ Termin abgelehnt: Funktioniert
Beide Mails (Kunde + Admin) werden korrekt versendet.

### 4. ✅ Termin storniert: Funktioniert
Beide Mails (Kunde + Admin) werden korrekt versendet.

---

## Technische Details

### Email Templates (`email-templates.ts`)

**Neue Action**: `instant-booked`

```typescript
export function generateAdminNotificationEmail(
  appointment: AppointmentData,
  settings: EmailSettings,
  action: 'requested' | 'confirmed' | 'instant-booked' | 'cancelled' | 'rejected'
): string
```

**Header & Subject basierend auf Action**:

| Action | Header | Subject | Status Badge |
|--------|--------|---------|--------------|
| `requested` | ⏳ Neue Terminanfrage | "wartet auf Ihre Bestätigung" | Ausstehend (gelb) |
| **`instant-booked`** | **✅ Termin automatisch bestätigt** | **"wurde automatisch bestätigt"** | **Auto-Bestätigt (grün)** |
| `confirmed` | ✅ Termin bestätigt | "wurde bestätigt" | Bestätigt (grün) |
| `cancelled` | ❌ Termin storniert | "wurde storniert" | Storniert (rot) |
| `rejected` | ❌ Terminanfrage abgelehnt | "wurde abgelehnt" | Abgelehnt (rot) |

### Email Service (`email.ts`)

**Admin-Email Typ-Erweiterung**:

```typescript
export async function sendAdminNotification(
  data: {
    // ...
    action: 'requested' | 'instant-booked' | 'confirmed' | 'cancelled' | 'rejected';
    // ...
  },
  adminEmail: string,
  env?: any
): Promise<boolean>
```

**Subject Lines**:
```typescript
switch (data.action) {
  case 'requested':
    subject = `⏳ Neue Terminanfrage: ${data.name} am ${formatDate(data.day)} um ${data.time}`;
    break;
  case 'instant-booked':
    subject = `✅ Termin automatisch bestätigt: ${data.name} am ${formatDate(data.day)} um ${data.time}`;
    break;
  case 'confirmed':
    subject = `✅ Termin bestätigt: ${data.name} am ${formatDate(data.day)} um ${data.time}`;
    break;
  // ...
}
```

**ICS-Anhang bei instant-booked**:
```typescript
// ✅ ICS-Anhang für Auto-Confirm & bestätigte Termine
if (data.action === 'confirmed' || data.action === 'instant-booked') {
  icsAttachment = generateICS(icsAppointment, settings);
}
```

**Audit Log Einträge**:
```typescript
const actionLabel = data.action === 'requested' ? 'Neue Anfrage' : 
                   data.action === 'instant-booked' ? 'Sofortbestätigung' :
                   data.action === 'confirmed' ? 'Bestätigung' :
                   data.action === 'cancelled' ? 'Stornierung' : 'Ablehnung';
```

### Test Email API (`test-email.ts`)

**Admin-Mail Test für instant-booked**:

```typescript
// 2. Admin-Version an Admin senden (für requested, instant-booked, confirmed, cancelled, rejected)
if (['requested', 'instant-booked', 'confirmed', 'cancelled', 'rejected'].includes(action)) {
  const adminSent = await sendAdminNotification(
    emailData,
    adminEmail,
    locals?.runtime?.env
  );
  // ...
}
```

---

## Testing Checklist

### ✅ Test 1: Sofortbuchung (instant-booked)
```
1. Admin-Panel → Email-Tests → "Test: Sofortbestätigt"
2. ✅ Kunden-E-Mail empfangen (mit ICS-Anhang)
3. ✅ Admin-E-Mail empfangen (mit ICS-Anhang)
4. ✅ Admin Subject: "✅ Termin automatisch bestätigt: Max Mustermann am 24.01.2025 um 10:30"
5. ✅ Admin Header: "✅ Termin automatisch bestätigt"
6. ✅ Admin Badge: "Auto-Bestätigt" (grün)
7. ✅ Audit Log: "Sofortbestätigung wurde an info@moro-gmbh.de gesendet"
```

### ✅ Test 2: Manuelle Bestätigung (confirmed)
```
1. Admin-Panel → Email-Tests → "Test: Bestätigt von Admin"
2. ✅ Kunden-E-Mail empfangen (mit ICS-Anhang)
3. ✅ Admin-E-Mail empfangen (mit ICS-Anhang)
4. ✅ Admin Subject: "✅ Termin bestätigt: Max Mustermann am 24.01.2025 um 10:30"
5. ✅ Admin Header: "✅ Termin bestätigt" (OHNE "automatisch")
6. ✅ Admin Badge: "Bestätigt" (grün)
7. ✅ Audit Log: "Bestätigung wurde an info@moro-gmbh.de gesendet"
```

### ✅ Test 3: Neue Anfrage (requested)
```
1. Admin-Panel → Email-Tests → "Test: Neue Anfrage"
2. ✅ Kunden-E-Mail empfangen (kein ICS)
3. ✅ Admin-E-Mail empfangen (kein ICS)
4. ✅ Admin Subject: "⏳ Neue Terminanfrage: Max Mustermann am 24.01.2025 um 10:30"
5. ✅ Admin Badge: "Ausstehend" (gelb)
6. ✅ Admin Hinweis: "Aktion erforderlich"
```

### ✅ Test 4: Storniert (cancelled)
```
1. Admin-Panel → Email-Tests → "Test: Storniert"
2. ✅ Kunden-E-Mail empfangen
3. ✅ Admin-E-Mail empfangen
4. ✅ Admin Subject: "❌ Termin storniert: Max Mustermann am 24.01.2025 um 10:30"
5. ✅ Admin Badge: "Storniert" (rot)
```

### ✅ Test 5: Abgelehnt (rejected)
```
1. Admin-Panel → Email-Tests → "Test: Abgelehnt"
2. ✅ Kunden-E-Mail empfangen
3. ✅ Admin-E-Mail empfangen
4. ✅ Admin Subject: "❌ Termin abgelehnt: Max Mustermann am 24.01.2025 um 10:30"
5. ✅ Admin Badge: "Abgelehnt" (rot)
```

---

## Unterschiede: instant-booked vs confirmed

| Feature | instant-booked | confirmed |
|---------|----------------|-----------|
| **Trigger** | Automatische Bestätigung bei Sofortbuchung | Manuelle Bestätigung durch Admin |
| **Admin Subject** | "✅ Termin **automatisch** bestätigt" | "✅ Termin bestätigt" |
| **Admin Header** | "✅ Termin **automatisch** bestätigt" | "✅ Termin bestätigt" |
| **Status Badge** | "Auto-Bestätigt" (grün) | "Bestätigt" (grün) |
| **Kunden-Email** | Identisch (Terminbestätigung) | Identisch (Terminbestätigung) |
| **ICS-Anhang** | Ja (Kunde + Admin) | Ja (Kunde + Admin) |
| **Audit Log** | "Sofortbestätigung" | "Bestätigung" |

---

## Flow-Diagramm

### Sofortbuchung (instant-booked)
```
Kunde bucht Termin (Sofortbuchung aktiv)
    ↓
book-appointment.ts: autoConfirm = true
    ↓
    ├─→ sendCustomerNotification(action: 'instant-booked')
    │      → Kunden-E-Mail: "✅ Terminbestätigung" + ICS
    │
    └─→ sendAdminNotification(action: 'instant-booked')
           → Admin-E-Mail: "✅ Termin automatisch bestätigt" + ICS
```

### Manuelle Bestätigung (confirmed)
```
Admin bestätigt Termin manuell
    ↓
Admin-Panel: confirmAppointment()
    ↓
    ├─→ sendCustomerNotification(action: 'confirmed')
    │      → Kunden-E-Mail: "✅ Terminbestätigung" + ICS
    │
    └─→ sendAdminNotification(action: 'confirmed')
           → Admin-E-Mail: "✅ Termin bestätigt" + ICS
```

---

## Dateien geändert

1. ✅ `src/lib/email-templates.ts` 
   - Neue Action: `instant-booked`
   - Unterschiedliche Header/Subjects

2. ✅ `src/lib/email.ts`
   - `sendAdminNotification()` akzeptiert `instant-booked`
   - ICS-Anhang auch bei `instant-booked`
   - Korrekte Subject Lines
   - Audit Log Labels angepasst

3. ✅ `src/pages/api/admin/test-email.ts`
   - Admin-Mail Test für `instant-booked` hinzugefügt
   - BEIDE Mails werden getestet

---

## Zusammenfassung

| Problem | Status | Fix |
|---------|--------|-----|
| Sofortbuchung: Keine Admin-Mail | ✅ Fixed | Admin-Mail wird jetzt gesendet (mit ICS) |
| Bestätigt: Falsche Formulierung | ✅ Fixed | "automatisch" nur bei instant-booked |
| Abgelehnt: Funktioniert | ✅ OK | Keine Änderungen |
| Storniert: Funktioniert | ✅ OK | Keine Änderungen |

**Status**: ✅ Alle Fixes implementiert und getestet  
**Datum**: 18. November 2025  
**Version**: 2.2.0
