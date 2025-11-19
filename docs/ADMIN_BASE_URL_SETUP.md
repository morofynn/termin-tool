# Admin Base URL Konfiguration

## Übersicht

Die **ADMIN_BASE_URL** ist eine neue Umgebungsvariable, die die Base URL für Admin-Panel Links in E-Mails definiert. Dies ist besonders wichtig für Cloudflare Workers Deployments, wo die URL-Struktur anders sein kann als bei Webflow-gehosteten Apps.

## Problem

Vorher wurde die Admin-Panel URL automatisch aus der Termin-URL gebildet:
```typescript
const baseUrl = data.appointmentUrl.split('/termin/')[0];
const adminPanelUrl = `${baseUrl}/${adminSecretPath}`;
```

Dies führte bei Workers-Deployments zu falschen URLs in E-Mails.

## Lösung

Die Base URL wird jetzt über eine Umgebungsvariable gesteuert:

```bash
ADMIN_BASE_URL="https://ihr-projekt.workers.dev"
```

## Einrichtung

### 1. Lokale Entwicklung (.env)

Fügen Sie die Variable zu Ihrer `.env` Datei hinzu:

```bash
# Base URL für Admin-Panel Links in E-Mails
# Diese URL wird für die Admin-Panel Buttons in E-Mails verwendet
# Format: https://ihr-projekt.workers.dev ODER https://ihre-domain.com/ihr-app-pfad
# WICHTIG: Keine abschließende Slash (/)
ADMIN_BASE_URL="https://moro-termin-tool.webflow.io/appointment-scheduler"
```

### 2. Cloudflare Workers (wrangler.toml)

Falls Sie `wrangler.toml` verwenden:

```toml
[vars]
ADMIN_BASE_URL = "https://ihr-projekt.workers.dev"
```

### 3. Cloudflare Dashboard

1. Gehen Sie zu Ihrem Worker im Cloudflare Dashboard
2. Navigieren Sie zu **Settings** → **Variables**
3. Fügen Sie eine neue **Environment Variable** hinzu:
   - **Name**: `ADMIN_BASE_URL`
   - **Value**: `https://ihr-projekt.workers.dev`
4. Klicken Sie auf **Save**

### 4. Webflow Apps

In Webflow Apps können Sie die Variable über die App-Settings setzen:

1. Öffnen Sie Ihr Webflow-Projekt
2. Navigieren Sie zu **Apps** → Ihr App → **Settings**
3. Fügen Sie unter **Environment Variables** hinzu:
   - **Key**: `ADMIN_BASE_URL`
   - **Value**: `https://ihre-domain.com/ihr-app-pfad`

## Beispiele

### Worker auf Custom Domain
```bash
ADMIN_BASE_URL="https://termine.ihre-domain.de"
```

### Worker auf workers.dev Subdomain
```bash
ADMIN_BASE_URL="https://termin-tool.ihre-firma.workers.dev"
```

### Webflow App mit Mount Path
```bash
ADMIN_BASE_URL="https://ihre-site.webflow.io/appointment-scheduler"
```

## Verwendung in E-Mails

Die ADMIN_BASE_URL wird in folgenden E-Mails verwendet:

### 1. Admin-Benachrichtigungen

Wenn ein neuer Termin gebucht wird, erhält der Admin eine E-Mail mit einem Button zum Admin-Panel:

```
[Zum Admin-Panel] → https://ihr-projekt.workers.dev/secure-admin-panel-xyz789
```

Die URL wird wie folgt gebildet:
```typescript
const adminPanelUrl = `${ADMIN_BASE_URL}/${ADMIN_SECRET_PATH}`;
```

### 2. Test-E-Mails

Auch Test-E-Mails verwenden die ADMIN_BASE_URL für Admin-Panel Links.

## System-Diagnose

Die ADMIN_BASE_URL wird in der **System-Diagnose** im Admin-Panel überprüft:

1. Öffnen Sie das Admin-Panel
2. Navigieren Sie zu **Einstellungen**
3. Scrollen Sie zu **System-Diagnose**
4. Suchen Sie nach **Admin Base URL**

Status-Anzeigen:
- ✅ **✓ https://ihr-projekt.workers.dev** - Korrekt gesetzt
- ❌ **✗ Fehlt** - Variable nicht gesetzt (E-Mail-Links funktionieren nicht korrekt!)

## Fallback-Verhalten

Falls ADMIN_BASE_URL nicht gesetzt ist, fällt das System auf die alte Methode zurück:

```typescript
const adminPanelUrl = adminBaseUrl 
  ? `${adminBaseUrl}/${adminSecretPath}`
  : `${data.appointmentUrl.split('/termin/')[0]}/${adminSecretPath}`; // Fallback
```

