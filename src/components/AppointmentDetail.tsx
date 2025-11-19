import { getEventName } from '../lib/event-config';
import { getDayName } from '../lib/event-config';
import { useState, useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';
import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Mail,
  Phone,
  Building2,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertCircle,
  AlertTriangle,
  Globe,
  Loader2,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Separator } from './ui/separator';
import { Badge } from './ui/badge';
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
import { toast } from 'sonner';
import { baseUrl } from '../lib/base-url';
import AppointmentQRCode from './AppointmentQRCode';

interface Appointment {
  id: string;
  day: string;
  time: string;
  appointmentDate: string;
  name: string;
  company?: string;
  phone: string;
  email: string;
  message?: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  createdAt: string;
  googleEventId?: string;
}

interface AppSettings {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  companyWebsite: string;
  logoUrl: string;
  eventLocation: string;
  eventHall: string;
}

const DAY_NAMES_FULL: Record<string, string> = {
  friday: getDayName('friday'),
  saturday: getDayName('saturday'),
  sunday: getDayName('sunday'),
};

// Default Settings als Fallback
const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'MORO',
  companyEmail: 'info@moro-gmbh.de',
  companyPhone: '+49 221 292 40 500',
  companyAddress: 'Eupener Str. 124, 50933 Köln',
  companyWebsite: 'https://www.moroclub.com',
  logoUrl: 'https://cdn.prod.website-files.com/66c5b6f94041a6256d15cfa6/66d86596b9d572660f8b239d_moro-logo.svg',
  eventLocation: 'Stand B4.110',
  eventHall: 'Messe München',
};

