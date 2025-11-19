import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X,
  Clock,
  Loader2,
  AlertCircle,
  Calendar,
  CheckCircle2,
  XCircle,
  RefreshCw,
  User,
  Trash2,
  Settings,
  UserPlus,
  Mail,
  Edit,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Badge } from './ui/badge';
import { ScrollArea } from './ui/scroll-area';
import { baseUrl } from '../lib/base-url';
import { format, parseISO, isValid } from 'date-fns';
import { de } from 'date-fns/locale';
import { toast } from 'sonner';

interface AdminAuditLogProps {
  isOpen: boolean;
  onClose: () => void;
}

interface AuditLogEntry {
  id: string;
  timestamp: string;
  action: string;
  details: string;
  type?: 'settings_change' | 'appointment_created' | 'appointment_confirmed' | 'appointment_cancelled' | 'appointment_deleted' | 'bulk_delete' | 'audit_log_deleted';
  user?: string;
  appointmentId?: string;
  metadata?: Record<string, unknown>;
}

const safeFormatDate = (dateString: string): string => {
  try {
    const date = parseISO(dateString);
    if (!isValid(date)) return 'Ungültiges Datum';
    return format(date, 'dd.MM.yyyy HH:mm:ss', { locale: de });
  } catch {
    return 'Ungültiges Datum';
  }
};

const getActionIcon = (action: string) => {
  const actionLower = action.toLowerCase();
  
  // Wichtig: "gebucht" VOR "bestätigt" prüfen!
  if (actionLower.includes('gebucht') || actionLower.includes('booked') || actionLower.includes('created') || actionLower.includes('new appointment')) {
    return <Calendar className="w-4 h-4 text-green-600" />;
  }
  if (actionLower.includes('cancelled') || actionLower.includes('storniert')) {
    return <XCircle className="w-4 h-4 text-orange-600" />;
  }
  if (actionLower.includes('deleted') || actionLower.includes('gelöscht')) {
    return <Trash2 className="w-4 h-4 text-red-600" />;
  }
  if (actionLower.includes('confirmed') || actionLower.includes('bestätigt')) {
    return <CheckCircle2 className="w-4 h-4 text-blue-600" />;
  }
  if (actionLower.includes('anfrage') || actionLower.includes('request') || actionLower.includes('pending')) {
    return <Clock className="w-4 h-4 text-yellow-600" />;
  }
  if (actionLower.includes('updated') || actionLower.includes('changed') || actionLower.includes('geändert')) {
    return <Edit className="w-4 h-4 text-purple-600" />;
  }
  if (actionLower.includes('settings') || actionLower.includes('einstellungen')) {
    return <Settings className="w-4 h-4 text-indigo-600" />;
  }
  if (actionLower.includes('email') || actionLower.includes('mail') || actionLower.includes('sent')) {
    return <Mail className="w-4 h-4 text-cyan-600" />;
  }
  if (actionLower.includes('user') || actionLower.includes('benutzer')) {
    return <UserPlus className="w-4 h-4 text-teal-600" />;
  }
  if (actionLower.includes('cleared') || actionLower.includes('clear')) {
    return <Trash2 className="w-4 h-4 text-pink-600" />;
  }
  
  return <Clock className="w-4 h-4 text-gray-600" />;
};

const getActionColor = (action: string) => {
  const actionLower = action.toLowerCase();
  
  // Wichtig: "gebucht" VOR "bestätigt" prüfen!
  if (actionLower.includes('gebucht') || actionLower.includes('booked') || actionLower.includes('created') || actionLower.includes('new appointment')) {
    return 'bg-green-50 border-green-200';
  }
  if (actionLower.includes('cancelled') || actionLower.includes('storniert')) {
    return 'bg-orange-50 border-orange-200';
  }
  if (actionLower.includes('deleted') || actionLower.includes('gelöscht')) {
    return 'bg-red-50 border-red-200';
  }
  if (actionLower.includes('confirmed') || actionLower.includes('bestätigt')) {
    return 'bg-blue-50 border-blue-200';
  }
  if (actionLower.includes('anfrage') || actionLower.includes('request') || actionLower.includes('pending')) {
    return 'bg-yellow-50 border-yellow-200';
  }
  if (actionLower.includes('updated') || actionLower.includes('changed') || actionLower.includes('geändert')) {
    return 'bg-purple-50 border-purple-200';
  }
  if (actionLower.includes('settings') || actionLower.includes('einstellungen')) {
    return 'bg-indigo-50 border-indigo-200';
  }
  if (actionLower.includes('email') || actionLower.includes('mail') || actionLower.includes('sent')) {
    return 'bg-cyan-50 border-cyan-200';
  }
  if (actionLower.includes('user') || actionLower.includes('benutzer')) {
    return 'bg-teal-50 border-teal-200';
  }
  if (actionLower.includes('cleared') || actionLower.includes('clear')) {
    return 'bg-pink-50 border-pink-200';
  }
  
  return 'bg-gray-50 border-gray-200';
};

