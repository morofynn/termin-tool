import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Calendar as CalendarIcon, Loader2, RefreshCw, CheckCircle2, XCircle, AlertCircle, Clock, User, Building2, ExternalLink } from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { baseUrl } from '../lib/base-url';
import { toast } from 'sonner';
import { format, parseISO } from 'date-fns';
import { de } from 'date-fns/locale';

import { getShortLabel, getDayName, getLongLabel, getEventYear } from '../lib/event-config';

interface AdminTimetableProps {
  isOpen: boolean;
  onClose: () => void;
  unseenCount?: number;
  onUnseenCountChange?: (count: number) => void;
}

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
  status: 'confirmed' | 'cancelled' | 'pending';
  createdAt: string;
  updatedAt?: string;
}

interface SeenAppointment {
  id: string;
  status: string;
  timestamp: string;
}

interface DayInfo {
  name: string;
  short: string;
  date: string;
  fullDate: string;
}

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

type DayKey = 'friday' | 'saturday' | 'sunday';

const SEEN_APPOINTMENTS_KEY = 'admin_seen_appointments';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-50 border-green-300 text-green-900';
    case 'cancelled':
      return 'bg-red-50 border-red-300 text-red-900';
    case 'pending':
      return 'bg-yellow-50 border-yellow-300 text-yellow-900';
    default:
      return 'bg-gray-100 border-gray-300 text-gray-800';
  }
};

const getStatusDot = (status: string) => {
  switch (status) {
    case 'confirmed':
      return 'bg-green-500';
    case 'cancelled':
      return 'bg-red-500';
    case 'pending':
      return 'bg-yellow-500';
    default:
      return 'bg-gray-500';
  }
};

const getStatusIcon = (status: string) => {
  switch (status) {
    case 'confirmed':
      return <CheckCircle2 className="w-3 h-3" />;
    case 'cancelled':
      return <XCircle className="w-3 h-3" />;
    case 'pending':
      return <Clock className="w-3 h-3" />;
    default:
      return <AlertCircle className="w-3 h-3" />;
  }
};

// Sichere Datums-Formatierung
const safeFormatDate = (dateString: string, formatString: string): string => {
  try {
    if (!dateString) return 'Ungültiges Datum';
    const date = parseISO(dateString);
    if (isNaN(date.getTime())) return 'Ungültiges Datum';
    return format(date, formatString, { locale: de });
  } catch {
    return 'Ungültiges Datum';
  }
};

