# 🔌 API Dokumentation

## Öffentliche Endpunkte

### `POST /api/book-appointment`
Neue Terminbuchung erstellen

**Body:**
```json
{
  "name": "Max Mustermann",
  "email": "max@example.com",
  "phone": "+49 123 456789",
  "date": "2025-01-24",
  "time": "09:00",
  "message": "Optional"
}
```

**Response:**
```json
{
  "success": true,
  "appointmentId": "uuid",
  "message": "Termin erfolgreich gebucht"
}
```

---

### `GET /api/availability?date=2025-01-24`
Verfügbare Zeitslots abrufen

**Response:**
```json
{
  "slots": [
    {
      "time": "09:00",
      "available": true,
      "spotsLeft": 1
    }
  ]
}
```

---

### `POST /api/appointment/cancel`
Termin stornieren (Kunden-Link)

**Body:**
```json
{
  "id": "appointment-uuid"
}
```

---

## Admin Endpunkte

Alle Admin-Endpunkte benötigen Authentifizierung via `adminPassword` Header.

### `GET /api/admin/appointments`
Alle Termine abrufen

**Query Params:**
- `status` (optional): `pending` | `confirmed` | `cancelled`
- `date` (optional): `2025-01-24`

---

### `POST /api/admin/appointments/confirm`
Termin bestätigen

**Body:**
```json
{
  "id": "appointment-uuid"
}
```

---

### `POST /api/admin/appointments/cancel`
Termin ablehnen/stornieren

**Body:**
```json
{
  "id": "appointment-uuid",
  "reason": "Optional"
}
```

---

### `GET /api/admin/settings`
Einstellungen abrufen

---

### `POST /api/admin/settings`
Einstellungen speichern

**Body:**
```json
{
  "settings": {
    "companyName": "MORO",
    "appointmentDurationMinutes": 30,
    "autoConfirm": false,
    ...
  }
}
```

---

### `GET /api/admin/audit-log`
Audit Log abrufen

**Response:**
```json
{
  "logs": [
    {
      "timestamp": "2025-01-17T12:00:00Z",
      "action": "appointment_confirmed",
      "details": "Termin für Max Mustermann bestätigt",
      "ip": "1.2.3.4"
    }
  ]
}
```

---

### `GET /api/admin/calendar-status`
Google Calendar Status prüfen

**Response:**
```json
{
  "connected": true,
  "email": "admin@example.com",
  "calendar": "Termine"
}
```

---

## OAuth Endpunkte

### `GET /api/auth/google-authorize`
Google OAuth Flow starten

Redirect zu Google Consent Screen.

---

### `GET /api/auth/google-callback?code=...`
OAuth Callback

Wird von Google nach Autorisierung aufgerufen.

---

## Rate Limiting

- **Default**: 5 Anfragen pro 15 Minuten
- **Konfigurierbar** im Admin Panel
- **Status Code**: `429 Too Many Requests`
