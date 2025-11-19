# 🔗 Terminbuchungs-Tool: Embed & Integration Guide

> **Anleitung zur Einbettung des Terminbuchungs-Tools auf externen Websites**

---

## 📋 Übersicht

Das Terminbuchungs-Tool kann auf drei verschiedene Arten in externe Websites integriert werden:

1. **iFrame-Einbettung** (Empfohlen) - Vollständig eingebettet in die Seite
2. **Popup/Modal** - Öffnet als Overlay über der Seite
3. **Direkter Link** - Externe Verlinkung zur Tool-Seite

---

## 🎯 Option 1: iFrame-Einbettung (Empfohlen)

### Grundlegende Einbettung

```html
<iframe 
  src="https://deine-domain.com/embed"
  width="100%"
  height="800"
  frameborder="0"
  scrolling="auto"
  style="border: none; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
  title="Terminbuchung">
</iframe>
```

### Responsive Einbettung

```html
<div style="position: relative; width: 100%; max-width: 800px; margin: 0 auto;">
  <iframe 
    src="https://deine-domain.com/embed"
    style="width: 100%; height: 800px; border: none; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
    frameborder="0"
    scrolling="auto"
    title="Terminbuchung">
  </iframe>
</div>
```

### Mit automatischer Höhenanpassung

```html
<div id="booking-container" style="max-width: 800px; margin: 0 auto;">
  <iframe 
    id="booking-iframe"
    src="https://deine-domain.com/embed"
    style="width: 100%; border: none; border-radius: 16px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);"
    frameborder="0"
    scrolling="auto"
    title="Terminbuchung">
  </iframe>
</div>

<script>
  // Automatische Höhenanpassung
  window.addEventListener('message', function(e) {
    if (e.origin !== 'https://deine-domain.com') return;
    
    if (e.data.type === 'resize') {
      const iframe = document.getElementById('booking-iframe');
      if (iframe) {
        iframe.style.height = e.data.height + 'px';
      }
    }
  });
  
  // Initial height
  document.getElementById('booking-iframe').style.height = '800px';
</script>
```

---

## 🚀 Option 2: Popup/Modal-Integration

### Einfacher Button mit Popup

```html
<!-- Button zum Öffnen -->
<button 
  onclick="openBookingPopup()"
  style="background: linear-gradient(135deg, #2d62ff 0%, #1e48c8 100%); color: white; padding: 12px 24px; border: none; border-radius: 8px; font-size: 16px; font-weight: 600; cursor: pointer; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
  📅 Termin buchen
</button>

<!-- Popup Container -->
<div id="booking-popup" style="display: none; position: fixed; inset: 0; z-index: 9999; background: rgba(0, 0, 0, 0.7); align-items: center; justify-content: center; padding: 20px;">
  <div style="position: relative; width: 100%; max-width: 900px; max-height: 90vh; background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);">
    <!-- Close Button -->
    <button 
      onclick="closeBookingPopup()"
      style="position: absolute; top: 16px; right: 16px; z-index: 10; background: rgba(0, 0, 0, 0.1); border: none; border-radius: 50%; width: 40px; height: 40px; display: flex; align-items: center; justify-content: center; cursor: pointer; transition: background 0.2s;"
      onmouseover="this.style.background='rgba(0, 0, 0, 0.2)'"
      onmouseout="this.style.background='rgba(0, 0, 0, 0.1)'">
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <line x1="18" y1="6" x2="6" y2="18"></line>
        <line x1="6" y1="6" x2="18" y2="18"></line>
      </svg>
    </button>
    
    <!-- iFrame -->
    <iframe 
      src="https://deine-domain.com/popup"
      style="width: 100%; height: 90vh; border: none;"
      frameborder="0"
      title="Terminbuchung">
    </iframe>
  </div>
</div>

<script>
  function openBookingPopup() {
    const popup = document.getElementById('booking-popup');
    popup.style.display = 'flex';
    document.body.style.overflow = 'hidden';
  }
  
  function closeBookingPopup() {
    const popup = document.getElementById('booking-popup');
    popup.style.display = 'none';
    document.body.style.overflow = '';
  }
  
  // Close on ESC key
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeBookingPopup();
    }
  });
  
  // Close on background click
  document.getElementById('booking-popup').addEventListener('click', function(e) {
    if (e.target === this) {
      closeBookingPopup();
    }
  });
</script>
```

### Modernes Popup mit Animation

