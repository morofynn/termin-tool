# 🖼️ iFrame Integration Guide

> Wie Sie das Termin-Tool in Ihre Website einbetten

---

## 🎯 Schnellstart

Kopieren Sie diesen Code in Ihre Website:

```html
<!-- Termin-Tool iFrame -->
<iframe 
  id="termin-iframe"
  src="https://ihre-domain.com/embed"
  style="width: 100%; border: none; min-height: 600px;"
  allow="clipboard-write"
></iframe>

<!-- Auto-Resize Script -->
<script>
(function() {
  const iframe = document.getElementById('termin-iframe');
  
  window.addEventListener('message', function(event) {
    // Sicherheit: Prüfe Origin
    if (event.origin !== 'https://ihre-domain.com') return;
    
    // Prüfe Message-Type
    if (event.data.type === 'resize' && event.data.height) {
      iframe.style.height = event.data.height + 'px';
    }
  }, false);
})();
</script>
```

**Wichtig:** Ersetzen Sie `https://ihre-domain.com` mit Ihrer echten Domain!

---

## 📋 Vollständige Integration

### 1. HTML-Struktur

```html
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Termin buchen</title>
  <style>
    /* Container für das iFrame */
    .termin-container {
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    
    /* iFrame Styles */
    #termin-iframe {
      width: 100%;
      border: none;
      min-height: 600px;
      transition: height 0.3s ease;
    }
    
    /* Optional: Loading Indicator */
    .loading {
      text-align: center;
      padding: 40px;
      color: #666;
    }
  </style>
</head>
<body>
  <div class="termin-container">
    <!-- Optional: Loading Indicator -->
    <div id="loading" class="loading">
      Termin-Tool wird geladen...
    </div>
    
    <!-- iFrame -->
    <iframe 
      id="termin-iframe"
      src="https://ihre-domain.com/embed"
      allow="clipboard-write"
      loading="lazy"
    ></iframe>
  </div>

  <script>
    (function() {
      const iframe = document.getElementById('termin-iframe');
      const loading = document.getElementById('loading');
      
      // Verstecke Loading sobald iFrame geladen ist
      iframe.addEventListener('load', function() {
        if (loading) loading.style.display = 'none';
      });
      
      // Auto-Resize Handler
      window.addEventListener('message', function(event) {
        // ✅ WICHTIG: Origin-Check für Sicherheit
        if (event.origin !== 'https://ihre-domain.com') return;
        
        if (event.data.type === 'resize' && event.data.height) {
          iframe.style.height = event.data.height + 'px';
          console.log('iFrame resized to:', event.data.height + 'px');
        }
      }, false);
    })();
  </script>
</body>
</html>
```

---

## 🎨 Styling-Optionen

### Responsive iFrame
```css
/* Mobile: Volle Breite */
@media (max-width: 768px) {
  #termin-iframe {
    min-height: 500px;
  }
  
  .termin-container {
    padding: 10px;
  }
}

/* Desktop: Zentriert mit max-width */
@media (min-width: 769px) {
  #termin-iframe {
    min-height: 650px;
  }
  
  .termin-container {
    max-width: 900px;
  }
}
```

### Schatten & Rahmen
```css
#termin-iframe {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}
```

### Loading Animation
```html
<style>
  .loading {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;
  }
  
  .loading::after {
    content: '';
    width: 40px;
    height: 40px;
    border: 4px solid #f3f3f3;
    border-top: 4px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;
  }
  
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
</style>
```

---

## 🔧 Erweiterte Optionen

### URL-Parameter übergeben
```html
<!-- Mit vorausgefüllten Daten -->
<iframe 
  src="https://ihre-domain.com/embed?name=Max+Mustermann&email=max@example.com"
></iframe>
```

**Unterstützte Parameter:**
- `name` - Vorausgefüllter Name
- `email` - Vorausgefüllte E-Mail
- `phone` - Vorausgefüllte Telefonnummer
- `company` - Vorausgefüllte Firma

