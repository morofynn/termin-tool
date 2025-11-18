import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AnimatedClock from './AnimatedClock';
import { Calendar, User, Building2, Phone, Mail, MessageSquare, CheckCircle2, Loader2, X, CalendarX, AlertTriangle, PartyPopper, Wrench } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Checkbox } from './ui/checkbox';
import { toast } from 'sonner';
import { baseUrl } from '../lib/base-url';
import { validateFormData, validateEmail, validatePhone, validateName } from '../lib/validation';
import { type EventDay, getEventDate, getShortLabel, getEventName } from '../lib/event-config';
import { useEventConfig, getEventDateFromConfig } from '../hooks/use-event-config';

type DayKey = EventDay;

interface SlotAvailability {
  [key: string]: {
    booked: number;
    available: boolean;
  };
}

interface FormData {
  name: string;
  company: string;
  phone: string;
  email: string;
  message: string;
}

// Verfügbare Tage in korrekter Reihenfolge
const dayOrder: DayKey[] = ["friday", "saturday", "sunday"];

// Display-Labels und Event-Dates werden dynamisch aus den Settings geladen
// via useEventConfig() Hook

const TIME_SLOTS = {
  friday: Array.from({ length: 15 }, (_, i) => {
    const hour = Math.floor(i / 2) + 10;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  }),
  saturday: Array.from({ length: 15 }, (_, i) => {
    const hour = Math.floor(i / 2) + 10;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  }),
  sunday: Array.from({ length: 13 }, (_, i) => {
    const hour = Math.floor(i / 2) + 10;
    const minute = i % 2 === 0 ? '00' : '30';
    return `${hour.toString().padStart(2, '0')}:${minute}`;
  }),
};

const ACCENT_COLOR = '#2d62ff';
const ACCENT_FOREGROUND = '#f5f8ff';

const COLORS = {
  textDark: '#1f2937',
  textBlack: '#111827',
  white: '#ffffff',
  grayBorder: '#e5e7eb',
};

