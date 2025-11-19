# 🔐 Dynamischer Admin-Pfad

## Übersicht

Das Admin-Panel ist **nicht mehr** über eine feste URL erreichbar. Stattdessen wird der Pfad über eine **Umgebungsvariable** festgelegt.

## Funktionsweise

### 1. Umgebungsvariable setzen

In Webflow → **Environment Variables** (oder lokal in `.env`):

```env
ADMIN_SECRET_PATH=mein-geheimer-admin-pfad-2024
```

### 2. Admin-Panel aufrufen

```
https://deine-domain.com/mein-geheimer-admin-pfad-2024
```

Das Admin-Panel ist **nur** über diesen Pfad erreichbar!

## Vorteile

✅ **Sicherheit**: Niemand kennt die URL außer dir  
✅ **Flexibilität**: URL kann jederzeit geändert werden ohne Code anzufassen  
✅ **Multi-Tenant**: Jede Firma kann ihre eigene Admin-URL haben  
✅ **Keine Hardcoding**: Keine festen Pfade mehr im Code  

## Standard-Wert

Falls `ADMIN_SECRET_PATH` nicht gesetzt ist, wird folgender Standard-Pfad verwendet:

```
https://deine-domain.com/secure-admin-panel-xyz789
```

⚠️ **WICHTIG**: Ändere diesen Pfad in Produktion!

## Beispiele

### Beispiel 1: Einfacher Pfad
```env
ADMIN_SECRET_PATH=admin-2024
```
→ `https://deine-domain.com/admin-2024`

### Beispiel 2: Komplexer Pfad
```env
ADMIN_SECRET_PATH=super-secret-panel-xyz-abc-789
```
→ `https://deine-domain.com/super-secret-panel-xyz-abc-789`

### Beispiel 3: Multi-Tenant
**Firma A:**
```env
ADMIN_SECRET_PATH=firma-a-admin-2024
```

**Firma B:**
```env
ADMIN_SECRET_PATH=firma-b-admin-2024
```

## Authentifizierung

Die Authentifizierung erfolgt wie gewohnt über das **ADMIN_PASSWORD**:

```env
ADMIN_PASSWORD=MeinSuperSicheresPasswort2024!
```

## E-Mails anpassen

Alle Admin-E-Mails enthalten **automatisch** den korrekten dynamischen Link zum Admin-Panel:

```typescript
// In src/lib/email-templates.ts
const adminSecretPath = runtime?.env?.ADMIN_SECRET_PATH || 
                       import.meta.env.ADMIN_SECRET_PATH || 
                       'secure-admin-panel-xyz789';

const adminPanelUrl = `https://${domain}/${adminSecretPath}`;
```

Der Link in E-Mails passt sich **automatisch** an!

## Migration von alter URL

Wenn du vorher die feste URL verwendet hast:

### Alt (fest):
```
https://deine-domain.com/secure-admin-panel-xyz789
```

### Neu (dynamisch):
1. Setze in Webflow:
   ```env
   ADMIN_SECRET_PATH=mein-neuer-admin-pfad-2024
   ```

2. Neue URL:
   ```
   https://deine-domain.com/mein-neuer-admin-pfad-2024
   ```

3. **Die alte URL funktioniert nicht mehr!**

## Sicherheits-Tipps

### ✅ Empfohlen:
- Lange, komplexe Pfade verwenden
- Keine leicht zu erratenden Wörter (z.B. "admin", "panel")
- Zufällige Zeichenfolgen einbauen
- Pfad regelmäßig ändern

### ❌ Nicht empfohlen:
- Kurze Pfade wie "admin" oder "panel"
- Firmenname im Pfad (z.B. "musterfirma-admin")
- Vorhersehbare Muster (z.B. "admin-2024")

### 🎯 Perfekt:
```env
ADMIN_SECRET_PATH=x7k9m2p4q8w3e6r1t5y0u9i8o7p6
```

## Technische Details

### Middleware-Flow

```
1. Request: /mein-admin-pfad
2. Middleware prüft: Passt zu ADMIN_SECRET_PATH?
3. Ja → Login-Check (Cookie)
4. Authentifiziert? → Rewrite zu /admin (interne Route)
5. Nicht authentifiziert? → Login-Seite anzeigen
```

### Dateien

- **Middleware**: `src/middleware.ts` - Routing-Logik
- **Admin-Panel**: `src/pages/admin.astro` - Eigentliche Admin-Seite (intern)
- **E-Mail-Templates**: `src/lib/email-templates.ts` - Admin-Links

### Rewrite vs. Redirect

Die Middleware verwendet `ctx.rewrite()` statt `redirect()`:

- **Rewrite**: URL bleibt `/mein-admin-pfad` im Browser
- **Redirect**: URL würde zu `/admin` ändern (zeigt interne Struktur)

→ Rewrite ist sicherer!

## FAQ

### Kann ich mehrere Admin-Pfade haben?
Nein, nur ein Pfad pro Deployment. Für Multi-Tenant siehe [MULTI-TENANT-SETUP.md](./MULTI-TENANT-SETUP.md).

### Was passiert wenn ich /admin direkt aufrufe?
Die Middleware leitet automatisch zum konfigurierten Admin-Pfad um.

### Funktioniert der alte hardcodierte Pfad noch?
Ja, aber nur wenn `ADMIN_SECRET_PATH` nicht gesetzt ist. In Produktion **immer** eine eigene Variable setzen!

### Wie ändere ich den Pfad?
Einfach `ADMIN_SECRET_PATH` in Webflow ändern und Deployment neu starten. Fertig!

## Zusammenfassung

🎯 **Setze ADMIN_SECRET_PATH in Webflow**  
🔐 **Verwende einen langen, komplexen Pfad**  
📧 **E-Mails enthalten automatisch den richtigen Link**  
🔄 **Pfad kann jederzeit ohne Code-Änderung gewechselt werden**  

---

**Letzte Aktualisierung**: 2024-11-18  
**Siehe auch**: [MULTI-TENANT-SETUP.md](./MULTI-TENANT-SETUP.md), [GOOGLE_CALENDAR_SETUP.md](./GOOGLE_CALENDAR_SETUP.md)
