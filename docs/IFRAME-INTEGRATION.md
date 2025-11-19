# iFrame Integration Guide

## 📋 Übersicht

Das Termin-Tool kann als **iFrame** auf jeder beliebigen Website eingebunden werden. Die Integration ist optimiert für:

- ✅ **Automatische Höhenanpassung** (responsive)
- ✅ **Kein Scroll-Problem** im iFrame
- ✅ **Mobile-optimiert**
- ✅ **Transparenter Hintergrund**

---

## 🚀 Schnellstart

### 1. Basis-Integration (minimal)

```html
<iframe
  src="https://YOUR-DOMAIN.webflow.io/YOUR-BASE-PATH/embed"
  width="100%"
  height="600"
  style="border: none; max-width: 700px; margin: 0 auto; display: block;"
  title="Terminbuchung"
></iframe>
```

### 2. Empfohlene Integration (mit Auto-Resize)

Komplettes Beispiel siehe: `docs/EMBED-EXAMPLE.html`

---

## 🔧 Technische Details

### Wie funktioniert Auto-Resize?

Das Tool sendet automatisch Höhen-Updates an das Parent-Fenster via `postMessage`:

```javascript
// Im iFrame (wird automatisch gemacht):
window.parent.postMessage({
  type: 'termin-tool-resize',
  height: 1234
}, '*');
```

### Parent-Seite Listener

```javascript
window.addEventListener('message', function(event) {
  if (event.data.type === 'termin-tool-resize') {
    const iframe = document.getElementById('termin-tool-iframe');
    iframe.style.height = event.data.height + 'px';
  }
});
```

---

## 📐 Styling-Empfehlungen

### Container Setup

```css
.iframe-container {
  width: 100%;
  max-width: 700px; /* Entspricht Tool-Breite */
  margin: 0 auto;
  background: transparent;
}

iframe {
  width: 100%;
  border: none;
  display: block;
  transition: height 0.3s ease;
}
```

### Mobile Optimierung

```css
@media (max-width: 768px) {
  .iframe-container {
    max-width: 100%;
    padding: 0 0.5rem;
  }
}
```

---

## 🎨 Design-Anpassungen

### Hintergrund

Das Tool hat einen **transparenten Hintergrund** und passt sich automatisch an das Design der Parent-Seite an.

### Padding/Spacing

- Desktop: 1rem Padding (im iFrame)
- Tablet: 0.5rem Padding
- Mobile: 0.25rem Padding

Um zusätzlichen Abstand zu schaffen, füge Padding im Container hinzu:

```css
.iframe-container {
  padding: 2rem 1rem;
}
```

---

## 🔒 Sicherheit

### Content Security Policy

Falls deine Seite CSP verwendet, stelle sicher dass iFrames erlaubt sind:

```html
<meta http-equiv="Content-Security-Policy" 
      content="frame-src https://YOUR-DOMAIN.webflow.io;">
```

### postMessage Origin Check

Für Produktion empfohlen - filtere Messages nach Origin:

```javascript
window.addEventListener('message', function(event) {
  // Nur Messages von deiner Domain akzeptieren
  const allowedOrigins = ['https://YOUR-DOMAIN.webflow.io'];
  if (!allowedOrigins.includes(event.origin)) return;
  
  if (event.data.type === 'termin-tool-resize') {
    // ... handle resize
  }
});
```

---

## 📱 Mobile Verhalten

### Touch Scrolling

Das iFrame nutzt `-webkit-overflow-scrolling: touch` für smoothes Scrolling auf iOS.

### Viewport Meta Tag

Stelle sicher dass deine Parent-Seite ein responsive Viewport Tag hat:

```html
<meta name="viewport" content="width=device-width, initial-scale=1.0">
```

---

## 🐛 Troubleshooting

### Problem: iFrame zeigt nur weißen Bereich