export default function AppointmentDetail({ appointmentId }: { appointmentId: string }) {
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [notFoundDialogOpen, setNotFoundDialogOpen] = useState(false);

  useEffect(() => {
    fetchAppointment();
    fetchSettings();
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/appointment/${appointmentId}`);
      if (!response.ok) {
        throw new Error('Termin nicht gefunden');
      }
      const data: any = await response.json();
      setAppointment(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten');
      setNotFoundDialogOpen(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/admin/settings`);
      if (response.ok) {
        const data: any = await response.json();
        setSettings({
          companyName: data.settings.companyName || DEFAULT_SETTINGS.companyName,
          companyEmail: data.settings.companyEmail || DEFAULT_SETTINGS.companyEmail,
          companyPhone: data.settings.companyPhone || DEFAULT_SETTINGS.companyPhone,
          companyAddress: data.settings.companyAddress || DEFAULT_SETTINGS.companyAddress,
          companyWebsite: data.settings.companyWebsite || DEFAULT_SETTINGS.companyWebsite,
          logoUrl: data.settings.logoUrl || DEFAULT_SETTINGS.logoUrl,
          eventLocation: data.settings.eventLocation || DEFAULT_SETTINGS.eventLocation,
          eventHall: data.settings.eventHall || DEFAULT_SETTINGS.eventHall,
        });
      }
    } catch (err) {
      console.error('Error loading settings, using defaults:', err);
      // Defaults sind bereits gesetzt
    }
  };

  const handleCancelAppointment = async () => {
    if (!appointment) return;

    setCancelling(true);
    try {
      const response = await fetch(`${baseUrl}/api/appointment/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: appointment.id }),
      });

      if (!response.ok) {
        throw new Error('Stornierung fehlgeschlagen');
      }

      toast.success('Termin erfolgreich storniert');
      setCancelled(true);
      setCancelDialogOpen(false);
      
      // Termin neu laden
      await fetchAppointment();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Fehler beim Stornieren');
    } finally {
      setCancelling(false);
    }
  };

  const safeFormatDate = (dateString: string, formatStr: string) => {
    try {
      if (!dateString) return 'Ungültiges Datum';
      const date = parseISO(dateString);
      if (isNaN(date.getTime())) return 'Ungültiges Datum';
      return format(date, formatStr, { locale: de });
    } catch {
      return 'Ungültiges Datum';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'cancelled':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'pending':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed':
        return <CheckCircle2 className="w-4 h-4" />;
      case 'cancelled':
        return <XCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      default:
        return <AlertCircle className="w-4 h-4" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Bestätigt';
      case 'cancelled':
        return 'Storniert';
      case 'pending':
        return 'Ausstehend';
      default:
        return status;
    }
  };

  // Dynamische Überschrift basierend auf Status - zweizeilig
  const getTitleLines = () => {
    const eventName = getEventName(); // ✅ Nutze zentrale Funktion
    
    if (appointment?.status === 'pending') {
      return {
        mainLine: 'Ihre Terminanfrage',
        subLine: `für die ${eventName}`
      };
    }
    return {
      mainLine: 'Ihr Termin',
      subLine: `auf der ${eventName}`
    };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'transparent' }}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Termin wird geladen...</p>
        </div>
      </div>
    );
  }

  if (error || !appointment) {
    return (
      <>
        <div className="min-h-screen flex items-center justify-center p-4" style={{ background: 'transparent' }}>
          {/* Unsichtbarer Platzhalter */}
        </div>

        {/* "Not Found" Dialog - im gleichen Stil wie andere AlertDialogs */}
        <AlertDialog open={notFoundDialogOpen} onOpenChange={setNotFoundDialogOpen}>
          <AlertDialogContent className="rounded-2xl border-0 shadow-2xl bg-white max-w-md mx-4">
            <AlertDialogHeader>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-3 bg-red-50 rounded-xl">
                  <XCircle className="w-6 h-6 text-red-600" />
                </div>
                <AlertDialogTitle className="text-xl text-gray-900">Termin nicht gefunden</AlertDialogTitle>
              </div>
              <AlertDialogDescription className="text-sm text-gray-600 leading-relaxed">
                {error || 'Der angeforderte Termin existiert nicht oder wurde gelöscht.'}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter className="gap-2 sm:gap-2">
              <AlertDialogAction
                onClick={() => (window.location.href = `${baseUrl}/`)}
                className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl w-full"
              >
                Zurück zur Startseite
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </>
    );
  }

  const titleLines = getTitleLines();

  // Helper: Calculate end time (30 minutes after start)
  const getEndTime = (startTime: string): string => {
    const [hours, minutes] = startTime.split(':').map(Number);
    const endDate = new Date();
    endDate.setHours(hours, minutes + 30, 0, 0);
    return `${String(endDate.getHours()).padStart(2, '0')}:${String(endDate.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen p-4 md:p-8" style={{ background: 'transparent' }}>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-3xl mx-auto space-y-6"
      >
        {/* Termin Details Card */}
        <Card className="shadow-2xl border-0 overflow-hidden bg-white" style={{ borderRadius: '1.5rem' }}>
          <CardHeader className="pb-6 pt-8 px-6 bg-gradient-to-br from-blue-600 to-blue-700" style={{ borderRadius: '1.5rem 1.5rem 0 0' }}>
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div className="flex-1">
                <CardTitle className="text-white leading-tight">
                  <div className="text-3xl md:text-4xl font-bold mb-1">
                    {titleLines.mainLine}
                  </div>
                  <div className="text-xl md:text-2xl font-normal opacity-90">
                    {titleLines.subLine}
                  </div>
                </CardTitle>
              </div>
              <Badge
                variant="secondary"
                className={`${getStatusColor(appointment.status)} flex items-center gap-2 px-3 py-2 text-sm font-semibold border self-start`}
                style={{ flexShrink: 0 }}
              >
                {getStatusIcon(appointment.status)}
                <span className="whitespace-nowrap">{getStatusText(appointment.status)}</span>
              </Badge>
            </div>
          </CardHeader>

          <CardContent className="p-6">
            {/* Pending Disclaimer */}
            {appointment.status === 'pending' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-2 border-yellow-300 rounded-2xl p-5 mb-6 shadow-sm"
              >
                <div className="flex gap-4">
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 bg-yellow-200 rounded-full flex items-center justify-center">
                      <Clock className="w-6 h-6 text-yellow-700" />
                    </div>
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-yellow-900 mb-2">
                      Termin noch nicht bestätigt
                    </h3>
                    <p className="text-sm text-yellow-800 leading-relaxed">
                      Ihre Terminanfrage wird geprüft und Sie erhalten in Kürze eine Bestätigung per E-Mail. 
                      Der Termin ist erst nach der Bestätigung verbindlich.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Stornierungshinweis */}
            {appointment.status === 'cancelled' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6"
              >
                <div className="flex gap-3">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-red-900 mb-1">Termin storniert</h3>
                    <p className="text-xs text-red-700">
                      Dieser Termin wurde storniert und ist nicht mehr gültig.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Erfolgreiche Stornierung */}
            {cancelled && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="bg-green-50 border border-green-200 rounded-xl p-4 mb-6"
              >
                <div className="flex gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-semibold text-green-900 mb-1">Stornierung erfolgreich</h3>
                    <p className="text-xs text-green-700">
                      Ihr Termin wurde erfolgreich storniert. Sie erhalten in Kürze eine Bestätigungs-E-Mail.
                    </p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Termin-Details Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 mb-0.5">Datum</p>
                  <p className="text-sm font-bold text-gray-900 truncate">
                    {safeFormatDate(appointment.appointmentDate, 'dd. MMM yyyy')}
                  </p>
                  <p className="text-xs text-gray-600">{DAY_NAMES_FULL[appointment.day]}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                  <Clock className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 mb-0.5">Uhrzeit</p>
                  <p className="text-sm font-bold text-gray-900">{appointment.time} Uhr</p>
                  <p className="text-xs text-gray-600">30 Minuten</p>
                </div>
              </div>

              <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-xl">
                <div className="p-2 bg-blue-50 rounded-lg flex-shrink-0">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 mb-0.5">Ort</p>
                  <p className="text-sm font-bold text-gray-900 truncate">{settings.eventLocation}</p>
                  <p className="text-xs text-gray-600 truncate">{settings.eventHall}</p>
                </div>
              </div>
            </div>

            <Separator className="my-6" />

            {/* Kundendaten */}
            <div className="space-y-4 mb-6">
              <div>
                <h3 className="text-sm font-semibold text-gray-700 mb-3">
                  Ihre Kontaktdaten
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                      <Calendar className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 mb-0.5">Name</p>
                      <p className="text-sm font-semibold text-gray-900 break-words">{appointment.name}</p>
                    </div>
                  </div>

                  {appointment.company && (
                    <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                      <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                        <Building2 className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs text-gray-500 mb-0.5">Betrieb</p>
                        <p className="text-sm font-semibold text-gray-900 break-words">{appointment.company}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                      <Phone className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 mb-0.5">Telefon</p>
                      <a
                        href={`tel:${appointment.phone}`}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 break-all"
                      >
                        {appointment.phone}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                    <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                      <Mail className="w-4 h-4 text-gray-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-gray-500 mb-0.5">E-Mail</p>
                      <a
                        href={`mailto:${appointment.email}`}
                        className="text-sm font-semibold text-blue-600 hover:text-blue-700 break-all"
                      >
                        {appointment.email}
                      </a>
                    </div>
                  </div>
                </div>
              </div>

              {appointment.message && (
                <div>
                  <h3 className="text-sm font-semibold text-gray-700 mb-2">Ihre Nachricht</h3>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">{appointment.message}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Stornierungsbutton */}
            {appointment.status !== 'cancelled' && (
              <div className="bg-orange-50 border border-orange-200 rounded-xl p-4">
                <div className="flex flex-col gap-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-orange-900 mb-1">
                        Termin stornieren
                      </h3>
                      <p className="text-xs text-orange-700">
                        Sie können Ihren Termin jederzeit stornieren. Sie erhalten eine Bestätigung per
                        E-Mail.
                      </p>
                    </div>
                  </div>
                  <Button
                    onClick={() => setCancelDialogOpen(true)}
                    variant="outline"
                    className="border-orange-300 hover:bg-orange-100 rounded-xl gap-2 text-orange-700 w-full"
                  >
                    <XCircle className="w-4 h-4" />
                    Stornieren
                  </Button>
                </div>
              </div>
            )}

            <Separator className="my-6" />

            {/* Zusatzinfo */}
            <div className="text-center text-xs text-gray-500">
              <div className="mb-1">
                Termin erstellt am {safeFormatDate(appointment.createdAt, 'dd.MM.yyyy')} um{' '}
                {safeFormatDate(appointment.createdAt, 'HH:mm')} Uhr
              </div>
              {appointment.googleEventId && (
                <Badge variant="outline" className="text-[10px] h-5 mt-1">
                  Im Google Calendar
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>

        {/* QR Code Card - Nur bei bestätigten Terminen */}
        {appointment.status === 'confirmed' && (
          <AppointmentQRCode
            appointmentId={appointment.id}
            appointmentData={{
              name: appointment.name,
              company: appointment.company,
              email: appointment.email,
              phone: appointment.phone,
              date: appointment.appointmentDate,
              startTime: appointment.time,
              endTime: getEndTime(appointment.time),
              message: appointment.message,
            }}
            settings={settings}
          />
        )}

        {/* Kontaktkarte - mit dynamischen Firmendaten */}
        <Card className="shadow-2xl rounded-2xl border-0 overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className="mb-6 flex items-center justify-center">
              <img 
                src={settings.logoUrl} 
                alt={`${settings.companyName} Logo`} 
                className="h-16 w-auto"
                onError={(e) => {
                  // Fallback wenn Logo nicht geladen werden kann
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            </div>

            <Separator className="mb-6" />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                  <MapPin className="w-4 h-4 text-gray-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 mb-0.5">Adresse</p>
                  <p className="text-sm font-semibold text-gray-900">{settings.companyName}</p>
                  {settings.companyAddress.split(',').map((line, i) => (
                    <p key={i} className="text-sm font-semibold text-gray-900">{line.trim()}</p>
                  ))}
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                  <Phone className="w-4 h-4 text-gray-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 mb-0.5">Telefon</p>
                  <a
                    href={`tel:${settings.companyPhone.replace(/\s/g, '')}`}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 break-all"
                  >
                    {settings.companyPhone}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                  <Mail className="w-4 h-4 text-gray-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 mb-0.5">E-Mail</p>
                  <a
                    href={`mailto:${settings.companyEmail}`}
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 break-all"
                  >
                    {settings.companyEmail}
                  </a>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div className="p-2 bg-white rounded-lg shadow-sm flex-shrink-0">
                  <Globe className="w-4 h-4 text-gray-600" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500 mb-0.5">Website</p>
                  <a
                    href={settings.companyWebsite}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-semibold text-blue-600 hover:text-blue-700 break-all"
                  >
                    {settings.companyWebsite.replace(/^https?:\/\/(www\.)?/, '')}
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-6 text-center">
              <p className="text-xs text-gray-500">
                Wir freuen uns auf Ihren Besuch! Bei Fragen stehen wir Ihnen gerne zur Verfügung.
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Cancel Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-0 shadow-2xl bg-white max-w-md mx-4">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-orange-50 rounded-xl">
                <AlertCircle className="w-6 h-6 text-orange-600" />
              </div>
              <AlertDialogTitle className="text-xl text-gray-900">Termin wirklich stornieren?</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm text-gray-600 leading-relaxed">
              Möchten Sie Ihren Termin am {DAY_NAMES_FULL[appointment.day]} um {appointment.time} Uhr
              wirklich stornieren? Sie erhalten eine Bestätigung per E-Mail.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2 flex-col sm:flex-row">
            <AlertDialogCancel 
              disabled={cancelling} 
              className="rounded-xl text-gray-900 w-full sm:w-auto"
            >
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleCancelAppointment}
              disabled={cancelling}
              className="bg-orange-600 hover:bg-orange-700 text-white rounded-xl w-full sm:w-auto"
            >
              {cancelling ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Wird storniert...
                </>
              ) : (
                'Ja, stornieren'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Not Found Dialog */}
      <AlertDialog open={notFoundDialogOpen} onOpenChange={setNotFoundDialogOpen}>
        <AlertDialogContent className="rounded-2xl border-0 shadow-2xl bg-white max-w-md mx-4">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-red-50 rounded-xl">
                <XCircle className="w-6 h-6 text-red-600" />
              </div>
              <AlertDialogTitle className="text-xl text-gray-900">Termin nicht gefunden</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-sm text-gray-600 leading-relaxed">
              {error || 'Der angeforderte Termin existiert nicht oder wurde gelöscht.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogAction
              onClick={() => (window.location.href = `${baseUrl}/`)}
              className="bg-blue-600 hover:bg-blue-700 text-white rounded-xl w-full"
            >
              Zurück zur Startseite
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