export default function AdminTimetable({ isOpen, onClose, unseenCount, onUnseenCountChange }: AdminTimetableProps) {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [seenAppointments, setSeenAppointments] = useState<Map<string, SeenAppointment>>(new Map());
  const [currentEventYear, setCurrentEventYear] = useState<number>(2026);
  const [settings, setSettings] = useState<any>(null);
  
  // 🔥 Dynamische Day-Labels basierend auf Settings
  const [days, setDays] = useState<Record<DayKey, DayInfo>>({
    friday: { 
      name: 'Freitag', 
      short: 'Fr', 
      date: '16.01.', 
      fullDate: 'Freitag, 16.01.2026' 
    },
    saturday: { 
      name: 'Samstag', 
      short: 'Sa', 
      date: '17.01.', 
      fullDate: 'Samstag, 17.01.2026' 
    },
    sunday: { 
      name: 'Sonntag', 
      short: 'So', 
      date: '18.01.', 
      fullDate: 'Sonntag, 18.01.2026' 
    },
  });

  useEffect(() => {
    // Lade Settings und aktualisiere Day-Labels
    const fetchSettings = async () => {
      try {
        const response = await fetch(`${baseUrl}/api/admin/settings`);
        if (response.ok) {
          const data = await response.json();
          const loadedSettings = data.settings;
          setSettings(loadedSettings);
          
          const year = loadedSettings.eventYear || 2026;
          setCurrentEventYear(year);
          
          // 🔥 Dynamische Day-Labels mit Settings generieren
          setDays({
            friday: { 
              name: getDayName('friday', loadedSettings), 
              short: 'Fr', 
              date: getShortLabel('friday', loadedSettings).split(' ')[1], 
              fullDate: getLongLabel('friday', loadedSettings) 
            },
            saturday: { 
              name: getDayName('saturday', loadedSettings), 
              short: 'Sa', 
              date: getShortLabel('saturday', loadedSettings).split(' ')[1], 
              fullDate: getLongLabel('saturday', loadedSettings) 
            },
            sunday: { 
              name: getDayName('sunday', loadedSettings), 
              short: 'So', 
              date: getShortLabel('sunday', loadedSettings).split(' ')[1], 
              fullDate: getLongLabel('sunday', loadedSettings) 
            },
          });
        }
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    
    fetchSettings();
  }, []);

  useEffect(() => {
    // Lade gesehene Termine aus LocalStorage
    const loadSeenAppointments = () => {
      try {
        const stored = localStorage.getItem(SEEN_APPOINTMENTS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as SeenAppointment[];
          const map = new Map(parsed.map(sa => [sa.id, sa]));
          setSeenAppointments(map);
        }
      } catch (error) {
        console.error('Error loading seen appointments:', error);
      }
    };
    
    loadSeenAppointments();
  }, []);

  useEffect(() => {
    if (isOpen) {
      fetchAppointments();
    }
  }, [isOpen, currentEventYear]);

  useEffect(() => {
    // Berechne ungesehene Termine und informiere Parent
    if (appointments.length > 0 && onUnseenCountChange) {
      const count = appointments.filter(apt => isAppointmentUnseen(apt)).length;
      onUnseenCountChange(count);
    }
  }, [appointments, seenAppointments, onUnseenCountChange]);

  const saveSeenAppointments = (map: Map<string, SeenAppointment>) => {
    try {
      const array = Array.from(map.values());
      localStorage.setItem(SEEN_APPOINTMENTS_KEY, JSON.stringify(array));
    } catch (error) {
      console.error('Error saving seen appointments:', error);
    }
  };

  const isAppointmentUnseen = (apt: Appointment): boolean => {
    const seen = seenAppointments.get(apt.id);
    
    // Wenn nie gesehen, ist es unsichtbar
    if (!seen) return true;
    
    // Wenn Status sich geändert hat, ist es "neu"
    if (seen.status !== apt.status) return true;
    
    // Wenn updatedAt vorhanden ist und später als der "seen" Zeitstempel
    if (apt.updatedAt) {
      const updatedTime = new Date(apt.updatedAt).getTime();
      const seenTime = new Date(seen.timestamp).getTime();
      if (updatedTime > seenTime) return true;
    }
    
    return false;
  };

  const markAppointmentAsSeen = (apt: Appointment) => {
    const newSeen = new Map(seenAppointments);
    newSeen.set(apt.id, {
      id: apt.id,
      status: apt.status,
      timestamp: new Date().toISOString(),
    });
    setSeenAppointments(newSeen);
    saveSeenAppointments(newSeen);
  };

  const fetchAppointments = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }

    try {
      const response = await fetch(`${baseUrl}/api/admin/appointments`);
      if (response.ok) {
        const data: any = await response.json();
        const allAppointments = data.appointments || [];
        
        // 🔥 FILTER: Nur Termine aus dem aktuellen Event-Jahr anzeigen
        const filteredAppointments = allAppointments.filter((apt: Appointment) => {
          try {
            const aptDate = parseISO(apt.appointmentDate);
            if (isNaN(aptDate.getTime())) return false;
            return aptDate.getFullYear() === currentEventYear;
          } catch {
            return false;
          }
        });
        
        setAppointments(filteredAppointments);
        if (showRefreshing) {
          toast.success('Zeitplan aktualisiert');
        }
      } else {
        toast.error('Fehler beim Laden der Termine');
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
      toast.error('Verbindungsfehler');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchAppointments(true);
  };

  const viewAppointment = (apt: Appointment) => {
    // Markiere als gesehen
    markAppointmentAsSeen(apt);
    
    // Öffne Termin in neuem Tab
    window.open(`${baseUrl}/termin/${apt.id}`, '_blank');
  };

  const getAppointmentsForSlot = (day: DayKey, time: string) => {
    return appointments.filter(apt => apt.day === day && apt.time === time);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 z-50"
            style={{ backdropFilter: 'blur(4px)' }}
          />

          {/* Timetable Panel */}
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed left-0 right-0 bottom-0 top-16 bg-white shadow-2xl z-50 overflow-hidden flex flex-col rounded-t-3xl"
          >
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-3 sm:py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 sm:gap-3">
                  <div className="p-1.5 sm:p-2 bg-indigo-50 rounded-lg">
                    <CalendarIcon className="w-5 h-5 sm:w-6 sm:h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold text-gray-900">Zeitplan {currentEventYear}</h2>
                    <p className="text-xs sm:text-sm text-gray-600">
                      Termine für {settings?.eventName || 'OPTI'} {currentEventYear} {unseenCount && unseenCount > 0 && (
                        <span className="text-red-600 font-semibold">• {unseenCount} neu</span>
                      )}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    size="icon"
                    disabled={refreshing}
                    className="rounded-full text-gray-900 h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 sm:w-4 sm:h-4 ${refreshing ? 'animate-spin' : ''}`} />
                  </Button>
                  <Button
                    onClick={onClose}
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-gray-900 h-8 w-8 sm:h-10 sm:w-10"
                  >
                    <X className="w-4 h-4 sm:w-5 sm:h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="w-8 h-8 sm:w-10 sm:h-10 animate-spin text-indigo-600 mb-3 sm:mb-4" />
                  <p className="text-xs sm:text-sm text-gray-600">Zeitplan wird geladen...</p>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="p-3 sm:p-6">
                    {/* Legend - Minimalistisch und schön */}
                    <div className="mb-4 sm:mb-6 flex items-center justify-center gap-4 sm:gap-6 py-2 sm:py-3 px-3 sm:px-4 bg-gray-50 rounded-lg sm:rounded-xl border border-gray-200">
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-yellow-500" />
                        <span className="text-[10px] sm:text-sm text-gray-700">Ausstehend</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-green-500" />
                        <span className="text-[10px] sm:text-sm text-gray-700">Bestätigt</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-500" />
                        <span className="text-[10px] sm:text-sm text-gray-700">Storniert</span>
                      </div>
                      <div className="flex items-center gap-1.5 sm:gap-2">
                        <div className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-red-600 animate-pulse" />
                        <span className="text-[10px] sm:text-sm text-gray-700 font-semibold">Neu/Geändert</span>
                      </div>
                    </div>

                    {/* Timetable Grid */}
                    <div className="grid grid-cols-4 gap-2 sm:gap-4">
                      {/* Header Row - Zeit-Spalte */}
                      <div className="sticky top-0 bg-white z-20 pb-2">
                        <div className="text-center font-semibold text-gray-700 text-[10px] sm:text-sm py-2 sm:py-3 bg-gray-100 rounded-md sm:rounded-lg">
                          Zeit
                        </div>
                      </div>

                      {/* Header Row - Tage */}
                      {(Object.keys(days) as DayKey[]).map((day) => (
                        <div key={day} className="sticky top-0 bg-white z-20 pb-2">
                          <div className="text-center font-semibold text-gray-900 py-2 sm:py-3 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-md sm:rounded-lg border border-indigo-200">
                            <div className="text-xs sm:text-base">{days[day].short}</div>
                            <div className="text-[9px] sm:text-xs text-gray-600 mt-0.5">{days[day].date}</div>
                          </div>
                        </div>
                      ))}

                      {/* Time Rows */}
                      {Array.from(new Set([
                        ...TIME_SLOTS.friday,
                        ...TIME_SLOTS.saturday,
                        ...TIME_SLOTS.sunday
                      ])).sort().map((time) => (
                        <>
                          {/* Zeit-Label */}
                          <div key={`time-${time}`} className="flex items-start justify-center pt-2 sm:pt-4">
                            <Badge variant="outline" className="text-[9px] sm:text-xs font-semibold text-gray-700 bg-gray-50 px-1.5 sm:px-2 py-0.5 sm:py-1">
                              {time}
                            </Badge>
                          </div>

                          {/* Slots für jeden Tag */}
                          {(Object.keys(days) as DayKey[]).map((day) => {
                            const hasSlot = TIME_SLOTS[day].includes(time);
                            const slotAppointments = hasSlot ? getAppointmentsForSlot(day, time) : [];

                            return (
                              <div key={`${day}-${time}`} className="min-h-[60px] sm:min-h-[80px]">
                                {hasSlot ? (
                                  slotAppointments.length > 0 ? (
                                    <div className="space-y-1.5 sm:space-y-2">
                                      {slotAppointments.map((apt) => {
                                        const isUnseen = isAppointmentUnseen(apt);
                                        
                                        return (
                                          <motion.div
                                            key={apt.id}
                                            initial={{ opacity: 0, scale: 0.95 }}
                                            animate={{ opacity: 1, scale: 1 }}
                                            whileHover={{ scale: 1.02 }}
                                            transition={{ duration: 0.2 }}
                                          >
                                            <Card
                                              className={`cursor-pointer hover:shadow-md transition-all border rounded-lg sm:rounded-xl ${getStatusColor(apt.status)} relative overflow-hidden`}
                                              onClick={() => viewAppointment(apt)}
                                            >
                                              {/* Unseen Indicator - Oben rechts, pulsierender Punkt */}
                                              {isUnseen && (
                                                <motion.div
                                                  initial={{ scale: 0 }}
                                                  animate={{ scale: 1 }}
                                                  className="absolute top-1 right-1 w-2 h-2 sm:w-2.5 sm:h-2.5 bg-red-600 rounded-full animate-pulse shadow-lg"
                                                  style={{ zIndex: 5 }}
                                                />
                                              )}

                                              {/* Status Indicator - Links */}
                                              <div className={`absolute left-0 top-0 bottom-0 w-0.5 sm:w-1 ${getStatusDot(apt.status)}`} />
                                              
                                              <CardContent className="p-2 sm:p-3 pl-2.5 sm:pl-4">
                                                <div className="flex items-start justify-between gap-1 sm:gap-2 mb-1 sm:mb-2">
                                                  <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                                                    <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full flex-shrink-0 ${getStatusDot(apt.status)}`} />
                                                    <span className={`font-semibold text-[10px] sm:text-sm truncate ${isUnseen ? 'text-gray-900' : ''}`}>
                                                      {apt.name}
                                                    </span>
                                                  </div>
                                                  <ExternalLink className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0 opacity-50" />
                                                </div>

                                                {/* 🔥 DYNAMISCHES DATUM statt statisches Label */}
                                                <div className="text-[8px] sm:text-xs text-gray-600 ml-2.5 sm:ml-4 mb-1 opacity-70">
                                                  {safeFormatDate(apt.appointmentDate, 'dd.MM.yyyy')}
                                                </div>

                                                {/* Betrieb - nur auf Desktop */}
                                                {apt.company && (
                                                  <div className="hidden md:flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs opacity-70 ml-2.5 sm:ml-4 mb-1">
                                                    <Building2 className="w-2.5 h-2.5 sm:w-3 sm:h-3 flex-shrink-0" />
                                                    <span className="truncate">{apt.company}</span>
                                                  </div>
                                                )}

                                                {/* Email - Auf Desktop mit Icon, auf Mobile ohne */}
                                                <div className="flex items-center gap-1 sm:gap-1.5 text-[9px] sm:text-xs opacity-80 ml-2.5 sm:ml-4">
                                                  <User className="w-2.5 h-2.5 sm:w-3 sm:h-3 hidden sm:block" />
                                                  <span className="truncate">{apt.email}</span>
                                                </div>
                                              </CardContent>
                                            </Card>
                                          </motion.div>
                                        );
                                      })}
                                    </div>
                                  ) : (
                                    <div className="h-full flex items-center justify-center">
                                      <div className="w-full h-12 sm:h-16 rounded-md sm:rounded-lg border-2 border-dashed border-gray-200 bg-gray-50/50 flex items-center justify-center">
                                        <span className="text-[9px] sm:text-xs text-gray-400">Frei</span>
                                      </div>
                                    </div>
                                  )
                                ) : (
                                  <div className="h-full flex items-center justify-center">
                                    <div className="w-full h-12 sm:h-16 rounded-md sm:rounded-lg bg-gray-100/50" />
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </>
                      ))}
                    </div>
                  </div>
                </ScrollArea>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
