# Responsive iFrame Integration - Ohne Scroll

## Methode 1: CSS Fixed Aspect Ratio

Für feste Proportionen (z.B. wenn dein Tool immer gleich groß ist):

```html
<div class="termin-tool-container">
  <iframe 
    src="https://deine-domain.com/termin-tool" 
    frameborder="0"
    scrolling="no"
    class="termin-tool-iframe"
  ></iframe>
</div>

<style>
.termin-tool-container {
  position: relative;
  width: 100%;
  max-width: 800px; /* Optional: Maximale Breite */
  margin: 0 auto;
  padding-bottom: 120%; /* Höhe = 120% der Breite */
  overflow: hidden;
}

.termin-tool-iframe {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  border: none;
}

/* Mobile Anpassung */
@media (max-width: 768px) {
  .termin-tool-container {
    padding-bottom: 150%; /* Mehr Höhe auf Mobile */
  }
}
</style>
```

## Methode 2: JavaScript Auto-Resize (EMPFOHLEN)

Diese Methode passt die iFrame-Höhe automatisch an den Inhalt an.

### Schritt 1: HTML auf deiner Website

```html
<iframe 
  id="termin-tool-iframe"
  src="https://deine-domain.com/termin-tool" 
  frameborder="0"
  scrolling="no"
  style="width: 100%; border: none; overflow: hidden;"
></iframe>

<script src="https://deine-domain.com/iframe-resizer.js"></script>
```

### Schritt 2: iframe-resizer.js erstellen

Diese Datei muss im `public/` Ordner des Termin-Tools liegen:

```javascript
// Auto-Resize iFrame Höhe
(function() {
  const iframe = document.getElementById('termin-tool-iframe');
  
  if (!iframe) {
    console.error('Termin-Tool iFrame nicht gefunden');
    return;
  }

  // Message Listener für Höhen-Updates vom iFrame
  window.addEventListener('message', function(event) {
    // Sicherheit: Nur Messages von deiner Domain akzeptieren
    if (event.origin !== 'https://deine-domain.com') return;
    
    if (event.data.type === 'resize' && event.data.height) {
      iframe.style.height = event.data.height + 'px';
    }
  });

  // Initial Höhe setzen
  iframe.style.height = '800px';
})();
```

### Schritt 3: Resize-Script im Termin-Tool

Füge dieses Script in die `index.astro` ein (vor dem schließenden `</body>` Tag):

```html
<script>
  // Sende Höhen-Updates an Parent Window
  function sendHeightToParent() {
    if (window.parent && window.parent !== window) {
      const height = document.documentElement.scrollHeight;
      window.parent.postMessage({
        type: 'resize',
        height: height
      }, '*'); // In Produktion: Nur deine Domain
    }
  }

  // Initial senden
  window.addEventListener('load', sendHeightToParent);

  // Bei Größenänderungen
  const resizeObserver = new ResizeObserver(sendHeightToParent);
  resizeObserver.observe(document.body);

  // Backup: Interval-basiert
  setInterval(sendHeightToParent, 500);
</script>
```

## Methode 3: iFrame Resizer Library (Professionell)

Die einfachste und zuverlässigste Lösung:

### Installation im Termin-Tool

```bash
npm install iframe-resizer
```

### In index.astro einbinden

```html
<script src="https://cdn.jsdelivr.net/npm/iframe-resizer@4.3.6/js/iframeResizer.contentWindow.min.js"></script>
```

### Auf deiner Website

```html
<iframe 
  id="termin-tool"
  src="https://deine-domain.com/termin-tool"
  frameborder="0"
  scrolling="no"
></iframe>

<script src="https://cdn.jsdelivr.net/npm/iframe-resizer@4.3.6/js/iframeResizer.min.js"></script>
<script>
  iFrameResize({ 
    log: false,
    checkOrigin: false,
    heightCalculationMethod: 'lowestElement'
  }, '#termin-tool');
</script>
```

## Methode 4: Feste Höhe mit Overflow Hidden

Einfachste Lösung wenn Scroll akzeptabel ist:

```html
<iframe 
  src="https://deine-domain.com/termin-tool"
  style="
    width: 100%; 
    height: 100vh; /* Volle Viewport-Höhe */
    min-height: 800px;
    max-height: 1200px;
    border: none;
    overflow: hidden;
  "
  frameborder="0"
  scrolling="no"
></iframe>
```

## Empfehlung

**Für beste Ergebnisse**: Kombiniere Methode 2 (JavaScript Auto-Resize) mit CSS-Fallback:

```html
<div style="max-width: 800px; margin: 0 auto;">
  <iframe 
    id="termin-tool-iframe"
    src="https://deine-domain.com/termin-tool" 
    frameborder="0"
    scrolling="no"
    style="
      width: 100%; 
      min-height: 600px;
      border: none; 
      overflow: hidden;
    "
  ></iframe>
</div>

<script>
  const iframe = document.getElementById('termin-tool-iframe');
  
  window.addEventListener('message', function(e) {
    if (e.data.type === 'resize') {
      iframe.style.height = e.data.height + 'px';
    }
  });
</script>
```

## Troubleshooting

### Problem: Scroll-Balken erscheinen trotzdem
**Lösung**: 
```css
iframe {
  overflow: hidden !important;
}
body {
  overflow-x: hidden;
}
```

### Problem: Höhe wird nicht korrekt berechnet
**Lösung**: Nutze `document.documentElement.scrollHeight` statt `document.body.scrollHeight`

### Problem: Cross-Origin Errors
**Lösung**: Stelle sicher, dass beide Domains HTTPS nutzen und die Message-Origins validiert werden.

## Mobile Optimierung

```css
@media (max-width: 768px) {
  .termin-tool-container {
    padding: 0;
  }
  
  iframe {
    min-height: 100vh;
  }
}
```