export default function AppointmentScheduler() {
  // Event-Config dynamisch laden
  const { config: eventConfig, loading: configLoading } = useEventConfig();
  
  // Dynamische Labels und Dates
  const DAYS: Record<EventDay, string> = {
    friday: eventConfig.shortLabels.friday,
    saturday: eventConfig.shortLabels.saturday,
    sunday: eventConfig.shortLabels.sunday,
  };
  
  const EVENT_DATES: Record<EventDay, Date> = {
    friday: getEventDateFromConfig('friday', eventConfig),
    saturday: getEventDateFromConfig('saturday', eventConfig),
    sunday: getEventDateFromConfig('sunday', eventConfig),
  };

  const [mounted, setMounted] = useState(false);
  const [selectedDay, setSelectedDay] = useState<DayKey>('friday');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availability, setAvailability] = useState<SlotAvailability>({});
  const [availabilityLoaded, setAvailabilityLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [showSuccessScreen, setShowSuccessScreen] = useState(false);
  const [bookedInfo, setBookedInfo] = useState({ day: '', time: '', autoConfirmed: true, id: '' });
  const [error, setError] = useState<string | null>(null);
  const [debugInfo, setDebugInfo] = useState<string[]>([]);
  const [maxBookingsPerSlot, setMaxBookingsPerSlot] = useState(2);
  const [showSlotIndicator, setShowSlotIndicator] = useState(true);
  const [messagePlaceholder, setMessagePlaceholder] = useState('Ihre Nachricht...');
  const [adminEmail, setAdminEmail] = useState('info@moro-gmbh.de');
  const [logoUrl, setLogoUrl] = useState('');
  const [availableDays, setAvailableDays] = useState({
    friday: true,
    saturday: true,
    sunday: true
  });
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [maintenanceMessage, setMaintenanceMessage] = useState('Das Buchungssystem ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.');
  const [eventEnded, setEventEnded] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: '',
    company: '',
    phone: '',
    email: '',
    message: '',
  });
  const [formErrors, setFormErrors] = useState<Partial<Record<keyof FormData, string>>>({});
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [showPrivacyOverlay, setShowPrivacyOverlay] = useState(false);
  const [testEventEnded, setTestEventEnded] = useState(false);

  const addDebugLog = (message: string) => {
    console.log(`[AppointmentScheduler] ${message}`);
    setDebugInfo(prev => [...prev, `${new Date().toISOString()}: ${message}`]);
  };

  // Prüfe ob ein Zeitslot in der Vergangenheit liegt
  const isSlotInPast = (day: DayKey, time: string): boolean => {
    try {
      const now = new Date();
      const eventDate = EVENT_DATES[day];
      const [hours, minutes] = time.split(':').map(Number);
      const slotDateTime = new Date(eventDate);
      slotDateTime.setHours(hours, minutes, 0, 0);
      return slotDateTime < now;
    } catch (err) {
      console.error('Error checking if slot is in past:', err);
      return false;
    }
  };

  useEffect(() => {
    addDebugLog('Component mounted');
    setMounted(true);
    
    // Fetch settings first to check event status
    fetchSettings();
    fetchAvailability();
  }, []);

  const fetchSettings = async () => {
    try {
      addDebugLog(`Fetching settings from: ${baseUrl}/api/admin/settings`);
      const response = await fetch(`${baseUrl}/api/admin/settings`);
      if (response.ok) {
        const data: any = await response.json();
        setMaxBookingsPerSlot(data.settings.maxBookingsPerSlot || 2);
        setShowSlotIndicator(data.settings.showSlotIndicator !== false);
        setMessagePlaceholder(data.settings.messagePlaceholder || 'Ihre Nachricht...');
        setAdminEmail(data.settings.companyEmail || 'info@moro-gmbh.de');
        setLogoUrl(data.settings.logoUrl || '');
        setAvailableDays(data.settings.availableDays || {
          friday: true,
          saturday: true,
          sunday: true
        });
        
        // Wartungsmodus
        setMaintenanceMode(data.settings.maintenanceMode || false);
        setMaintenanceMessage(data.settings.maintenanceMessage || 'Das Buchungssystem ist vorübergehend nicht verfügbar. Bitte versuchen Sie es später erneut.');
        
        // 🔥 EVENT-ENDED STATUS - MIT DYNAMISCHEM JAHR
        const manualEnded = data.settings.eventEnded || false;
        
        // Automatisches Event-End basierend auf Event-Sonntag + 1 Tag
        let dateEnded = false;
        if (data.settings.eventDateSunday) {
          try {
            const sundayDate = new Date(data.settings.eventDateSunday);
            // Setze auf 23:59:59 am Sonntag
            sundayDate.setHours(23, 59, 59, 999);
            
            const now = new Date();
            dateEnded = now > sundayDate;
            
            if (dateEnded && !manualEnded) {
              addDebugLog(`Event automatically ended: current time ${now.toISOString()} > event end ${sundayDate.toISOString()}`);
            }
          } catch (err) {
            console.error('Error parsing event end date:', err);
          }
        }
        
        const isEnded = manualEnded || dateEnded;
        setEventEnded(isEnded);
        
        if (manualEnded) {
          addDebugLog(`Event manually ended via toggle`);
        }
        addDebugLog(`Settings loaded successfully, Event Ended: ${isEnded}`);
        
        // Set first available day as selected
        const firstAvailableDay = (['friday', 'saturday', 'sunday'] as DayKey[])
          .find(day => data.settings.availableDays?.[day] !== false);
        if (firstAvailableDay && data.settings.availableDays?.[firstAvailableDay]) {
          setSelectedDay(firstAvailableDay);
        }
      } else {
        addDebugLog(`Settings fetch failed: ${response.status}`);
      }
    } catch (error) {
      addDebugLog(`Settings fetch error: ${error instanceof Error ? error.message : 'Unknown'}`);
      console.error('Error loading settings:', error);
    }
  };

  const fetchAvailability = async () => {
    try {
      addDebugLog('Starting fetchAvailability...');
      setAvailabilityLoaded(false);
      const url = `${baseUrl}/api/availability`;
      addDebugLog(`Fetching from: ${url}`);
      
      const response = await fetch(url);
      addDebugLog(`Response status: ${response.status} ${response.statusText}`);
      
      if (response.ok) {
        const data: any = await response.json();
        addDebugLog(`Received availability data with ${Object.keys(data).length} slots`);
        
        setAvailability(data);
        setAvailabilityLoaded(true);
        addDebugLog('Availability loaded successfully');
      } else {
        const errorText = await response.text();
        addDebugLog(`Availability fetch failed: ${errorText}`);
        setError(`API Error: ${response.status}`);
        setAvailabilityLoaded(true);
      }
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addDebugLog(`Error in fetchAvailability: ${errorMsg}`);
      console.error('Error fetching availability:', error);
      setError(`Fetch Error: ${errorMsg}`);
      setAvailabilityLoaded(true);
    }
  };

  const getSlotStatus = (day: DayKey, time: string) => {
    const key = `${day}-${time}`;
    const slot = availability[key];
    
    // Wenn Slot in der Vergangenheit liegt, als nicht verfügbar markieren
    if (isSlotInPast(day, time)) {
      return { booked: 0, available: false };
    }
    
    if (!slot) return { booked: 0, available: true };
    return slot;
  };

  const toggleEventEndedTest = () => {
    const newState = !testEventEnded;
    setTestEventEnded(newState);
    setEventEnded(newState);
    addDebugLog(`Event ended test: ${newState}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    addDebugLog('Form submitted');

    if (!selectedTime) {
      toast.error('Bitte wählen Sie einen Zeitpunkt');
      return;
    }

    if (!privacyAccepted) {
      toast.error('Bitte akzeptieren Sie die Datenschutzbestimmungen');
      return;
    }

    setLoading(true);
    setShowLoadingScreen(true);

    try {
      const response = await fetch(`${baseUrl}/api/book-appointment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          day: selectedDay,
          time: selectedTime,
          ...formData,
        }),
      });

      const data: any = await response.json();
      addDebugLog(`Booking response: ${JSON.stringify(data)}`);

      await new Promise(resolve => setTimeout(resolve, 2000));

      if (response.ok) {
        setBookedInfo({
          day: DAYS[selectedDay],
          time: selectedTime,
          autoConfirmed: data.autoConfirmed !== undefined ? data.autoConfirmed : true,
          id: data.appointmentId || ''
        });
        setShowLoadingScreen(false);
        setTimeout(() => {
          setShowSuccessScreen(true);
        }, 300);
        setFormData({
          name: '',
          company: '',
          phone: '',
          email: '',
          message: '',
        });
        setPrivacyAccepted(false);
        setSelectedTime('');
        await fetchAvailability();
      } else {
        setShowLoadingScreen(false);
        toast.error(data.message || 'Fehler beim Buchen');
      }
    } catch (error) {
      setShowLoadingScreen(false);
      const errorMsg = error instanceof Error ? error.message : 'Unknown error';
      addDebugLog(`Booking error: ${errorMsg}`);
      toast.error('Ein Fehler ist aufgetreten');
      console.error('Booking error:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetToBooking = () => {
    addDebugLog('Reset to booking');
    setShowSuccessScreen(false);
  };

  const getActiveTabIndex = () => {
    return dayOrder.indexOf(selectedDay);
  };

  const isDayFullyBooked = (day: DayKey): boolean => {
    if (!availabilityLoaded) return false;
    
    const slots = TIME_SLOTS[day];
    return slots.every(time => {
      const status = getSlotStatus(day, time);
      return !status.available;
    });
  };

  const isDayDisabled = (day: DayKey): boolean => {
    return !availableDays[day];
  };

  if (!mounted) {
    return (
      <div style={{ 
        maxWidth: '42rem', 
        margin: '0 auto', 
        padding: '1.5rem',
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent'
      }}>
        <div style={{ textAlign: 'center' }}>
          <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
          <p className="text-gray-600">Lade Termin-Tool...</p>
        </div>
      </div>
    );
  }

  // Maintenance Mode Screen
  if (maintenanceMode) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'transparent',
        position: 'relative'
      }}>
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            maxWidth: 'clamp(20rem, 90vw, 42rem)',
            margin: '0 auto',
            padding: 'clamp(2rem, 8vw, 4rem)',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Card style={{
            background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.2)',
            borderRadius: '1.5rem',
            border: 'none',
            overflow: 'hidden',
            textAlign: 'center',
            color: '#ffffff'
          }}>
            <CardContent style={{ padding: 'clamp(2rem, 8vw, 4rem)' }}>
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                style={{ marginBottom: 'clamp(1rem, 4vw, 2rem)' }}
              >
                <div style={{
                  width: 'clamp(4rem, 15vw, 6rem)',
                  height: 'clamp(4rem, 15vw, 6rem)',
                  margin: '0 auto',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
                  >
                    <Wrench style={{ 
                      width: 'clamp(2.5rem, 10vw, 3.5rem)', 
                      height: 'clamp(2.5rem, 10vw, 3.5rem)',
                      color: '#ffffff'
                    }} />
                  </motion.div>
                </div>
              </motion.div>

              <h1 style={{
                fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
                fontWeight: 700,
                marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
                lineHeight: 1.2
              }}>
                Wartungsmodus
              </h1>

              <p style={{
                fontSize: 'clamp(1rem, 3.5vw, 1.25rem)',
                opacity: 0.95,
                lineHeight: 1.6,
                maxWidth: '32rem',
                margin: '0 auto'
              }}>
                {maintenanceMessage}
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Event Ended Screen
  const isEventEnded = eventEnded || testEventEnded;
  
  if (isEventEnded) {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'transparent',
        position: 'relative'
      }}>
        {/* Test Button - nur im Test-Modus sichtbar */}
        {testEventEnded && (
          <div style={{
            position: 'fixed',
            top: '1rem',
            left: '1rem',
            zIndex: 100
          }}>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleEventEndedTest}
              className="shadow-lg hover:shadow-xl transition-all"
              style={{
                background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                border: 'none',
                color: '#ffffff',
                padding: '0.625rem 1rem',
                borderRadius: '0.75rem',
                fontSize: '0.875rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              <CheckCircle2 className="w-4 h-4" />
              Stop Event End
            </Button>
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          style={{
            maxWidth: 'clamp(20rem, 90vw, 42rem)',
            margin: '0 auto',
            padding: 'clamp(2rem, 8vw, 4rem)',
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <Card style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.2)',
            borderRadius: '1.5rem',
            border: 'none',
            overflow: 'hidden',
            textAlign: 'center',
            color: '#ffffff'
          }}>
            <CardContent style={{ padding: 'clamp(2rem, 8vw, 4rem)' }}>
              <motion.div
                initial={{ scale: 0, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                style={{ marginBottom: 'clamp(1rem, 4vw, 2rem)' }}
              >
                <div style={{
                  width: 'clamp(4rem, 15vw, 6rem)',
                  height: 'clamp(4rem, 15vw, 6rem)',
                  margin: '0 auto',
                  background: 'rgba(255, 255, 255, 0.2)',
                  borderRadius: '9999px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}>
                  <motion.div
                    animate={{ 
                      scale: [1, 1.2, 1],
                      rotate: [0, 5, -5, 0]
                    }}
                    transition={{ 
                      duration: 2,
                      repeat: Infinity,
                      ease: 'easeInOut'
                    }}
                  >
                    <PartyPopper style={{ 
                      width: 'clamp(2.5rem, 10vw, 3.5rem)', 
                      height: 'clamp(2.5rem, 10vw, 3.5rem)',
                      color: '#ffffff'
                    }} />
                  </motion.div>
                </div>
              </motion.div>

              <h1 style={{
                fontSize: 'clamp(1.5rem, 5vw, 2.5rem)',
                fontWeight: 700,
                marginBottom: 'clamp(1rem, 3vw, 1.5rem)',
                lineHeight: 1.2
              }}>
                Vielen Dank, dass ihr dabei wart!
              </h1>

              <p style={{
                fontSize: 'clamp(1rem, 3.5vw, 1.25rem)',
                opacity: 0.95,
                lineHeight: 1.6,
                maxWidth: '32rem',
                margin: '0 auto'
              }}>
                Wir sehen uns im nächsten Jahr wieder auf der {eventConfig.name}.
              </p>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  // Privacy Overlay
  const PrivacyOverlay = () => (
    <AnimatePresence>
      {showPrivacyOverlay && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            backgroundColor: 'rgba(0, 0, 0, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
          }}
          onClick={() => setShowPrivacyOverlay(false)}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            style={{
              backgroundColor: '#ffffff',
              borderRadius: '1rem',
              maxWidth: '600px',
              width: '100%',
              maxHeight: '80vh',
              overflow: 'hidden',
              boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.2)',
              position: 'relative'
            }}
          >
            <div style={{
              padding: '1.5rem',
              borderBottom: '1px solid #e5e7eb',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <h3 style={{
                fontSize: '1.25rem',
                fontWeight: 700,
                color: '#111827'
              }}>
                Datenschutzbestimmungen
              </h3>
              <button
                onClick={() => setShowPrivacyOverlay(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '0.5rem',
                  color: '#6b7280',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '0.5rem',
                  transition: 'background-color 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f3f4f6'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <X style={{ width: '1.5rem', height: '1.5rem' }} />
              </button>
            </div>
            <div style={{
              padding: '1.5rem',
              overflowY: 'auto',
              maxHeight: 'calc(80vh - 100px)',
              color: '#374151',
              lineHeight: 1.6
            }}>
              <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', color: '#111827' }}>
                Erhebung und Verarbeitung personenbezogener Daten
              </h4>
              <p style={{ marginBottom: '1rem' }}>
                Ihre personenbezogenen Daten (Name, Betrieb, Telefonnummer, E-Mail-Adresse und optionale Nachricht) 
                werden ausschließlich zur Terminverwaltung und Kontaktaufnahme im Rahmen der {eventConfig.name} verwendet.
              </p>
              
              <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem', color: '#111827' }}>
                Zweck der Datenverarbeitung
              </h4>
              <ul style={{ marginBottom: '1rem', paddingLeft: '1.5rem' }}>
                <li>Verwaltung Ihrer Terminbuchung</li>
                <li>Bestätigung und Erinnerung an Ihren Termin</li>
                <li>Kontaktaufnahme bei Rückfragen oder Änderungen</li>
                <li>Synchronisation mit unserem internen Kalender (Google Calendar)</li>
              </ul>
              
              <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem', color: '#111827' }}>
                Speicherung und Löschung
              </h4>
              <p style={{ marginBottom: '1rem' }}>
                Ihre Daten werden gespeichert, bis Sie Ihren Termin stornieren oder Sie uns zur Löschung auffordern.
              </p>
              
              <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem', color: '#111827' }}>
                Weitergabe an Dritte
              </h4>
              <p style={{ marginBottom: '1rem' }}>
                Ihre Daten werden nicht an Dritte weitergegeben. Die Speicherung erfolgt auf sicheren Servern der 
                Cloudflare Workers Plattform (KV Store) und in unserem Google Calendar.
              </p>
              
              <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem', color: '#111827' }}>
                Ihre Rechte
              </h4>
              <p style={{ marginBottom: '1rem' }}>
                Sie haben jederzeit das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung 
                Ihrer personenbezogenen Daten. Sie können Ihren Termin auch selbstständig über den Bestätigungslink 
                stornieren.
              </p>
              
              <h4 style={{ fontWeight: 600, marginBottom: '0.75rem', marginTop: '1.5rem', color: '#111827' }}>
                Kontakt
              </h4>
              <p style={{ marginBottom: '0' }}>
                Bei Fragen zum Datenschutz kontaktieren Sie uns unter:<br />
                <strong>{adminEmail}</strong>
              </p>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  // Main Render mit Error Boundary
  try {
    return (
      <div style={{ 
        minHeight: '100vh',
        background: 'transparent',
        position: 'relative'
      }}>
        <PrivacyOverlay />
        
        {/* Debug Panel - nur in Development */}
        {import.meta.env.DEV && debugInfo.length > 0 && (
          <div style={{
            position: 'fixed',
            bottom: '10px',
            right: '10px',
            maxWidth: '400px',
            maxHeight: '300px',
            overflow: 'auto',
            background: 'rgba(0, 0, 0, 0.9)',
            color: '#00ff00',
            padding: '10px',
            borderRadius: '5px',
            fontSize: '10px',
            zIndex: 9999,
            fontFamily: 'monospace'
          }}>
            <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>Debug Log:</div>
            {debugInfo.slice(-10).map((log, i) => (
              <div key={i} style={{ marginBottom: '2px' }}>{log}</div>
            ))}
          </div>
        )}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            maxWidth: 'clamp(20rem, 90vw, 42rem)',
            margin: '0 auto',
            padding: 'clamp(0.75rem, 2vw, 1.5rem)',
          }}
        >
          <div style={{ position: 'relative' }}>
            <Card style={{
              background: '#ffffff',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
              borderRadius: '1rem',
              border: 'none',
              overflow: 'hidden'
            }}>
              <CardContent 
                style={{ 
                  padding: 'clamp(1rem, 3vw, 1.5rem)',
                  paddingTop: 'clamp(1.5rem, 4vw, 2rem)',
                  opacity: showSuccessScreen ? 0 : 1,
                  pointerEvents: showSuccessScreen ? 'none' : 'auto',
                  transition: 'opacity 0.3s ease'
                }}
              >
                {/* Logo Header */}
                {logoUrl && (
                  <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    marginBottom: 'clamp(1.5rem, 4vw, 2rem)'
                  }}>
                    <img 
                      src={logoUrl} 
                      alt="Logo" 
                      style={{
                        maxWidth: 'clamp(120px, 40vw, 200px)',
                        height: 'auto',
                        objectFit: 'contain'
                      }}
                    />
                  </div>
                )}

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(1rem, 3vw, 1.5rem)' }}>
                  {/* Tag-Auswahl */}
                  <div>
                    <Tabs value={selectedDay} onValueChange={(v) => {
                      addDebugLog(`Day changed to: ${v}`);
                      setSelectedDay(v as DayKey);
                    }}>
                      <div style={{
                        position: 'relative',
                        background: '#f3f4f6',
                        borderRadius: '0.75rem',
                        padding: 'clamp(0.25rem, 1vw, 0.375rem)',
                        isolation: 'isolate'
                      }}>
                        <motion.div
                          style={{ 
                            position: 'absolute',
                            backgroundColor: ACCENT_COLOR,
                            width: `calc(${100 / dayOrder.length}% - 6px)`,
                            zIndex: 1,
                            top: 'clamp(0.25rem, 1vw, 0.375rem)',
                            bottom: 'clamp(0.25rem, 1vw, 0.375rem)',
                            borderRadius: '0.5rem',
                            boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                            pointerEvents: 'none'
                          }}
                          layoutId="activeTab"
                          initial={false}
                          animate={{ 
                            left: `calc(${getActiveTabIndex() * (100 / dayOrder.length)}% + 6px)` 
                          }}
                          transition={{ 
                            type: 'spring', 
                            stiffness: 260, 
                            damping: 20,
                            mass: 0.8,
                          }}
                        />
                        <div style={{
                          position: 'relative',
                          display: 'grid',
                          width: '100%',
                          gridTemplateColumns: `repeat(${dayOrder.length}, 1fr)`,
                          zIndex: 2,
                          gap: 'clamp(0.25rem, 1vw, 0.375rem)'
                        }}>
                          {dayOrder.map((day) => {
                            const isActive = selectedDay === day;
                            return (
                              <button
                                key={day}
                                type="button"
                                onClick={() => setSelectedDay(day)}
                                style={{
                                  position: 'relative',
                                  fontWeight: 500,
                                  borderRadius: '0.5rem',
                                  transition: 'color 0.2s',
                                  background: 'transparent',
                                  border: 'none',
                                  cursor: 'pointer',
                                  color: isActive ? '#ffffff' : '#000000',
                                  zIndex: 3,
                                  fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
                                  padding: 'clamp(0.5rem, 2vw, 0.625rem)',
                                }}
                              >
                                {DAYS[day]}
                              </button>
                            );
                          })}
                        </div>
                      </div>

                      {dayOrder.map((day) => (
                        <TabsContent key={day} value={day} style={{ marginTop: 'clamp(0.75rem, 2vw, 1rem)' }}>
                          {!availabilityLoaded ? (
                            <div style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              padding: '2rem',
                              minHeight: '200px'
                            }}>
                              <div style={{ textAlign: 'center' }}>
                                <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
                                <p className="text-gray-600 text-sm">Verfügbarkeit wird geladen...</p>
                              </div>
                            </div>
                          ) : (isDayFullyBooked(day) || isDayDisabled(day)) ? (
                            <div style={{
                              textAlign: 'center',
                              padding: 'clamp(2rem, 6vw, 3rem) clamp(1rem, 3vw, 1.5rem)',
                              background: 'linear-gradient(135deg, #fef3c7 0%, #fde68a 100%)',
                              borderRadius: '1rem',
                              border: '2px solid #fbbf24'
                            }}>
                              <motion.div
                                initial={{ scale: 0.8, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ duration: 0.3 }}
                              >
                                <motion.div
                                  initial={{ scale: 0, rotate: -180 }}
                                  animate={{ scale: 1, rotate: 0 }}
                                  transition={{ type: 'spring', stiffness: 200, damping: 15 }}
                                  style={{ marginBottom: 'clamp(0.75rem, 2vw, 1rem)' }}
                                >
                                  <div style={{
                                    width: 'clamp(3rem, 10vw, 4rem)',
                                    height: 'clamp(3rem, 10vw, 4rem)',
                                    margin: '0 auto',
                                    background: '#fbbf24',
                                    borderRadius: '9999px',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center'
                                  }}>
                                    <CalendarX style={{ 
                                      width: 'clamp(1.5rem, 5vw, 2rem)', 
                                      height: 'clamp(1.5rem, 5vw, 2rem)',
                                      color: '#ffffff'
                                    }} />
                                  </div>
                                </motion.div>
                                <p style={{
                                  color: '#92400e',
                                  fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                                  lineHeight: 1.6,
                                  fontWeight: 500
                                }}>
                                  Leider sind keine freien Termine mehr für diesen Tag verfügbar.
                                </p>
                                <p style={{
                                  color: '#92400e',
                                  fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                                  lineHeight: 1.6,
                                  marginTop: 'clamp(0.5rem, 1.5vw, 0.75rem)'
                                }}>
                                  Kommen Sie aber gerne spontan bei uns am Stand vorbei! :)
                                </p>
                              </motion.div>
                            </div>
                          ) : (
                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(5, 1fr)',
                                gap: 'clamp(0.375rem, 1.5vw, 0.5rem)'
                              }}
                            >
                              {TIME_SLOTS[day].map((time) => {
                                const status = getSlotStatus(day, time);
                                const isSelected = selectedTime === time;
                                const isDisabled = !status.available;
                                const isPast = isSlotInPast(day, time);

                                return (
                                  <div key={time} style={{ position: 'relative' }}>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      disabled={isDisabled || isPast}
                                      onClick={() => {
                                        if (!isPast && !isDisabled) {
                                          addDebugLog(`Time selected: ${time}`);
                                          setSelectedTime(time);
                                        }
                                      }}
                                      style={{
                                        width: '100%',
                                        fontWeight: 600,
                                        borderRadius: '0.75rem',
                                        transition: 'all 0.2s',
                                        boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                                        backgroundColor: isSelected ? ACCENT_COLOR : COLORS.white,
                                        borderColor: isSelected ? ACCENT_COLOR : COLORS.grayBorder,
                                        color: isSelected ? ACCENT_FOREGROUND : COLORS.textBlack,
                                        fontSize: 'clamp(0.75rem, 2vw, 0.875rem)',
                                        padding: 'clamp(0.5rem, 2vw, 0.625rem) clamp(0.25rem, 1vw, 0.5rem)',
                                        opacity: (isDisabled || isPast) ? 0.3 : 1,
                                        cursor: (isDisabled || isPast) ? 'not-allowed' : 'pointer'
                                      }}
                                    >
                                      {time}
                                    </Button>

                                    {showSlotIndicator && status.booked > 0 && !isPast && (
                                      <Badge
                                        variant={status.booked >= maxBookingsPerSlot ? 'destructive' : 'secondary'}
                                        style={{
                                          position: 'absolute',
                                          top: '-0.25rem',
                                          right: '-0.25rem',
                                          fontSize: '10px',
                                          height: '1rem',
                                          padding: '0 0.375rem',
                                          borderRadius: '9999px',
                                          boxShadow: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                                          zIndex: 10
                                        }}
                                      >
                                        {status.booked}/{maxBookingsPerSlot}
                                      </Badge>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </TabsContent>
                      ))}
                    </Tabs>
                  </div>

                  {/* Formular - Rest (name, company, phone, email, message, privacy checkbox) bleibt unverändert... */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
                    <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.25rem, 1vw, 0.375rem)' }}>
                        <Label htmlFor="name" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: 'clamp(0.8rem, 2.5vw, 0.875rem)', fontWeight: 500, color: '#374151' }}>
                          <User style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
                          <span>Name *</span>
                        </Label>
                        <Input
                          id="name"
                          required
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Max Mustermann"
                          className="rounded-xl border-gray-200 bg-white shadow-sm focus:shadow-md" style={{ color: COLORS.textDark, height: 'clamp(2rem, 5vw, 2.5rem)', fontSize: 'clamp(0.8rem, 2.5vw, 0.875rem)', borderColor: formData.name && !validateName(formData.name) ? '#ef4444' : undefined }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.25rem, 1vw, 0.375rem)' }}>
                        <Label htmlFor="company" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: 'clamp(0.8rem, 2.5vw, 0.875rem)', fontWeight: 500, color: '#374151' }}>
                          <Building2 style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
                          <span>Betrieb</span>
                        </Label>
                        <Input
                          id="company"
                          value={formData.company}
                          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                          placeholder="Firma GmbH"
                          style={{ color: COLORS.textDark, height: 'clamp(2rem, 5vw, 2.5rem)', fontSize: 'clamp(0.8rem, 2.5vw, 0.875rem)' }}
                          className="rounded-xl border-gray-200 bg-white shadow-sm focus:shadow-md"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2" style={{ gap: 'clamp(0.75rem, 2vw, 1rem)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.25rem, 1vw, 0.375rem)' }}>
                        <Label htmlFor="phone" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: 'clamp(0.8rem, 2.5vw, 0.875rem)', fontWeight: 500, color: '#374151' }}>
                          <Phone style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
                          <span>Telefon *</span>
                        </Label>
                        <Input
                          id="phone"
                          type="tel"
                          required
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          placeholder="+49 123 456789"
                          className="rounded-xl border-gray-200 bg-white shadow-sm focus:shadow-md" style={{ color: COLORS.textDark, height: 'clamp(2rem, 5vw, 2.5rem)', fontSize: 'clamp(0.8rem, 2.5vw, 0.875rem)', borderColor: formData.phone && !validatePhone(formData.phone) ? '#ef4444' : undefined }}
                        />
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.25rem, 1vw, 0.375rem)' }}>
                        <Label htmlFor="email" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: 'clamp(0.8rem, 2.5vw, 0.875rem)', fontWeight: 500, color: '#374151' }}>
                          <Mail style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
                          <span>E-Mail *</span>
                        </Label>
                        <Input
                          id="email"
                          type="email"
                          required
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          placeholder="max@example.com"
                          className="rounded-xl border-gray-200 bg-white shadow-sm focus:shadow-md" style={{ color: COLORS.textDark, height: 'clamp(2rem, 5vw, 2.5rem)', fontSize: 'clamp(0.8rem, 2.5vw, 0.875rem)', borderColor: formData.email && !validateEmail(formData.email) ? '#ef4444' : undefined }}
                        />
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.25rem, 1vw, 0.375rem)' }}>
                      <Label htmlFor="message" style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', fontSize: 'clamp(0.8rem, 2.5vw, 0.875rem)', fontWeight: 500, color: '#374151' }}>
                        <MessageSquare style={{ width: '1rem', height: '1rem', flexShrink: 0 }} />
                        <span>Nachricht</span>
                      </Label>
                      <Textarea
                        id="message"
                        value={formData.message}
                        onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                        placeholder={messagePlaceholder}
                        rows={3}
                        style={{ color: COLORS.textDark, fontSize: 'clamp(0.8rem, 2.5vw, 0.875rem)' }}
                        className="resize-none rounded-xl border-gray-200 bg-white shadow-sm focus:shadow-md"
                      />
                    </div>
                    
                    {/* Privacy Checkbox */}
                    <div style={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      gap: '0.75rem',
                      padding: '0.75rem',
                      background: '#f9fafb',
                      borderRadius: '0.75rem',
                      border: '1px solid #e5e7eb'
                    }}>
                      <Checkbox
                        id="privacy"
                        checked={privacyAccepted}
                        onCheckedChange={(checked) => setPrivacyAccepted(checked as boolean)}
                        style={{
                          marginTop: '0.125rem'
                        }}
                      />
                      <Label 
                        htmlFor="privacy" 
                        style={{ 
                          fontSize: 'clamp(0.75rem, 2.5vw, 0.875rem)',
                          lineHeight: 1.3,
                          color: '#374151',
                          cursor: 'pointer',
                          flex: 1
                        }}
                      >
                        Ich habe die{' '}
                        <span
                          onClick={(e) => {
                            e.preventDefault();
                            setShowPrivacyOverlay(true);
                          }}
                          style={{
                            color: ACCENT_COLOR,
                            textDecoration: 'underline',
                            cursor: 'pointer'
                          }}
                        >
                          Datenschutzbestimmungen
                        </span>
                        {' '}gelesen und akzeptiere diese. *
                      </Label>
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div>
                    <Button
                      type="submit"
                      disabled={loading || !selectedTime || !availabilityLoaded || !validateFormData(formData).valid || !privacyAccepted}
                      style={{ 
                        width: '100%',
                        fontWeight: 600,
                        borderRadius: '0.75rem',
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                        transition: 'all 0.2s',
                        backgroundColor: ACCENT_COLOR,
                        color: ACCENT_FOREGROUND,
                        height: 'clamp(2.25rem, 6vw, 2.75rem)',
                        fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                        opacity: (loading || !selectedTime || !availabilityLoaded || !privacyAccepted) ? 0.5 : 1
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 'clamp(0.375rem, 1.5vw, 0.5rem)' }}>
                        {loading ? (
                          <>
                            <Loader2 style={{ width: 'clamp(0.875rem, 2.5vw, 1rem)', height: 'clamp(0.875rem, 2.5vw, 1rem)' }} className="animate-spin" />
                            Wird gebucht...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 style={{ width: 'clamp(0.875rem, 2.5vw, 1rem)', height: 'clamp(0.875rem, 2.5vw, 1rem)' }} />
                            Termin buchen
                          </>
                        )}
                      </div>
                    </Button>
                  </div>
                </form>
              </CardContent>

              {/* Success Screen - Verkürzt für Brevity */}
              <AnimatePresence>
                {(showSuccessScreen || showLoadingScreen) && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: showSuccessScreen ? 1 : 0, scale: showSuccessScreen ? 1 : 0.95 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 40,
                      background: '#ffffff',
                      borderRadius: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1rem'
                    }}
                  >
                    <div style={{ textAlign: 'center', maxWidth: '28rem', width: '100%' }}>
                      {bookedInfo.autoConfirmed ? (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: showSuccessScreen ? 1 : 0, rotate: showSuccessScreen ? 0 : -180 }}
                          transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.2 }}
                          style={{ marginBottom: 'clamp(1rem, 4vw, 1.5rem)' }}
                        >
                          <div style={{
                            width: 'clamp(4rem, 15vw, 6rem)',
                            height: 'clamp(4rem, 15vw, 6rem)',
                            margin: '0 auto',
                            background: '#dcfce7',
                            borderRadius: '9999px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center'
                          }}>
                            <CheckCircle2 style={{ 
                              width: 'clamp(2.5rem, 10vw, 3.5rem)', 
                              height: 'clamp(2.5rem, 10vw, 3.5rem)',
                              color: '#16a34a'
                            }} />
                          </div>
                        </motion.div>
                      ) : (
                        <AnimatedClock />
                      )}

                      <h2 style={{
                        fontWeight: 700,
                        color: '#111827',
                        fontSize: 'clamp(1.5rem, 5vw, 1.875rem)',
                        marginBottom: 'clamp(0.5rem, 2vw, 0.75rem)'
                      }}>
                        Nice to see you!
                      </h2>

                      <p style={{
                        color: '#6b7280',
                        fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                        marginBottom: 'clamp(0.25rem, 1vw, 0.5rem)'
                      }}>
                        {bookedInfo.autoConfirmed
                          ? 'Ihr Termin wurde erfolgreich gebucht!'
                          : 'Ihre Terminanfrage wurde eingereicht!'}
                      </p>

                      <p style={{
                        fontWeight: 600,
                        color: '#111827',
                        fontSize: 'clamp(1rem, 3.5vw, 1.125rem)',
                        marginBottom: 'clamp(2rem, 6vw, 3rem)'
                      }}>
                        {bookedInfo.day} um {bookedInfo.time} Uhr
                      </p>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 'clamp(0.75rem, 2vw, 1rem)', width: '100%' }}>
                        {bookedInfo.id && (
                          <Button
                            onClick={() => window.open(`${baseUrl}/termin/${bookedInfo.id}`, '_blank')}
                            style={{
                              fontWeight: 600,
                              borderRadius: '0.75rem',
                              boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                              transition: 'all 0.2s',
                              padding: 'clamp(1rem, 4vw, 1.5rem) clamp(1.5rem, 6vw, 2rem)',
                              fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                              backgroundColor: bookedInfo.autoConfirmed ? '#2d62ff' : '#10b981',
                              color: '#ffffff',
                              border: 'none',
                              cursor: 'pointer'
                            }}
                          >
                            Zum Termin →
                          </Button>
                        )}
                        <Button
                          onClick={resetToBooking}
                          variant="outline"
                          style={{
                            fontWeight: 600,
                            borderRadius: '0.75rem',
                            boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                            transition: 'all 0.2s',
                            padding: 'clamp(1rem, 4vw, 1.5rem) clamp(1.5rem, 6vw, 2rem)',
                            fontSize: 'clamp(0.875rem, 3vw, 1rem)',
                            backgroundColor: '#ffffff',
                            color: '#111827',
                            border: '1px solid #e5e7eb',
                            cursor: 'pointer'
                          }}
                        >
                          Bis dann! 👋
                        </Button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Loading Screen */}
              <AnimatePresence>
                {showLoadingScreen && (
                  <motion.div
                    initial={{ y: '100%' }}
                    animate={{ y: 0 }}
                    exit={{ y: '100%' }}
                    transition={{ type: 'spring', stiffness: 100, damping: 25 }}
                    style={{
                      position: 'absolute',
                      inset: 0,
                      zIndex: 50,
                      background: '#ffffff',
                      borderRadius: '1rem',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                  >
                    <div style={{ textAlign: 'center' }}>
                      <motion.div
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                      >
                        <Loader2 style={{ width: '4rem', height: '4rem', color: '#2563eb', margin: '0 auto 1rem' }} />
                      </motion.div>
                      <p style={{ fontSize: '1.125rem', color: '#6b7280' }}>
                        Termin wird gebucht...
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          </div>
        </motion.div>
      </div>
    );
  } catch (renderError) {
    console.error('Render error:', renderError);
    addDebugLog(`RENDER ERROR: ${renderError instanceof Error ? renderError.message : 'Unknown'}`);
    return (
      <div style={{
        maxWidth: '42rem',
        margin: '2rem auto',
        padding: '2rem',
        background: '#fee2e2',
        color: '#991b1b',
        borderRadius: '1rem',
        border: '2px solid #fca5a5'
      }}>
        <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem' }}>
          Rendering Error
        </h2>
        <p style={{ marginBottom: '0.5rem' }}>
          <strong>Error:</strong> {renderError instanceof Error ? renderError.message : 'Unknown error'}
        </p>
        <pre style={{ 
          background: 'white', 
          padding: '1rem', 
          borderRadius: '0.5rem', 
          overflow: 'auto',
          fontSize: '0.75rem'
        }}>
          {renderError instanceof Error ? renderError.stack : 'No stack trace'}
        </pre>
      </div>
    );
  }
}
