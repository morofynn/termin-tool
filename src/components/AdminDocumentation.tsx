import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Clock,
  Ban,
  HelpCircle,
  Calendar,
  Bell,
  FileText,
  Zap,
  Loader2,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from './ui/accordion';
import { baseUrl } from '../lib/base-url';
import { toast } from 'sonner';

interface AdminDocumentationProps {
  isOpen: boolean;
  onClose: () => void;
}

type TabKey = 'overview' | 'emails' | 'faq';

const TABS = {
  overview: 'Übersicht',
  emails: 'E-Mails',
  faq: 'FAQ',
};

const tabOrder: TabKey[] = ['overview', 'emails', 'faq'];

export default function AdminDocumentation({ isOpen, onClose }: AdminDocumentationProps) {
  const [sendingTest, setSendingTest] = useState<string | null>(null);
  const [selectedTab, setSelectedTab] = useState<TabKey>('overview');
  const [eventName, setEventName] = useState('OPTI 26');
  const [eventYear, setEventYear] = useState(new Date().getFullYear());

  // Lade Event-Name und Jahr aus Settings
  useEffect(() => {
    const loadEventName = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/admin/settings`);
        if (response.ok) {
          const data = await response.json() as any;
          const year = data.settings?.eventYear || new Date().getFullYear();
          const name = data.settings?.eventName || 'OPTI';
          setEventYear(year);
          setEventName(`${name} ${year.toString().slice(-2)}`);
          console.log('📅 Loaded event config:', { year, name, eventName: `${name} ${year.toString().slice(-2)}` });
        }
      } catch (error) {
        console.error('Error loading event name:', error);
      }
    };

    if (isOpen) {
      loadEventName();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sendTestEmail = async (emailType: string) => {
    setSendingTest(emailType);
    try {
      const response = await fetch(`${baseUrl}/api/admin/test-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ emailType }),
      });

      if (response.ok) {
        toast.success('Test-E-Mail wurde versendet! Bitte prüfen Sie Ihren Posteingang.');
      } else {
        const data = await response.json();
        toast.error((data as any).message || 'Fehler beim Versenden');
      }
    } catch (error) {
      toast.error('Verbindungsfehler');
      console.error('Error sending test email:', error);
    } finally {
      setSendingTest(null);
    }
  };

  const getActiveTabIndex = () => {
    return tabOrder.indexOf(selectedTab);
  };

  return (
    <div 
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 sm:p-4"
      style={{ overflow: 'hidden' }}
    >
      <Card className="w-full max-w-5xl h-[95vh] sm:h-[90vh] bg-white shadow-2xl rounded-xl sm:rounded-2xl border-0 flex flex-col overflow-hidden">
        <CardHeader className="px-4 sm:px-6 py-4 sm:py-5 border-b flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg">
                <FileText className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
              </div>
              <div>
                <CardTitle className="text-lg sm:text-xl text-gray-900">System-Dokumentation</CardTitle>
                <CardDescription className="text-xs sm:text-sm text-gray-600">
                  Funktionen, E-Mail-Übersicht & FAQ
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={onClose}
              variant="ghost"
              size="icon"
              className="rounded-full hover:bg-gray-100 h-8 w-8 sm:h-10 sm:w-10"
            >
              <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </Button>
          </div>
        </CardHeader>

        {/* Tab Navigation - im gleichen Style wie Tageswahl */}
        <div className="px-3 sm:px-6 pt-3 sm:pt-4 flex-shrink-0">
          <div className="relative bg-gray-100 rounded-xl p-1.5">
            <motion.div
              className="absolute bg-blue-600 rounded-lg shadow-sm pointer-events-none"
              style={{
                width: `calc(${100 / tabOrder.length}% - 8px)`,
                zIndex: 1,
                top: '6px',
                bottom: '6px',
              }}
              layoutId="activeDocTab"
              initial={false}
              animate={{
                left: `calc(${getActiveTabIndex() * (100 / tabOrder.length)}% + 6px)`,
              }}
              transition={{
                type: 'spring',
                stiffness: 260,
                damping: 20,
                mass: 0.8,
              }}
            />
            <div
              className="relative grid w-full gap-1.5 z-10"
              style={{
                gridTemplateColumns: `repeat(${tabOrder.length}, 1fr)`,
              }}
            >
              {tabOrder.map((tab) => {
                const isActive = selectedTab === tab;
                return (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setSelectedTab(tab)}
                    style={{
                      position: 'relative',
                      fontWeight: 500,
                      borderRadius: '0.5rem',
                      transition: 'color 0.2s',
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: isActive ? '#ffffff !important' : '#1f2937',
                      zIndex: 20,
                      fontSize: '0.75rem',
                      padding: '0.5rem 0.75rem',
                    }}
                    className="sm:text-sm sm:px-4 sm:py-2.5"
                  >
                    <span style={{ color: isActive ? '#ffffff' : '#1f2937' }}>
                      {TABS[tab]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Content Area mit Scroll */}
        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-full">
            <div className="px-3 sm:px-6 py-4 sm:py-6 pb-6 sm:pb-8">
              {/* Übersicht Tab */}
              {selectedTab === 'overview' && (
                <div className="space-y-4 sm:space-y-6">
                  {/* Haupt-Funktionen */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-6 sm:mb-8 flex items-center gap-2">
                      <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      Haupt-Funktionen
                    </h3>
                    
                    <div className="grid gap-3 sm:gap-4 mt-6 sm:mt-8">
                      {/* Terminbuchung */}
                      <Card className="border-gray-200 bg-white">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 bg-green-50 rounded-lg flex-shrink-0">
                              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-green-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">Terminbuchung</h4>
                              <p className="text-xs sm:text-sm text-gray-600 mb-2 leading-relaxed">
                                Kunden können Termine für die nächste Veranstaltung buchen. 
                                Slots können je nach Einstellung automatisch bestätigt oder als "Ausstehend" markiert werden.
                              </p>
                              <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                                <Badge variant="outline" className="text-[10px] sm:text-xs" style={{ color: '#000000' }}>
                                  Auto-Bestätigung optional
                                </Badge>
                                <Badge variant="outline" className="text-[10px] sm:text-xs" style={{ color: '#000000' }}>
                                  Duplikat-Schutz
                                </Badge>
                                <Badge variant="outline" className="text-[10px] sm:text-xs" style={{ color: '#000000' }}>
                                  Slot-Verwaltung
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Termin-Verwaltung */}
                      <Card className="border-gray-200 bg-white">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg flex-shrink-0">
                              <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">Termin-Verwaltung</h4>
                              <p className="text-xs sm:text-sm text-gray-600 mb-2 leading-relaxed">
                                Bestätigen, Ablehnen oder Löschen Sie Termine im Admin-Panel. 
                                Jede Aktion wird dokumentiert und der Kunde wird automatisch benachrichtigt.
                              </p>
                              <div className="space-y-1.5 sm:space-y-2 mt-2 sm:mt-3">
                                {/* Bestätigen */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-[10px] sm:text-xs">
                                  <Badge className="bg-green-600 text-white text-[10px] sm:text-xs w-fit">Bestätigen</Badge>
                                  <span className="text-gray-600">→ Google Calendar + Bestätigungs-E-Mail</span>
                                </div>
                                {/* Stornieren */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-[10px] sm:text-xs">
                                  <Badge className="bg-orange-600 text-white text-[10px] sm:text-xs w-fit">Stornieren</Badge>
                                  <span className="text-gray-600">→ Slot freigeben + Benachrichtigungs-E-Mail</span>
                                </div>
                                {/* Löschen */}
                                <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-[10px] sm:text-xs">
                                  <Badge className="bg-red-600 text-white text-[10px] sm:text-xs w-fit">Löschen</Badge>
                                  <span className="text-gray-600">→ Komplett entfernen (KEINE E-Mail)</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Erinnerungs-E-Mails */}
                      <Card className="border-gray-200 bg-white">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 bg-purple-50 rounded-lg flex-shrink-0">
                              <Bell className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                                Automatische Erinnerungen
                              </h4>
                              <p className="text-xs sm:text-sm text-gray-600 mb-2 leading-relaxed">
                                24 Stunden vor jedem bestätigten Termin wird automatisch eine Erinnerungs-E-Mail 
                                versendet. Powered by Cloudflare Cron Jobs (stündlich).
                              </p>
                              <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                                <Badge variant="outline" className="text-[10px] sm:text-xs" style={{ color: '#000000' }}>
                                  Automatisch via Cron
                                </Badge>
                                <Badge variant="outline" className="text-[10px] sm:text-xs" style={{ color: '#000000' }}>
                                  Duplikat-Schutz
                                </Badge>
                                <Badge variant="outline" className="text-[10px] sm:text-xs" style={{ color: '#000000' }}>
                                  Audit-Log
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Google Calendar */}
                      <Card className="border-gray-200 bg-white">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex items-start gap-2 sm:gap-3">
                            <div className="p-1.5 sm:p-2 bg-indigo-50 rounded-lg flex-shrink-0">
                              <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="text-sm sm:text-base font-semibold text-gray-900 mb-1">
                                Google Calendar Integration
                              </h4>
                              <p className="text-xs sm:text-sm text-gray-600 mb-2 leading-relaxed">
                                Bestätigte Termine werden automatisch in Google Calendar eingetragen. 
                                Bei Stornierung werden sie automatisch gelöscht.
                              </p>
                              <div className="flex gap-1.5 sm:gap-2 flex-wrap">
                                <Badge variant="outline" className="text-[10px] sm:text-xs" style={{ color: '#000000' }}>
                                  Automatisch bei Bestätigung
                                </Badge>
                                <Badge variant="outline" className="text-[10px] sm:text-xs" style={{ color: '#000000' }}>
                                  Automatisch bei Stornierung
                                </Badge>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  {/* Status-Übersicht */}
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-6 sm:mb-8 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      Status-Übersicht
                    </h3>
                    
                    <div className="grid gap-2 sm:gap-3 mt-6 sm:mt-8">
                      <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs sm:text-sm text-yellow-900">Ausstehend (Pending)</p>
                          <p className="text-[10px] sm:text-xs text-yellow-700 leading-relaxed">
                            Wartet auf Ihre Bestätigung. Zeitslot ist blockiert. Kunde hat Anfrage-E-Mail erhalten.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-green-50 rounded-lg border border-green-200">
                        <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs sm:text-sm text-green-900">Bestätigt (Confirmed)</p>
                          <p className="text-[10px] sm:text-xs text-green-700 leading-relaxed">
                            Termin ist bestätigt. In Google Calendar eingetragen. Kunde erhält Erinnerung 24h vorher.
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 sm:gap-3 p-2.5 sm:p-3 bg-red-50 rounded-lg border border-red-200">
                        <Ban className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0" />
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold text-xs sm:text-sm text-red-900">Storniert (Cancelled)</p>
                          <p className="text-[10px] sm:text-xs text-red-700 leading-relaxed">
                            Termin abgelehnt oder storniert. Zeitslot wieder frei. Kunde erhält Benachrichtigungs-E-Mail. Bleibt zur Dokumentation sichtbar.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* E-Mails Tab */}
              {selectedTab === 'emails' && (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-6 sm:mb-8 flex items-center gap-2">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      E-Mail-Übersicht
                    </h3>
                    
                    <div className="space-y-3 sm:space-y-4 mt-6 sm:mt-8">
                      {/* Terminanfrage (Pending) */}
                      <Card className="border-yellow-200 bg-yellow-50/30">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex flex-col gap-3">
                            <div className="flex-1 min-w-0 w-full">
                              <div className="flex items-center gap-2 mb-2">
                                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-yellow-600" />
                                <h4 className="text-sm sm:text-base font-semibold text-gray-900">Terminanfrage eingegangen</h4>
                              </div>
                              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                <div>
                                  <span className="text-gray-600">Wann:</span>{' '}
                                  <span className="text-gray-900 font-medium">
                                    Bei neuer Buchung (wenn Auto-Bestätigung AUS)
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">An:</span>{' '}
                                  <Badge variant="outline" className="text-[10px] sm:text-xs" style={{ color: '#000000' }}>Kunde</Badge>
                                  <Badge variant="outline" className="text-[10px] sm:text-xs ml-1" style={{ color: '#000000' }}>Admin (optional)</Badge>
                                </div>
                                <div className="break-all">
                                  <span className="text-gray-600">Betreff:</span>{' '}
                                  <code className="text-[10px] sm:text-xs bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded" style={{ color: '#000000' }}>
                                    ⏳ Ihre Terminanfrage für die {eventName}
                                  </code>
                                </div>
                                <div>
                                  <span className="text-gray-600">Inhalt:</span>{' '}
                                  <span className="text-gray-900">
                                    Bestätigung der Anfrage, Hinweis auf Prüfung, Link zur Terminseite
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendTestEmail('requested')}
                              disabled={sendingTest === 'requested'}
                              className="gap-2 text-xs w-full sm:w-auto sm:self-end"
                            >
                              {sendingTest === 'requested' ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              Test senden
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Sofortbuchung */}
                      <Card className="border-green-200 bg-green-50/30">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex flex-col gap-3">
                            <div className="flex-1 min-w-0 w-full">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                                <h4 className="text-sm sm:text-base font-semibold text-gray-900">Sofortbuchung bestätigt</h4>
                              </div>
                              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                <div>
                                  <span className="text-gray-600">Wann:</span>{' '}
                                  <span className="text-gray-900 font-medium">
                                    Bei neuer Buchung (wenn Auto-Bestätigung AN)
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">An:</span>{' '}
                                  <Badge variant="outline" className="text-[10px] sm:text-xs" style={{ color: '#000000' }}>Kunde</Badge>
                                  <Badge variant="outline" className="text-[10px] sm:text-xs ml-1" style={{ color: '#000000' }}>Admin (optional)</Badge>
                                </div>
                                <div className="break-all">
                                  <span className="text-gray-600">Betreff:</span>{' '}
                                  <code className="text-[10px] sm:text-xs bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded" style={{ color: '#000000' }}>
                                    ✅ Terminbestätigung - {eventName}
                                  </code>
                                </div>
                                <div>
                                  <span className="text-gray-600">Inhalt:</span>{' '}
                                  <span className="text-gray-900">
                                    Termin ist bestätigt, Details, Stornierungsoption, Link zur Terminseite
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendTestEmail('instant-booked')}
                              disabled={sendingTest === 'instant-booked'}
                              className="gap-2 text-xs w-full sm:w-auto sm:self-end"
                            >
                              {sendingTest === 'instant-booked' ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              Test senden
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Termin bestätigt */}
                      <Card className="border-green-200 bg-green-50/30">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex flex-col gap-3">
                            <div className="flex-1 min-w-0 w-full">
                              <div className="flex items-center gap-2 mb-2">
                                <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-green-600" />
                                <h4 className="text-sm sm:text-base font-semibold text-gray-900">Termin bestätigt (vom Admin)</h4>
                              </div>
                              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                <div>
                                  <span className="text-gray-600">Wann:</span>{' '}
                                  <span className="text-gray-900 font-medium">
                                    Wenn Admin einen ausstehenden Termin bestätigt
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">An:</span>{' '}
                                  <Badge variant="outline" className="text-[10px] sm:text-xs" style={{ color: '#000000' }}>Kunde</Badge>
                                  <Badge variant="outline" className="text-[10px] sm:text-xs ml-1" style={{ color: '#000000' }}>Admin (optional)</Badge>
                                </div>
                                <div className="break-all">
                                  <span className="text-gray-600">Betreff:</span>{' '}
                                  <code className="text-[10px] sm:text-xs bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded" style={{ color: '#000000' }}>
                                    ✅ Terminbestätigung - {eventName}
                                  </code>
                                </div>
                                <div>
                                  <span className="text-gray-600">Inhalt:</span>{' '}
                                  <span className="text-gray-900">
                                    Bestätigung, Termin-Details, Stornierungsoption, Link zur Terminseite
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendTestEmail('confirmed')}
                              disabled={sendingTest === 'confirmed'}
                              className="gap-2 text-xs w-full sm:w-auto sm:self-end"
                            >
                              {sendingTest === 'confirmed' ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              Test senden
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Termin abgelehnt */}
                      <Card className="border-orange-200 bg-orange-50/30">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex flex-col gap-3">
                            <div className="flex-1 min-w-0 w-full">
                              <div className="flex items-center gap-2 mb-2">
                                <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-orange-600" />
                                <h4 className="text-sm sm:text-base font-semibold text-gray-900">Terminanfrage abgelehnt</h4>
                              </div>
                              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                <div>
                                  <span className="text-gray-600">Wann:</span>{' '}
                                  <span className="text-gray-900 font-medium">
                                    Wenn Admin einen Termin ablehnt/storniert
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">An:</span>{' '}
                                  <Badge variant="outline" className="text-[10px] sm:text-xs" style={{ color: '#000000' }}>Kunde</Badge>
                                  <Badge variant="outline" className="text-[10px] sm:text-xs ml-1" style={{ color: '#000000' }}>Admin (optional)</Badge>
                                </div>
                                <div className="break-all">
                                  <span className="text-gray-600">Betreff:</span>{' '}
                                  <code className="text-[10px] sm:text-xs bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded" style={{ color: '#000000' }}>
                                    ❌ Terminanfrage abgelehnt
                                  </code>
                                </div>
                                <div>
                                  <span className="text-gray-600">Inhalt:</span>{' '}
                                  <span className="text-gray-900">
                                    Freundliche Absage, Hinweis auf alternative Buchung, Link zur Terminseite
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendTestEmail('rejected')}
                              disabled={sendingTest === 'rejected'}
                              className="gap-2 text-xs w-full sm:w-auto sm:self-end"
                            >
                              {sendingTest === 'rejected' ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              Test senden
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Kunde storniert */}
                      <Card className="border-red-200 bg-red-50/30">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex flex-col gap-3">
                            <div className="flex-1 min-w-0 w-full">
                              <div className="flex items-center gap-2 mb-2">
                                <Ban className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-600" />
                                <h4 className="text-sm sm:text-base font-semibold text-gray-900">Termin storniert (vom Kunden)</h4>
                              </div>
                              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                <div>
                                  <span className="text-gray-600">Wann:</span>{' '}
                                  <span className="text-gray-900 font-medium">
                                    Wenn Kunde über Termin-Link storniert
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">An:</span>{' '}
                                  <Badge variant="outline" className="text-[10px] sm:text-xs" style={{ color: '#000000' }}>Kunde</Badge>
                                  <Badge variant="outline" className="text-[10px] sm:text-xs ml-1" style={{ color: '#000000' }}>Admin (optional)</Badge>
                                </div>
                                <div className="break-all">
                                  <span className="text-gray-600">Betreff:</span>{' '}
                                  <code className="text-[10px] sm:text-xs bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded" style={{ color: '#000000' }}>
                                    ❌ Termin storniert
                                  </code>
                                </div>
                                <div>
                                  <span className="text-gray-600">Inhalt:</span>{' '}
                                  <span className="text-gray-900">
                                    Stornierungsbestätigung, Möglichkeit zur Neu-Buchung, Link zur Terminseite
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendTestEmail('cancelled')}
                              disabled={sendingTest === 'cancelled'}
                              className="gap-2 text-xs w-full sm:w-auto sm:self-end"
                            >
                              {sendingTest === 'cancelled' ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              Test senden
                            </Button>
                          </div>
                        </CardContent>
                      </Card>

                      {/* Erinnerung */}
                      <Card className="border-purple-200 bg-purple-50/30">
                        <CardContent className="p-3 sm:p-4">
                          <div className="flex flex-col gap-3">
                            <div className="flex-1 min-w-0 w-full">
                              <div className="flex items-center gap-2 mb-2">
                                <Bell className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-purple-600" />
                                <h4 className="text-sm sm:text-base font-semibold text-gray-900">Termin-Erinnerung (24h vorher)</h4>
                              </div>
                              <div className="space-y-1.5 sm:space-y-2 text-xs sm:text-sm">
                                <div>
                                  <span className="text-gray-600">Wann:</span>{' '}
                                  <span className="text-gray-900 font-medium">
                                    Automatisch 24h vor bestätigtem Termin (via Cron Job)
                                  </span>
                                </div>
                                <div>
                                  <span className="text-gray-600">An:</span>{' '}
                                  <Badge variant="outline" className="text-[10px] sm:text-xs" style={{ color: '#000000' }}>Kunde</Badge>
                                </div>
                                <div className="break-all">
                                  <span className="text-gray-600">Betreff:</span>{' '}
                                  <code className="text-[10px] sm:text-xs bg-white px-1.5 sm:px-2 py-0.5 sm:py-1 rounded" style={{ color: '#000000' }}>
                                    ⏰ Erinnerung: Ihr Termin morgen - {eventName}
                                  </code>
                                </div>
                                <div>
                                  <span className="text-gray-600">Inhalt:</span>{' '}
                                  <span className="text-gray-900">
                                    "Wir freuen uns auf Sie!", Termin-Details, Stornierungsoption, Wichtige Infos
                                  </span>
                                </div>
                              </div>
                            </div>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => sendTestEmail('reminder')}
                              disabled={sendingTest === 'reminder'}
                              className="gap-2 text-xs w-full sm:w-auto sm:self-end"
                            >
                              {sendingTest === 'reminder' ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              Test senden
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  <Separator />

                  <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
                    <div className="flex gap-2 sm:gap-3">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="text-xs sm:text-sm font-semibold text-blue-900 mb-1">
                          Hinweis zu Test-E-Mails
                        </h4>
                        <p className="text-[10px] sm:text-xs text-blue-700 leading-relaxed">
                          Test-E-Mails werden an die in den Einstellungen hinterlegte Admin-E-Mail-Adresse gesendet. 
                          So können Sie die E-Mails prüfen, bevor Kunden sie erhalten. Die E-Mails enthalten Beispiel-Daten.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* FAQ Tab */}
              {selectedTab === 'faq' && (
                <div className="space-y-4 sm:space-y-6">
                  <div>
                    <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-6 sm:mb-8 flex items-center gap-2">
                      <HelpCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600" />
                      Häufig gestellte Fragen
                    </h3>
                    
                    <Accordion type="single" collapsible className="space-y-2 mt-6 sm:mt-8">
                      <AccordionItem value="item-1" className="border border-gray-200 bg-white rounded-lg px-3 sm:px-4">
                        <AccordionTrigger className="text-xs sm:text-sm font-medium text-gray-900 hover:no-underline py-2">
                          Was ist der Unterschied zwischen "Stornieren" und "Löschen"?
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-gray-600 space-y-1.5 pb-2">
                          <p>
                            <strong className="text-gray-900">Stornieren:</strong> Der Termin wird als "Storniert" markiert, 
                            der Kunde erhält eine E-Mail-Benachrichtigung, der Zeitslot wird freigegeben, und der Termin 
                            bleibt zur Dokumentation im System sichtbar.
                          </p>
                          <p>
                            <strong className="text-gray-900">Löschen:</strong> Der Termin wird komplett aus dem System entfernt, 
                            der Kunde erhält KEINE Benachrichtigung, und der Termin ist nicht mehr sichtbar. 
                            Verwenden Sie diese Funktion nur für Test-Termine oder Duplikate.
                          </p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-2" className="border border-gray-200 bg-white rounded-lg px-3 sm:px-4">
                        <AccordionTrigger className="text-xs sm:text-sm font-medium text-gray-900 hover:no-underline py-2">
                          Wann werden Erinnerungs-E-Mails versendet?
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-gray-600 space-y-1.5 pb-2">
                          <p>
                            Erinnerungs-E-Mails werden automatisch 24 Stunden vor jedem <strong>bestätigten</strong> Termin versendet. 
                            Das System prüft stündlich (via Cloudflare Cron Job), welche Termine in den nächsten 24 Stunden stattfinden.
                          </p>
                          <p>
                            <strong className="text-gray-900">Wichtig:</strong> Nur Termine mit Status "Bestätigt" erhalten Erinnerungen. 
                            Ausstehende oder stornierte Termine werden übersprungen.
                          </p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-3" className="border border-gray-200 bg-white rounded-lg px-3 sm:px-4">
                        <AccordionTrigger className="text-xs sm:text-sm font-medium text-gray-900 hover:no-underline py-2">
                          Was passiert wenn ich versehentlich einen Termin ablehne?
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-gray-600 space-y-1.5 pb-2">
                          <p>
                            Der Termin wird als "Storniert" markiert und der Kunde erhält eine Absage-E-Mail. 
                            Eine Wiederherstellung ist nicht möglich.
                          </p>
                          <p>
                            <strong className="text-gray-900">Lösung:</strong> Kontaktieren Sie den Kunden direkt 
                            (Telefon oder E-Mail) und bitten Sie ihn, einen neuen Termin zu buchen.
                          </p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-4" className="border border-gray-200 bg-white rounded-lg px-3 sm:px-4">
                        <AccordionTrigger className="text-xs sm:text-sm font-medium text-gray-900 hover:no-underline py-2">
                          Wie kann ich prüfen ob E-Mails versendet wurden?
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-gray-600 space-y-1.5 pb-2">
                          <p>
                            Im <strong>Aktivitätslog</strong> werden alle E-Mail-Versände dokumentiert. 
                            Sie sehen dort den Status (erfolgreich oder fehlgeschlagen), den Empfänger und den Zeitpunkt.
                          </p>
                          <p>
                            Einträge im Audit-Log:
                          </p>
                          <ul className="list-disc pl-4 space-y-0.5 text-xs sm:text-sm">
                            <li>"E-Mail an Kunde" - Kunde wurde benachrichtigt</li>
                            <li>"E-Mail an Admin" - Admin wurde benachrichtigt</li>
                            <li>"E-Mail fehlgeschlagen" - Versand war nicht erfolgreich</li>
                            <li>"Erinnerungs-E-Mail" - Erinnerung wurde versendet</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-5" className="border border-gray-200 bg-white rounded-lg px-3 sm:px-4">
                        <AccordionTrigger className="text-xs sm:text-sm font-medium text-gray-900 hover:no-underline py-2">
                          Was ist Auto-Bestätigung und wann sollte ich sie verwenden?
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-gray-600 space-y-1.5 pb-2">
                          <p>
                            Mit <strong>Auto-Bestätigung AN</strong> werden neue Termine sofort bestätigt, 
                            in Google Calendar eingetragen und der Kunde erhält eine Bestätigungs-E-Mail.
                          </p>
                          <p>
                            Mit <strong>Auto-Bestätigung AUS</strong> haben neue Termine den Status "Ausstehend" 
                            und warten auf Ihre manuelle Bestätigung im Admin-Panel.
                          </p>
                          <p>
                            <strong className="text-gray-900">Empfehlung:</strong> Verwenden Sie Auto-Bestätigung, 
                            wenn Sie allen Kunden vertrauen und genügend Slots verfügbar sind. Deaktivieren Sie sie, 
                            wenn Sie jeden Termin manuell prüfen möchten.
                          </p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-6" className="border border-gray-200 bg-white rounded-lg px-3 sm:px-4">
                        <AccordionTrigger className="text-xs sm:text-sm font-medium text-gray-900 hover:no-underline py-2">
                          Werden Kunden bei mehrfacher E-Mail-Adresse benachrichtigt?
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-gray-600 space-y-1.5 pb-2">
                          <p>
                            Ja, das System verfügt über einen <strong>Duplikat-Schutz</strong>. 
                            Wenn die Option "Duplikat-Schutz" in den Einstellungen aktiviert ist, 
                            können Kunden mit derselben E-Mail-Adresse keinen zweiten Termin buchen.
                          </p>
                          <p>
                            Der Duplikat-Schutz prüft nur <strong>aktive</strong> Termine (ausstehend und bestätigt). 
                            Stornierte Termine werden ignoriert, sodass der Kunde nach einer Stornierung erneut buchen kann.
                          </p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-7" className="border border-gray-200 bg-white rounded-lg px-3 sm:px-4">
                        <AccordionTrigger className="text-xs sm:text-sm font-medium text-gray-900 hover:no-underline py-2">
                          Was passiert wenn Google Calendar nicht konfiguriert ist?
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-gray-600 space-y-1.5 pb-2">
                          <p>
                            Das System funktioniert auch ohne Google Calendar Integration. 
                            Termine werden normal verwaltet, aber nicht automatisch in Google Calendar eingetragen.
                          </p>
                          <p>
                            In den Einstellungen sehen Sie einen Warnhinweis, wenn Google Calendar nicht konfiguriert ist. 
                            Folgen Sie der Anleitung in der Google Calendar Setup-Dokumentation, um die Integration einzurichten.
                          </p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-8" className="border border-gray-200 bg-white rounded-lg px-3 sm:px-4">
                        <AccordionTrigger className="text-xs sm:text-sm font-medium text-gray-900 hover:no-underline py-2">
                          Wie kann ich das Buchungssystem temporär deaktivieren?
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-gray-600 space-y-1.5 pb-2">
                          <p>
                            Aktivieren Sie den <strong>Wartungsmodus</strong> in den Einstellungen. 
                            Dann wird Kunden eine konfigurierbare Wartungsmeldung angezeigt und neue Buchungen sind nicht möglich.
                          </p>
                          <p>
                            <strong className="text-gray-900">Hinweis:</strong> Bestehende Termine bleiben erhalten 
                            und Sie können diese weiterhin im Admin-Panel verwalten.
                          </p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-9" className="border border-gray-200 bg-white rounded-lg px-3 sm:px-4">
                        <AccordionTrigger className="text-xs sm:text-sm font-medium text-gray-900 hover:no-underline py-2">
                          Kann ich die E-Mail-Vorlagen anpassen?
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-gray-600 space-y-1.5 pb-2">
                          <p>
                            Die E-Mail-Vorlagen sind fest im System integriert und können nicht direkt 
                            über das Admin-Panel angepasst werden. 
                          </p>
                          <p>
                            <strong className="text-gray-900">Für Anpassungen:</strong> Kontaktieren Sie Ihren Entwickler. 
                            Die Templates befinden sich in <code className="text-[10px] bg-gray-100 px-1 py-0.5 rounded">src/lib/email.ts</code>.
                          </p>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-10" className="border border-gray-200 bg-white rounded-lg px-3 sm:px-4">
                        <AccordionTrigger className="text-xs sm:text-sm font-medium text-gray-900 hover:no-underline py-2">
                          Was bedeuten die verschiedenen Einträge im Audit-Log?
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-gray-600 space-y-1.5 pb-2">
                          <p>Das Audit-Log dokumentiert alle wichtigen Aktionen im System:</p>
                          <ul className="list-disc pl-4 space-y-0.5 text-xs sm:text-sm">
                            <li><strong>Termin gebucht</strong> - Neuer Termin wurde erstellt</li>
                            <li><strong>Termin bestätigt</strong> - Admin hat Termin bestätigt</li>
                            <li><strong>Termin abgelehnt</strong> - Admin hat Termin abgelehnt</li>
                            <li><strong>Termin storniert</strong> - Kunde hat Termin storniert</li>
                            <li><strong>Termin gelöscht</strong> - Admin hat Termin komplett gelöscht</li>
                            <li><strong>E-Mail an Kunde</strong> - Kunde wurde per E-Mail informiert</li>
                            <li><strong>E-Mail fehlgeschlagen</strong> - E-Mail-Versand ist fehlgeschlagen</li>
                            <li><strong>Erinnerungs-E-Mail</strong> - 24h-Erinnerung wurde versendet</li>
                            <li><strong>Einstellungen geändert</strong> - Admin hat Einstellungen angepasst</li>
                          </ul>
                        </AccordionContent>
                      </AccordionItem>

                      <AccordionItem value="item-11" className="border border-gray-200 bg-white rounded-lg px-3 sm:px-4">
                        <AccordionTrigger className="text-xs sm:text-sm font-medium text-gray-900 hover:no-underline py-2">
                          Wie passe ich das System für das nächste Jahr an?
                        </AccordionTrigger>
                        <AccordionContent className="text-sm text-gray-600 space-y-1.5 pb-2">
                          <p>
                            Das System ist für jährliche Events optimiert. Gehen Sie wie folgt vor:
                          </p>
                          <ol className="list-decimal pl-4 space-y-1 text-xs sm:text-sm">
                            <li>
                              <strong className="text-gray-900">Einstellungen öffnen:</strong> Navigieren Sie zu den 
                              <strong> Einstellungen</strong> im Admin-Panel
                            </li>
                            <li>
                              <strong className="text-gray-900">Event-Jahres-Konfiguration:</strong> Scrollen Sie zur Sektion 
                              "Event-Jahres-Konfiguration"
                            </li>
                            <li>
                              <strong className="text-gray-900">Jahr anpassen:</strong> Tragen Sie das neue Jahr ein (z.B. 2027)
                            </li>
                            <li>
                              <strong className="text-gray-900">Startdatum anpassen:</strong> Tragen Sie das Startdatum ein (Freitag, Format: YYYY-MM-DD)
                            </li>
                            <li>
                              <strong className="text-gray-900">Speichern:</strong> Klicken Sie auf "Einstellungen speichern"
                            </li>
                            <li>
                              <strong className="text-gray-900">Neu laden:</strong> Laden Sie die Seite mit <kbd>Strg+Shift+R</kbd> 
                              (Windows) oder <kbd>Cmd+Shift+R</kbd> (Mac) komplett neu
                            </li>
                          </ol>
                          <p className="bg-yellow-50 border border-yellow-200 rounded-lg p-2 mt-1.5">
                            <strong className="text-yellow-900">Automatische Updates:</strong>
                            <br/>
                            Nach der Anpassung werden automatisch aktualisiert:
                          </p>
                          <ul className="list-disc pl-4 space-y-0.5 text-xs sm:text-sm mt-1">
                            <li>Alle Datumsanzeigen im Buchungsformular</li>
                            <li>E-Mail-Vorlagen mit den neuen Termindaten</li>
                            <li>Admin-Panel Terminübersichten</li>
                            <li>Event-End-Screen Datum (automatisch auf Sonntag + 1 Tag)</li>
                          </ul>
                          <p className="bg-green-50 border border-green-200 rounded-lg p-2 mt-1.5">
                            <strong className="text-green-900">Hinweis:</strong> Alte Termine bleiben erhalten und werden 
                            nicht gelöscht. Sie sehen dann Termine für beide Jahre im System.
                          </p>
                        </AccordionContent>
                      </AccordionItem>
                    </Accordion>
                  </div>

                  <Separator />

                  <div className="bg-green-50 border border-green-200 rounded-xl p-4 sm:p-5">
                    <div className="flex flex-col sm:flex-row items-start gap-3 sm:gap-4">
                      <CheckCircle2 className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <h4 className="text-sm sm:text-base font-semibold text-green-900 mb-2">
                          Weitere Fragen?
                        </h4>
                        <p className="text-xs sm:text-sm text-green-700 leading-relaxed mb-4">
                          Wenn Sie weitere Fragen haben oder Probleme auftreten, wenden Sie sich bitte an die{' '}
                          <a 
                            href="https://www.moroclub.com" 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="font-semibold underline hover:text-green-900 transition-colors"
                          >
                            Agentur MORO
                          </a>.
                        </p>
                        <a href="mailto:info@moro-gmbh.de" className="block">
                          <Button 
                            size="sm" 
                            className="w-full sm:w-auto gap-2 bg-green-600 hover:bg-green-700 text-white whitespace-nowrap text-xs sm:text-sm"
                          >
                            <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                            info@moro-gmbh.de
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>
        </div>
      </Card>
    </div>
  );
}
