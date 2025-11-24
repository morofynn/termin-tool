# 📅 Google Calendar API Integration - Was passiert im Firmen-Kalender?

## 🎯 **Zwei verschiedene Szenarien:**

### **1️⃣ KUNDE importiert ICS-Datei**
→ Siehe separate Dokumentation (passiver Import)

### **2️⃣ FIRMA: Automatisches Google Calendar Event (Google Calendar API)**
→ Diese Dokumentation (aktive API-Integration)

---

# 🏢 **FIRMEN-KALENDER: Automatische Event-Erstellung**

## 📋 **Überblick: Wann wird ein Event erstellt?**

**Zeitpunkt:** Wenn ein Admin im Admin-Panel auf **"Bestätigen"** klickt

**Ablauf:**
```
1. Admin klickt "Bestätigen"
2. Termin-Status → "confirmed"
3. System ruft Google Calendar API auf
4. Event wird in EUREM Firmen-Kalender erstellt
5. Kunde bekommt Bestätigungs-Email mit ICS-Datei
```

---

## 🔍 **Was enthält das Google Calendar Event?**

### **Event-Daten aus dem Code:**

```javascript
{
  summary: "Termin mit [Kundenname] ([Firma])",
  
  description: 
    "Terminbuchung
    
    Name: Max Mustermann
    Firma: ABC GmbH
    E-Mail: max@example.com
    Telefon: +49 123 456789
    
    Nachricht:
    [Kundennachricht wenn vorhanden]
    
    Termin-Details: https://app.example.com/termin/abc123",
  
  start: {
    dateTime: "2025-01-15T10:00:00+01:00",
    timeZone: "Europe/Berlin"
  },
  
  end: {
    dateTime: "2025-01-15T10:30:00+01:00",
    timeZone: "Europe/Berlin"
  },
  
  reminders: {
    useDefault: false,
    overrides: [
      { method: "email", minutes: 1440 },  // 24 Stunden vorher
      { method: "popup", minutes: 30 }      // 30 Minuten vorher
    ]
  }
}
```

---

## 🖥️ **Wie sieht das im Firmen-Google-Calendar aus?**

### **Kalender-Ansicht (Web):**

```
┌─────────────────────────────────────────────────┐
│ Mi, 15. Januar 2025                             │
│                                                  │
│ 10:00 ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━ 10:30    │
│ Termin mit Max Mustermann (ABC GmbH)           │
└─────────────────────────────────────────────────┘
```

### **Event-Details (bei Klick):**

```
┌─────────────────────────────────────────────────────────┐
│ Termin mit Max Mustermann (ABC GmbH)                   │
│                                                          │
│ 📅 Mittwoch, 15. Januar 2025                            │
│ ⏰ 10:00 - 10:30 Uhr (30 Min)                           │
│ 🌍 Europe/Berlin                                         │
│                                                          │
│ 📝 Beschreibung:                                        │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│ Terminbuchung                                           │
│                                                          │
│ Name: Max Mustermann                                    │
│ Firma: ABC GmbH                                         │
│ E-Mail: max@example.com                                 │
│ Telefon: +49 123 456789                                 │
│                                                          │
│ Nachricht:                                              │
│ Ich interessiere mich für Produkt XYZ und hätte        │
│ gerne eine Beratung zu den Preisen.                    │
│                                                          │
│ Termin-Details: https://app.example.com/termin/abc123   │
│ ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━   │
│                                                          │
│ 🔔 Erinnerungen:                                        │
│    • Email: 1 Tag vorher (14. Jan, 10:00 Uhr)         │
│    • Popup: 30 Minuten vorher (15. Jan, 09:30 Uhr)    │
│                                                          │
│ [Bearbeiten] [Löschen] [Mehr...]                       │
└─────────────────────────────────────────────────────────┘
```

---

## 📱 **Mobile App (Google Calendar):**

```
┌─────────────────────────────────────────┐
│ Mi, 15. Jan                             │
│                                          │
│ 10:00 ━━━━━━━━━━━━━━━━━━━━━━━ 10:30   │
│ Termin mit Max Mustermann              │
│ 📧 max@example.com                      │
│ 📞 +49 123 456789                       │
└─────────────────────────────────────────┘
```

**Bei Tippen:**
- ✅ Volle Details sichtbar
- ✅ Telefonnummer **anklickbar** (öffnet Telefon-App)
- ✅ Email **anklickbar** (öffnet Mail-App)
- ✅ Link "Termin-Details" **anklickbar** (öffnet Browser)

---

## 🔔 **Automatische Erinnerungen:**

### **Was haben wir konfiguriert:**

