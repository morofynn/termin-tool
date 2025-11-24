import { useState, useEffect } from 'react';
import { Calendar, Building2, Phone, Mail, MessageSquare, Loader2, CheckCircle2, XCircle, AlertCircle, Info, Clock, MapPin, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import { toast } from 'sonner';
import { baseUrl } from '../lib/base-url';
import { getLongLabel } from '../lib/event-config';
import AnimatedClock from './AnimatedClock';
import type { Settings } from '../types/appointments';
import AppointmentQRCode from './AppointmentQRCode';

type DayKey = 'friday' | 'saturday' | 'sunday';
type BookingStep = 'time' | 'details' | 'confirmation';

interface TimeSlot {
  time: string;
  available: boolean;
}

interface FormData {
  day: DayKey;
  time: string;
  name: string;
  company: string;
  phone: string;
  email: string;
  message: string;
}

interface SlotAvailability {
  [key: string]: {
    booked: number;
    available: boolean;
  };
}

interface BookingResult {
  success: boolean;
  message?: string;
  appointment?: {
    id: string;
    name: string;
    day: string;
    time: string;
    appointmentDate: string;
  };
}

export default function AppointmentScheduler() {
  const [currentStep, setCurrentStep] = useState<BookingStep>('time');
  const [selectedDay, setSelectedDay] = useState<DayKey | null>(null);
  const [formData, setFormData] = useState<FormData>({
    day: 'friday',
    time: '',
    name: '',
    company: '',
    phone: '',
    email: '',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [availability, setAvailability] = useState<SlotAvailability>({});
  const [loadingAvailability, setLoadingAvailability] = useState(false);

  // ✅ FIX: Verwende maxAppointmentsPerSlot statt maxBookingsPerSlot
  const [maxAppointmentsPerSlot, setMaxAppointmentsPerSlot] = useState(2);
  const [settings, setSettings] = useState<Settings | null>(null);

  // Hole Verfügbarkeiten beim ersten Laden
  useEffect(() => {
    fetchAvailability();
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const response = await fetch(`${baseUrl}/api/admin/settings`);
      if (response.ok) {
        const data = await response.json();
        setSettings(data.settings);
        
        // ✅ FIX: Verwende maxAppointmentsPerSlot
        setMaxAppointmentsPerSlot(data.settings.maxAppointmentsPerSlot || 2);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  };

  const fetchAvailability = async () => {
    setLoadingAvailability(true);
    try {
      const response = await fetch(`${baseUrl}/api/availability`);
      if (response.ok) {
        const data = await response.json();
        setAvailability(data);
      }
    } catch (error) {
      console.error('Error fetching availability:', error);
    } finally {
      setLoadingAvailability(false);
    }
  };

  // Zeitslots für jeden Tag
  const timeSlots: Record<DayKey, TimeSlot[]> = {
    friday: Array.from({ length: 15 }, (_, i) => {
      const hour = Math.floor(i / 2) + 10;
      const minute = i % 2 === 0 ? '00' : '30';
      const time = `${hour.toString().padStart(2, '0')}:${minute}`;
      return {
        time,
        available: true,
      };
    }),
    saturday: Array.from({ length: 15 }, (_, i) => {
      const hour = Math.floor(i / 2) + 10;
      const minute = i % 2 === 0 ? '00' : '30';
      const time = `${hour.toString().padStart(2, '0')}:${minute}`;
      return {
        time,
        available: true,
      };
    }),
    sunday: Array.from({ length: 13 }, (_, i) => {
      const hour = Math.floor(i / 2) + 10;
      const minute = i % 2 === 0 ? '00' : '30';
      const time = `${hour.toString().padStart(2, '0')}:${minute}`;
      return {
        time,
        available: true,
      };
    }),
  };

  const handleDaySelect = (day: DayKey) => {
    setSelectedDay(day);
    setFormData(prev => ({ ...prev, day }));
  };

  const handleTimeSelect = (time: string) => {
    setFormData(prev => ({ ...prev, time }));
    setCurrentStep('details');
  };

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const validateForm = (): boolean => {
    if (!formData.name.trim()) {
      setError('Bitte geben Sie Ihren Namen an.');
      return false;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Bitte geben Sie eine gültige E-Mail-Adresse an.');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Bitte geben Sie Ihre Telefonnummer an.');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${baseUrl}/api/book-appointment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json() as BookingResult;

      if (response.ok && result.success) {
        setBookingResult(result);
        setCurrentStep('confirmation');
        toast.success('Termin erfolgreich gebucht!');
      } else {
        setError(result.message || 'Buchung fehlgeschlagen. Bitte versuchen Sie es erneut.');
        toast.error(result.message || 'Buchung fehlgeschlagen');
      }
    } catch (err) {
      console.error('Booking error:', err);
      setError('Verbindungsfehler. Bitte versuchen Sie es später erneut.');
      toast.error('Verbindungsfehler');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setCurrentStep('time');
    setSelectedDay(null);
    setFormData({
      day: 'friday',
      time: '',
      name: '',
      company: '',
      phone: '',
      email: '',
      message: '',
    });
    setError(null);
    setBookingResult(null);
    fetchAvailability();
  };

  const goBack = () => {
    if (currentStep === 'details') {
      setCurrentStep('time');
      setFormData(prev => ({ ...prev, time: '' }));
    } else if (currentStep === 'confirmation') {
      resetForm();
    }
  };

  const getDayLabel = (day: DayKey): string => {
    return getLongLabel(day, settings);
  };

  const getSlotStatus = (day: DayKey, time: string) => {
    const key = `${day}-${time}`;
    const slot = availability[key];
    
    if (loadingAvailability) {
      return { booked: 0, available: false };
    }
    
    if (!slot) return { booked: 0, available: true };
    return slot;
  };

  // Wartungsmodus Check
  if (availability.maintenanceMode) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-orange-50 via-red-50 to-orange-100">
        <Card className="w-full max-w-2xl shadow-2xl border-2 border-orange-200">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-4 bg-orange-100 rounded-full w-20 h-20 flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-orange-600" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Wartungsmodus
            </CardTitle>
            <CardDescription className="text-base text-gray-700">
              {settings?.maintenanceMessage || 'Das Buchungssystem ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.'}
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  // Event beendet
  if (settings?.eventEnded) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
        <Card className="w-full max-w-2xl shadow-2xl border-2 border-blue-200">
          <CardHeader className="text-center pb-4">
            <div className="mx-auto mb-4 p-4 bg-blue-100 rounded-full w-20 h-20 flex items-center justify-center">
              <CheckCircle2 className="w-12 h-12 text-blue-600" />
            </div>
            <CardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2">
              Event beendet
            </CardTitle>
            <CardDescription className="text-base text-gray-700">
              Die {settings?.eventName || 'Veranstaltung'} ist beendet. Vielen Dank für Ihr Interesse!
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-6">
            <p className="text-sm text-gray-600 mb-4">
              Wir hoffen, Sie hatten eine erfolgreiche Zeit auf der Messe.
            </p>
            {settings?.companyWebsite && (
              <Button
                onClick={() => window.open(settings.companyWebsite, '_blank')}
                variant="outline"
                className="gap-2 rounded-xl text-gray-900"
              >
                <ExternalLink className="w-4 h-4" />
                Zur Website
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-100">
      <div className="w-full max-w-4xl">
        {/* Logo & Branding */}
        {settings?.logoUrl && (
          <div className="text-center mb-6">
            <img 
              src={settings.logoUrl} 
              alt={settings.companyName || 'Company Logo'} 
              className="h-12 sm:h-16 mx-auto object-contain"
            />
          </div>
        )}

        <Card className="shadow-2xl border-2 border-indigo-200">
          {/* Header mit AnimatedClock */}
          <CardHeader className="text-center pb-4 sm:pb-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 opacity-10">
              <AnimatedClock size={120} />
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center justify-center gap-3 mb-3 sm:mb-4">
                <div className="p-2 sm:p-3 bg-indigo-100 rounded-full">
                  <Calendar className="w-6 h-6 sm:w-8 sm:h-8 text-indigo-600" />
                </div>
              </div>
              
              <CardTitle className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-900 mb-2">
                Terminbuchung
              </CardTitle>
              
              <CardDescription className="text-sm sm:text-base text-gray-700">
                {settings?.eventName && settings?.eventYear ? (
                  <>{settings.eventName} {settings.eventYear.toString().slice(-2)}</>
                ) : (
                  'Ihre Terminbuchung'
                )}
              </CardDescription>

              {settings?.standInfo && (
                <div className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 rounded-full border border-indigo-200">
                  <MapPin className="w-4 h-4 text-indigo-600" />
                  <span className="text-sm font-medium text-indigo-900">
                    {settings.standInfo}
                  </span>
                </div>
              )}
            </div>
          </CardHeader>

          <CardContent className="p-4 sm:p-6">
            {currentStep === 'time' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
                  <Badge className="bg-indigo-100 text-indigo-900 hover:bg-indigo-100">
                    Schritt 1 von 2
                  </Badge>
                </div>

                <div className="text-center mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    Wählen Sie einen Termin
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Bitte wählen Sie zuerst einen Tag und dann eine verfügbare Uhrzeit
                  </p>
                </div>

                {/* Tag-Auswahl */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
                  {(['friday', 'saturday', 'sunday'] as DayKey[]).map((day) => (
                    <Button
                      key={day}
                      onClick={() => handleDaySelect(day)}
                      variant={selectedDay === day ? 'default' : 'outline'}
                      className={`h-auto py-3 sm:py-4 flex flex-col gap-1 sm:gap-2 rounded-xl transition-all ${
                        selectedDay === day
                          ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg scale-105'
                          : 'text-gray-900 hover:bg-indigo-50 border-2 border-gray-200'
                      }`}
                    >
                      <Calendar className="w-5 h-5 sm:w-6 sm:h-6" />
                      <span className="font-semibold text-sm sm:text-base">{getDayLabel(day)}</span>
                    </Button>
                  ))}
                </div>

                {/* Zeitslot-Auswahl */}
                {selectedDay && (
                  <div className="space-y-3 sm:space-y-4 animate-in fade-in duration-300">
                    <Separator />
                    <div>
                      <h4 className="font-semibold text-base sm:text-lg text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
                        <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                        Verfügbare Uhrzeiten
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2 sm:gap-3">
                        {timeSlots[selectedDay].map((slot) => {
                          const status = getSlotStatus(selectedDay, slot.time);
                          const isAvailable = status.available;
                          const isFullyBooked = !isAvailable;

                          return (
                            <div key={slot.time} className="relative">
                              <Button
                                onClick={() => isAvailable && handleTimeSelect(slot.time)}
                                disabled={!isAvailable || loadingAvailability}
                                variant={isAvailable ? 'outline' : 'secondary'}
                                className={`w-full h-auto py-2.5 sm:py-3 flex flex-col gap-1 rounded-xl transition-all ${
                                  isAvailable
                                    ? 'text-gray-900 hover:bg-indigo-50 hover:border-indigo-300 border-2'
                                    : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                }`}
                              >
                                <span className="font-bold text-base sm:text-lg">{slot.time}</span>
                                {settings?.showSlotIndicator && status.booked > 0 && (
                                  <div className="flex items-center gap-1">
                                    <Badge
                                      // ✅ FIX: Verwende maxAppointmentsPerSlot
                                      variant={status.booked >= maxAppointmentsPerSlot ? 'destructive' : 'secondary'}
                                      className="text-[10px] sm:text-xs px-1.5 py-0 h-4 sm:h-5"
                                    >
                                      {/* ✅ FIX: Zeige korrekte Zahlen */}
                                      {status.booked}/{maxAppointmentsPerSlot}
                                    </Badge>
                                  </div>
                                )}
                              </Button>
                              {isFullyBooked && (
                                <div className="absolute -top-1 -right-1">
                                  <div className="bg-red-500 text-white rounded-full p-0.5">
                                    <XCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Legende */}
                    {settings?.showSlotIndicator && (
                      <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-4 text-xs sm:text-sm text-gray-600 pt-2 sm:pt-3">
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 border-2 border-gray-300 rounded"></div>
                          <span>Verfügbar</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <Badge variant="secondary" className="text-[10px] sm:text-xs h-4 sm:h-5 px-1.5">1/{maxAppointmentsPerSlot}</Badge>
                          <span>Teilweise gebucht</span>
                        </div>
                        <div className="flex items-center gap-1.5 sm:gap-2">
                          <div className="w-3 h-3 sm:w-4 sm:h-4 bg-gray-300 rounded flex items-center justify-center">
                            <XCircle className="w-2 h-2 sm:w-3 sm:h-3 text-white" />
                          </div>
                          <span>Ausgebucht</span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {currentStep === 'details' && (
              <div className="space-y-4 sm:space-y-6">
                {/* Step Indicator */}
                <div className="flex items-center justify-center gap-2 mb-4 sm:mb-6">
                  <Badge className="bg-indigo-100 text-indigo-900 hover:bg-indigo-100">
                    Schritt 2 von 2
                  </Badge>
                </div>

                {/* Selected Time Info */}
                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 flex-shrink-0" />
                      <span className="font-semibold text-sm sm:text-base text-gray-900">
                        {getDayLabel(formData.day)}
                      </span>
                    </div>
                    <Separator orientation="vertical" className="hidden sm:block h-6" />
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 flex-shrink-0" />
                      <span className="font-semibold text-sm sm:text-base text-gray-900">
                        {formData.time} Uhr
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-center mb-4 sm:mb-6">
                  <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-2">
                    Ihre Kontaktdaten
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600">
                    Bitte geben Sie Ihre Daten ein, um den Termin zu bestätigen
                  </p>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="name" className="text-sm sm:text-base font-medium flex items-center gap-2">
                      <span>Name *</span>
                    </Label>
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="Max Mustermann"
                      className="h-10 sm:h-12 text-sm sm:text-base rounded-xl text-gray-900"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="company" className="text-sm sm:text-base font-medium flex items-center gap-2">
                      <Building2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                      <span>Firma</span>
                    </Label>
                    <Input
                      id="company"
                      value={formData.company}
                      onChange={(e) => handleInputChange('company', e.target.value)}
                      placeholder="Beispiel GmbH (optional)"
                      className="h-10 sm:h-12 text-sm sm:text-base rounded-xl text-gray-900"
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="email" className="text-sm sm:text-base font-medium flex items-center gap-2">
                      <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                      <span>E-Mail *</span>
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => handleInputChange('email', e.target.value)}
                      placeholder="max@beispiel.de"
                      className="h-10 sm:h-12 text-sm sm:text-base rounded-xl text-gray-900"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="phone" className="text-sm sm:text-base font-medium flex items-center gap-2">
                      <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                      <span>Telefon *</span>
                    </Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => handleInputChange('phone', e.target.value)}
                      placeholder="+49 123 456789"
                      className="h-10 sm:h-12 text-sm sm:text-base rounded-xl text-gray-900"
                      required
                    />
                  </div>

                  <div className="space-y-1.5 sm:space-y-2">
                    <Label htmlFor="message" className="text-sm sm:text-base font-medium flex items-center gap-2">
                      <MessageSquare className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-600" />
                      <span>Nachricht</span>
                    </Label>
                    <Textarea
                      id="message"
                      value={formData.message}
                      onChange={(e) => handleInputChange('message', e.target.value)}
                      placeholder={settings?.messagePlaceholder || "Ihre Nachricht..."}
                      className="min-h-[80px] sm:min-h-[100px] text-sm sm:text-base rounded-xl resize-none text-gray-900"
                      rows={4}
                    />
                  </div>
                </div>

                {error && (
                  <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs sm:text-sm text-red-800">{error}</p>
                  </div>
                )}

                <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 pt-2 sm:pt-4">
                  <Button
                    onClick={goBack}
                    variant="outline"
                    disabled={loading}
                    className="w-full h-10 sm:h-12 rounded-xl text-sm sm:text-base font-semibold text-gray-900"
                  >
                    Zurück
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={loading}
                    className="w-full h-10 sm:h-12 rounded-xl text-sm sm:text-base font-semibold bg-indigo-600 hover:bg-indigo-700 shadow-lg"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5 animate-spin" />
                        Wird gebucht...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                        Termin buchen
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {currentStep === 'confirmation' && bookingResult?.appointment && (
              <div className="space-y-4 sm:space-y-6 text-center">
                <div className="flex justify-center">
                  <div className="p-3 sm:p-4 bg-green-100 rounded-full">
                    <CheckCircle2 className="w-12 h-12 sm:w-16 sm:h-16 text-green-600" />
                  </div>
                </div>

                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
                    Termin erfolgreich gebucht!
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Sie erhalten eine Bestätigungs-E-Mail mit allen Details.
                  </p>
                </div>

                <div className="bg-indigo-50 border-2 border-indigo-200 rounded-xl p-4 sm:p-6 space-y-3 sm:space-y-4">
                  <div className="flex items-center justify-center gap-2 mb-2">
                    <Info className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                    <h4 className="font-semibold text-base sm:text-lg text-gray-900">Ihre Buchungsdetails</h4>
                  </div>

                  <div className="space-y-2 sm:space-y-3 text-left">
                    <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg">
                      <Calendar className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600">Termin</p>
                        <p className="font-semibold text-sm sm:text-base text-gray-900">
                          {getDayLabel(bookingResult.appointment.day as DayKey)}, {bookingResult.appointment.time} Uhr
                        </p>
                      </div>
                    </div>

                    {settings?.standInfo && (
                      <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg">
                        <MapPin className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm text-gray-600">Standort</p>
                          <p className="font-semibold text-sm sm:text-base text-gray-900">{settings.standInfo}</p>
                        </div>
                      </div>
                    )}

                    <div className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-white rounded-lg">
                      <Mail className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs sm:text-sm text-gray-600">Kontakt</p>
                        <p className="font-semibold text-sm sm:text-base text-gray-900 break-all">{formData.email}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* QR Code */}
                <div className="bg-white border-2 border-gray-200 rounded-xl p-4 sm:p-6">
                  <h4 className="font-semibold text-sm sm:text-base text-gray-900 mb-3 sm:mb-4">Ihr Termin-QR-Code</h4>
                  <AppointmentQRCode appointmentId={bookingResult.appointment.id} />
                  <p className="text-xs text-gray-600 mt-3 sm:mt-4">
                    Zeigen Sie diesen QR-Code bei Ihrem Termin vor
                  </p>
                </div>

                <Button
                  onClick={resetForm}
                  variant="outline"
                  className="w-full h-10 sm:h-12 rounded-xl text-sm sm:text-base font-semibold text-gray-900"
                >
                  Weiteren Termin buchen
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Footer Info */}
        {settings && (
          <div className="mt-6 sm:mt-8 text-center space-y-2">
            <p className="text-xs sm:text-sm text-gray-600">
              Bei Fragen kontaktieren Sie uns:
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-700">
              {settings.companyEmail && (
                <a
                  href={`mailto:${settings.companyEmail}`}
                  className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {settings.companyEmail}
                </a>
              )}
              {settings.companyPhone && (
                <a
                  href={`tel:${settings.companyPhone}`}
                  className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors"
                >
                  <Phone className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  {settings.companyPhone}
                </a>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
