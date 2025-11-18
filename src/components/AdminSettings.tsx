import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  X,
  SaveIcon,
  CheckCircle2,
  XCircle,
  Loader2,
  ShieldCheckIcon,
  BellIcon,
  CalendarIcon,
  BuildingIcon,
  ClockIcon,
  MapPinIcon,
  AlertTriangleIcon,
  AlertCircle,
  InfoIcon,
  Trash2,
  RotateCcw,
  XOctagon,
  RefreshCw,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Switch } from './ui/switch';
import { toast } from 'sonner';
import { baseUrl } from '../lib/base-url';
import type { Settings } from '../types/appointments';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog';
import { Separator } from './ui/separator';
import AdminGoogleCalendar from './AdminGoogleCalendar';

const defaultSettings: Settings = {
  companyName: 'MORO',
  companyAddress: 'Eupener Str. 124, 50933 Köln',
  companyPhone: '+49 221 292 40 500',
  companyEmail: 'info@moro-gmbh.de',
  companyWebsite: 'https://www.moroclub.com',
  logoUrl: 'https://cdn.prod.website-files.com/66c5b6f94041a6256d15cfa6/66d86596b9d572660f8b239d_moro-logo.svg',
  primaryColor: '#2d62ff',
  maxAppointmentsPerSlot: 1,
  maxBookingsPerSlot: 1,
  bookingMode: 'manual',
  autoConfirm: false,
  requireApproval: true,
  adminEmail: 'info@moro-gmbh.de',
  emailNotifications: true,
  appointmentDurationMinutes: 30,
  availableDays: {
    friday: true,
    saturday: true,
    sunday: true,
  },
  showSlotIndicator: true,
  messagePlaceholder: 'Ihre Nachricht...',
  preventDuplicateEmail: true,
  standInfo: 'Stand B4.110, Messe München',
  eventLocation: 'Stand B4.110',
  eventHall: 'Messe München',
  eventEnded: false,
  eventEndDate: new Date().toISOString(),
  eventName: 'OPTI',
  eventYear: 2025,
  eventDateFriday: '2025-01-24',
  eventDateSaturday: '2025-01-25',
  eventDateSunday: '2025-01-26',
  maintenanceMode: false,
  maintenanceMessage: 'Das Buchungssystem ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.',
  rateLimitingEnabled: true,
  rateLimitMaxRequests: 5,
  rateLimitWindowMinutes: 15,
};

interface SystemStatus {
  needsAttention: boolean;
  missingRequired: Array<{ name: string; key: string }>;
  googleCalendarStatus: {
    success: boolean;
    error?: string;
  } | null;
}