```javascript
reminders: {
  useDefault: false,  // Nicht Standard-Erinnerungen nutzen
  overrides: [
    { 
      method: "email",     // Email-Benachrichtigung
      minutes: 1440        // 24 Stunden = 1440 Minuten
    },
    { 
      method: "popup",     // Desktop/Mobile Popup
      minutes: 30          // 30 Minuten vorher
    }
  ]
}
```

### **Was passiert konkret:**

**24 Stunden vorher (14. Jan, 10:00 Uhr):**
```
📧 Email an Firmen-Kalender-Email:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Betreff: Erinnerung: Termin mit Max Mustermann (ABC GmbH)

Morgen um 10:00 Uhr:
Termin mit Max Mustermann (ABC GmbH)

[Details ansehen]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

**30 Minuten vorher (15. Jan, 09:30 Uhr):**
```
🔔 Desktop/Mobile Notification:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Termin in 30 Minuten

Termin mit Max Mustermann (ABC GmbH)
10:00 - 10:30 Uhr

[Details ansehen] [Schließen]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
```

---

## 🔄 **Was passiert bei Status-Änderungen?**

### **1. Admin bestätigt Termin:**
```
✅ Event wird erstellt
✅ Event ID wird in Datenbank gespeichert (googleEventId)
✅ Event erscheint sofort im Firmen-Kalender
✅ Erinnerungen werden aktiviert
```

### **2. Admin storniert Termin:**
```
❌ Event wird aus Firmen-Kalender GELÖSCHT
❌ Erinnerungen werden automatisch abgesagt
❌ Event verschwindet sofort
✅ Kunde bekommt Stornierungsmail
```

### **3. Admin löscht Termin endgültig:**
```
🗑️ Event wird aus Firmen-Kalender GELÖSCHT
🗑️ Termin wird aus Datenbank gelöscht
🗑️ KEINE Email an Kunde (Admin muss manuell informieren)
```

---

## 🔐 **Technische Details: Google Calendar API**

### **1. Authentifizierung (OAuth 2.0 Flow):**

```
1. Admin autorisiert App über /api/auth/google-authorize
2. Google gibt Authorization Code
3. App tauscht Code gegen Access Token + Refresh Token
4. Refresh Token wird in .env gespeichert
5. Für jeden API-Call: Access Token von Refresh Token holen
```

### **2. API-Endpoint:**

```
POST https://www.googleapis.com/calendar/v3/calendars/{calendarId}/events

Headers:
  Authorization: Bearer {access_token}
  Content-Type: application/json