```html
<!-- Button -->
<button id="booking-btn" onclick="openBookingPopup()">
  📅 Termin buchen
</button>

<!-- Popup -->
<div id="booking-popup" class="popup-hidden">
  <div class="popup-backdrop" onclick="closeBookingPopup()"></div>
  <div class="popup-content">
    <button class="popup-close" onclick="closeBookingPopup()">×</button>
    <iframe 
      src="https://deine-domain.com/popup"
      class="popup-iframe"
      title="Terminbuchung">
    </iframe>
  </div>
</div>

<style>
  #booking-btn {
    background: linear-gradient(135deg, #2d62ff 0%, #1e48c8 100%);
    color: white;
    padding: 14px 28px;
    border: none;
    border-radius: 8px;
    font-size: 16px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  #booking-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
  
  #booking-popup {
    position: fixed;
    inset: 0;
    z-index: 9999;
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    transition: opacity 0.3s, visibility 0.3s;
  }
  
  #booking-popup.popup-hidden {
    opacity: 0;
    visibility: hidden;
    pointer-events: none;
  }
  
  .popup-backdrop {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(4px);
  }
  
  .popup-content {
    position: relative;
    width: 100%;
    max-width: 900px;
    max-height: 90vh;
    background: white;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.3);
    transform: scale(1);
    transition: transform 0.3s;
  }
  
  #booking-popup.popup-hidden .popup-content {
    transform: scale(0.9);
  }
  
  .popup-close {
    position: absolute;
    top: 16px;
    right: 16px;
    z-index: 10;
    background: rgba(0, 0, 0, 0.1);
    border: none;
    border-radius: 50%;
    width: 40px;
    height: 40px;
    font-size: 24px;
    line-height: 1;
    cursor: pointer;
    transition: background 0.2s;
  }
  
  .popup-close:hover {
    background: rgba(0, 0, 0, 0.2);
  }
  
  .popup-iframe {
    width: 100%;
    height: 90vh;
    border: none;
  }
  
  @media (max-width: 768px) {
    .popup-content {
      max-width: 100%;
      max-height: 100vh;
      border-radius: 0;
    }
    
    .popup-iframe {
      height: 100vh;
    }
  }
</style>

<script>
  function openBookingPopup() {
    const popup = document.getElementById('booking-popup');
    popup.classList.remove('popup-hidden');
    document.body.style.overflow = 'hidden';
  }
  
  function closeBookingPopup() {
    const popup = document.getElementById('booking-popup');
    popup.classList.add('popup-hidden');
    document.body.style.overflow = '';
  }
  
  // Close on ESC
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      closeBookingPopup();
    }
  });
</script>
```

---

## 🔗 Option 3: Direkter Link

### Standard-Link

```html
<a 
  href="https://deine-domain.com"
  target="_blank"
  rel="noopener noreferrer"
  style="background: linear-gradient(135deg, #2d62ff 0%, #1e48c8 100%); color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 600;">
  📅 Zur Terminbuchung
</a>
```

### Button-Style Link

```html
<a 
  href="https://deine-domain.com"
  target="_blank"
  class="booking-link">
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
    <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
    <line x1="16" y1="2" x2="16" y2="6"></line>
    <line x1="8" y1="2" x2="8" y2="6"></line>
    <line x1="3" y1="10" x2="21" y2="10"></line>
  </svg>
  Jetzt Termin buchen
</a>

<style>
  .booking-link {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    background: linear-gradient(135deg, #2d62ff 0%, #1e48c8 100%);
    color: white;
    padding: 14px 28px;
    text-decoration: none;
    border-radius: 8px;
    font-weight: 600;
    font-size: 16px;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    transition: transform 0.2s, box-shadow 0.2s;
  }
  
  .booking-link:hover {
    transform: translateY(-2px);
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
  }
</style>
```

---

## 📱 Mobile Optimierung

### Responsive iFrame Container

```html
<style>
  .booking-wrapper {
    width: 100%;
    max-width: 800px;
    margin: 0 auto;
    padding: 0 16px;
  }
  
  .booking-iframe-container {
    position: relative;
    width: 100%;
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  }
  
  .booking-iframe {
    width: 100%;
    height: 800px;
    border: none;
    background: transparent;
  }
  
  @media (max-width: 768px) {
    .booking-wrapper {
      padding: 0 12px;
    }
    
    .booking-iframe {
      height: 700px;
    }
  }
  
  @media (max-width: 480px) {
    .booking-wrapper {
      padding: 0 8px;
    }
    
    .booking-iframe {
      height: 650px;
    }
    
    .booking-iframe-container {
      border-radius: 12px;
    }
  }
</style>

<div class="booking-wrapper">
  <div class="booking-iframe-container">
    <iframe 
      src="https://deine-domain.com/embed"
      class="booking-iframe"
      frameborder="0"
      title="Terminbuchung">
    </iframe>
  </div>
</div>
```

---

## 🎨 Styling-Optionen

### Dark Mode Container

