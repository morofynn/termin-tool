# Favicon Setup

Das Termin-Icon aus dem Admin-Panel wurde als Favicon hinterlegt.

## Aktuelle Favicons

- **favicon.svg** - Vektorgrafik (skalierbar, modern)
- **favicon.ico** - Klassisches ICO-Format (für ältere Browser)
- **favicon-32x32.png** - 32x32px PNG
- **favicon-16x16.png** - 16x16px PNG  
- **apple-touch-icon.png** - 180x180px für iOS/Safari
- **site.webmanifest** - Web App Manifest

## Das Icon

Das Favicon zeigt eine **gelbe Uhr** mit:
- Gelbem Hintergrund (#fef3c7)
- Goldenem Uhrenrand (#ca8a04)
- Stunden- und Minutenzeigern
- 12 Stundenmarkierungen

Es entspricht dem AnimatedClock-Icon, das im Buchungsformular verwendet wird.

## Integration

Das Favicon ist bereits in `src/layouts/main.astro` eingebunden:

```html
<link rel="icon" type="image/x-icon" href={`${baseUrl}/favicon.ico`} />
<link rel="icon" type="image/png" sizes="32x32" href={`${baseUrl}/favicon-32x32.png`} />
<link rel="icon" type="image/png" sizes="16x16" href={`${baseUrl}/favicon-16x16.png`} />
<link rel="apple-touch-icon" sizes="180x180" href={`${baseUrl}/apple-touch-icon.png`} />
```

## PNG-Versionen erstellen

Falls Sie die PNG-Versionen aktualisieren möchten:

1. Öffnen Sie `public/favicon.svg` in einem SVG-Editor (z.B. Figma, Inkscape)
2. Exportieren Sie als PNG in folgenden Größen:
   - 16x16px → `favicon-16x16.png`
   - 32x32px → `favicon-32x32.png`
   - 180x180px → `apple-touch-icon.png`
   - 512x512px → `android-chrome-512x512.png` (optional)

Oder nutzen Sie einen Online-Konverter wie [CloudConvert](https://cloudconvert.com/svg-to-png).

## Browser Cache

Nach dem Ändern des Favicons müssen Browser möglicherweise den Cache leeren:
- **Chrome/Edge**: `Ctrl + Shift + R` (Windows) / `Cmd + Shift + R` (Mac)
- **Firefox**: `Ctrl + F5` (Windows) / `Cmd + Shift + R` (Mac)
- **Safari**: `Cmd + Option + E` (Cache leeren)

## Webflow Deployment

Die Favicon-Dateien werden automatisch mit dem Projekt deployed und sind unter:
```
https://ihre-domain.com/[base-path]/favicon.svg
https://ihre-domain.com/[base-path]/favicon.ico
```

verfügbar.
