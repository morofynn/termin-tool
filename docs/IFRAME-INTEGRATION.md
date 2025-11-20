# iFrame Integration Guide

## 📋 Übersicht

Dieser Guide zeigt dir, wie du das Terminbuchungstool als **iFrame** in deine Webflow-Seite oder andere Websites einbinden kannst.

## 🎯 Vorteile der iFrame-Integration

- ✅ **Einfache Integration** - Nur ein `<iframe>`-Tag nötig
- ✅ **Automatische Höhenanpassung** - iFrame wächst UND schrumpft mit dem Inhalt
- ✅ **Responsiv** - Passt sich an alle Bildschirmgrößen an
- ✅ **Isoliert** - Keine CSS/JS-Konflikte mit deiner Website
- ✅ **Schnell eingebaut** - In 5 Minuten produktiv

---

## 🚀 Quick Start

### 1️⃣ iFrame in Webflow einbinden

1. Füge ein **Embed-Element** in deine Webflow-Seite ein
2. Kopiere diesen Code:

```html
<!-- Terminbuchung iFrame Container -->
<div class="terminbuchung-wrapper" style="width: 100%; max-width: 800px; margin: 0 auto;">
    <iframe 
        id="terminbuchung-iframe"
        src="DEINE-APP-URL-HIER"
        title="Terminbuchung"
        style="width: 100%; border: none; display: block; min-height: 400px;"
        scrolling="no"
        allow="clipboard-write"
    ></iframe>
</div>

<script>
// Auto-Resize: iFrame passt sich automatisch an Inhaltsgröße an
(function() {
    const iframe = document.getElementById('terminbuchung-iframe');
    if (!iframe) return;

    // Empfange Größen-Updates vom iFrame
    window.addEventListener('message', function(event) {
        // ⚠️ SICHERHEIT: In Produktion Origin prüfen!
        // if (event.origin !== 'https://deine-domain.com') return;

        if (event.data && event.data.type === 'resize') {
            const { height } = event.data;
            
            // Setze Höhe direkt (damit iFrame auch kleiner werden kann!)
            if (height && typeof height === 'number') {
                iframe.style.height = height + 'px';
                console.log('📏 iFrame Höhe:', height + 'px');
            }
        }
    });

    console.log('✅ Auto-Resize aktiviert');
})();
</script>
```

3. Ersetze `DEINE-APP-URL-HIER` mit deiner tatsächlichen App-URL:
   - **Lokal (Dev):** `http://localhost:3000`
   - **Production:** `https://dein-termin-tool.app` oder Webflow App URL

---

## 🔧 Technische Details

### So funktioniert das Auto-Resize

1. **iFrame sendet Größen-Updates** (aus `src/pages/index.astro`):
   ```javascript
   window.parent.postMessage({
       type: 'resize',
       height: 800,  // Tatsächliche Content-Höhe
       width: 600    // Aktuelle Breite
   }, '*');
   ```

2. **Parent empfängt & setzt neue Höhe**:
   ```javascript
   window.addEventListener('message', function(event) {
       if (event.data.type === 'resize') {
           iframe.style.height = event.data.height + 'px';
       }
   });
   ```

3. **iFrame wird größer UND kleiner**:
   - Früher: `Math.max(currentHeight, newHeight)` → nur größer
   - Jetzt: `newHeight` → auch wieder kleiner! ✅

### Wichtige Änderung (2025-01-20)

**ALT (funktionierte nicht richtig):**
```javascript
const currentHeight = parseInt(iframe.style.height) || 0;
const newHeight = Math.max(currentHeight, height);
iframe.style.height = newHeight + 'px';
```
❌ Problem: iFrame wurde nur größer, nie wieder kleiner

**NEU (funktioniert!):**
```javascript
iframe.style.height = height + 'px';
```
✅ Lösung: iFrame wird direkt auf die empfangene Höhe gesetzt

---

## 📱 Responsive Verhalten

### Das iFrame passt sich automatisch an:

1. **Desktop** (1024px+):
   - Volle Breite (max. 800px Container)
   - Höhe passt sich an Formular an

2. **Tablet** (768px - 1023px):
   - Volle Container-Breite
   - Kompakteres Layout

3. **Mobile** (< 768px):
   - 100% Breite
   - Touch-optimierte Buttons
   - Gestapelte Elemente

### Automatische Höhenanpassung

Der iFrame reagiert auf folgende Änderungen:

- ✅ Schritt-Wechsel im Formular
- ✅ Kalender öffnen/schließen
- ✅ Fehler-Meldungen
- ✅ Erfolgs-Bildschirm
- ✅ Responsive Breakpoints (Breiten-Änderung!)

---

## 🎨 Styling-Optionen

### Container anpassen

```html
<div class="terminbuchung-wrapper" style="
    width: 100%;
    max-width: 900px;        /* Maximale Breite */
    margin: 40px auto;       /* Zentrieren mit Abstand */
    padding: 0 20px;         /* Seitlicher Abstand */
    background: white;       /* Hintergrund */
    border-radius: 12px;     /* Abgerundete Ecken */
    box-shadow: 0 4px 12px rgba(0,0,0,0.1);  /* Schatten */
">
    <iframe id="terminbuchung-iframe" ...></iframe>
</div>
```

