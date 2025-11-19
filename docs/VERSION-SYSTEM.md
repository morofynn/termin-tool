# 🏷️ Version System - Terminbuchungs-Tool

> **Zentrale Versionsverwaltung für das Terminbuchungs-Tool**

---

## 📋 Übersicht

Das Terminbuchungs-Tool verfügt jetzt über ein zentrales Versionssystem, das an folgenden Stellen sichtbar ist:

1. **Buchungs-Tool** (index.astro) - Unten klein und grau
2. **Admin-Panel** (admin.astro) - Unten rechts, klickbar mit Changelog

---

## 🎯 Features

### ✅ Zentrale Versionsverwaltung
- **Eine Stelle** für Version: `src/lib/version.ts`
- Automatische Übernahme überall im Code
- Kein manuelles Suchen & Ersetzen mehr

### ✅ Changelog-Dialog
- **Klickbare Version** im Admin-Panel
- Öffnet Modal mit vollständigem Changelog
- Zeigt alle Features, Bugfixes & Änderungen
- Inkl. geplante Features für nächste Version

### ✅ Zwei Varianten

#### 1. **Default** (Booking Tool)
```tsx
<VersionBadge />
// → Zeigt nur "v1.0" in grau
```

#### 2. **Clickable** (Admin Panel)
```tsx
<VersionBadge variant="clickable" />
// → Zeigt "v1.0" mit Hover-Effekt
// → Öffnet Changelog bei Klick
```

---

## 🔧 Wie Version ändern?

### Schritt 1: Version in `src/lib/version.ts` ändern

```typescript
// src/lib/version.ts

export const APP_VERSION = 'v1.1'; // ← Hier ändern

export const VERSION_INFO = {
  version: APP_VERSION,
  releaseDate: '2025-12-01', // ← Hier ändern
  name: 'Bug Fixes & Performance', // ← Hier ändern
  description: 'Kleinere Bugfixes und Performance-Verbesserungen'
};
```

### Schritt 2: Changelog in `src/components/ChangelogDialog.tsx` aktualisieren

```tsx
// Füge neuen Block OBEN ein:

<div className="border-l-2 border-blue-500 pl-4">
  <div className="flex items-center gap-2 mb-2">
    <h3 className="font-semibold text-lg">Version 1.1</h3>
    <Badge>Current</Badge>
  </div>
  <p className="text-sm text-gray-500 mb-3">01. Dezember 2025</p>
  <div className="space-y-2">
    <div>
      <h4 className="font-medium text-sm mb-1">✨ Features</h4>
      <ul className="text-sm space-y-1 text-gray-700 list-disc list-inside">
        <li>Feature 1</li>
        <li>Feature 2</li>
      </ul>
    </div>
    <div className="mt-3">
      <h4 className="font-medium text-sm mb-1">🐛 Bugfixes</h4>
      <ul className="text-sm space-y-1 text-gray-700 list-disc list-inside">
        <li>Fix 1</li>
        <li>Fix 2</li>
      </ul>
    </div>
  </div>
</div>

// Ändere vorherige Version:
// <Badge>Current</Badge> → <Badge variant="outline">Previous</Badge>
```

### Schritt 3: `CHANGELOG.md` aktualisieren

```markdown
## [v1.1] - 2025-12-01

### ✨ Features
- Feature 1
- Feature 2

### 🐛 Bugfixes
- Fix 1
- Fix 2

---

## [v1.0] - 2025-11-19
...
```

### Schritt 4: Commit & Push

```bash
git add .
git commit -m "chore: bump version to v1.1"
git push origin main
```

### Schritt 5: Deploy

```bash
npm run build
# Deploy zu Cloudflare/Webflow
```

---

## 📍 Wo wird die Version angezeigt?

### 1. **Buchungs-Tool** (`/`)

```
┌─────────────────────────────────────┐
│                                     │
│  [Termin buchen]                    │
│                                     │
│          v1.0                       │ ← Hier
└─────────────────────────────────────┘
```