```html
<div style="background: #1f2937; padding: 40px 20px; border-radius: 16px;">
  <h2 style="color: white; text-align: center; margin-bottom: 24px; font-size: 28px; font-weight: 700;">
    Termin vereinbaren
  </h2>
  <iframe 
    src="https://deine-domain.com/embed"
    style="width: 100%; max-width: 800px; height: 800px; margin: 0 auto; display: block; border: none; border-radius: 12px; box-shadow: 0 10px 15px rgba(0, 0, 0, 0.3);"
    frameborder="0"
    title="Terminbuchung">
  </iframe>
</div>
```

### Mit Überschrift & Beschreibung

```html
<section style="max-width: 900px; margin: 60px auto; padding: 0 20px;">
  <div style="text-align: center; margin-bottom: 40px;">
    <h2 style="font-size: 36px; font-weight: 700; color: #111827; margin-bottom: 12px;">
      Vereinbaren Sie einen Termin
    </h2>
    <p style="font-size: 18px; color: #6b7280; max-width: 600px; margin: 0 auto;">
      Buchen Sie jetzt Ihren persönlichen Beratungstermin direkt online. 
      Wählen Sie Ihren Wunschtermin und wir melden uns bei Ihnen.
    </p>
  </div>
  
  <div style="border-radius: 16px; overflow: hidden; box-shadow: 0 10px 15px rgba(0, 0, 0, 0.1);">
    <iframe 
      src="https://deine-domain.com/embed"
      style="width: 100%; height: 800px; border: none; display: block;"
      frameborder="0"
      title="Terminbuchung">
    </iframe>
  </div>
</section>
```

---

## ⚙️ URL-Parameter (Optional)

Sie können optionale Parameter an die URL anhängen:

```html
<!-- Mit vorausgefüllter E-Mail -->
<iframe src="https://deine-domain.com/embed?email=kunde@example.com"></iframe>

<!-- Mit Referrer-Tracking -->
<iframe src="https://deine-domain.com/embed?ref=homepage"></iframe>

<!-- Mehrere Parameter -->
<iframe src="https://deine-domain.com/embed?email=kunde@example.com&ref=newsletter"></iframe>
```

---

## 🔒 Sicherheit & Best Practices

### 1. **HTTPS verwenden**
```html
<!-- ✅ Richtig -->
<iframe src="https://deine-domain.com/embed"></iframe>

<!-- ❌ Falsch -->
<iframe src="http://deine-domain.com/embed"></iframe>
```

### 2. **Sandbox Attributes (Optional)**
```html
<iframe 
  src="https://deine-domain.com/embed"
  sandbox="allow-same-origin allow-scripts allow-forms allow-popups">
</iframe>
```

### 3. **Content Security Policy**
```html
<meta 
  http-equiv="Content-Security-Policy" 
  content="frame-src https://deine-domain.com;">
```

### 4. **Loading Attribute**
```html
<!-- Lazy Loading für bessere Performance -->
<iframe 
  src="https://deine-domain.com/embed"
  loading="lazy">
</iframe>
```

---

## 🐛 Troubleshooting

### Problem: iFrame lädt nicht

**Lösung 1: X-Frame-Options prüfen**
```
Das Tool muss X-Frame-Options erlauben.
Kontaktieren Sie Ihren Administrator.
```

**Lösung 2: CORS-Fehler**
```
Stellen Sie sicher, dass die Domain in den CORS-Einstellungen erlaubt ist.
```

### Problem: Höhe passt nicht

**Lösung: Feste Höhe setzen**
```html
<iframe 
  src="https://deine-domain.com/embed"
  style="height: 900px; width: 100%;">
</iframe>
```

### Problem: Popup blockiert

**Lösung: User-Interaction erforderlich**
```javascript
// Popup muss durch Button-Click geöffnet werden
document.getElementById('btn').addEventListener('click', openPopup);
```

---

## 📊 Unterstützte Browser

| Browser | Version | Support |
|---------|---------|---------|
| Chrome | 90+ | ✅ Vollständig |
| Firefox | 88+ | ✅ Vollständig |
| Safari | 14+ | ✅ Vollständig |
| Edge | 90+ | ✅ Vollständig |
| Opera | 76+ | ✅ Vollständig |
| Mobile Safari (iOS) | 14+ | ✅ Vollständig |
| Chrome Mobile | 90+ | ✅ Vollständig |

---

## 📞 Support & Hilfe

Bei Fragen zur Integration kontaktieren Sie:

- **E-Mail**: support@ihre-firma.de
- **Dokumentation**: [docs/INDEX.md](./INDEX.md)
- **GitHub Issues**: [Link zum Repository]

---

## 🎉 Fertig!

Ihr Terminbuchungs-Tool ist nun erfolgreich eingebettet. 

**Tipp**: Testen Sie die Integration auf verschiedenen Geräten und Browsern, um die beste User Experience sicherzustellen.

---

**Made with ❤️ for seamless appointment booking**