### iFrame Styling

```css
#terminbuchung-iframe {
    width: 100%;
    border: none;
    display: block;
    min-height: 400px;      /* Minimale Höhe beim Laden */
    transition: height 0.3s ease;  /* Sanfte Höhen-Änderung */
}
```

---

## 🔒 Sicherheit

### Origin-Prüfung (Production)

**Wichtig:** In Production solltest du die Message-Origin prüfen:

```javascript
window.addEventListener('message', function(event) {
    // Nur Messages von deiner App-Domain akzeptieren
    if (event.origin !== 'https://deine-app-domain.com') {
        console.warn('Unerlaubte Origin:', event.origin);
        return;
    }

    if (event.data && event.data.type === 'resize') {
        // ... resize logic
    }
});
```

### CSP (Content Security Policy)

Falls du CSP verwendest, erlaube iFrame:

```html
<meta http-equiv="Content-Security-Policy" 
      content="frame-src https://deine-app-domain.com;">
```

---

## 🐛 Debugging

### Console Logs aktivieren

Das iFrame sendet automatisch Debug-Informationen:

```javascript
// Im iFrame (index.astro):
console.log('📐 Neue Dimensionen gesendet:', { height, width });

// Im Parent (deine Website):
console.log('📏 iFrame Höhe aktualisiert:', height + 'px');
```

### Debug-Panel einbauen (optional)

```html
<div class="debug-info" style="
    margin-top: 20px;
    padding: 15px;
    background: #f0f0f0;
    border-radius: 8px;
    font-family: monospace;
    font-size: 14px;
">
    <strong>Debug Info:</strong><br>
    iFrame Höhe: <span id="debug-height">-</span>px<br>
    iFrame Breite: <span id="debug-width">-</span>px<br>
    Letzte Aktualisierung: <span id="debug-time">-</span>
</div>

<script>
window.addEventListener('message', function(event) {
    if (event.data && event.data.type === 'resize') {
        const { height, width } = event.data;
        
        // Update Debug Info
        document.getElementById('debug-height').textContent = height;
        document.getElementById('debug-width').textContent = width;
        document.getElementById('debug-time').textContent = 
            new Date().toLocaleTimeString('de-DE');
    }
});
</script>
```

---

## 📊 Performance

### Optimierungen

Das Auto-Resize ist optimiert:

- ✅ **Debounced** - Max. alle 150ms Update
- ✅ **MutationObserver** - Reagiert auf DOM-Änderungen
- ✅ **ResizeObserver** - Reagiert auf Layout-Änderungen
- ✅ **Interval Fallback** - Alle 2 Sekunden als Backup

### Wichtige Events

```javascript
// Initial nach Load
window.addEventListener('load', () => {
    setTimeout(sendHeightToParent, 100);
    setTimeout(sendHeightToParent, 500);
    setTimeout(sendHeightToParent, 1000);
});

// Bei DOM-Änderungen
const observer = new MutationObserver(debouncedResize);
observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    characterData: true
});

// Bei Resize
const resizeObserver = new ResizeObserver(debouncedResize);
resizeObserver.observe(document.body);
```

---

## 🔗 Weitere Integrationen

### Popup-Integration

Siehe: [IFRAME-RESPONSIVE.md](./IFRAME-RESPONSIVE.md)

### Embed-Code Generator

Coming Soon: Tool zum Generieren von Custom Embed-Codes

---

## ✅ Checkliste

Vor dem Live-Gehen prüfen:

- [ ] iFrame URL auf Production gesetzt
- [ ] Origin-Prüfung aktiviert
- [ ] Auto-Resize funktioniert (auch kleiner werden!)
- [ ] Mobile Ansicht getestet
- [ ] Console Logs in Production deaktiviert (optional)
- [ ] CSP konfiguriert (falls verwendet)

---

## 🆘 Hilfe & Support

### Häufige Probleme

**Problem:** iFrame wird nur größer, nicht kleiner  
**Lösung:** Stelle sicher, dass du NICHT `Math.max()` verwendest - siehe "Wichtige Änderung" oben

**Problem:** Auto-Resize funktioniert nicht  
**Lösung:** Prüfe Console auf Fehler, Origin-Prüfung eventuell zu streng

**Problem:** iFrame zu klein beim Laden  
**Lösung:** Erhöhe `min-height` im iFrame Style

---

## 📚 Siehe auch

- [IFRAME-RESPONSIVE.md](./IFRAME-RESPONSIVE.md) - Responsive Design Details
- [EMBED-INTEGRATION.md](./EMBED-INTEGRATION.md) - Alternative Embed-Methode
- [docs/IFRAME-EXAMPLE.html](./IFRAME-EXAMPLE.html) - Vollständiges Beispiel

---

**Zuletzt aktualisiert:** 2025-01-20  
**Version:** 2.0 (Auto-Resize Fix)
