import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { ScrollArea } from './ui/scroll-area';
import { Badge } from './ui/badge';
import { Sparkles, ChevronDown, ChevronUp } from 'lucide-react';
import { APP_VERSION } from '../lib/version';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from './ui/collapsible';

interface ChangelogDialogProps {
  children: React.ReactNode;
  className?: string;
  onOpen?: () => void;
  hasSeenChangelog?: boolean;
}

const CHANGELOG_SEEN_KEY = 'changelog_seen_v1.1';

export function ChangelogDialog({ children, className, onOpen, hasSeenChangelog: hasSeenChangelogProp }: ChangelogDialogProps) {
  const [open, setOpen] = useState(false);
  const [localHasSeen, setLocalHasSeen] = useState(true);
  const [isV1Expanded, setIsV1Expanded] = useState(false);

  // Lade initialen State aus sessionStorage
  useEffect(() => {
    const seen = sessionStorage.getItem(CHANGELOG_SEEN_KEY);
    setLocalHasSeen(seen === 'true');
  }, []);

  const handleOpenChange = (newOpen: boolean) => {
    setOpen(newOpen);
    if (newOpen) {
      // Markiere als gesehen wenn Dialog geöffnet wird
      sessionStorage.setItem(CHANGELOG_SEEN_KEY, 'true');
      onOpen?.();
    } else {
      // Nach Schließen: Update local state
      setLocalHasSeen(true);
    }
  };

  // Zeige Indicator wenn NOCH NICHT gesehen
  const showIndicator = !localHasSeen || !hasSeenChangelogProp;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <button className={className}>
          {children}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[80vh] rounded-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-600" />
            Changelog
            <Badge variant="secondary">{APP_VERSION}</Badge>
          </DialogTitle>
          <DialogDescription>
            Alle Änderungen und Updates des Terminbuchungs-Tools
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Version 1.1 - AKTUELL */}
            <div className="border-l-2 border-blue-500 pl-4 relative">
              {/* Indicator für neuen Changelog-Eintrag */}
              {open && showIndicator && (
                <span 
                  className="absolute flex h-2 w-2"
                  style={{
                    right: 'calc(var(--spacing) * 3)',
                    top: 'calc(var(--spacing) * 4)'
                  }}
                >
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                </span>
              )}
              
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">Version 1.1</h3>
                <Badge>Current</Badge>
              </div>
              <p className="text-sm text-gray-500 mb-3">19. November 2025</p>
              <div className="space-y-2">
                <div>
                  <h4 className="font-medium text-sm mb-1">Neue Features</h4>
                  <ul className="text-sm space-y-1 text-gray-700 list-disc list-inside">
                    <li>QR-Code auf Terminbestätigung zum Kalender hinzufügen</li>
                    <li>QR-Code enthält ICS-Kalenderdatei mit allen Termindaten</li>
                    <li>Scannen lädt Termin direkt in den Kalender (iOS/Android)</li>
                    <li>Click-to-Download für Desktop-Nutzer</li>
                    <li>ICS Download für Terminansicht</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Version 1.0 - LEGACY (Kollabierbar) */}
            <Collapsible open={isV1Expanded} onOpenChange={setIsV1Expanded}>
              <div className="border-l-2 border-gray-300 pl-4">
                <CollapsibleTrigger className="w-full">
                  <div className="flex items-center gap-2 mb-2 hover:opacity-70 transition-opacity">
                    <h3 className="font-semibold text-lg">Version 1.0</h3>
                    <Badge variant="outline">Legacy</Badge>
                    {isV1Expanded ? (
                      <ChevronUp className="w-4 h-4 text-gray-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-gray-500" />
                    )}
                  </div>
                </CollapsibleTrigger>
                <p className="text-sm text-gray-500 mb-3">19. November 2025</p>
                
                <CollapsibleContent>
                  <div className="space-y-2">
                    <div>
                      <h4 className="font-medium text-sm mb-1">Features</h4>
                      <ul className="text-sm space-y-1 text-gray-700 list-disc list-inside">
                        <li>Interaktive Terminbuchung mit Kalender-Ansicht</li>
                        <li>Admin-Dashboard zur Terminverwaltung</li>
                        <li>Google Calendar Integration mit OAuth 2.0</li>
                        <li>Automatischer E-Mail-Versand via Gmail API</li>
                        <li>ICS-Attachments für alle Termin-E-Mails</li>
                        <li>Konfigurierbare Arbeitszeiten und Termindauer</li>
                        <li>Rate Limiting (max 5 Buchungen/IP/Tag)</li>
                        <li>Audit-Log für alle Admin-Aktionen</li>
                        <li>Mobile-optimiertes, responsives Design</li>
                        <li>Touch-optimierte UI für mobile Geräte</li>
                      </ul>
                    </div>
                    <div className="mt-3">
                      <h4 className="font-medium text-sm mb-1">Design</h4>
                      <ul className="text-sm space-y-1 text-gray-700 list-disc list-inside">
                        <li>Modernes UI mit Tailwind CSS 4</li>
                        <li>shadcn/ui Komponenten-Bibliothek</li>
                        <li>Animierte Übergänge und Feedback</li>
                        <li>Responsive Layout für alle Bildschirmgrößen</li>
                      </ul>
                    </div>
                    <div className="mt-3">
                      <h4 className="font-medium text-sm mb-1">Sicherheit</h4>
                      <ul className="text-sm space-y-1 text-gray-700 list-disc list-inside">
                        <li>Passwort-geschütztes Admin-Panel</li>
                        <li>Dynamischer Admin-Pfad (konfigurierbar)</li>
                        <li>Input-Validierung mit Zod</li>
                        <li>HTTP-only Cookies für Sessions</li>
                        <li>Environment Variables für Secrets</li>
                      </ul>
                    </div>
                    <div className="mt-3">
                      <h4 className="font-medium text-sm mb-1">Performance</h4>
                      <ul className="text-sm space-y-1 text-gray-700 list-disc list-inside">
                        <li>Cloudflare Workers für Edge Computing</li>
                        <li>Cloudflare KV Store für Datenspeicherung</li>
                        <li>Optimierte Bundle-Größe</li>
                        <li>Lazy Loading für React Components</li>
                      </ul>
                    </div>
                    <div className="mt-3">
                      <h4 className="font-medium text-sm mb-1">Integration</h4>
                      <ul className="text-sm space-y-1 text-gray-700 list-disc list-inside">
                        <li>Embed-Modus für iFrame-Einbettung</li>
                        <li>Popup-Modus für Modal-Integration</li>
                        <li>Multi-Tenant Support (White-Label)</li>
                      </ul>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            {/* Version 1.2 - GEPLANT */}
            <div className="border-l-2 border-gray-300 pl-4 opacity-50">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">Version 1.2</h3>
                <Badge variant="outline">Geplant</Badge>
              </div>
              <p className="text-sm text-gray-500 mb-3">TBA</p>
              <div className="space-y-2">
                <div>
                  <h4 className="font-medium text-sm mb-1">Geplante Features</h4>
                  <ul className="text-sm space-y-1 text-gray-700 list-disc list-inside">
                    <li>Termin Umbuchungsfunktion</li>
                    <li>Export als CSV/Excel</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

// Hook um zu prüfen ob Changelog bereits gesehen wurde
export function useChangelogSeen() {
  const [hasSeenChangelog, setHasSeenChangelog] = useState(true);

  useEffect(() => {
    const seen = sessionStorage.getItem(CHANGELOG_SEEN_KEY);
    setHasSeenChangelog(seen === 'true');
  }, []);

  const markAsSeen = () => {
    sessionStorage.setItem(CHANGELOG_SEEN_KEY, 'true');
    setHasSeenChangelog(true);
  };

  return { hasSeenChangelog, markAsSeen };
}