**Lösung:** Prüfe ob die URL korrekt ist:
- Lokale Entwicklung: `http://localhost:3000/embed`
- Produktion: `https://YOUR-DOMAIN.webflow.io/YOUR-BASE-PATH/embed`

### Problem: Höhe passt sich nicht an

**Lösung:** 
1. Prüfe ob der `message` Event Listener läuft
2. Öffne Browser Console und schaue nach postMessage events
3. Stelle sicher dass keine CSP die postMessage blockiert

### Problem: Horizontal Scrollbar erscheint

**Lösung:**
```css
iframe {
  overflow-x: hidden;
}

.iframe-container {
  overflow-x: hidden;
}
```

### Problem: Loading State verschwindet nicht

**Lösung:** Fallback-Timeout ist auf 3 Sekunden gesetzt. Falls das Tool langsam lädt, erhöhe den Timeout:

```javascript
setTimeout(function() {
  loading.style.display = 'none';
  iframe.style.display = 'block';
}, 5000); // 5 Sekunden
```

---

## 🎯 Best Practices

### 1. Loading State anzeigen

Zeige einen Loading-Spinner während das iFrame lädt (siehe EMBED-EXAMPLE.html)

### 2. Lazy Loading

```html
<iframe loading="lazy" ...>
```

Spart Bandbreite wenn das iFrame nicht sofort sichtbar ist.

### 3. Title Attribut

```html
<iframe title="Terminbuchung" ...>
```

Wichtig für Accessibility (Screen Reader).

### 4. Allow Attribute

```html
<iframe allow="clipboard-write" ...>
```

Erlaubt dem Tool den Clipboard zu verwenden (für Copy-Links etc.)

---

## 📊 Performance

### Initiale Ladezeit

- ~2-3 Sekunden für initial load
- Danach: Instant updates via postMessage

### Größe

- JavaScript Bundle: ~500KB (gzipped)
- Minimal external requests
- Cached nach erstem Load

---

## 🔗 URLs

### Entwicklung
```
http://localhost:3000/embed
```

### Produktion (Webflow Cloud)
```
https://YOUR-DOMAIN.webflow.io/YOUR-BASE-PATH/embed
```

### Custom Domain
```
https://termin.your-domain.com/embed
```

---

## 💡 Beispiele

### WordPress Integration

```php
<!-- In deinem Template oder Shortcode -->
<div class="termin-tool-wrapper">
  <?php echo do_shortcode('[termin_tool_iframe]'); ?>
</div>
```

### React Integration

```jsx
import { useEffect, useRef } from 'react';

function TerminToolEmbed() {
  const iframeRef = useRef(null);

  useEffect(() => {
    const handleMessage = (event) => {
      if (event.data.type === 'termin-tool-resize') {
        if (iframeRef.current) {
          iframeRef.current.style.height = `${event.data.height}px`;
        }
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <iframe
      ref={iframeRef}
      src="https://YOUR-DOMAIN.webflow.io/embed"
      style={{ width: '100%', border: 'none', height: '600px' }}
      title="Terminbuchung"
    />
  );
}
```

### Vue Integration

```vue
<template>
  <iframe
    ref="iframe"
    src="https://YOUR-DOMAIN.webflow.io/embed"
    :style="{ width: '100%', border: 'none', height: `${iframeHeight}px` }"
    title="Terminbuchung"
  />
</template>

<script>
export default {
  data() {
    return {
      iframeHeight: 600
    };
  },
  mounted() {
    window.addEventListener('message', this.handleMessage);
  },
  beforeUnmount() {
    window.removeEventListener('message', this.handleMessage);
  },
  methods: {
    handleMessage(event) {
      if (event.data.type === 'termin-tool-resize') {
        this.iframeHeight = event.data.height;
      }
    }
  }
};
</script>
```

---

## 📞 Support

Bei Fragen zur Integration:
- GitHub Issues: [Link einfügen]
- E-Mail: [E-Mail einfügen]
- Dokumentation: `/docs/`

---

**Letztes Update:** November 2024  
**Version:** 1.0