interface AdminSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AdminSettings({ isOpen, onClose }: AdminSettingsProps) {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [originalSettings, setOriginalSettings] = useState<Settings>(defaultSettings);
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'success' | 'error'>('idle');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  
  // Danger Zone Dialogs
  const [deleteAllDialogOpen, setDeleteAllDialogOpen] = useState(false);
  const [deleteAuditDialogOpen, setDeleteAuditDialogOpen] = useState(false);
  const [resetSettingsDialogOpen, setResetSettingsDialogOpen] = useState(false);
  const [resetAllDialogOpen, setResetAllDialogOpen] = useState(false);
  const [deletingAll, setDeletingAll] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      checkSystemStatus();
    }
  }, [isOpen]);

  // Prüfe auf Änderungen
  useEffect(() => {
    const changed = JSON.stringify(settings) !== JSON.stringify(originalSettings);
    setHasUnsavedChanges(changed);
  }, [settings, originalSettings]);

  const checkSystemStatus = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/admin/system-status`);
      if (response.ok) {
        const data = await response.json();
        setSystemStatus(data);
      }
    } catch (error) {
      console.error('Error checking system status:', error);
    }
  };


  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await Promise.all([
        loadSettings(),
        checkSystemStatus()
      ]);
      toast.success('Einstellungen aktualisiert');
    } catch (error) {
      console.error('Error refreshing:', error);
      toast.error('Fehler beim Aktualisieren');
    } finally {
      setRefreshing(false);
    }
  };

    const loadSettings = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/admin/settings`);
      if (response.ok) {
        const data = await response.json();
        const loadedSettings = { ...defaultSettings, ...data.settings };
        setSettings(loadedSettings);
        setOriginalSettings(loadedSettings);
      }
    } catch (error) {
      console.error('Fehler beim Laden der Einstellungen:', error);
      toast.error('Fehler beim Laden der Einstellungen');
    }
  };

  const saveSettings = async () => {
    setSaveStatus('saving');
    setLoading(true);
    
    try {
      const response = await fetch(`${baseUrl}/api/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings }),
      });

      if (response.ok) {
        setSaveStatus('success');
        setOriginalSettings(settings);
        setHasUnsavedChanges(false);
        setShowUnsavedWarning(false);
        toast.success('Einstellungen erfolgreich gespeichert');
        setTimeout(() => setSaveStatus('idle'), 2000);
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Fehler beim Speichern');
      }
    } catch (error: any) {
      setSaveStatus('error');
      toast.error(error.message || 'Fehler beim Speichern der Einstellungen');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowUnsavedWarning(true);
    } else {
      onClose();
    }
  };

  const cancelChanges = () => {
    setSettings(originalSettings);
    setHasUnsavedChanges(false);
    setShowUnsavedWarning(false);
    onClose();
  };

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const updateNestedSetting = <K extends keyof Settings>(parent: K, key: string, value: any) => {
    setSettings(prev => ({
      ...prev,
      [parent]: {
        ...(prev[parent] as any),
        [key]: value,
      },
    }));
  };

  // Berechne automatisch Samstag und Sonntag basierend auf Freitag
  const handleFridayDateChange = (fridayDate: string) => {
    const friday = new Date(fridayDate);
    
    // Prüfe ob es wirklich ein Freitag ist
    if (friday.getDay() !== 5) {
      toast.error('Bitte wählen Sie einen Freitag als Startdatum');
      return;
    }

    const saturday = new Date(friday);
    saturday.setDate(saturday.getDate() + 1);
    const sunday = new Date(friday);
    sunday.setDate(sunday.getDate() + 2);

    const formatDate = (d: Date) => d.toISOString().split('T')[0];

    setSettings(prev => ({
      ...prev,
      eventDateFriday: fridayDate,
      eventDateSaturday: formatDate(saturday),
      eventDateSunday: formatDate(sunday),
      eventEndDate: new Date(sunday.setHours(23, 59, 59, 999)).toISOString()
    }));
  };

  // Berechne standInfo dynamisch
  useEffect(() => {
    if (settings.eventLocation && settings.eventHall) {
      const newStandInfo = `${settings.eventLocation}, ${settings.eventHall}`;
      if (newStandInfo !== settings.standInfo) {
        setSettings(prev => ({ ...prev, standInfo: newStandInfo }));
      }
    }
  }, [settings.eventLocation, settings.eventHall]);

  // Danger Zone Actions
  const handleDeleteAllAppointments = async () => {
    setDeletingAll(true);
    try {
      const response = await fetch(`${baseUrl}/api/admin/appointments/delete-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        toast.success('Alle Termine wurden gelöscht');
        setDeleteAllDialogOpen(false);
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Fehler beim Löschen');
      }
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Löschen der Termine');
    } finally {
      setDeletingAll(false);
    }
  };

  const handleDeleteAuditLog = async () => {
    setDeletingAll(true);
    try {
      const response = await fetch(`${baseUrl}/api/admin/audit-log/delete-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.ok) {
        toast.success('Audit Log wurde gelöscht');
        setDeleteAuditDialogOpen(false);
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Fehler beim Löschen');
      }
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Löschen des Audit Logs');
    } finally {
      setDeletingAll(false);
    }
  };

  const handleResetSettings = async () => {
    setDeletingAll(true);
    try {
      setSettings(defaultSettings);
      const response = await fetch(`${baseUrl}/api/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: defaultSettings }),
      });

      if (response.ok) {
        setOriginalSettings(defaultSettings);
        setHasUnsavedChanges(false);
        toast.success('Einstellungen wurden zurückgesetzt');
        setResetSettingsDialogOpen(false);
      } else {
        const data = await response.json();
        throw new Error(data.message || 'Fehler beim Zurücksetzen');
      }
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Zurücksetzen der Einstellungen');
    } finally {
      setDeletingAll(false);
    }
  };

  const handleResetAll = async () => {
    setDeletingAll(true);
    try {
      await fetch(`${baseUrl}/api/admin/appointments/delete-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      await fetch(`${baseUrl}/api/admin/audit-log/delete-all`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });

      setSettings(defaultSettings);
      await fetch(`${baseUrl}/api/admin/settings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ settings: defaultSettings }),
      });

      setOriginalSettings(defaultSettings);
      setHasUnsavedChanges(false);
      toast.success('Alles wurde zurückgesetzt');
      setResetAllDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Fehler beim Zurücksetzen');
    } finally {
      setDeletingAll(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={handleClose}
        className="fixed inset-0 bg-black/50 z-50"
        style={{ backdropFilter: 'blur(4px)' }}
      />

      {/* Settings Panel */}
      <motion.div
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="fixed right-0 top-0 bottom-0 w-full max-w-3xl bg-white shadow-2xl z-50 overflow-hidden flex flex-col"
      >
        {/* Header */}
        <div className="flex-shrink-0 bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <AlertTriangleIcon className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-gray-900">Einstellungen</h2>
                <p className="text-sm text-gray-600">
                  System-Konfiguration
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={handleRefresh}
                variant="outline"
                size="icon"
                disabled={refreshing}
                className="rounded-full text-gray-900"
              >
                <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
              <Button
                onClick={handleClose}
                variant="ghost"
                size="icon"
                className="rounded-full text-gray-900"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content - Native Scroll */}
        <div className="flex-1 overflow-y-auto">
          <div className="p-4 sm:p-6 space-y-3">
            {/* System Status Disclaimer */}
            {systemStatus && systemStatus.needsAttention && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-2 border-red-300 bg-red-50 rounded-xl shadow-md">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 bg-red-100 rounded-lg flex-shrink-0">
                        <AlertCircle className="w-5 h-5 text-red-700" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold text-red-900 mb-1">
                          ⚠️ Konfiguration erforderlich
                        </p>
                        <p className="text-xs text-red-800 leading-relaxed mb-2">
                          Das System ist nicht vollständig konfiguriert. Bitte überprüfen Sie die System-Diagnose weiter unten.
                        </p>
                        {systemStatus.missingRequired.length > 0 && (
                          <div className="space-y-1">
                            <p className="text-xs font-semibold text-red-900">Fehlende Umgebungsvariablen:</p>
                            {systemStatus.missingRequired.map(item => (
                              <div key={item.key} className="flex items-start gap-1.5">
                                <span className="text-red-600 font-bold mt-0.5">•</span>
                                <code className="text-xs bg-red-100 px-1.5 py-0.5 rounded text-red-900 font-mono">
                                  {item.key}
                                </code>
                              </div>
                            ))}
                          </div>
                        )}
                        {systemStatus.googleCalendarStatus && !systemStatus.googleCalendarStatus.success && (
                          <div className="mt-2 p-2 bg-red-100 rounded-lg">
                            <p className="text-xs font-semibold text-red-900">Google Calendar Fehler:</p>
                            <p className="text-xs text-red-800">{systemStatus.googleCalendarStatus.error}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Ungespeicherte Änderungen */}
            {hasUnsavedChanges && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Card className="border-yellow-200 bg-yellow-50 rounded-xl">
                  <CardContent className="p-3 sm:p-4">
                    <div className="flex items-start gap-2 sm:gap-3">
                      <AlertTriangleIcon className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 flex-shrink-0 mt-1" />
                      <div className="min-w-0 flex-1">
                        <p className="text-xs sm:text-sm font-semibold text-yellow-900">Ungespeicherte Änderungen</p>
                        <p className="text-xs text-yellow-800 leading-relaxed">
                          Sie haben Änderungen vorgenommen, die noch nicht gespeichert wurden.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            {/* Wartungsmodus Warnung */}
            {settings.maintenanceMode && (
              <Card className="border-orange-200 bg-orange-50 rounded-xl">
                <CardContent className="p-3 sm:p-4">
                  <div className="flex items-start gap-2 sm:gap-3">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-orange-600 flex-shrink-0 mt-1" />
                    <div className="min-w-0 flex-1">
                      <p className="text-xs sm:text-sm font-semibold text-orange-900">Wartungsmodus aktiv</p>
                      <p className="text-xs text-orange-800 leading-relaxed">
                        Das Buchungssystem ist für Nutzer deaktiviert.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Info Card */}
            <Card className="border-blue-200 bg-blue-50 rounded-xl">
              <CardContent className="p-3 sm:p-4">
                <div className="flex items-start gap-2 sm:gap-3">
                  <InfoIcon className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-1" />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs sm:text-sm font-semibold text-blue-900">Hinweis</p>
                    <p className="text-xs text-blue-800 leading-relaxed">
                      Änderungen werden erst nach dem Speichern wirksam. Alle Änderungen werden im Audit-Log protokolliert.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Benachrichtigungen */}
            <Card className="border-gray-200 rounded-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-purple-50 rounded-lg">
                    <BellIcon className="w-4 h-4 text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base text-gray-900">Benachrichtigungen</CardTitle>
                    <CardDescription className="text-xs">E-Mail-Benachrichtigungen konfigurieren</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="adminEmail" className="text-xs font-medium">Admin E-Mail *</Label>
                  <Input
                    id="adminEmail"
                    type="email"
                    value={settings.adminEmail}
                    onChange={(e) => updateSetting('adminEmail', e.target.value)}
                    placeholder="admin@beispiel.de"
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-600">
                    An diese E-Mail-Adresse werden Buchungsbenachrichtigungen gesendet
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between py-1">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium">E-Mail-Benachrichtigungen</Label>
                    <p className="text-xs text-gray-600">
                      Benachrichtigungen bei neuen Terminanfragen
                    </p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => updateSetting('emailNotifications', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Sicherheit & Buchungen */}
            <Card className="border-gray-200 rounded-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-green-50 rounded-lg">
                    <ShieldCheckIcon className="w-4 h-4 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base text-gray-900">Sicherheit & Buchungen</CardTitle>
                    <CardDescription className="text-xs">Buchungseinstellungen und Sicherheitsoptionen</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-1">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium">Automatische Bestätigung</Label>
                    <p className="text-xs text-gray-600">
                      {settings.autoConfirm 
                        ? 'Termine werden sofort bestätigt' 
                        : 'Termine müssen manuell vom Admin bestätigt werden'}
                    </p>
                  </div>
                  <Switch
                    checked={settings.autoConfirm}
                    onCheckedChange={(checked) => updateSetting('autoConfirm', checked)}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between py-1">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium">Doppelbuchungen verhindern</Label>
                    <p className="text-xs text-gray-600">
                      Verhindert mehrere Buchungen mit derselben E-Mail
                    </p>
                  </div>
                  <Switch
                    checked={settings.preventDuplicateEmail}
                    onCheckedChange={(checked) => updateSetting('preventDuplicateEmail', checked)}
                  />
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <Label htmlFor="maxAppointments" className="text-xs font-medium">Max. Termine pro Zeitslot</Label>
                  <Input
                    id="maxAppointments"
                    type="number"
                    min="1"
                    max="50"
                    value={settings.maxAppointmentsPerSlot}
                    onChange={(e) => updateSetting('maxAppointmentsPerSlot', parseInt(e.target.value))}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-600">
                    Wie viele Personen können denselben Zeitslot buchen
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between py-1">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium">Slot-Indikator anzeigen</Label>
                    <p className="text-xs text-gray-600">
                      Zeigt verfügbare Plätze im Zeitslot an
                    </p>
                  </div>
                  <Switch
                    checked={settings.showSlotIndicator}
                    onCheckedChange={(checked) => updateSetting('showSlotIndicator', checked)}
                  />
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <Label htmlFor="messagePlaceholder" className="text-xs font-medium">Nachrichten-Platzhalter</Label>
                  <Input
                    id="messagePlaceholder"
                    value={settings.messagePlaceholder}
                    onChange={(e) => updateSetting('messagePlaceholder', e.target.value)}
                    placeholder="Ihre Nachricht..."
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-600">
                    Platzhalter-Text für das Nachrichtenfeld im Buchungsformular
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Event-Konfiguration */}
            <Card className="border-gray-200 rounded-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-blue-50 rounded-lg">
                    <CalendarIcon className="w-4 h-4 text-blue-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base text-gray-900">Event-Konfiguration</CardTitle>
                    <CardDescription className="text-xs">Name, Jahr und Zeitraum Ihres Events</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="eventName" className="text-xs font-medium">Event-Name *</Label>
                  <Input
                    id="eventName"
                    value={settings.eventName || ''}
                    onChange={(e) => updateSetting('eventName', e.target.value)}
                    placeholder="OPTI"
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-600">
                    Z.B. "OPTI" wird mit dem Jahr kombiniert zu "OPTI 25"
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="eventYear" className="text-xs font-medium">Event-Jahr *</Label>
                  <Input
                    id="eventYear"
                    type="number"
                    min="2024"
                    max="2100"
                    value={settings.eventYear}
                    onChange={(e) => updateSetting('eventYear', parseInt(e.target.value))}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-600">
                    Wird für die Anzeige verwendet (z.B. "OPTI 25")
                  </p>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <Label htmlFor="eventDateFriday" className="text-xs font-medium">Startdatum (Freitag) *</Label>
                  <Input
                    id="eventDateFriday"
                    type="date"
                    value={settings.eventDateFriday || ''}
                    onChange={(e) => handleFridayDateChange(e.target.value)}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-600">
                    Wählen Sie einen Freitag - Samstag und Sonntag werden automatisch berechnet
                  </p>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <Label htmlFor="appointmentDuration" className="text-xs font-medium">Termindauer (Minuten) *</Label>
                  <Input
                    id="appointmentDuration"
                    type="number"
                    min="5"
                    max="240"
                    step="5"
                    value={settings.appointmentDurationMinutes}
                    onChange={(e) => updateSetting('appointmentDurationMinutes', parseInt(e.target.value))}
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-600">
                    Jeder Termin dauert standardmäßig {settings.appointmentDurationMinutes} Minuten
                  </p>
                </div>

                <Separator />

                <div className="flex items-center justify-between py-1">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium">Event manuell beenden</Label>
                    <p className="text-xs text-gray-600">
                      Zeigt Event-Ende-Bildschirm an
                    </p>
                  </div>
                  <Switch
                    checked={settings.eventEnded}
                    onCheckedChange={(checked) => updateSetting('eventEnded', checked)}
                  />
                </div>

                {!settings.eventEnded && (
                  <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-xs text-blue-900">
                    <InfoIcon className="h-3.5 w-3.5 inline mr-1.5" />
                    Event endet automatisch am Sonntag um 23:59 Uhr
                  </div>
                )}

                {settings.eventEnded && (
                  <div className="p-2.5 bg-orange-50 border border-orange-200 rounded-lg text-xs text-orange-900">
                    <AlertCircle className="h-3.5 w-3.5 inline mr-1.5" />
                    <strong>Event beendet:</strong> Nutzer sehen den Event-Ende-Bildschirm
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Verfügbare Tage */}
            <Card className="border-gray-200 rounded-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-cyan-50 rounded-lg">
                    <ClockIcon className="w-4 h-4 text-cyan-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base text-gray-900">Verfügbare Tage</CardTitle>
                    <CardDescription className="text-xs">An welchen Tagen können Termine gebucht werden?</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 pt-4">
                <div className="flex items-center justify-between p-2.5 border rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <Label htmlFor="dayFriday" className="text-sm cursor-pointer font-medium">Freitag</Label>
                    {settings.eventDateFriday && (
                      <p className="text-xs text-gray-600">{new Date(settings.eventDateFriday).toLocaleDateString('de-DE')}</p>
                    )}
                  </div>
                  <Switch
                    id="dayFriday"
                    checked={settings.availableDays.friday}
                    onCheckedChange={(checked) => updateNestedSetting('availableDays', 'friday', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 border rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <Label htmlFor="daySaturday" className="text-sm cursor-pointer font-medium">Samstag</Label>
                    {settings.eventDateSaturday && (
                      <p className="text-xs text-gray-600">{new Date(settings.eventDateSaturday).toLocaleDateString('de-DE')}</p>
                    )}
                  </div>
                  <Switch
                    id="daySaturday"
                    checked={settings.availableDays.saturday}
                    onCheckedChange={(checked) => updateNestedSetting('availableDays', 'saturday', checked)}
                  />
                </div>

                <div className="flex items-center justify-between p-2.5 border rounded-lg bg-gray-50">
                  <div className="flex-1">
                    <Label htmlFor="daySunday" className="text-sm cursor-pointer font-medium">Sonntag</Label>
                    {settings.eventDateSunday && (
                      <p className="text-xs text-gray-600">{new Date(settings.eventDateSunday).toLocaleDateString('de-DE')}</p>
                    )}
                  </div>
                  <Switch
                    id="daySunday"
                    checked={settings.availableDays.sunday}
                    onCheckedChange={(checked) => updateNestedSetting('availableDays', 'sunday', checked)}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Firmendaten */}
            <Card className="border-gray-200 rounded-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-orange-50 rounded-lg">
                    <BuildingIcon className="w-4 h-4 text-orange-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base text-gray-900">Firmendaten</CardTitle>
                    <CardDescription className="text-xs">Ihre Kontaktinformationen und Logo</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="companyName" className="text-xs font-medium">Firmenname *</Label>
                  <Input
                    id="companyName"
                    value={settings.companyName}
                    onChange={(e) => updateSetting('companyName', e.target.value)}
                    placeholder="MORO"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="logoUrl" className="text-xs font-medium">Logo URL</Label>
                  <Input
                    id="logoUrl"
                    type="url"
                    value={settings.logoUrl || ''}
                    onChange={(e) => updateSetting('logoUrl', e.target.value)}
                    placeholder="https://example.com/logo.svg"
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-600">
                    URL zu Ihrem Firmenlogo (wird im Buchungsformular angezeigt)
                  </p>
                </div>

                <Separator />

                <div className="space-y-1.5">
                  <Label htmlFor="companyEmail" className="text-xs font-medium">Firmen-E-Mail *</Label>
                  <Input
                    id="companyEmail"
                    type="email"
                    value={settings.companyEmail}
                    onChange={(e) => updateSetting('companyEmail', e.target.value)}
                    placeholder="info@moro-gmbh.de"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="companyPhone" className="text-xs font-medium">Telefonnummer *</Label>
                  <Input
                    id="companyPhone"
                    type="tel"
                    value={settings.companyPhone}
                    onChange={(e) => updateSetting('companyPhone', e.target.value)}
                    placeholder="+49 221 292 40 500"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="companyAddress" className="text-xs font-medium">Adresse *</Label>
                  <Input
                    id="companyAddress"
                    value={settings.companyAddress}
                    onChange={(e) => updateSetting('companyAddress', e.target.value)}
                    placeholder="Eupener Str. 124, 50933 Köln"
                    className="text-sm"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="companyWebsite" className="text-xs font-medium">Website</Label>
                  <Input
                    id="companyWebsite"
                    type="url"
                    value={settings.companyWebsite || ''}
                    onChange={(e) => updateSetting('companyWebsite', e.target.value)}
                    placeholder="https://www.moroclub.com"
                    className="text-sm"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Event-Standort */}
            <Card className="border-gray-200 rounded-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-50 rounded-lg">
                    <MapPinIcon className="w-4 h-4 text-red-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base text-gray-900">Event-Standort</CardTitle>
                    <CardDescription className="text-xs">Wo findet Ihr Event statt?</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1.5">
                  <Label htmlFor="eventLocation" className="text-xs font-medium">Standort *</Label>
                  <Input
                    id="eventLocation"
                    value={settings.eventLocation || ''}
                    onChange={(e) => updateSetting('eventLocation', e.target.value)}
                    placeholder="Stand B4.110"
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-600">
                    Z.B. Stand-Nummer oder Raum
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="eventHall" className="text-xs font-medium">Halle/Gebäude *</Label>
                  <Input
                    id="eventHall"
                    value={settings.eventHall || ''}
                    onChange={(e) => updateSetting('eventHall', e.target.value)}
                    placeholder="Messe München"
                    className="text-sm"
                  />
                  <p className="text-xs text-gray-600">
                    Z.B. Messehalle oder Gebäudename
                  </p>
                </div>

                {settings.eventLocation && settings.eventHall && (
                  <div className="p-2.5 bg-gray-50 border border-gray-200 rounded-lg">
                    <p className="text-xs text-gray-600 mb-1">Vollständige Stand-Info (automatisch):</p>
                    <p className="text-sm font-medium text-gray-900">{settings.standInfo}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Erweiterte Einstellungen */}
            <Card className="border-gray-200 rounded-xl">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-yellow-50 rounded-lg">
                    <AlertTriangleIcon className="w-4 h-4 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base text-gray-900">Erweiterte Einstellungen</CardTitle>
                    <CardDescription className="text-xs">Rate Limiting und Wartungsmodus</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between py-1">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium">Rate Limiting aktivieren</Label>
                    <p className="text-xs text-gray-600">
                      Schützt vor zu vielen Anfragen
                    </p>
                  </div>
                  <Switch
                    checked={settings.rateLimitingEnabled}
                    onCheckedChange={(checked) => updateSetting('rateLimitingEnabled', checked)}
                  />
                </div>

                {settings.rateLimitingEnabled && (
                  <>
                    <Separator />

                    <div className="space-y-1.5">
                      <Label htmlFor="rateLimitMax" className="text-xs font-medium">Max. Anfragen</Label>
                      <Input
                        id="rateLimitMax"
                        type="number"
                        min="1"
                        max="50"
                        value={settings.rateLimitMaxRequests}
                        onChange={(e) => updateSetting('rateLimitMaxRequests', parseInt(e.target.value))}
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-600">
                        Maximal {settings.rateLimitMaxRequests} Anfragen erlaubt
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="rateLimitWindow" className="text-xs font-medium">Zeitfenster (Minuten)</Label>
                      <Input
                        id="rateLimitWindow"
                        type="number"
                        min="1"
                        max="60"
                        value={settings.rateLimitWindowMinutes}
                        onChange={(e) => updateSetting('rateLimitWindowMinutes', parseInt(e.target.value))}
                        className="text-sm"
                      />
                      <p className="text-xs text-gray-600">
                        Innerhalb von {settings.rateLimitWindowMinutes} Minuten
                      </p>
                    </div>
                  </>
                )}

                <Separator />

                <div className="flex items-center justify-between py-1">
                  <div className="space-y-0.5">
                    <Label className="text-xs font-medium">Wartungsmodus</Label>
                    <p className="text-xs text-gray-600">
                      Deaktiviert das Buchungssystem vorübergehend
                    </p>
                  </div>
                  <Switch
                    checked={settings.maintenanceMode}
                    onCheckedChange={(checked) => updateSetting('maintenanceMode', checked)}
                  />
                </div>

                {settings.maintenanceMode && (
                  <>
                    <Separator />

                    <div className="space-y-1.5">
                      <Label htmlFor="maintenanceMessage" className="text-xs font-medium">Wartungsnachricht</Label>
                      <Input
                        id="maintenanceMessage"
                        value={settings.maintenanceMessage || ''}
                        onChange={(e) => updateSetting('maintenanceMessage', e.target.value)}
                        placeholder="Das Buchungssystem ist vorübergehend nicht verfügbar."
                        className="text-sm"
                      />
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Google Calendar Integration - VEREINFACHT */}
            <AdminGoogleCalendar />

            {/* Gefahrenbereich */}
            <Card className="border-red-300 bg-red-50 rounded-xl mt-4">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-red-100 rounded-lg">
                    <XOctagon className="w-4 h-4 text-red-700" />
                  </div>
                  <div className="flex-1">
                    <CardTitle className="text-base text-red-900">Gefahrenbereich</CardTitle>
                    <CardDescription className="text-xs text-red-700">
                      Vorsicht: Diese Aktionen können nicht rückgängig gemacht werden!
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* Alle Termine löschen */}
                <Card className="border-red-200 rounded-lg">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Trash2 className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0 space-y-3">
                        <div>
                          <h4 className="text-sm font-semibold text-red-900 mb-1">Alle Termine löschen</h4>
                          <p className="text-xs text-red-700 leading-relaxed">
                            Löscht <strong>alle Termine</strong> permanent aus der Datenbank. 
                            Dies betrifft bestätigte, ausstehende und stornierte Termine.
                          </p>
                        </div>
                        <Button
                          onClick={() => setDeleteAllDialogOpen(true)}
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-700 hover:bg-red-100 text-xs"
                        >
                          <Trash2 className="w-3 h-3 mr-1.5" />
                          Alle Termine löschen
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Audit Log löschen */}
                <Card className="border-red-200 rounded-lg">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Trash2 className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0 space-y-3">
                        <div>
                          <h4 className="text-sm font-semibold text-red-900 mb-1">Audit Log löschen</h4>
                          <p className="text-xs text-red-700 leading-relaxed">
                            Löscht <strong>alle Einträge</strong> aus dem Audit Log. 
                            Die komplette Historie aller Admin-Aktionen geht verloren.
                          </p>
                        </div>
                        <Button
                          onClick={() => setDeleteAuditDialogOpen(true)}
                          variant="outline"
                          size="sm"
                          className="border-red-300 text-red-700 hover:bg-red-100 text-xs"
                        >
                          <Trash2 className="w-3 h-3 mr-1.5" />
                          Audit Log löschen
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Einstellungen zurücksetzen */}
                <Card className="border-orange-200 bg-orange-50 rounded-lg">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <RotateCcw className="w-4 h-4 text-orange-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0 space-y-3">
                        <div>
                          <h4 className="text-sm font-semibold text-orange-900 mb-1">Einstellungen zurücksetzen</h4>
                          <p className="text-xs text-orange-700 leading-relaxed">
                            Setzt <strong>alle Einstellungen</strong> auf die Standardwerte zurück. 
                            Ihre aktuellen Konfigurationen gehen verloren.
                          </p>
                        </div>
                        <Button
                          onClick={() => setResetSettingsDialogOpen(true)}
                          variant="outline"
                          size="sm"
                          className="border-orange-300 text-orange-700 hover:bg-orange-100 text-xs"
                        >
                          <RotateCcw className="w-3 h-3 mr-1.5" />
                          Einstellungen zurücksetzen
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* ALLES ZURÜCKSETZEN */}
                <Card className="border-red-400 bg-red-100 rounded-lg">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <XOctagon className="w-4 h-4 text-red-800 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0 space-y-3">
                        <div>
                          <h4 className="text-sm font-bold text-red-900 mb-2">⚠️ ALLES ZURÜCKSETZEN</h4>
                          <p className="text-xs text-red-800 mb-2">
                            <strong>WARNUNG:</strong> Diese Aktion löscht:
                          </p>
                          <ul className="text-xs text-red-800 list-disc list-inside space-y-0.5 mb-2">
                            <li>Alle Termine (bestätigt, ausstehend, storniert)</li>
                            <li>Alle Audit Log Einträge</li>
                            <li>Alle Einstellungen (zurück auf Standard)</li>
                          </ul>
                          <p className="text-xs text-red-900 font-semibold">
                            Diese Aktion kann NICHT rückgängig gemacht werden!
                          </p>
                        </div>
                        <Button
                          onClick={() => setResetAllDialogOpen(true)}
                          variant="outline"
                          size="sm"
                          className="border-red-500 text-red-900 hover:bg-red-200 font-semibold text-xs"
                        >
                          <XOctagon className="w-3 h-3 mr-1.5" />
                          ALLES ZURÜCKSETZEN
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Footer - Sticky am Bottom */}
        <div className="flex-shrink-0 bg-white border-t border-gray-200 px-4 sm:px-6 py-4 shadow-[0_-4px_12px_rgba(0,0,0,0.08)]">
          <div className="flex gap-3">
            <Button
              onClick={cancelChanges}
              variant="outline"
              size="lg"
              className="flex-1 rounded-xl text-gray-900"
            >
              <X className="mr-2 h-4 w-4" />
              Abbrechen
            </Button>
            <Button
              onClick={saveSettings}
              disabled={loading || !hasUnsavedChanges}
              size="lg"
              className="flex-1 rounded-xl"
            >
              {saveStatus === 'saving' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {saveStatus === 'success' && <CheckCircle2 className="mr-2 h-4 w-4" />}
              {saveStatus === 'error' && <XCircle className="mr-2 h-4 w-4" />}
              {saveStatus === 'idle' && <SaveIcon className="mr-2 h-4 w-4" />}
              {saveStatus === 'idle' && 'Speichern'}
              {saveStatus === 'saving' && 'Speichert...'}
              {saveStatus === 'success' && 'Gespeichert!'}
              {saveStatus === 'error' && 'Fehler'}
            </Button>
          </div>
        </div>
      </motion.div>

      {/* Unsaved Changes Dialog */}
      <AlertDialog open={showUnsavedWarning} onOpenChange={setShowUnsavedWarning}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Ungespeicherte Änderungen</AlertDialogTitle>
            <AlertDialogDescription>
              Sie haben Änderungen vorgenommen, die noch nicht gespeichert wurden. 
              Möchten Sie die Einstellungen wirklich ohne Speichern schließen?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowUnsavedWarning(false)} className="rounded-xl">
              Zurück zu Einstellungen
            </AlertDialogCancel>
            <AlertDialogAction onClick={cancelChanges} className="bg-red-600 hover:bg-red-700 rounded-xl">
              Ohne Speichern schließen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Danger Zone Dialogs - Verbessert */}
      <AlertDialog open={deleteAllDialogOpen} onOpenChange={setDeleteAllDialogOpen}>
        <AlertDialogContent className="rounded-2xl max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-900 flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="h-5 w-5 text-red-700" />
              </div>
              Alle Termine löschen?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p className="text-sm text-gray-700 font-medium">Diese Aktion löscht unwiderruflich:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-red-600 font-bold mt-0.5">•</span>
                  <span><strong className="text-gray-900">Alle bestätigten Termine</strong> – Termine, die bereits zugesagt wurden</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-red-600 font-bold mt-0.5">•</span>
                  <span><strong className="text-gray-900">Alle ausstehenden Termine</strong> – Termine, die noch auf Bestätigung warten</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-red-600 font-bold mt-0.5">•</span>
                  <span><strong className="text-gray-900">Alle stornierten Termine</strong> – Bereits abgesagte Termine</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-red-600 font-bold mt-0.5">•</span>
                  <span><strong className="text-gray-900">Google Calendar Einträge</strong> – Falls synchronisiert</span>
                </li>
              </ul>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-3">
                <p className="text-red-900 font-bold text-sm">⚠️ Diese Aktion kann nicht rückgängig gemacht werden!</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAllAppointments}
              disabled={deletingAll}
              className="bg-red-600 hover:bg-red-700 rounded-xl"
            >
              {deletingAll ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Alle Termine löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={deleteAuditDialogOpen} onOpenChange={setDeleteAuditDialogOpen}>
        <AlertDialogContent className="rounded-2xl max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-900 flex items-center gap-2">
              <div className="p-2 bg-red-100 rounded-lg">
                <Trash2 className="h-5 w-5 text-red-700" />
              </div>
              Audit Log löschen?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p className="text-sm text-gray-700 font-medium">Diese Aktion löscht unwiderruflich:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-red-600 font-bold mt-0.5">•</span>
                  <span><strong className="text-gray-900">Komplette Aktionshistorie</strong> – Alle protokollierten Admin-Aktionen</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-red-600 font-bold mt-0.5">•</span>
                  <span><strong className="text-gray-900">Änderungsprotokolle</strong> – Wer hat was wann geändert</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-red-600 font-bold mt-0.5">•</span>
                  <span><strong className="text-gray-900">E-Mail-Versand-Historie</strong> – Protokoll aller versendeten E-Mails</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-red-600 font-bold mt-0.5">•</span>
                  <span><strong className="text-gray-900">Fehlerprotokolle</strong> – Aufgezeichnete Fehler und Probleme</span>
                </li>
              </ul>
              <div className="bg-red-50 border border-red-200 rounded-xl p-3 mt-3">
                <p className="text-red-900 font-bold text-sm">⚠️ Die komplette Nachvollziehbarkeit geht verloren!</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAuditLog}
              disabled={deletingAll}
              className="bg-red-600 hover:bg-red-700 rounded-xl"
            >
              {deletingAll ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Trash2 className="w-4 h-4 mr-2" />}
              Audit Log löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetSettingsDialogOpen} onOpenChange={setResetSettingsDialogOpen}>
        <AlertDialogContent className="rounded-2xl max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-orange-900 flex items-center gap-2">
              <div className="p-2 bg-orange-100 rounded-lg">
                <RotateCcw className="h-5 w-5 text-orange-700" />
              </div>
              Einstellungen zurücksetzen?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <p className="text-sm text-gray-700 font-medium">Diese Aktion setzt zurück:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-orange-600 font-bold mt-0.5">•</span>
                  <span><strong className="text-gray-900">Alle Firmendaten</strong> – Name, Adresse, Kontaktdaten</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-orange-600 font-bold mt-0.5">•</span>
                  <span><strong className="text-gray-900">Event-Konfiguration</strong> – Name, Datum, Standort</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-orange-600 font-bold mt-0.5">•</span>
                  <span><strong className="text-gray-900">Buchungseinstellungen</strong> – Auto-Bestätigung, Limits, Sicherheit</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-orange-600 font-bold mt-0.5">•</span>
                  <span><strong className="text-gray-900">Design-Anpassungen</strong> – Logo, Branding</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-orange-600 font-bold mt-0.5">•</span>
                  <span><strong className="text-gray-900">Erweiterte Einstellungen</strong> – Rate Limiting, Wartungsmodus</span>
                </li>
              </ul>
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-3 mt-3">
                <p className="text-orange-900 font-bold text-sm">Ihre Termine und das Audit Log bleiben erhalten.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetSettings}
              disabled={deletingAll}
              className="bg-orange-600 hover:bg-orange-700 rounded-xl"
            >
              {deletingAll ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <RotateCcw className="w-4 h-4 mr-2" />}
              Einstellungen zurücksetzen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={resetAllDialogOpen} onOpenChange={setResetAllDialogOpen}>
        <AlertDialogContent className="rounded-2xl max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-900 flex items-center gap-2">
              <div className="p-2 bg-red-200 rounded-lg">
                <XOctagon className="h-5 w-5 text-red-800" />
              </div>
              ⚠️ ALLES ZURÜCKSETZEN?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <div className="bg-red-100 border-2 border-red-400 rounded-xl p-3">
                <p className="text-red-900 font-bold text-base">KRITISCHE WARNUNG!</p>
                <p className="text-red-800 text-sm mt-1">Diese Aktion löscht das komplette System zurück auf Werkseinstellungen.</p>
              </div>
              
              <p className="text-sm text-gray-700 font-medium">Es werden unwiderruflich gelöscht:</p>
              <ul className="space-y-2">
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-red-600 font-bold mt-0.5">•</span>
                  <span><strong className="text-gray-900">ALLE TERMINE</strong> – Bestätigt, ausstehend und storniert</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-red-600 font-bold mt-0.5">•</span>
                  <span><strong className="text-gray-900">KOMPLETTES AUDIT LOG</strong> – Gesamte Aktionshistorie</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-red-600 font-bold mt-0.5">•</span>
                  <span><strong className="text-gray-900">ALLE EINSTELLUNGEN</strong> – Zurück auf Standardwerte</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-red-600 font-bold mt-0.5">•</span>
                  <span><strong className="text-gray-900">GOOGLE CALENDAR EVENTS</strong> – Falls synchronisiert</span>
                </li>
                <li className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-red-600 font-bold mt-0.5">•</span>
                  <span><strong className="text-gray-900">ALLE KUNDENDATEN</strong> – Namen, E-Mails, Nachrichten</span>
                </li>
              </ul>
              
              <div className="bg-red-50 border-2 border-red-300 rounded-xl p-3 mt-3">
                <p className="text-red-900 font-bold text-sm">🚨 DIESE AKTION KANN NICHT RÜCKGÄNGIG GEMACHT WERDEN!</p>
                <p className="text-red-800 text-xs mt-1">Das System wird in den Zustand wie nach der ersten Installation versetzt.</p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="rounded-xl">Abbrechen</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleResetAll}
              disabled={deletingAll}
              className="bg-red-700 hover:bg-red-800 rounded-xl"
            >
              {deletingAll ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <XOctagon className="w-4 h-4 mr-2" />}
              ALLES LÖSCHEN
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
