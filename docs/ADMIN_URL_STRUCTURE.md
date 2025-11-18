# Admin-Panel URL Struktur - Erklärung

## Problem
In Admin-Emails war der Link zum Admin-Panel falsch aufgebaut. Diese Dokumentation erklärt **genau**, wie sich die URL zusammensetzt.

## URL-Aufbau im Detail

### Basis-Struktur
```
https://{site}.webflow.io/{baseUrl}/{adminSecretPath}
```

### Beispiel mit echten Werten
```
https://moro-termin-tool.webflow.io/appointment-scheduler/test-secure-admin-panel-xyz789
│                                   │                     │
│                                   │                     └─ ADMIN_SECRET_PATH (env variable)
│                                   └────────────────────── baseUrl (aus astro.config.mjs)
└────────────────────────────────────────────────────────── Webflow Site Domain
```

## Alle Komponenten im Detail

### 1. Site Domain
- **Was**: Die Webflow-Site-Domain
- **Beispiel**: `moro-termin-tool.webflow.io`
- **Quelle**: Automatisch von Webflow gesetzt
- **Kann sich ändern**: Ja, wenn die Site umbenannt wird

### 2. Base URL (Mount Path)
- **Was**: Der Mount-Pfad der App in Webflow
- **Beispiel**: `/appointment-scheduler`
- **Quelle**: `astro.config.mjs` → `base` Property
- **Kann sich ändern**: Ja, wenn du die App neu deployst
- **Wo definiert**: 
  ```js
  // astro.config.mjs
  export default defineConfig({
    base: '/appointment-scheduler', // ← Hier!
  })
  ```

### 3. Admin Secret Path
- **Was**: Der geheime Pfad zum Admin-Panel
- **Beispiel**: `test-secure-admin-panel-xyz789`
- **Quelle**: Environment Variable `ADMIN_SECRET_PATH`
- **Kann sich ändern**: Ja, kannst du in Webflow ändern
- **Wo definiert**: Webflow → App Settings → Environment Variables

## Wie die URL dynamisch gebaut wird

### In Email-Templates (src/lib/email.ts)

```typescript
// 1. Admin Secret Path aus Environment Variable holen
const adminSecretPath = env?.ADMIN_SECRET_PATH || 
                       import.meta.env.ADMIN_SECRET_PATH || 
                       'secure-admin-panel-xyz789'; // Fallback

// 2. Base URL aus appointmentUrl extrahieren
// appointmentUrl = "https://moro-termin-tool.webflow.io/appointment-scheduler/termin/abc123"
const baseUrl = data.appointmentUrl.split('/termin/')[0];
// Ergebnis: "https://moro-termin-tool.webflow.io/appointment-scheduler"

// 3. Admin-Panel URL zusammenbauen
const adminPanelUrl = `${baseUrl}/${adminSecretPath}`;
// Ergebnis: "https://moro-termin-tool.webflow.io/appointment-scheduler/test-secure-admin-panel-xyz789"
```

### Warum das robust ist

✅ **Site Domain**: Automatisch korrekt (kommt von appointmentUrl)  
✅ **Base URL**: Automatisch korrekt (kommt von appointmentUrl)  
✅ **Admin Secret**: Dynamisch aus Environment Variable

## Wichtige Hinweise

### Was passiert, wenn sich etwas ändert?

1. **Site Domain ändert sich** (z.B. Custom Domain)
   - ✅ Funktioniert weiterhin (wird aus appointmentUrl extrahiert)

2. **Base URL ändert sich** (z.B. neuer Mount Path)
   - ✅ Funktioniert weiterhin (wird aus appointmentUrl extrahiert)
   - ⚠️ Du musst `astro.config.mjs` und `ADMIN_SECRET_PATH` Route anpassen

3. **Admin Secret Path ändert sich**
   - ✅ Funktioniert sofort (kommt aus Environment Variable)
   - Einfach in Webflow → App Settings → Environment Variables ändern

### Testen der URL

Du kannst die URL-Generierung testen:

```typescript
console.log('🔍 Admin URL Konstruktion:');
console.log('  - appointmentUrl:', data.appointmentUrl);
console.log('  - baseUrl:', baseUrl);
console.log('  - adminSecretPath:', adminSecretPath);
console.log('  - adminPanelUrl:', adminPanelUrl);
```

Diese Logs findest du im Console-Output wenn Emails gesendet werden.

## Fehlerbehebung

### Problem: Admin-Link funktioniert nicht

1. **Prüfe Environment Variable**
   ```bash
   # In Webflow → App Settings → Environment Variables
   ADMIN_SECRET_PATH = "dein-geheimer-pfad"
   ```

2. **Prüfe Admin-Route**
   ```typescript
   // src/pages/admin.astro
   // oder
   // src/pages/[adminPath].astro
   ```

3. **Prüfe Middleware**
   ```typescript
   // src/middleware.ts
   const adminSecretPath = locals?.runtime?.env?.ADMIN_SECRET_PATH || ...
   ```

### Problem: Base URL ist falsch

1. **Prüfe astro.config.mjs**
   ```js
   base: '/appointment-scheduler' // Muss mit Webflow Mount Path übereinstimmen
   ```

2. **Prüfe baseUrl Helper**
   ```typescript
   // src/lib/base-url.ts
   export const baseUrl = import.meta.env.BASE_URL.replace(/\/$/, '');
   ```

## Zusammenfassung

Die Admin-Panel URL setzt sich aus **drei dynamischen Teilen** zusammen:

1. **Site Domain** - Kommt automatisch von Webflow
2. **Base URL** - Definiert in `astro.config.mjs`
3. **Admin Secret Path** - Environment Variable

Alle drei können sich ändern, die Email-Logic extrahiert sie automatisch zur Laufzeit! 🎉
