# 🚀 Einfache iFrame-Anleitung

## In 2 Schritten fertig!

### Schritt 1: Code kopieren

Kopiere diesen Code komplett:

```html
<div style="width: 100%; max-width: 800px; margin: 0 auto;">
    <iframe 
        id="termin-iframe"
        src="http://localhost:3000"
        style="width: 100%; border: none; display: block;"
        scrolling="no"
    ></iframe>
</div>

<script>
(function() {
    const iframe = document.getElementById('termin-iframe');
    if (!iframe) return;
    
    // Setze Starthöhe
    iframe.style.height = '600px';
    
    window.addEventListener('message', function(event) {
        // Prüfe ob Message vom iFrame kommt
        if (event.data && event.data.type === 'resize') {
            const height = event.data.height;
            
            if (height && typeof height === 'number' && height > 0) {
                // Setze Höhe direkt - so kann iFrame größer UND kleiner werden
                iframe.style.height = height + 'px';
                console.log('iFrame Höhe:', height + 'px');
            }
        }
    });
    
    console.log('Auto-Resize aktiviert');
})();
</script>
```

### Schritt 2: In Webflow einfügen

1. Füge ein **Embed-Element** in deine Webflow-Seite ein
2. Füge den Code aus Schritt 1 ein
3. Ersetze `http://localhost:3000` mit deiner App-URL
4. Fertig! ✅

---

## Production URL

Wenn du live gehst, ändere die URL:

```html
src="http://localhost:3000"          <!-- Lokal -->
src="https://deine-app-url.com"      <!-- Production -->
```

---

## Testen

1. Starte deine App: `npm run dev`
2. Öffne `docs/EINFACH-TESTEN.html` im Browser
3. Teste:
   - Wechsle zwischen Formular-Schritten
   - Öffne den Kalender → wird größer
   - Schließe den Kalender → wird kleiner ✨
4. Öffne Browser-Console (F12) → Du siehst die Höhen-Updates

---

## Das war's! 🎉

Der iFrame passt sich jetzt automatisch an:
- ✅ Wird größer wenn nötig
- ✅ Wird kleiner wenn nötig
- ✅ Funktioniert auf Mobile
- ✅ Kein Scrollen im iFrame

---

## Optional: Breite anpassen

```html
<div style="width: 100%; max-width: 1000px; margin: 0 auto;">
                              ^^^^^^
                              Ändere diese Zahl für breiteres Layout
```

---

## Fehlerbehebung

**Problem:** iFrame ändert Höhe nicht  
**Lösung:** Öffne Browser-Console (F12) und prüfe ob du "iFrame Höhe: XXXpx" siehst

**Problem:** Console zeigt nichts  
**Lösung:** Stelle sicher dass die App auf `http://localhost:3000` läuft

**Problem:** iFrame zu klein/groß am Anfang  
**Lösung:** Ändere die Starthöhe: `iframe.style.height = '800px';`