const getActionBadgeColor = (action: string) => {
  const actionLower = action.toLowerCase();
  
  // Wichtig: "gebucht" VOR "bestätigt" prüfen!
  if (actionLower.includes('gebucht') || actionLower.includes('booked') || actionLower.includes('created') || actionLower.includes('new appointment')) {
    return 'bg-green-100 text-green-800 border-green-300';
  }
  if (actionLower.includes('cancelled') || actionLower.includes('storniert')) {
    return 'bg-orange-100 text-orange-800 border-orange-300';
  }
  if (actionLower.includes('deleted') || actionLower.includes('gelöscht')) {
    return 'bg-red-100 text-red-800 border-red-300';
  }
  if (actionLower.includes('confirmed') || actionLower.includes('bestätigt')) {
    return 'bg-blue-100 text-blue-800 border-blue-300';
  }
  if (actionLower.includes('anfrage') || actionLower.includes('request') || actionLower.includes('pending')) {
    return 'bg-yellow-100 text-yellow-800 border-yellow-300';
  }
  if (actionLower.includes('updated') || actionLower.includes('changed') || actionLower.includes('geändert')) {
    return 'bg-purple-100 text-purple-800 border-purple-300';
  }
  if (actionLower.includes('settings') || actionLower.includes('einstellungen')) {
    return 'bg-indigo-100 text-indigo-800 border-indigo-300';
  }
  if (actionLower.includes('email') || actionLower.includes('mail') || actionLower.includes('sent')) {
    return 'bg-cyan-100 text-cyan-800 border-cyan-300';
  }
  if (actionLower.includes('user') || actionLower.includes('benutzer')) {
    return 'bg-teal-100 text-teal-800 border-teal-300';
  }
  if (actionLower.includes('cleared') || actionLower.includes('clear')) {
    return 'bg-pink-100 text-pink-800 border-pink-300';
  }
  
  return 'bg-gray-100 text-gray-800 border-gray-300';
};

const getBadgeLabel = (action: string) => {
  const actionLower = action.toLowerCase();
  
  if (actionLower.includes('gebucht') || actionLower.includes('booked') || actionLower.includes('created') || actionLower.includes('new appointment')) {
    return 'Gebucht';
  }
  if (actionLower.includes('cancelled') || actionLower.includes('storniert')) {
    return 'Storniert';
  }
  if (actionLower.includes('deleted') || actionLower.includes('gelöscht')) {
    return 'Gelöscht';
  }
  if (actionLower.includes('anfrage') || actionLower.includes('request') || actionLower.includes('pending')) {
    return 'Anfrage';
  }
  if (actionLower.includes('confirmed') || actionLower.includes('bestätigt')) {
    return 'Bestätigt';
  }
  if (actionLower.includes('updated') || actionLower.includes('changed')) {
    return 'Geändert';
  }
  if (actionLower.includes('settings') || actionLower.includes('einstellungen')) {
    return 'Einstellung';
  }
  if (actionLower.includes('email') || actionLower.includes('mail')) {
    return 'E-Mail';
  }
  if (actionLower.includes('cleared')) {
    return 'Bereinigt';
  }
  
  return 'Aktion';
};

