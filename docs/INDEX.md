# 📚 Dokumentations-Übersicht

Zentrale Übersicht aller Dokumentationen für das Terminbuchungssystem.

---

## 🚀 Getting Started

Perfekt für neue Nutzer und Entwickler:

| Dokument | Beschreibung | Für wen? |
|----------|--------------|----------|
| [01-QUICK-START.md](01-QUICK-START.md) | System in unter 10 Minuten zum Laufen bringen | ⭐ Einsteiger |
| [02-SETUP.md](02-SETUP.md) | Detaillierte Installation & Konfiguration | Alle |
| [03-ENVIRONMENT.md](03-ENVIRONMENT.md) | Alle Environment-Variablen erklärt | Alle |
| [04-DEPLOYMENT.md](04-DEPLOYMENT.md) | Production-Deployment auf Cloudflare | DevOps |

---

## 🏗️ Architecture

Für Entwickler die das System verstehen/erweitern wollen:

| Dokument | Beschreibung |
|----------|--------------|
| [10-ARCHITECTURE.md](10-ARCHITECTURE.md) | System-Architektur & Tech-Stack |
| [11-KV-LIFECYCLE.md](11-KV-LIFECYCLE.md) | KV Store Datenverwaltung |
| [12-DATA-MODEL.md](12-DATA-MODEL.md) | Datenstrukturen & TypeScript Types |

---

## 🔌 Integration

Für die Einbettung in Websites:

| Dokument | Beschreibung |
|----------|--------------|
| [20-IFRAME-INTEGRATION.md](20-IFRAME-INTEGRATION.md) | iFrame-Einbettung (empfohlen) |
| [21-EMBED-OPTIONS.md](21-EMBED-OPTIONS.md) | Alternative Einbettungs-Methoden |
| [22-API-REFERENCE.md](22-API-REFERENCE.md) | Vollständige API-Dokumentation |

---

## ✨ Features

Detaillierte Beschreibung aller Funktionen:

| Dokument | Beschreibung |
|----------|--------------|
| [30-BOOKING-FLOW.md](30-BOOKING-FLOW.md) | Buchungsablauf im Detail |
| [31-CANCELLATION.md](31-CANCELLATION.md) | Stornierungsprozess |
| [32-ADMIN-PANEL.md](32-ADMIN-PANEL.md) | Admin-Funktionen & Einstellungen |
| [33-GOOGLE-CALENDAR.md](33-GOOGLE-CALENDAR.md) | Google Calendar Integration |
| [34-EMAIL-SYSTEM.md](34-EMAIL-SYSTEM.md) | Email-Benachrichtigungen |

---

## ✅ Testing & Quality

Für Qualitätssicherung:

| Dokument | Beschreibung |
|----------|--------------|
| [40-TESTING-GUIDE.md](40-TESTING-GUIDE.md) | Vollständige Test-Checkliste |
| [41-PERFORMANCE.md](41-PERFORMANCE.md) | Performance-Optimierung |
| [42-SECURITY.md](42-SECURITY.md) | Sicherheits-Best-Practices |

---

## 📖 Reference

Nachschlagewerke & Historie:

| Dokument | Beschreibung |
|----------|--------------|
| [50-CHANGELOG.md](50-CHANGELOG.md) | Vollständiger Changelog |
| [51-FINAL-ANALYSIS.md](51-FINAL-ANALYSIS.md) | System-Bewertung & Status |
| [52-TROUBLESHOOTING.md](52-TROUBLESHOOTING.md) | Häufige Probleme & Lösungen |

---

## 🎯 Schnellzugriff nach Rolle

### 👨‍💼 Ich bin Endnutzer/Kunde

→ Keine Dokumentation nötig! Einfach Termin buchen 😊

### 🎨 Ich bin Website-Owner

→ Start: [20-IFRAME-INTEGRATION.md](20-IFRAME-INTEGRATION.md)  
→ Dann: [02-SETUP.md](02-SETUP.md) für Email-Konfiguration

### 👨‍💻 Ich bin Entwickler (neu)

→ Start: [01-QUICK-START.md](01-QUICK-START.md)  
→ Dann: [10-ARCHITECTURE.md](10-ARCHITECTURE.md)  
→ Dann: [40-TESTING-GUIDE.md](40-TESTING-GUIDE.md)

### 🔧 Ich bin DevOps

→ Start: [04-DEPLOYMENT.md](04-DEPLOYMENT.md)  
→ Dann: [03-ENVIRONMENT.md](03-ENVIRONMENT.md)  
→ Dann: [42-SECURITY.md](42-SECURITY.md)

### 🆘 Ich habe ein Problem

→ Start: [52-TROUBLESHOOTING.md](52-TROUBLESHOOTING.md)  
→ Oder: Suche nach Error-Message in Dokumenten

---

## 📝 Dokumentations-Status

| Kategorie | Status | Vollständigkeit |
|-----------|--------|-----------------|
| Getting Started | ✅ Vollständig | 100% |
| Architecture | ✅ Vollständig | 100% |
| Integration | ✅ Vollständig | 100% |
| Features | ✅ Vollständig | 100% |
| Testing | ✅ Vollständig | 100% |
| Reference | ✅ Vollständig | 100% |

**Letzte Aktualisierung:** 24. November 2025  
**Version:** 2.0.0

---

## 🔍 Suche in Dokumentation

```bash
# Suche nach Stichwort in allen Docs
grep -r "email" docs/

# Suche nach spezifischem Begriff
grep -r "ADMIN_BASE_URL" docs/
```

---

## 🤝 Beitragen zur Dokumentation

Dokumentation fehlt oder ist unklar? 

1. Issue erstellen mit Label "documentation"
2. Pull Request mit Verbesserungen
3. Kontakt zu Team

---

**Zurück zur Hauptseite:** [../README.md](../README.md)
