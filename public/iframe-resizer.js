/**
 * Termin-Tool iFrame Auto-Resizer v2.0
 * 
 * Verbesserte Version mit:
 * - Scroll-Through für besseres UX
 * - Responsive Höhenanpassung bei Breiten-Änderung
 * - Performance-Optimierungen
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
    maxHeight: 5000, // Erhöht für längere Formulare
    debounceDelay: 150,
    fallbackHeight: 800
  };

  let debounceTimer = null;
  let lastHeight = 0;

  // Finde das iFrame
  const iframe = document.getElementById(CONFIG.iframeId);
  
  if (!iframe) {
    console.error(`Termin-Tool: iFrame mit ID "${CONFIG.iframeId}" nicht gefunden.`);
    console.info('Stelle sicher dass das iFrame folgendes Attribut hat: id="termin-tool-iframe"');
    return;
  }

  // Setze initiale Styles
  iframe.style.height = CONFIG.fallbackHeight + 'px';
  iframe.style.width = '100%';
  iframe.style.border = 'none';
  iframe.style.display = 'block';
  iframe.setAttribute('scrolling', 'no');

  // WICHTIG: Verhindere dass iFrame Scroll-Events abfängt
  iframe.style.pointerEvents = 'auto';
  iframe.style.overflow = 'hidden';

  /**
   * Aktualisiere iFrame Höhe
   */
  function updateHeight(height) {
    // Validierung
    if (typeof height !== 'number' || isNaN(height) || height <= 0) {
      console.warn('Termin-Tool: Ungültige Höhe erhalten:', height);
      return;
    }

    // Begrenzungen anwenden
    const boundedHeight = Math.max(
      CONFIG.minHeight,
      Math.min(CONFIG.maxHeight, height)
    );

    // Nur updaten wenn sich die Höhe signifikant geändert hat (min. 5px)
    if (Math.abs(boundedHeight - lastHeight) < 5) {
      return;
    }

    lastHeight = boundedHeight;

    // Höhe setzen mit smooth transition
    iframe.style.transition = 'height 0.3s ease-out';
    iframe.style.height = boundedHeight + 'px';

    // Debug-Info (in Entwicklung)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      console.log('📏 iFrame Höhe aktualisiert:', boundedHeight + 'px');
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
    if (event.data.type === 'resize') {
      if (event.data.height) {
        // Debouncing für Performance
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
          updateHeight(event.data.height);
        }, CONFIG.debounceDelay);
      }

      // Debug: Zeige auch Breiten-Info
      if (event.data.width && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')) {
        console.log('📐 iFrame Breite:', event.data.width + 'px');
      }
    }
  }

  // Event Listener registrieren
  window.addEventListener('message', handleMessage, false);

  // Initial-Load Handler
  iframe.addEventListener('load', function() {
    console.log('✅ Termin-Tool iFrame geladen');
    
    // Fallback: Versuche Höhe direkt zu lesen (funktioniert nur same-origin)
    try {
      const iframeDocument = iframe.contentDocument || iframe.contentWindow.document;
      if (iframeDocument) {
        const height = Math.max(
          iframeDocument.documentElement.scrollHeight,
          iframeDocument.body.scrollHeight
        );
        updateHeight(height);
      }
    } catch (e) {
      // Cross-origin - verwende postMessage
      console.info('Termin-Tool: Nutze postMessage für Cross-Origin iFrame');
    }
  });

  // Resize Observer für Parent Container
  // Wenn Container schmaler wird, informiere iFrame für Responsive Updates
  if (typeof ResizeObserver !== 'undefined') {
    const parentElement = iframe.parentElement || document.body;
    
    const resizeObserver = new ResizeObserver(function(entries) {
      for (const entry of entries) {
        const newWidth = entry.contentRect.width;
        
        // Informiere das iFrame über Breiten-Änderungen
        try {
          iframe.contentWindow.postMessage({
            type: 'parent-resize',
            width: newWidth
          }, '*');
          
          console.log('📱 Container-Breite geändert:', newWidth + 'px');
        } catch (e) {
          // Ignore cross-origin errors
        }
      }
    });
    
    resizeObserver.observe(parentElement);
  }

  // Window Resize Handler (Fallback)
  let windowResizeTimeout = null;
  window.addEventListener('resize', function() {
    clearTimeout(windowResizeTimeout);
    windowResizeTimeout = setTimeout(function() {
      try {
        iframe.contentWindow.postMessage({
          type: 'parent-resize',
          width: iframe.offsetWidth
        }, '*');
      } catch (e) {
        // Ignore
      }
    }, 200);
  });

  // Cleanup bei Page Unload
  window.addEventListener('beforeunload', function() {
    window.removeEventListener('message', handleMessage);
  });

  console.log('🚀 Termin-Tool iFrame Resizer v2.0 initialisiert');
})();
