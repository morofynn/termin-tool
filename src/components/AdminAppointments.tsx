import { useState, useEffect } from 'react';
import {
  Calendar,
  Building2,
  Phone,
  Mail,
  MessageSquare,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  Filter,
  Check,
  X,
  Trash2,
  ArrowLeft,
  Settings,
  Clock,
  ExternalLink,
  Ban,
  CalendarDays,
  Search,
  FileText,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { Separator } from './ui/separator';
import { Input } from './ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
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
import { baseUrl } from '../lib/base-url';
import AdminSettings from './AdminSettings';
import { format, isValid, parseISO } from 'date-fns';
import AdminAuditLog from './AdminAuditLog';
import AdminTimetable from './AdminTimetable';
import AdminDocumentation from './AdminDocumentation';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';
import { getLongLabel } from '../lib/event-config';
import { VersionBadge } from './VersionBadge';

interface Appointment {
  id: string;
  day: string;
  time: string;
  name: string;
  company?: string;
  phone: string;
  email: string;
  message?: string;
  appointmentDate: string;
  googleEventId?: string;
  status: 'confirmed' | 'cancelled' | 'pending';
  createdAt: string;
  updatedAt?: string;
}

interface AppointmentsResponse {
  appointments: Appointment[];
}

interface SeenAppointment {
  id: string;
  status: string;
  timestamp: string;
}

const SEEN_APPOINTMENTS_KEY = 'admin_seen_appointments';

// Sichere Datums-Parsing Funktion
const safeParseDate = (dateString: string): Date | null => {
  try {
    if (!dateString) return null;
    const parsed = parseISO(dateString);
    return isValid(parsed) ? parsed : null;
  } catch {
    return null;
  }
};

// Sichere Datums-Formatierung
const safeFormatDate = (dateString: string, formatString: string): string => {
  try {
    const date = safeParseDate(dateString);
    if (!date) return 'Ungültiges Datum';
    return format(date, formatString, { locale: de });
  } catch {
    return 'Ungültiges Datum';
  }
};

// Hilfsfunktion: Ist ein Termin "unseen"?
const isAppointmentUnseen = (apt: Appointment, seenMap: Map<string, SeenAppointment>): boolean => {
  const seen = seenMap.get(apt.id);
  
  // Wenn nie gesehen, ist es unseen
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

// Hilfsfunktion: Berechne unseen count
const calculateUnseenCount = (appointments: Appointment[], seenMap: Map<string, SeenAppointment>): number => {
  return appointments.filter(apt => isAppointmentUnseen(apt, seenMap)).length;
};

export default function AdminAppointments() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
  const [appointmentToDelete, setAppointmentToDelete] = useState<string | null>(null);
  const [appointmentToCancel, setAppointmentToCancel] = useState<string | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [timetableOpen, setTimetableOpen] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);
  const [documentationOpen, setDocumentationOpen] = useState(false);
  const [seenAppointments, setSeenAppointments] = useState<Map<string, SeenAppointment>>(new Map());
  
  const [auditLogOpen, setAuditLogOpen] = useState(false);
  // Filter States
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [dayFilter, setDayFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('created-desc');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Warning states für Settings-Button
  const [hasActiveWarnings, setHasActiveWarnings] = useState(false);
  const [calendarConfigured, setCalendarConfigured] = useState(true);
  const [emailConfigured, setEmailConfigured] = useState(true);
  const [maintenanceMode, setMaintenanceMode] = useState(false);

  // NEUE: Lade gesehene Termine aus LocalStorage beim Start
  useEffect(() => {
    const loadSeenAppointments = () => {
      try {
        const stored = localStorage.getItem(SEEN_APPOINTMENTS_KEY);
        if (stored) {
          const parsed = JSON.parse(stored) as SeenAppointment[];
          const map = new Map(parsed.map(sa => [sa.id, sa]));
          setSeenAppointments(map);
          console.log(`📖 Loaded ${map.size} seen appointments from localStorage`);
        }
      } catch (error) {
        console.error('Error loading seen appointments:', error);
      }
    };
    
    loadSeenAppointments();
  }, []);

  // NEUE: Berechne unseen count wenn sich appointments oder seenAppointments ändern
  useEffect(() => {
    if (appointments.length > 0) {
      const count = calculateUnseenCount(appointments, seenAppointments);
      setUnseenCount(count);
      console.log(`🔔 Unseen count updated: ${count}`);
    }
  }, [appointments, seenAppointments]);

  // Check settings warnings
  useEffect(() => {
    checkSettingsWarnings();
  }, []);

  const checkSettingsWarnings = async () => {
    try {
      // Check Calendar
      const calendarResponse = await fetch(`${baseUrl}/api/admin/calendar-status`);
      let calendarData = { configured: true };
      if (calendarResponse.ok) {
        calendarData = await calendarResponse.json();
        setCalendarConfigured(calendarData.configured);
      }

      // Check Settings
      const settingsResponse = await fetch(`${baseUrl}/api/admin/settings`);
      if (settingsResponse.ok) {
        const settingsData = await settingsResponse.json();
        const settings = (settingsData as any).settings;
        
        setMaintenanceMode(settings.maintenanceMode || false);
        setEmailConfigured(calendarData.configured);
        
        // Setze Warning-Flag
        const hasWarning = 
          settings.maintenanceMode || 
          !calendarData.configured ||
          (settings.emailNotifications && !calendarData.configured);
        
        setHasActiveWarnings(hasWarning);
      }
    } catch (error) {
      console.error('Error checking settings warnings:', error);
    }
  };

  const fetchAppointments = async () => {
    console.log('🔄 Fetching appointments...');
    try {
      setLoading(true);
      setError(null);
      
      const url = `${baseUrl}/api/admin/appointments`;
      console.log('📡 Fetching from:', url);
      
      const response = await fetch(url);
      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Error response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json() as AppointmentsResponse;
      console.log('✅ Data received:', data);
      
      if (data && Array.isArray(data.appointments)) {
        console.log(`📋 ${data.appointments.length} appointments loaded`);
        
        // Validiere und filtere Appointments mit ungültigen Daten
        const validAppointments = data.appointments.filter(apt => {
          const hasValidDate = safeParseDate(apt.appointmentDate) !== null;
          const hasValidCreated = safeParseDate(apt.createdAt) !== null;
          
          if (!hasValidDate || !hasValidCreated) {
            console.warn('⚠️ Invalid appointment date:', apt.id, {
              appointmentDate: apt.appointmentDate,
              createdAt: apt.createdAt
            });
          }
          
          return hasValidDate && hasValidCreated;
        });
        
        console.log(`✅ ${validAppointments.length} valid appointments`);
        setAppointments(validAppointments);
      } else {
        console.warn('⚠️ Invalid data format:', data);
        setAppointments([]);
      }
    } catch (err) {
      console.error('💥 Fetch error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Verbindungsfehler';
      setError(errorMessage);
      toast.error('Fehler beim Laden: ' + errorMessage);
    } finally {
      console.log('✅ Loading complete');
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log('🚀 Component mounted, fetching appointments');
    fetchAppointments();
  }, []);

  const updateAppointmentStatus = async (id: string, status: 'confirmed' | 'cancelled') => {
    setUpdatingId(id);
    try {
      const action = status === 'confirmed' ? 'confirm' : 'cancel';
      const response = await fetch(`${baseUrl}/api/admin/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: id, action }),
      });

      if (response.ok) {
        setAppointments(prev =>
          prev.map(apt => (apt.id === id ? { ...apt, status, updatedAt: new Date().toISOString() } : apt))
        );
        toast.success(
          status === 'confirmed'
            ? 'Termin wurde bestätigt'
            : 'Termin wurde storniert'
        );
      } else {
        const data = await response.json();
        toast.error((data as any).message || 'Fehler beim Aktualisieren');
      }
    } catch (err) {
      console.error('Error updating appointment:', err);
      toast.error('Verbindungsfehler');
    } finally {
      setUpdatingId(null);
    }
  };

  const handleDeleteAppointment = async (id: string) => {
    console.log(`🗑️ Frontend: Starting delete for appointment ${id}`);
    setUpdatingId(id);
    
    try {
      console.log(`📡 Sending DELETE request to ${baseUrl}/api/admin/appointments`);
      const response = await fetch(`${baseUrl}/api/admin/appointments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointmentId: id, action: 'delete' }),
      });

      console.log(`📥 Delete response status: ${response.status}`);
      
      if (response.ok) {
        const result = await response.json();
        console.log('✅ Delete successful:', result);
        
        setAppointments(prev => prev.filter(apt => apt.id !== id));
        toast.success('Termin wurde gelöscht');
      } else {
        const errorData = await response.json();
        console.error('❌ Delete failed:', errorData);
        
        const errorMsg = (errorData as any).error || (errorData as any).message || 'Fehler beim Löschen';
        const detailsMsg = (errorData as any).details ? ` (${(errorData as any).details})` : '';
        
        toast.error(errorMsg + detailsMsg);
      }
    } catch (err) {
      console.error('💥 Delete error:', err);
      const errorMessage = err instanceof Error ? err.message : 'Unbekannter Fehler';
      toast.error(`Verbindungsfehler: ${errorMessage}`);
    } finally {
      setUpdatingId(null);
      setDeleteDialogOpen(false);
      setAppointmentToDelete(null);
      console.log('✅ Delete operation complete');
    }
  };

  const confirmAppointment = (id: string) => {
    updateAppointmentStatus(id, 'confirmed');
  };

  const openCancelDialog = (id: string) => {
    setAppointmentToCancel(id);
    setCancelDialogOpen(true);
  };

  const cancelAppointment = () => {
    if (appointmentToCancel) {
      updateAppointmentStatus(appointmentToCancel, 'cancelled');
      setCancelDialogOpen(false);
      setAppointmentToCancel(null);
    }
  };

  const openDeleteDialog = (id: string) => {
    setAppointmentToDelete(id);
    setDeleteDialogOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'confirmed':
        return (
          <Badge className="bg-green-100 text-green-800 hover:bg-green-100 flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Bestätigt
          </Badge>
        );
      case 'cancelled':
        return (
          <Badge className="bg-red-100 text-red-800 hover:bg-red-100 flex items-center gap-1.5">
            <XCircle className="w-3.5 h-3.5" />
            Storniert
          </Badge>
        );
      case 'pending':
        return (
          <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100 flex items-center gap-1.5">
            <Clock className="w-3.5 h-3.5" />
            Ausstehend
          </Badge>
        );
      default:
        return null;
    }
  };

  // Filter & Sort Logic
  const filteredAppointments = appointments.filter(apt => {
    // Status Filter
    if (statusFilter !== 'all' && apt.status !== statusFilter) return false;
    
    // Day Filter
    if (dayFilter !== 'all' && apt.day !== dayFilter) return false;
    
    // Search Query (name, company, email, phone, year, date)
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      
      // Extrahiere Jahr aus appointmentDate für Suche
      const appointmentYear = safeParseDate(apt.appointmentDate)?.getFullYear().toString() || '';
      const formattedDate = safeFormatDate(apt.appointmentDate, 'dd.MM.yyyy');
      
      const searchableText = [
        apt.name,
        apt.company || '',
        apt.email,
        apt.phone,
        apt.message || '',
        appointmentYear,
        formattedDate
      ].join(' ').toLowerCase();
      
      if (!searchableText.includes(query)) return false;
    }
    return true;
  });

  // Sort Logic
  const sortedAppointments = [...filteredAppointments].sort((a, b) => {
    switch (sortBy) {
      case 'created-desc':
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      case 'created-asc':
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      case 'date-asc':
        return new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime();
      case 'date-desc':
        return new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime();
      case 'name-asc':
        return a.name.localeCompare(b.name);
      case 'name-desc':
        return b.name.localeCompare(a.name);
      default:
        return 0;
    }
  });

  const handleUnseenCountChange = (newCount: number) => {
    setUnseenCount(newCount);
  };

  return (
    <div className="container mx-auto p-2 sm:p-4 md:p-6 lg:p-8 max-w-7xl">
      {/* Header mit Titel, Refresh und Settings */}
      <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 rounded-lg block">
            <CalendarDays className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
          </div>
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-1 sm:mb-2">Terminverwaltung</h1>
            <p className="text-sm sm:text-base text-gray-600">
              Übersicht aller gebuchten Termine
            </p>
          </div>
        </div>
        
        {/* Mobile: Zeitplan oben, dann andere Buttons in Reihe | Desktop: Alle nebeneinander */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3 w-full sm:w-auto">
          {/* Zeitplan Button - volle Breite auf Mobile */}
          <Button
            onClick={() => setTimetableOpen(true)}
            variant="default"
            size="default"
            className="gap-2 rounded-xl shadow-md hover:shadow-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold px-4 sm:px-6 text-sm w-full sm:w-auto relative"
          >
            <CalendarDays className="w-4 h-4 sm:w-5 sm:h-5" />
            Zeitplan Ansicht
            {unseenCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500 text-white text-[10px] font-bold items-center justify-center shadow-lg">
                  {unseenCount}
                </span>
              </span>
            )}
          </Button>
          

          {/* Andere Buttons - horizontale Reihe auf Mobile */}

          <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-start">

            <Button
              onClick={() => setDocumentationOpen(true)}
              variant="outline"
              size="icon"
              className="rounded-xl shadow-md hover:shadow-lg text-gray-900 h-10 w-10"
            >
              <FileText className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => setAuditLogOpen(true)}
              variant="outline"
              size="icon"
              className="rounded-xl shadow-md hover:shadow-lg text-gray-900 h-10 w-10"
            >
              <Clock className="w-5 h-5" />
            </Button>
            <Button
              onClick={() => setSettingsOpen(true)}
              variant="outline"
              size="icon"
              className="rounded-xl shadow-md hover:shadow-lg text-gray-900 h-10 w-10 relative"
            >
              <Settings className="w-5 h-5" />
              {hasActiveWarnings && (
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
                </span>
              )}
            </Button>
            <Button
              onClick={() => fetchAppointments()}
              variant="outline"
              size="icon"
              disabled={loading}
              className="rounded-xl shadow-md hover:shadow-lg text-gray-900 h-10 w-10"
            >
              <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
            </Button>
          </div>

        </div>
      </div>

      {/* Filter & Search */}
      <Card className="mb-4 sm:mb-6 shadow-md">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Search */}
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Suchen (Name, Firma, E-Mail...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 text-gray-900"
                />
              </div>
            </div>

            {/* Status Filter */}
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="text-gray-900">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="pending">Ausstehend</SelectItem>
                <SelectItem value="confirmed">Bestätigt</SelectItem>
                <SelectItem value="cancelled">Storniert</SelectItem>
              </SelectContent>
            </Select>

            {/* Day Filter */}
            <Select value={dayFilter} onValueChange={setDayFilter}>
              <SelectTrigger className="text-gray-900">
                <SelectValue placeholder="Tag" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Tage</SelectItem>
                <SelectItem value="friday">Freitag</SelectItem>
                <SelectItem value="saturday">Samstag</SelectItem>
                <SelectItem value="sunday">Sonntag</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Sort */}
          <div className="mt-3 sm:mt-4 flex items-center gap-2 sm:gap-3">
            <Filter className="w-4 h-4 text-gray-600 flex-shrink-0" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="max-w-xs text-gray-900">
                <SelectValue placeholder="Sortieren" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="created-desc">Neueste zuerst</SelectItem>
                <SelectItem value="created-asc">Älteste zuerst</SelectItem>
                <SelectItem value="date-asc">Termin aufsteigend</SelectItem>
                <SelectItem value="date-desc">Termin absteigend</SelectItem>
                <SelectItem value="name-asc">Name A-Z</SelectItem>
                <SelectItem value="name-desc">Name Z-A</SelectItem>
              </SelectContent>
            </Select>
            {(statusFilter !== 'all' || dayFilter !== 'all' || searchQuery) && (
              <Button
                onClick={() => {
                  setStatusFilter('all');
                  setDayFilter('all');
                  setSearchQuery('');
                }}
                variant="ghost"
                size="sm"
                className="text-gray-900"
              >
                <X className="w-4 h-4 mr-1" />
                Filter zurücksetzen
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
        <Card className="shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Gesamt</p>
                <p className="text-xl sm:text-2xl font-bold text-gray-900">{appointments.length}</p>
              </div>
              <Calendar className="w-8 h-8 sm:w-10 sm:h-10 text-indigo-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Ausstehend</p>
                <p className="text-xl sm:text-2xl font-bold text-yellow-600">
                  {appointments.filter(a => a.status === 'pending').length}
                </p>
              </div>
              <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Bestätigt</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">
                  {appointments.filter(a => a.status === 'confirmed').length}
                </p>
              </div>
              <CheckCircle2 className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardContent className="p-3 sm:p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs sm:text-sm text-gray-600 mb-1">Storniert</p>
                <p className="text-xl sm:text-2xl font-bold text-red-600">
                  {appointments.filter(a => a.status === 'cancelled').length}
                </p>
              </div>
              <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Appointments List */}
      {loading ? (
        <Card className="shadow-md">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Loader2 className="w-10 h-10 sm:w-12 sm:h-12 animate-spin text-indigo-600" />
              <p className="text-sm sm:text-base text-gray-600">Termine werden geladen...</p>
            </div>
          </CardContent>
        </Card>
      ) : error ? (
        <Card className="shadow-md border-red-200 bg-red-50">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <AlertCircle className="w-10 h-10 sm:w-12 sm:h-12 text-red-600" />
              <div className="text-center">
                <p className="text-base sm:text-lg font-semibold text-red-900 mb-2">Fehler beim Laden</p>
                <p className="text-xs sm:text-sm text-red-700">{error}</p>
              </div>
              <Button onClick={() => fetchAppointments()} variant="outline" className="text-gray-900">
                <RefreshCw className="w-4 h-4 mr-2" />
                Erneut versuchen
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : sortedAppointments.length === 0 ? (
        <Card className="shadow-md">
          <CardContent className="p-6 sm:p-8">
            <div className="flex flex-col items-center justify-center space-y-4">
              <Calendar className="w-10 h-10 sm:w-12 sm:h-12 text-gray-400" />
              <div className="text-center">
                <p className="text-base sm:text-lg font-semibold text-gray-900 mb-2">
                  {searchQuery || statusFilter !== 'all' || dayFilter !== 'all'
                    ? 'Keine Termine gefunden'
                    : 'Keine Termine vorhanden'}
                </p>
                <p className="text-xs sm:text-sm text-gray-600">
                  {searchQuery || statusFilter !== 'all' || dayFilter !== 'all'
                    ? 'Versuchen Sie es mit anderen Filterkriterien.'
                    : 'Es wurden noch keine Termine gebucht.'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3 sm:space-y-4">
          {sortedAppointments.map((appointment) => (
            <Card
              key={appointment.id}
              className="hover:shadow-lg transition-all duration-200 shadow-md"
            >
              <CardHeader className="pb-3 sm:pb-4">
                <div className="flex flex-col gap-3">
                  {/* Top Row: Name + Status + Badges */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 sm:gap-3">
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <CardTitle className="text-base sm:text-lg text-gray-900">{appointment.name}</CardTitle>
                        {getStatusBadge(appointment.status)}
                        {appointment.googleEventId && (
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-300 flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            Google Calendar
                          </Badge>
                        )}
                      </div>
                      {appointment.company && (
                        <CardDescription className="flex items-center gap-2 text-gray-700">
                          <Building2 className="w-4 h-4 flex-shrink-0" />
                          {appointment.company}
                        </CardDescription>
                      )}
                    </div>
                  </div>
                  
                  {/* Action Buttons - Eigene Reihe mit Wrapping */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {appointment.status === 'pending' && (
                      <>
                        <Button
                          onClick={() => confirmAppointment(appointment.id)}
                          disabled={updatingId === appointment.id}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                        >
                          {updatingId === appointment.id ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <>
                              <Check className="w-4 h-4 mr-1" />
                              <span>Bestätigen</span>
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => openCancelDialog(appointment.id)}
                          disabled={updatingId === appointment.id}
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                        >
                          <Ban className="w-4 h-4 mr-1" />
                          <span>Ablehnen</span>
                        </Button>
                      </>
                    )}
                    
                    {appointment.status === 'confirmed' && (
                      <Button
                        onClick={() => openCancelDialog(appointment.id)}
                        disabled={updatingId === appointment.id}
                        size="sm"
                        variant="outline"
                        className="border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-sm"
                      >
                        <X className="w-4 h-4 mr-1" />
                        <span>Stornieren</span>
                      </Button>
                    )}

                    <Button
                      onClick={() => {
                        window.open(`${baseUrl}/termin/${appointment.id}`, '_blank');
                      }}
                      size="sm"
                      variant="outline"
                      className="text-gray-900 hover:bg-gray-50 rounded-lg border-gray-300"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      onClick={() => openDeleteDialog(appointment.id)}
                      disabled={updatingId === appointment.id}
                      size="sm"
                      variant="outline"
                      className="text-gray-900 hover:bg-gray-50 rounded-lg border-gray-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  {/* Left Column */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                      <Calendar className="w-4 h-4 flex-shrink-0" />
                      {/* 🔥 DYNAMISCHES DATUM AUS appointmentDate */}
                      <span className="font-medium">{safeFormatDate(appointment.appointmentDate, 'EEEE, dd. MMMM yyyy')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                      <Clock className="w-4 h-4 flex-shrink-0" />
                      <span className="font-medium">{appointment.time} Uhr</span>
                    </div>
                  </div>

                  {/* Right Column */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                      <Phone className="w-4 h-4 flex-shrink-0" />
                      <a href={`tel:${appointment.phone}`} className="text-blue-600 hover:text-blue-800">
                        {appointment.phone}
                      </a>
                    </div>
                    <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-700">
                      <Mail className="w-4 h-4 flex-shrink-0" />
                      <a href={`mailto:${appointment.email}`} className="text-blue-600 hover:text-blue-800 truncate">
                        {appointment.email}
                      </a>
                    </div>
                  </div>
                </div>

                {appointment.message && (
                  <>
                    <Separator className="my-3 sm:my-4" />
                    <div className="flex gap-2">
                      <MessageSquare className="w-4 h-4 text-gray-400 flex-shrink-0 mt-0.5" />
                      <p className="text-xs sm:text-sm text-gray-600 italic">{appointment.message}</p>
                    </div>
                  </>
                )}

                <Separator className="my-3 sm:my-4" />
                <div className="flex items-center justify-between text-[10px] sm:text-xs text-gray-500">
                  <span>Erstellt: {safeFormatDate(appointment.createdAt, 'dd.MM.yyyy HH:mm')} Uhr</span>
                  <span className="text-gray-400">ID: {appointment.id.slice(0, 8)}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Footer mit Version Badge */}
      <div className="mt-8 pt-6 border-t border-gray-200">
        <div className="flex justify-center">
          <VersionBadge variant="clickable" className="text-xs text-gray-400 hover:text-blue-500 transition-colors cursor-pointer" />
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Termin löschen?</AlertDialogTitle>
            <AlertDialogDescription>
              Diese Aktion kann nicht rückgängig gemacht werden. Der Termin wird dauerhaft gelöscht.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setDeleteDialogOpen(false);
              setAppointmentToDelete(null);
            }}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => appointmentToDelete && handleDeleteAppointment(appointmentToDelete)}
              className="bg-red-600 hover:bg-red-700"
            >
              Löschen
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Cancel Confirmation Dialog */}
      <AlertDialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Termin stornieren/ablehnen?</AlertDialogTitle>
            <AlertDialogDescription>
              Der Termin wird als storniert markiert. Diese Aktion informiert den Kunden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setCancelDialogOpen(false);
              setAppointmentToCancel(null);
            }}>
              Abbrechen
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={cancelAppointment}
              className="bg-red-600 hover:bg-red-700"
            >
              Stornieren
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Settings Panel */}
      <AdminSettings isOpen={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <AdminAuditLog isOpen={auditLogOpen} onClose={() => setAuditLogOpen(false)} />
      <AdminTimetable 
        isOpen={timetableOpen} 
        onClose={() => setTimetableOpen(false)}
        unseenCount={unseenCount}
        onUnseenCountChange={handleUnseenCountChange}
      />
      <AdminDocumentation isOpen={documentationOpen} onClose={() => setDocumentationOpen(false)} />
    </div>
  );
}
