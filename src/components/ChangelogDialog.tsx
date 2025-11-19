import { useState } from 'react';
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
import { Sparkles } from 'lucide-react';
import { APP_VERSION } from '../lib/version';

interface ChangelogDialogProps {
  children: React.ReactNode;
  className?: string;
}

export function ChangelogDialog({ children, className }: ChangelogDialogProps) {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
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
            {/* Version 1.0 */}
            <div className="border-l-2 border-blue-500 pl-4">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">Version 1.0</h3>
                <Badge>Current</Badge>
              </div>
              <p className="text-sm text-gray-500 mb-3">19. November 2025</p>
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
            </div>

            {/* Zukünftige Versionen - Placeholder */}
            <div className="border-l-2 border-gray-300 pl-4 opacity-50">
              <div className="flex items-center gap-2 mb-2">
                <h3 className="font-semibold text-lg">Version 1.1</h3>
                <Badge variant="outline">Geplant</Badge>
              </div>
              <p className="text-sm text-gray-500 mb-3">TBA</p>
              <div className="space-y-2">
                <div>
                  <h4 className="font-medium text-sm mb-1">Geplante Features</h4>
                  <ul className="text-sm space-y-1 text-gray-700 list-disc list-inside">
                    <li>Termin Umbuchungsfunktion</li>
                    <li>Export als CSV/Excel</li>
                    <li>QR-Codes für Terminansicht</li>
                    <li>ICS Download für Terminansicht</li>
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
