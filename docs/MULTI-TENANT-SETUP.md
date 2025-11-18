# 🏢 Multi-Tenant Setup - Eine App für mehrere Unternehmen

## Übersicht

Diese Webapp kann für mehrere Unternehmen parallel genutzt werden. Jedes Unternehmen erhält eine eigene Instanz mit separaten Daten und Einstellungen.

---

## 🔄 Option 1: Webflow Multi-Instance (Empfohlen)

### Vorteile
- ✅ Einfachste Methode
- ✅ Automatische Trennung der Daten
- ✅ Separate KV Stores
- ✅ Zentrale Code-Updates möglich

### Setup
1. **Webflow Dashboard** öffnen
2. **Apps** → Deine App auswählen
3. **"Create New Instance"** oder **"Duplicate"** klicken
4. **Namen vergeben**: z.B. "Firma-A-Termine", "Firma-B-Termine"
5. **Environment Variables** für jede Instanz setzen

### Pro Instanz konfigurieren:
```bash
# Google Calendar (separates Projekt pro Firma!)
GOOGLE_CLIENT_ID=firma-a-client-id.apps.googleusercontent.com
GOOGLE_CLIENT_SECRET=firma-a-secret
GOOGLE_REDIRECT_URI=https://firma-a.webflow.io/api/auth/google-callback
GOOGLE_USER_EMAIL=termine@firma-a.de

# Admin
ADMIN_PASSWORD=FirmaA-Sicheres-Passwort-123

# KV Namespace (automatisch getrennt)
APPOINTMENTS_KV=auto-generiert
```

### Ergebnis:
- Firma A: `https://firma-a.webflow.io/`
- Firma B: `https://firma-b.webflow.io/`
- Firma C: `https://firma-c.webflow.io/`

Jede Instanz ist **komplett isoliert**.

---

## 🗂️ Option 2: Backup-basierte Kopie

### Verwendung des Source-Code Backups

1. **Backup entpacken**
```bash
mkdir firma-b-termine
cd firma-b-termine
tar -xzf ../backups/source-backup-20251117-233433.tar.gz
```

2. **Dependencies installieren**
```bash
npm install
```

3. **Environment Variables anpassen**
Erstelle `.env` mit Firma-B Daten:
```bash
GOOGLE_CLIENT_ID=firma-b-client-id
GOOGLE_CLIENT_SECRET=firma-b-secret
GOOGLE_REDIRECT_URI=https://firma-b-domain.com/api/auth/google-callback
GOOGLE_USER_EMAIL=termine@firma-b.de
ADMIN_PASSWORD=FirmaB-Passwort
```

4. **In Webflow als neue App hochladen**
```bash
# Code anpassen (optional)
# Dann als neue App in Webflow hochladen
```

### Vorteile
- ✅ Volle Code-Kontrolle
- ✅ Firmenspezifische Anpassungen möglich
- ✅ Unabhängige Updates

### Nachteile
- ⚠️ Mehr Wartungsaufwand
- ⚠️ Updates müssen manuell synchronisiert werden

---

## 🎨 Option 3: White-Label Setup

### Firmenspezifische Anpassungen über Settings

Die App unterstützt bereits firmenbezogene Anpassungen im **Admin Panel → Settings**:

```typescript
// Pro Instanz konfigurierbar:
{
  companyName: "Firma A GmbH",
  companyEmail: "info@firma-a.de",
  companyPhone: "+49 123 456789",
  companyAddress: "Musterstraße 1, 12345 Stadt",
  companyWebsite: "https://firma-a.de",
  logoUrl: "https://firma-a.de/logo.svg",
  primaryColor: "#FF0000",
  eventName: "Messe XYZ",
  eventLocation: "Stand A1.234",
  standInfo: "Halle 3, Stand A1.234"
}
```

### Vorteil
- ✅ **Eine** Code-Basis
- ✅ Unterschiedliche Brandings
- ✅ Zentrale Updates
- ✅ Konfiguration ohne Code-Änderung

---

## 🔐 Google Calendar Setup pro Firma

### Wichtig: Jede Firma braucht eigenes Google Projekt!

**Für Firma A:**
1. Google Cloud Console → Neues Projekt: "Firma-A-Termine"
2. Calendar API + Gmail API aktivieren
3. OAuth Client erstellen
4. Credentials → Client ID & Secret notieren
5. In Webflow für Instanz A eintragen

**Für Firma B:**
1. Google Cloud Console → Neues Projekt: "Firma-B-Termine"
2. Calendar API + Gmail API aktivieren
3. OAuth Client erstellen
4. Credentials → Client ID & Secret notieren
5. In Webflow für Instanz B eintragen