- **Position**: Unten mittig, klein
- **Farbe**: Hellgrau (#a0aec0)
- **Interaktion**: Nicht klickbar

### 2. **Admin-Panel** (`/admin`)

```
┌─────────────────────────────────────┐
│  Admin Dashboard                    │
│                                     │
│  [Termine] [Settings] [Audit-Log]   │
│                                     │
│                          v1.0 ← Hier│
└─────────────────────────────────────┘
```

- **Position**: Unten rechts, fixed
- **Farbe**: Grau mit Hover → Blau
- **Interaktion**: **Klickbar** → Öffnet Changelog
- **Styling**: White background mit Backdrop-Blur

---

## 🎨 Styling

### Buchungs-Tool (Default)

```tsx
<div style={{ 
  textAlign: 'center', 
  marginTop: 'clamp(1rem, 3vw, 1.5rem)' 
}}>
  <VersionBadge />
</div>
```

```css
/* Output */
.text-xs {
  font-size: 0.75rem;
}
.text-gray-400 {
  color: #9ca3af;
}
```

### Admin-Panel (Clickable)

```tsx
<div className="fixed bottom-4 right-4 z-50">
  <VersionBadge 
    variant="clickable" 
    className="text-xs text-gray-400 hover:text-blue-600 
               transition-colors cursor-pointer 
               bg-white/80 backdrop-blur-sm 
               px-3 py-1.5 rounded-full shadow-md" 
  />
</div>
```

```css
/* Output */
.fixed { position: fixed; }
.bottom-4 { bottom: 1rem; }
.right-4 { right: 1rem; }
.z-50 { z-index: 50; }
.bg-white\/80 { background-color: rgba(255, 255, 255, 0.8); }
.backdrop-blur-sm { backdrop-filter: blur(4px); }
.rounded-full { border-radius: 9999px; }
.shadow-md { box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); }
.cursor-pointer { cursor: pointer; }
.hover\:text-blue-600:hover { color: #2563eb; }
```

---

## 📦 Komponenten-Struktur

```
src/
├── lib/
│   └── version.ts              ← Zentrale Version
├── components/
│   ├── VersionBadge.tsx        ← Badge-Komponente
│   ├── ChangelogDialog.tsx     ← Changelog-Modal
│   ├── AppointmentScheduler.tsx ← Nutzt VersionBadge
│   └── AdminAppointments.tsx   ← Nutzt VersionBadge (clickable)
└── pages/
    ├── index.astro             ← Booking Tool
    └── admin.astro             ← Admin Panel
```

---

## 🔄 Changelog-Dialog

### Design

- **Header**: Titel + Current Version Badge
- **Content**: Scrollbare Liste aller Versionen
- **Sections**: Features, Design, Security, Performance, etc.
- **Status-Badges**: 
  - `Current` - Aktuelle Version
  - `Previous` - Vorherige Versionen
  - `Planned` - Zukünftige Features

### Beispiel

```tsx
<ChangelogDialog>
  <button>v1.0</button>
</ChangelogDialog>
```

Öffnet Modal:

```
┌──────────────────────────────────────┐
│ 📋 Changelog              [v1.0]     │
│ ────────────────────────────────────│
│                                      │
│ Version 1.0         [Current]        │
│ 19. November 2025                    │
│                                      │
│ ✨ Features                          │
│ • Interaktive Terminbuchung          │
│ • Admin-Dashboard                    │
│ • Google Calendar Integration        │
│ ...                                  │
│                                      │
│ ────────────────────────────────────│
│                                      │
│ Version 1.1         [Geplant]        │
│ TBA                                  │
│                                      │
│ 🚀 Geplante Features                 │
│ • SMS-Benachrichtigungen             │
│ • Mehrsprachigkeit                   │
│ ...                                  │
│                                      │
└──────────────────────────────────────┘
```

---

## 🎯 Best Practices

### ✅ DO's

- **Immer** `src/lib/version.ts` als Single Source of Truth nutzen
- **Semantic Versioning** verwenden: `vMAJOR.MINOR.PATCH`
- **Changelog** vor jedem Release aktualisieren
- **Commit Messages** mit Version taggen: `git tag v1.0`
- **Breaking Changes** in MAJOR Version hochzählen
- **New Features** in MINOR Version hochzählen
- **Bugfixes** in PATCH Version hochzählen

### ❌ DON'Ts

- ❌ Version direkt in Komponenten hardcoden
- ❌ Changelog vergessen zu aktualisieren
- ❌ Verschiedene Versionen an verschiedenen Stellen
- ❌ Version ohne Git-Tag deployen

---

## 📊 Semantic Versioning

```
v1.2.3
│ │ │
│ │ └─ PATCH: Bugfixes, kleine Änderungen
│ └─── MINOR: Neue Features, backward-compatible
└───── MAJOR: Breaking Changes, große Updates
```

### Beispiele

- `v1.0.0` → Initial Release
- `v1.0.1` → Bugfix (z.B. Mail-Fehler)
- `v1.1.0` → Neues Feature (z.B. SMS-Benachrichtigungen)
- `v2.0.0` → Breaking Change (z.B. neue API-Struktur)

---

## 🚀 Deployment Workflow

```bash
# 1. Version ändern
vim src/lib/version.ts

# 2. Changelog aktualisieren
vim src/components/ChangelogDialog.tsx
vim CHANGELOG.md

# 3. Build testen
npm run build

# 4. Commit & Tag
git add .
git commit -m "chore: bump version to v1.1"
git tag v1.1
git push origin main --tags

# 5. Deploy
npm run deploy
# oder
wrangler deploy
```

---

## 🎨 Customization

### Andere Farbe für Version Badge

```tsx
// In AppointmentScheduler.tsx
<VersionBadge className="text-purple-400" />

// In AdminAppointments.tsx
<VersionBadge 
  variant="clickable" 
  className="text-purple-400 hover:text-purple-600" 
/>
```

### Andere Position im Admin

```tsx
// Oben links statt unten rechts
<div className="fixed top-4 left-4 z-50">
  <VersionBadge variant="clickable" />
</div>

// Zentriert unten
<div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50">
  <VersionBadge variant="clickable" />
</div>
```

---

## 📝 Testing

### Manueller Test

1. **Booking Tool öffnen**: `http://localhost:3000`
   - Version sollte unten mittig erscheinen
   - Grau, nicht klickbar

2. **Admin öffnen**: `http://localhost:3000/secure-admin-panel-xyz789`
   - Version sollte unten rechts erscheinen
   - Grau → Blau bei Hover
   - Klick öffnet Changelog

3. **Changelog testen**:
   - Alle Versionen sichtbar?
   - Aktuell mit "Current" Badge?
   - Scrollbar funktioniert?
   - Close-Button funktioniert?
   - ESC schließt Dialog?

---

## 🐛 Troubleshooting

### Version wird nicht angezeigt

**Problem**: Version Badge ist unsichtbar

**Lösung**:
```bash
# Build neu machen
npm run build

# Cache löschen
rm -rf dist/ node_modules/.vite
npm install
npm run dev
```

### Changelog öffnet nicht

**Problem**: Klick auf Version im Admin tut nichts

**Lösung**:
```tsx
// Prüfe ob variant="clickable" gesetzt ist
<VersionBadge variant="clickable" />

// Prüfe console auf React-Errors
```

### Falsche Version angezeigt

**Problem**: Alte Version wird noch angezeigt

**Lösung**:
```bash
# Browser-Cache löschen
# Oder Hard-Reload: Ctrl+Shift+R (Win) / Cmd+Shift+R (Mac)

# Vite Cache löschen
rm -rf node_modules/.vite
npm run dev
```

---

## 📚 Weitere Dokumentation

- [CHANGELOG.md](../CHANGELOG.md) - Vollständige Versionshistorie
- [EMBED-INTEGRATION.md](./EMBED-INTEGRATION.md) - Integration Guide
- [README.md](../README.md) - Projekt-Übersicht
- [API.md](./API.md) - API-Dokumentation

---

**Made with ❤️ for seamless versioning**
