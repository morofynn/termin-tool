/**
 * Termin-Tool iFrame Auto-Resizer
 * 
 * Füge dieses Script auf deiner Website ein, um das iFrame automatisch
 * an die Höhe des Inhalts anzupassen.
 * 
 * Verwendung:
 * <iframe id="termin-tool-iframe" src="..."></iframe>
 * <script src="https://deine-domain.com/iframe-resizer.js"></script>
 */

(function() {
  'use strict';

  // Konfiguration
  const CONFIG = {
    iframeId: 'termin-tool-iframe',
    minHeight: 400,
    maxHeight: 3000,
    debounceDelay: 100,
    fallbackHeight: 800
  };

  let debounceTimer = null;

  // Finde das iFrame
  const iframe = document.getElementById(CONFIG.iframeId);
  
  if (!iframe) {
    console.error(`Termin-Tool: iFrame mit ID "${CONFIG.iframeId}" nicht gefunden.`);
    console.info('Stelle sicher dass das iFrame folgendes Attribut hat: id="termin-tool-iframe"');
    return;
  }

  // Setze initiale Höhe
  iframe.style.height = CONFIG.fallbackHeight + 'px';
  iframe.style.width = '100%';
  iframe.style.border = 'none';
  iframe.style.overflow = 'hidden';
  iframe.setAttribute('scrolling', 'no');

  /**
   * Aktualisiere iFrame Höhe
   */
  function updateHeight(height) {
    // Validierung
    if (typeof height !== 'number' || isNaN(height)) {
      console.warn('Termin-Tool: Ungültige Höhe erhalten:', height);
      return;
    }

    // Begrenzungen anwenden
    const boundedHeight = Math.max(
      CONFIG.minHeight,
      Math.min(CONFIG.maxHeight, height)
    );

    // Höhe setzen
    iframe.style.height = boundedHeight + 'px';

    // Debug-Info (in Entwicklung)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('Termin-Tool iFrame Höhe aktualisiert:', boundedHeight + 'px');
    }
  }

  /**
   * Message Handler für postMessage API
   */
  function handleMessage(event) {
    // Sicherheit: Origin-Check (optional - in Produktion aktivieren)
    // if (event.origin !== 'https://deine-domain.com') return;

    // Prüfe Message-Format
    if (!event.data || typeof event.data !== 'object') return;

    // Höhen-Update
    if (event.data.type === 'resize' && event.data.height) {
      // Debouncing für Performance
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        updateHeight(event.data.height);
      }, CONFIG.debounceDelay);
    }
  }

  // Event Listener registrieren
  window.addEventListener('message', handleMessage, false);

  // Initial-Load Handler
  iframe.addEventListener('load', function() {
    console.log('Termin-Tool iFrame geladen');
    
    // Fallback: Versuche Höhe direkt zu lesen (funktioniert nur same-origin)
    try {
      const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
      if (iframeDocument) {
        const height = iframeDocument.documentElement.scrollHeight;
        updateHeight(height);
      }
    } catch (e) {
      // Cross-origin - verwende postMessage
      console.info('Termin-Tool: Nutze postMessage für Cross-Origin iFrame');
    }
  });

  // Resize Observer für Responsive Anpassungen
  if (typeof ResizeObserver !== 'undefined') {
    const resizeObserver = new ResizeObserver(function(entries) {
      for (const entry of entries) {
        // Informiere das iFrame über Breiten-Änderungen
        iframe.contentWindow.postMessage({
          type: 'parent-resize',
          width: entry.contentRect.width
        }, '*');
      }
    });
    
    resizeObserver.observe(iframe.parentElement || iframe);
  }

  // Cleanup bei Page Unload
  window.addEventListener('beforeunload', function() {
    window.removeEventListener('message', handleMessage);
  });

  console.log('Termin-Tool iFrame Resizer initialisiert');
})();