### Sandbox-Attribute
```html
<iframe 
  sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
  src="https://ihre-domain.com/embed"
></iframe>
```

**Wichtig:** `allow-scripts` ist erforderlich für die Funktionalität!

### Lazy Loading
```html
<iframe 
  loading="lazy"
  src="https://ihre-domain.com/embed"
></iframe>
```

Lädt das iFrame erst wenn es in den Viewport kommt.

---

## 📱 Mobile Optimierung

### Viewport Meta-Tag
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
```

### Touch-freundliche Mindestgrößen
```css
#termin-iframe {
  /* Mindesthöhe für mobile Geräte */
  min-height: 500px;
}

@media (max-width: 480px) {
  #termin-iframe {
    min-height: 550px;
  }
}
```

---

## 🔒 Sicherheit

### Origin-Check
```javascript
// ✅ IMMER Origin prüfen!
if (event.origin !== 'https://ihre-domain.com') {
  console.warn('Blocked message from', event.origin);
  return;
}
```

### Content Security Policy (CSP)
```html
<meta http-equiv="Content-Security-Policy" 
  content="frame-src https://ihre-domain.com;">
```

---

## 🐛 Troubleshooting

### Problem: iFrame lädt nicht
**Mögliche Ursachen:**
- Falsche URL
- CORS-Probleme
- CSP blockiert iFrame

**Lösung:**
```javascript
iframe.addEventListener('error', function() {
  console.error('iFrame failed to load');
  loading.innerHTML = 'Fehler beim Laden des Termin-Tools.';
});
```

### Problem: Auto-Resize funktioniert nicht
**Mögliche Ursachen:**
- Origin-Check schlägt fehl
- postMessage wird nicht gesendet
- Event-Listener nicht registriert

**Lösung:**
```javascript
// Debug-Modus
window.addEventListener('message', function(event) {
  console.log('Message received:', {
    origin: event.origin,
    data: event.data
  });
  
  if (event.origin !== 'https://ihre-domain.com') {
    console.warn('Origin mismatch!');
    return;
  }
  
  // ... rest of handler
});
```

### Problem: iFrame ist zu klein/groß
**Lösung:**
```css
#termin-iframe {
  min-height: 600px;  /* Erhöhen falls zu klein */
  max-height: 1200px; /* Begrenzen falls zu groß */
}
```

---

## ✅ Test-Checklist

Vor dem Go-Live testen:

- [ ] iFrame lädt korrekt
- [ ] Auto-Resize funktioniert
- [ ] Mobile-Ansicht funktioniert
- [ ] Termin buchen funktioniert
- [ ] E-Mail-Benachrichtigung kommt an
- [ ] Termin-Detail-Seite erreichbar
- [ ] Stornieren funktioniert
- [ ] Loading-State wird angezeigt
- [ ] Error-Handling funktioniert

---

## 📚 Test-Seite

Sie können die Integration testen unter:
```
https://ihre-domain.com/embed
```

Diese Seite:
- Enthält nur das Buchungs-Tool (kein Header/Footer)
- Sendet Auto-Resize Messages
- Ist optimiert für iFrame-Embedding

---

## 📖 Beispiel-Seiten

### Webflow
```html
<!-- In Webflow Embed-Element -->
<div id="termin-embed"></div>
<script>
  const iframe = document.createElement('iframe');
  iframe.src = 'https://ihre-domain.com/embed';
  iframe.style = 'width:100%; border:none; min-height:600px;';
  document.getElementById('termin-embed').appendChild(iframe);
</script>
```

### WordPress
```php
<!-- Shortcode für WordPress -->
[iframe src="https://ihre-domain.com/embed" width="100%" height="600"]
```

---

## 📚 Weitere Infos

- **Setup:** [01-SETUP.md](./01-SETUP.md)
- **API Docs:** [21-API.md](./21-API.md)
- **Deployment:** [03-DEPLOYMENT.md](./03-DEPLOYMENT.md)

---

**Zurück zur Übersicht:** [README.md](./README.md)