Body: {event-daten wie oben}
```

### **3. Response:**

```json
{
  "id": "abc123def456",
  "htmlLink": "https://www.google.com/calendar/event?eid=...",
  "status": "confirmed",
  "summary": "Termin mit Max Mustermann (ABC GmbH)",
  "start": { ... },
  "end": { ... },
  ...
}
```

**Was wir speichern:**
- `id` → als `appointment.googleEventId` in Datenbank
- `htmlLink` → für Admin-Panel (direkter Link zum Event)

---

## 📊 **Vergleich: Firmen-Event vs Kunden-ICS**

| Feature | Firmen Google Calendar | Kunden ICS-Import |
|---------|------------------------|-------------------|
| **Erstellt durch** | Google Calendar API | ICS-Datei Import |
| **Wann erstellt** | Admin klickt "Bestätigen" | Kunde importiert ICS |
| **Wo sichtbar** | Firmen-Kalender | Kunden-Kalender |
| **Titel** | "Termin mit [Kunde]" | "Termin: [Firma] - [Event]" |
| **Beschreibung** | Kundendaten + Link | Firmendaten + Link |
| **Erinnerungen** | ✅ Konfiguriert (24h + 30min) | ❌ Nutzt User-Standard |
| **Live-Sync** | ✅ Ja (über API) | ❌ Nein (einmalig) |
| **Änderbar durch** | Admin (über App) | Kunde (nur lokal) |
| **Bei Stornierung** | Event wird gelöscht | Kunde muss manuell löschen |
| **Teilnehmer** | Keine | Kunde + Firma |
| **RSVP** | Nicht relevant | FALSE |

---

## ⚠️ **Wichtige Einschränkungen & Edge Cases**

### **1. Was wenn Google Calendar API ausfällt?**

```javascript
try {
  googleEventLink = await createGoogleCalendarEvent(...);
  console.log('✅ Google Calendar event created');
} catch (calError) {
  console.error('❌ Error creating Google Calendar event:', calError);
  
  // Audit Log für Fehler
  await createAuditLog(
    KV,
    '❌ Google Calendar Fehler',
    `Fehler beim Erstellen des Calendar-Events für ${appointment.name}: ${errorMessage}`,
    appointment.id,
    'system'
  );
  
  // WICHTIG: Weiter ohne Google Calendar!
  // Termin wird trotzdem bestätigt
  // Kunde bekommt trotzdem Email
}
```

**→ System ist FEHLERTOLERANT: Termin wird trotzdem bestätigt, nur ohne Google Calendar Event**

### **2. Was wenn Refresh Token abläuft?**

**Symptom:**
```
Error: Token refresh failed: 401
```

**Lösung:**
```
1. Gehe zu /api/auth/google-authorize
2. Autorisiere App erneut
3. Kopiere neuen GOOGLE_REFRESH_TOKEN in .env
4. Redeploy
```

**Warum passiert das?**
- Google revoked Token (z.B. Passwort geändert)
- 6 Monate keine Nutzung (Google Policy)
- Manuell widerrufen in Google Account

### **3. Was wenn falscher Calendar ID?**

**Symptom:**
```
Error: Kalender nicht gefunden
```

**Lösung:**
```
1. Gehe zu Google Calendar Web
2. Klicke auf Kalender → Einstellungen
3. Kopiere "Kalender-ID" (z.B. "xyz@group.calendar.google.com")
4. Setze in .env: GOOGLE_CALENDAR_ID=xyz@group.calendar.google.com
5. Redeploy
```

---

## 🔧 **Admin-Panel Features**

### **Google Calendar Status anzeigen:**

**In Admin-Panel sichtbar:**
```
┌─────────────────────────────────────┐
│ 📅 Google Calendar Status           │
│                                      │
│ ✅ Verbunden                        │
│ 📧 firma@example.com                │
│ 📅 Haupt-Kalender                   │
│                                      │
│ [Test-Event erstellen]              │
└─────────────────────────────────────┘
```

**Bei Fehler:**
```
┌─────────────────────────────────────┐
│ 📅 Google Calendar Status           │
│                                      │
│ ❌ Nicht verbunden                  │
│ ⚠️ Refresh Token ungültig           │
│                                      │
│ [Neu autorisieren]                  │
└─────────────────────────────────────┘
```

---

## 🎨 **Darstellung im Firmen-Kalender**

### **Desktop (Google Calendar Web):**

**Monatsansicht:**
```
┌─────────────────────────────────────────────────────────┐
│ Januar 2025                           [Heute] [Monat ▼] │
├─────────────────────────────────────────────────────────┤
│ Mo   Di   Mi   Do   Fr   Sa   So                        │
│      1    2    3    4    5    6                         │
│ 7    8    9   10   11   12   13                         │
│ 14  [15]  16   17   18   19   20      ← 15. hat Event  │
│ 21   22   23   24   25   26   27                        │
│ 28   29   30   31                                       │
└─────────────────────────────────────────────────────────┘
```

**Wochenansicht:**
```
┌─────────────────────────────────────────────────────────┐
│ Mo, 13.1  Di, 14.1  Mi, 15.1  Do, 16.1  Fr, 17.1       │
├─────────────────────────────────────────────────────────┤
│ 08:00                                                    │
│ 09:00                                                    │
│ 10:00      🔵 Termin mit Max Mustermann (ABC GmbH)     │
│ 10:30      ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━      │
│ 11:00                                                    │
│ 12:00                                                    │
└─────────────────────────────────────────────────────────┘
```

**Tagesansicht:**
```
┌─────────────────────────────────────────────────────────┐
│ Mittwoch, 15. Januar 2025                               │
├─────────────────────────────────────────────────────────┤
│ 08:00                                                    │
│ 08:30                                                    │
│ 09:00                                                    │
│ 09:30                                                    │
│ 10:00 ┌─────────────────────────────────────────────┐  │
│       │ 🔵 Termin mit Max Mustermann (ABC GmbH)     │  │
│       │ 📧 max@example.com                          │  │
│       │ 📞 +49 123 456789                           │  │
│ 10:30 └─────────────────────────────────────────────┘  │
│ 11:00                                                    │
│ 11:30                                                    │
└─────────────────────────────────────────────────────────┘
```

---

## 🌐 **Multi-Geräte Synchronisation**

### **Wo erscheint das Event?**

```
✅ Google Calendar Web
✅ Google Calendar Mobile App (iOS + Android)
✅ Gmail (Kalender-Integration)
✅ Google Workspace Apps
✅ Outlook (bei Google Calendar Sync)
✅ Apple Calendar (bei Google Account)
✅ Alle Geräte die mit Firmen-Google-Account verbunden sind
```

**Synchronisations-Geschwindigkeit:**
```
⚡ Sofort (< 1 Sekunde)
✅ Push-Benachrichtigung auf Mobile
✅ Live-Update ohne Neuladen
```

---

## 📧 **Email-Benachrichtigungen (von Google)**

### **24-Stunden-Erinnerung:**

```
Von: Google Calendar <calendar-notification@google.com>
An: firma@example.com
Betreff: Erinnerung: Termin mit Max Mustermann (ABC GmbH) morgen

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Termin morgen