### Warum separate Projekte?
- ✅ Jede Firma nutzt eigenen Google Calendar
- ✅ E-Mails werden von firmenspezifischer Adresse gesendet
- ✅ Klare Trennung der Berechtigungen
- ✅ Keine Vermischung der Daten

---

## 📊 Daten-Isolation

### KV Store Trennung

Webflow erstellt automatisch für jede App-Instanz einen separaten KV Namespace:

```
Firma A: APPOINTMENTS_KV → kv-firma-a-abc123
Firma B: APPOINTMENTS_KV → kv-firma-b-def456
Firma C: APPOINTMENTS_KV → kv-firma-c-ghi789
```

### Was ist getrennt?
- ✅ Termine
- ✅ Einstellungen
- ✅ Audit Logs
- ✅ Google OAuth Tokens
- ✅ Rate Limiting Daten

**Es gibt KEINE Überschneidungen!**

---

## 🚀 Deployment-Workflow

### Szenario: 3 Firmen, 1 Code-Basis

```bash
# 1. Code-Update in Main-Version
git commit -m "Feature XYZ hinzugefügt"

# 2. In Webflow deployen
# Alle Instanzen nutzen denselben Code

# 3. Jede Instanz hat eigene Daten & Settings
Firma A: Eigene Termine, eigenes Branding
Firma B: Eigene Termine, eigenes Branding
Firma C: Eigene Termine, eigenes Branding
```

---

## 💡 Best Practices

### 1. Naming Convention
```
App-Name: "Terminbuchung"
Instanzen:
  - "Terminbuchung - Firma A"
  - "Terminbuchung - Firma B"
  - "Terminbuchung - Firma C"
```

### 2. Admin-Passwörter
Jede Instanz sollte **eigenes** Admin-Passwort haben:
```bash
Firma A: FirmaA-Secure-2025!
Firma B: FirmaB-Secure-2025!
Firma C: FirmaC-Secure-2025!
```

### 3. Google Accounts
Nutze **firmenspezifische** E-Mail-Adressen:
```bash
Firma A: termine@firma-a.de
Firma B: termine@firma-b.de
Firma C: termine@firma-c.de
```

### 4. Testing
Teste jede Instanz separat:
- ✅ Termin buchen
- ✅ Google Calendar Sync
- ✅ E-Mail-Versand
- ✅ Admin Panel Zugriff

---

## 🔧 Maintenance

### Updates ausrollen
1. Code-Änderung in Main-Version
2. In Webflow deployen
3. **Alle Instanzen werden automatisch aktualisiert**
4. Keine manuellen Updates nötig!

### Instanz-spezifische Anpassungen
Falls eine Firma spezielle Features braucht:
- Option A: Feature-Flags in Settings einbauen
- Option B: Separate Code-Kopie für diese Firma

---

## 📋 Checkliste: Neue Firma hinzufügen

- [ ] Webflow: Neue App-Instanz erstellen
- [ ] Google: Neues Cloud-Projekt anlegen
- [ ] Google: Calendar API + Gmail API aktivieren
- [ ] Google: OAuth Client erstellen
- [ ] Webflow: Environment Variables setzen
- [ ] Webflow: App deployen
- [ ] Admin Panel: Google Calendar autorisieren
- [ ] Admin Panel: Firmen-Settings konfigurieren
- [ ] Test: Termin buchen
- [ ] Test: E-Mail-Versand prüfen
- [ ] Test: Google Calendar Sync prüfen

---

## 💰 Kosten-Übersicht

### Webflow
- Pro App-Instanz können Kosten anfallen (je nach Plan)
- Check Webflow Pricing für Multi-Instance Support

### Google Cloud
- Calendar API: **Kostenlos** (keine Limits für typische Nutzung)
- Gmail API: **Kostenlos** (bis zu 1 Milliarde Anfragen/Tag)
- Pro Firma: Separates Google Cloud Projekt (kostenlos)

### Cloudflare Workers
- KV Store: Erste 100.000 reads/day kostenlos
- Workers: Erste 100.000 requests/day kostenlos
- Meist ausreichend für kleine bis mittlere Events

---

## 🆘 Support

**Neue Instanz funktioniert nicht?**
→ `docs/SETUP.md#troubleshooting`

**Google Calendar Probleme?**
→ Prüfe ob richtiges Google Projekt verwendet wird

**Daten vermischen sich?**
→ Sollte NICHT passieren - jede Instanz hat eigenen KV Store

---

**Empfehlung**: Nutze **Option 1 (Webflow Multi-Instance)** für einfachste Verwaltung! 🚀
