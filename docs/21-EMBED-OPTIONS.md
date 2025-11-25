# 🔌 Embed Options

Verschiedene Methoden zur Einbettung des Terminbuchungssystems.

---

## 🖼️ iFrame-Einbettung (Empfohlen)

Die bevorzugte Methode für Webflow & andere Websites.

**Siehe:** [20-IFRAME-INTEGRATION.md](20-IFRAME-INTEGRATION.md)

**Vorteile:**
- ✅ Einfachste Integration
- ✅ Automatische Größenanpassung
- ✅ Isolation vom Parent-CSS
- ✅ Cross-Origin-sicher

**Code:**
```html
<iframe
  id="appointment-iframe"
  src="https://your-app-url.com"
  style="width: 100%; border: none; min-height: 600px;"
  scrolling="no"
></iframe>

<script>
window.addEventListener('message', function(event) {
  if (event.data.type === 'resize') {
    document.getElementById('appointment-iframe').style.height = 
      event.data.height + 'px';
  }
});
</script>
```

---

## 🪟 Popup/Modal (Alternativ)

Öffnet als Overlay über der aktuellen Seite.

**Route:** `/popup`

**Vorteile:**
- ✅ Nimmt keinen Platz auf der Seite
- ✅ Fokus auf Buchung
- ✅ Einfach zu schließen

**Nachteile:**
- ❌ Popup-Blocker könnten greifen
- ❌ Nutzer muss Popup öffnen

**Implementierung:**
```html
<button onclick="openBookingPopup()">Termin buchen</button>

<script>
function openBookingPopup() {
  window.open(
    'https://your-app-url.com/popup',
    'booking',
    'width=600,height=800,scrollbars=yes'
  );
}
</script>
```

---

## 📱 Standalone (App-Modus)

Vollständige App ohne Einbettung.

**Route:** `/` (Standard)

**Vorteile:**
- ✅ Volle Kontrolle
- ✅ Keine Parent-Page nötig
- ✅ Kann als PWA installiert werden

**Nachteile:**
- ❌ Nutzer verlässt deine Website
- ❌ Separate URL

**URL:**
```
https://your-app-url.com
```

---

## 🔗 Deep-Link zu Termin

Direkter Link zu einem spezifischen Termin.

**Route:** `/termin/{id}`

**Verwendung:**
- Email-Links
- QR-Codes
- Push-Benachrichtigungen

**Beispiel:**
```
https://your-app-url.com/termin/apt_2026-01-16_10-00_abc123
```

---

## 🎨 Custom Styling

### Via CSS-Variablen (iFrame)

Webflow CSS-Variablen werden automatisch angewendet:

```css
/* In deiner Webflow-Page */
:root {
  --primary: #2d62ff;
  --secondary: #def5ff;
  /* ... weitere in generated/webflow.css */
}
```

### Via URL-Parameter (Geplant)

```html
<iframe src="https://your-app-url.com?theme=light&color=blue"></iframe>
```

Noch nicht implementiert.

---

## 📊 Vergleich

| Methode | Einfachheit | Flexibilität | Empfehlung |
|---------|-------------|--------------|------------|
| **iFrame** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ✅ Beste Wahl |
| **Popup** | ⭐⭐⭐⭐ | ⭐⭐ | Alternativ |
| **Standalone** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | Für dedizierte Booking-Page |
| **Deep-Link** | ⭐⭐⭐⭐⭐ | ⭐ | Nur für Termin-Details |

---

## 🔧 Technische Details

### Kommunikation (iFrame ↔ Parent)

```typescript
// Von iFrame zu Parent
window.parent.postMessage({
  type: 'resize',
  height: 800
}, '*');

// Von Parent zu iFrame (optional)
iframe.contentWindow.postMessage({
  type: 'theme',
  theme: 'dark'
}, '*');
```

### CORS-Konfiguration

Nicht benötigt für iFrame (same-origin oder CORS-Header in Worker).

### Performance

Alle Methoden haben gleiche Performance:
- Erste Load: ~1 Sekunde
- Interaktionen: < 500ms

---

## 📚 Weitere Infos

- **iFrame-Details:** [20-IFRAME-INTEGRATION.md](20-IFRAME-INTEGRATION.md)
- **API für Custom-Integration:** [22-API-REFERENCE.md](22-API-REFERENCE.md)
- **Deployment:** [04-DEPLOYMENT.md](04-DEPLOYMENT.md)

---

**Empfehlung:** Nutze iFrame-Einbettung für beste Ergebnisse! 🎯