Termin mit Max Mustermann (ABC GmbH)
Morgen · 10:00 - 10:30 Uhr
Europe/Berlin

Terminbuchung

Name: Max Mustermann
Firma: ABC GmbH
E-Mail: max@example.com
Telefon: +49 123 456789

Nachricht:
Ich interessiere mich für Produkt XYZ...

Termin-Details: https://app.example.com/termin/abc123

[Details ansehen] [Abbrechen]
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Diese Benachrichtigung wurde von Google Calendar gesendet.
```

---

## 🔍 **Was kann der Firmen-Admin machen?**

### **Im Google Calendar direkt:**

✅ **Event ansehen** → Alle Details sichtbar  
✅ **Event bearbeiten** → ACHTUNG: Änderungen NUR in Google, NICHT in Datenbank!  
✅ **Event löschen** → ACHTUNG: Nur in Google, NICHT in Datenbank!  
✅ **Event verschieben** → ACHTUNG: Nur in Google, NICHT in Datenbank!  
✅ **Teilnehmer hinzufügen** → Möglich, aber sinnlos (Kunde sieht es nicht)  
✅ **Farbe ändern** → Möglich  
✅ **Erinnerungen ändern** → Möglich  

### **⚠️ WICHTIG: Änderungen im Admin-Panel machen!**

**Richtig:**
```
Admin-Panel → Termin bearbeiten → Speichern
  ↓
✅ Datenbank aktualisiert
✅ Google Calendar aktualisiert (via API)
✅ Kunde bekommt Email
```

**Falsch:**
```
Google Calendar → Event bearbeiten → Speichern
  ↓
❌ NUR Google Calendar aktualisiert
❌ Datenbank bleibt alt
❌ Kunde weiß nichts von Änderung
❌ Admin-Panel zeigt falsche Daten
```

---

## 📚 **Zusammenfassung: Firmen-Google-Calendar**

### **✅ Was funktioniert:**
- Automatisches Event-Erstellen bei Bestätigung
- Event-Löschen bei Stornierung
- Erinnerungen (24h Email + 30min Popup)
- Multi-Geräte Sync (sofort)
- Klickbare Kontaktdaten (Tel, Email, Link)
- Fehlertolerant (Termin wird auch ohne Calendar bestätigt)

### **❌ Was NICHT funktioniert:**
- Bidirektionale Sync (Änderungen in Google → Datenbank)
- Automatische Updates bei Änderungen in Admin-Panel
- Teilnehmer-Verwaltung (Kunde sieht Event nicht)
- Kunde kann Event nicht sehen/ändern

### **⚠️ Admin muss wissen:**
- Änderungen NUR im Admin-Panel machen
- NICHT direkt in Google Calendar bearbeiten
- Bei Problemen: Refresh Token neu holen
- Audit Log zeigt alle Aktionen

---

## 🎯 **Best Practices**

### **1. Calendar ID richtig setzen:**
```bash
# Für Haupt-Kalender:
GOOGLE_CALENDAR_ID=primary

# Für speziellen Kalender:
GOOGLE_CALENDAR_ID=xyz@group.calendar.google.com
```

### **2. Separate Kalender für Termine:**
```
Empfehlung: Eigenen Kalender "Terminbuchungen" erstellen
Vorteil: Übersichtlicher, kann mit Team geteilt werden
```

### **3. Erinnerungen anpassen:**
```javascript
// Aktuell: 24h + 30min
// Änderbar in src/pages/api/admin/appointments.ts

reminders: {
  overrides: [
    { method: "email", minutes: 1440 },    // 24h vorher
    { method: "popup", minutes: 30 },      // 30min vorher
    { method: "email", minutes: 60 },      // NEU: 1h vorher
  ]
}
```

### **4. Event-Dauer anpassen:**
```javascript
// Aktuell: 30 Minuten (Zeile 467)
await createGoogleCalendarEvent(
  appointment,
  appointmentUrl,
  locals,
  durationMinutes: 60  // Ändere auf 60 Minuten
);
```

---

**Fazit:** Das Firmen-Google-Calendar-Event ist ein **automatisches, live-synchronisiertes Event**, das über die Google Calendar API verwaltet wird. Es ist unabhängig von der Kunden-ICS-Datei und dient nur der internen Organisation der Firma.