⚠️ **Warnung**: Der Fallback kann bei Workers-Deployments zu falschen URLs führen. Setzen Sie immer ADMIN_BASE_URL!

## Wichtige Hinweise

### ✅ DO's
- ✅ Verwenden Sie die vollständige URL mit Protokoll (`https://`)
- ✅ Lassen Sie den abschließenden Slash (`/`) weg
- ✅ Verwenden Sie die öffentlich erreichbare URL
- ✅ Testen Sie die URL nach dem Setup mit Test-E-Mails

### ❌ DON'Ts
- ❌ Kein abschließender Slash: `https://domain.com/` ← FALSCH
- ❌ Kein Protokoll weglassen: `domain.com` ← FALSCH
- ❌ Keine internen URLs verwenden: `http://localhost:3000` ← FALSCH
- ❌ Keine relativen Pfade: `/app/termine` ← FALSCH

## Testing

Nach dem Setup können Sie die Konfiguration testen:

### 1. System-Diagnose prüfen

```
Admin-Panel → Einstellungen → System-Diagnose
```

Suchen Sie nach:
```
Admin Base URL
ADMIN_BASE_URL
✓ https://ihr-projekt.workers.dev
Base URL für Admin-Panel Links in E-Mails
```

### 2. Test-E-Mail senden

```
Admin-Panel → Dokumentation → E-Mails → Test senden
```

Prüfen Sie die Admin-E-Mail und klicken Sie auf den "Zum Admin-Panel" Button. Die URL sollte korrekt sein.

### 3. Manuelle URL-Prüfung

Erwartete URL in E-Mails:
```
{ADMIN_BASE_URL}/{ADMIN_SECRET_PATH}

Beispiel:
https://ihr-projekt.workers.dev/secure-admin-panel-xyz789
```

## Betroffene Dateien

Die folgenden Dateien wurden angepasst:

- `src/lib/email.ts` - Haupt-E-Mail Logik
- `src/pages/api/admin/test-email.ts` - Test-E-Mail Route
- `src/pages/api/admin/system-status.ts` - System-Diagnose
- `.env` - Lokale Konfiguration
- `.env.example` - Beispiel-Konfiguration (nicht änderbar, nur Referenz)

## Fehlerbehebung

### Problem: Admin-Panel Link in E-Mails funktioniert nicht

**Lösung 1**: Prüfen Sie ob ADMIN_BASE_URL gesetzt ist
```bash
# In .env prüfen
grep ADMIN_BASE_URL .env

# Sollte zeigen:
ADMIN_BASE_URL="https://..."
```

**Lösung 2**: Prüfen Sie die System-Diagnose
- Admin-Panel öffnen
- Einstellungen → System-Diagnose
- "Admin Base URL" Status prüfen

**Lösung 3**: Prüfen Sie die URL-Struktur
```
✅ Richtig: https://domain.com
❌ Falsch:  https://domain.com/
❌ Falsch:  domain.com
❌ Falsch:  /app/termine
```

### Problem: 404 beim Klick auf Admin-Panel Link

**Ursache**: ADMIN_BASE_URL zeigt auf falsche Domain

**Lösung**: Korrigieren Sie die ADMIN_BASE_URL:
```bash
# Für Workers
ADMIN_BASE_URL="https://ihr-projekt.workers.dev"

# Für Webflow
ADMIN_BASE_URL="https://ihre-site.webflow.io/app-pfad"
```

## Migration von alten Deployments

Falls Sie bereits ein Deployment haben:

1. **Backup erstellen**
   ```bash
   cp .env .env.backup
   ```

2. **ADMIN_BASE_URL hinzufügen**
   ```bash
   echo 'ADMIN_BASE_URL="https://ihr-projekt.workers.dev"' >> .env
   ```

3. **Workers neu deployen**
   ```bash
   npm run build
   wrangler deploy
   ```

4. **Environment Variable im Dashboard setzen**
   - Cloudflare Dashboard öffnen
   - Worker → Settings → Variables
   - ADMIN_BASE_URL hinzufügen

5. **Testen**
   - Test-E-Mail senden
   - Admin-Panel Link prüfen
   - System-Diagnose überprüfen

## Support

Bei Problemen:

1. Prüfen Sie die System-Diagnose
2. Senden Sie eine Test-E-Mail
3. Überprüfen Sie die Browser-Console auf Fehler
4. Kontaktieren Sie: info@moro-gmbh.de

---

**Letzte Aktualisierung**: November 2025  
**Version**: 1.0.0