export default function AdminAuditLog({ isOpen, onClose }: AdminAuditLogProps) {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [total, setTotal] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      fetchLogs();
    }
  }, [isOpen]);

  const fetchLogs = async (showRefreshing = false) => {
    if (showRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    
    setErrorMessage('');

    try {
      const response = await fetch(`${baseUrl}/api/admin/audit-log?limit=100`);
      
      if (response.ok) {
        const data = await response.json();
        setLogs((data as any).logs || []);
        setTotal((data as any).total || 0);
        
        // Zeige Info-Message wenn keine Logs vorhanden
        if ((data as any).message && (data as any).logs.length === 0) {
          setErrorMessage((data as any).message);
        }
        
        if (showRefreshing) {
          toast.success('Audit Log aktualisiert');
        }
      } else {
        setErrorMessage('Fehler beim Laden des Audit Logs');
        toast.error('Fehler beim Laden des Audit Logs');
      }
    } catch (error) {
      console.error('Error fetching audit log:', error);
      const errMsg = error instanceof Error ? error.message : 'Verbindungsfehler';
      setErrorMessage(errMsg);
      toast.error('Verbindungsfehler beim Laden des Audit Logs');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    fetchLogs(true);
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

          {/* Audit Log Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-3xl bg-white shadow-2xl z-50 overflow-hidden flex flex-col"
          >
            {/* Header */}
            <div className="bg-white border-b border-gray-200 px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 rounded-lg">
                    <Clock className="w-6 h-6 text-purple-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-gray-900">Audit Log</h2>
                    <p className="text-sm text-gray-600">
                      {total > 0 ? `${total} Einträge` : 'Alle Systemaktivitäten'}
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
                    onClick={onClose}
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-gray-900"
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-hidden">
              {loading ? (
                <div className="flex flex-col items-center justify-center h-full">
                  <Loader2 className="w-10 h-10 animate-spin text-purple-600 mb-4" />
                  <p className="text-sm text-gray-600">Audit Log wird geladen...</p>
                </div>
              ) : errorMessage ? (
                <div className="flex flex-col items-center justify-center h-full p-8">
                  <div className="p-4 bg-yellow-100 rounded-full mb-4">
                    <AlertCircle className="w-12 h-12 text-yellow-600" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Information
                  </h3>
                  <p className="text-sm text-gray-600 text-center max-w-md">
                    {errorMessage}
                  </p>
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    className="mt-4 rounded-xl text-gray-900"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Erneut versuchen
                  </Button>
                </div>
              ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full p-8">
                  <div className="p-4 bg-gray-100 rounded-full mb-4">
                    <Clock className="w-12 h-12 text-gray-400" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Keine Einträge vorhanden
                  </h3>
                  <p className="text-sm text-gray-600 text-center">
                    Es wurden noch keine Aktivitäten protokolliert.
                  </p>
                  <Button
                    onClick={handleRefresh}
                    variant="outline"
                    className="mt-4 rounded-xl text-gray-900"
                  >
                    <RefreshCw className="w-4 h-4 mr-2" />
                    Aktualisieren
                  </Button>
                </div>
              ) : (
                <ScrollArea className="h-full">
                  <div className="p-4 sm:p-6 space-y-3">
                    {logs.map((log, index) => (
                      <motion.div
                        key={log.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                      >
                        <Card className={`border rounded-xl shadow-sm ${getActionColor(log.action)}`}>
                          <CardContent className="p-3 sm:p-4">
                            <div className="flex gap-3 sm:gap-4">
                              {/* Icon */}
                              <div className="flex-shrink-0 mt-1">
                                <div className="p-2 bg-white rounded-lg shadow-sm">
                                  {getActionIcon(log.action)}
                                </div>
                              </div>

                              {/* Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-start justify-between gap-2 mb-2">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <h4 className="text-sm font-semibold text-gray-900">
                                      {log.action}
                                    </h4>
                                    <Badge 
                                      variant="outline" 
                                      className={`text-[10px] h-5 rounded-md ${getActionBadgeColor(log.action)}`}
                                    >
                                      {getBadgeLabel(log.action)}
                                    </Badge>
                                  </div>
                                  <span className="text-xs text-gray-900 whitespace-nowrap font-medium">
                                    {safeFormatDate(log.timestamp)}
                                  </span>
                                </div>

                                <p className="text-sm text-gray-900 mb-3 leading-relaxed">
                                  {log.details}
                                </p>

                                {/* Meta Info */}
                                <div className="flex flex-wrap items-center gap-2">
                                  {log.user && (
                                    <Badge variant="outline" className="text-xs gap-1 bg-white border-gray-900 text-gray-900">
                                      <User className="w-3 h-3" />
                                      {log.user}
                                    </Badge>
                                  )}
                                  {log.appointmentId && (
                                    <Badge variant="outline" className="text-xs gap-1 bg-white font-mono border-gray-900 text-gray-900">
                                      <Calendar className="w-3 h-3" />
                                      {log.appointmentId.slice(0, 8)}...
                                    </Badge>
                                  )}
                                </div>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ))}
                  </div>
                </ScrollArea>
              )}
            </div>

            {/* Footer */}
            <div className="bg-white border-t border-gray-200 px-4 sm:px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <AlertCircle className="w-4 h-4" />
                  <span>Einträge werden 90 Tage gespeichert</span>
                </div>
                <Button
                  onClick={onClose}
                  variant="outline"
                  className="rounded-xl text-gray-900"
                >
                  Schließen
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
