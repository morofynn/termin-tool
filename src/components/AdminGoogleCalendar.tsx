import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { 
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertCircle,
  ExternalLink,
  Shield,
  Calendar,
  Globe,
} from 'lucide-react';
import { baseUrl } from '../lib/base-url';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';

interface SystemStatus {
  success: boolean;
  allRequired: boolean;
  needsAttention: boolean;
  missingRequired: Array<{ name: string; key: string; description: string }>;
  checks: Record<string, {
    name: string;
    key: string;
    status: boolean;
    value: string;
    required: boolean;
    category: string;
    description: string;
  }>;
  byCategory: {
    admin: Array<any>;
    google: Array<any>;
    webflow: Array<any>;
  };
  googleCalendarStatus: {
    success: boolean;
    calendarName?: string;
    calendarId?: string;
    timeZone?: string;
    error?: string;
    errorType?: string;
  } | null;
  summary: {
    total: number;
    passed: number;
    failed: number;
    requiredMissing: number;
    requiredTotal: number;
  };
}

export default function AdminGoogleCalendar() {
  const [loading, setLoading] = useState(true);
  const [status, setStatus] = useState<SystemStatus | null>(null);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    checkStatus();
  }, []);

  const checkStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${baseUrl}/api/admin/system-status`);
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
      }
    } catch (error) {
      console.error('Error checking system status:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTest = async () => {
    setTesting(true);
    await checkStatus();
    setTesting(false);
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'admin':
        return <Shield className="w-3.5 h-3.5 text-purple-600" />;
      case 'google':
        return <Calendar className="w-3.5 h-3.5 text-blue-600" />;
      case 'webflow':
        return <Globe className="w-3.5 h-3.5 text-cyan-600" />;
      default:
        return null;
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'admin':
        return 'bg-purple-600';
      case 'google':
        return 'bg-blue-600';
      case 'webflow':
        return 'bg-cyan-600';
      default:
        return 'bg-gray-600';
    }
  };

  return (
    <Card className="border-gray-200 rounded-xl">
      <CardHeader className="pb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 bg-indigo-50 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="flex-1">
            <CardTitle className="text-base text-gray-900">System-Diagnose</CardTitle>
            <CardDescription className="text-xs">Überprüfung aller Umgebungsvariablen und Integrationen</CardDescription>
          </div>
          <Button
            onClick={handleTest}
            variant="outline"
            size="sm"
            disabled={testing || loading}
            className="rounded-lg text-xs"
          >
            {testing || loading ? (
              <Loader2 className="w-3 h-3 animate-spin mr-1.5" />
            ) : (
              <CheckCircle2 className="w-3 h-3 mr-1.5" />
            )}
            Testen
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : status ? (
          <>
            {/* Zusammenfassung */}
            <div className="grid grid-cols-3 gap-2">
              <div className="p-2.5 bg-gray-50 rounded-lg border">
                <p className="text-xs text-gray-600 mb-0.5">Gesamt</p>
                <p className="text-lg font-bold text-gray-900">{status.summary.total}</p>
              </div>
              <div className="p-2.5 bg-green-50 rounded-lg border border-green-200">
                <p className="text-xs text-green-700 mb-0.5">Aktiv</p>
                <p className="text-lg font-bold text-green-900">{status.summary.passed}</p>
              </div>
              <div className="p-2.5 bg-red-50 rounded-lg border border-red-200">
                <p className="text-xs text-red-700 mb-0.5">Fehlend</p>
                <p className="text-lg font-bold text-red-900">{status.summary.failed}</p>
              </div>
            </div>

            {/* Kritische Warnung */}
            {status.summary.requiredMissing > 0 && (
              <div className="p-3 bg-red-50 border-2 border-red-300 rounded-xl">
                <div className="flex items-start gap-2">
                  <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-red-900 mb-1">
                      ⚠️ {status.summary.requiredMissing} erforderliche Variable(n) fehlen
                    </p>
                    <p className="text-xs text-red-800 mb-2 leading-relaxed">
                      Das System kann ohne diese Variablen nicht vollständig funktionieren.
                    </p>
                    <div className="space-y-1">
                      {status.missingRequired.map((item) => (
                        <div key={item.key} className="flex items-start gap-1.5">
                          <span className="text-red-600 font-bold mt-0.5">•</span>
                          <div>
                            <p className="text-xs font-semibold text-red-900">{item.name}</p>
                            <p className="text-xs text-red-700">{item.description}</p>
                            <code className="text-[10px] bg-red-100 px-1.5 py-0.5 rounded text-red-800">
                              {item.key}
                            </code>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            <Separator />

            {/* Admin-Bereich */}
            <div>
              <h4 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${getCategoryColor('admin')}`}></div>
                Admin-Konfiguration
                <Badge variant="outline" className="text-[10px] ml-auto">
                  {status.byCategory.admin.filter(c => c.status).length} / {status.byCategory.admin.length}
                </Badge>
              </h4>
              <div className="space-y-1.5">
                {status.byCategory.admin.map((check) => (
                  <div
                    key={check.key}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs border"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {check.status ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium truncate">{check.name}</p>
                        <p className="text-gray-600 text-[10px] truncate">{check.description}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] flex-shrink-0 ml-2 ${
                        check.status
                          ? 'bg-green-50 text-green-800 border-green-300'
                          : 'bg-red-50 text-red-800 border-red-300'
                      }`}
                    >
                      {check.value}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Google Calendar */}
            <div>
              <h4 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${getCategoryColor('google')}`}></div>
                Google Calendar Integration
                <Badge variant="outline" className="text-[10px] ml-auto">
                  {status.byCategory.google.filter(c => c.status).length} / {status.byCategory.google.length}
                </Badge>
              </h4>
              <div className="space-y-1.5">
                {status.byCategory.google.map((check) => (
                  <div
                    key={check.key}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs border"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {check.status ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-red-600 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium truncate">{check.name}</p>
                        <p className="text-gray-600 text-[10px] truncate">{check.description}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] flex-shrink-0 ml-2 ${
                        check.status
                          ? 'bg-green-50 text-green-800 border-green-300'
                          : 'bg-red-50 text-red-800 border-red-300'
                      }`}
                    >
                      {check.value}
                    </Badge>
                  </div>
                ))}

                {/* Google Calendar Verbindungstest */}
                {status.googleCalendarStatus && (
                  <div
                    className={`p-3 rounded-xl border-2 ${
                      status.googleCalendarStatus.success
                        ? 'bg-green-50 border-green-300'
                        : 'bg-red-50 border-red-300'
                    }`}
                  >
                    <div className="flex items-start gap-2">
                      {status.googleCalendarStatus.success ? (
                        <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-bold mb-1">
                          {status.googleCalendarStatus.success ? (
                            <span className="text-green-900">✓ Verbindung erfolgreich</span>
                          ) : (
                            <span className="text-red-900">✗ Verbindung fehlgeschlagen</span>
                          )}
                        </p>
                        {status.googleCalendarStatus.calendarName && (
                          <div className="space-y-1 text-xs text-green-800">
                            <p><strong>Kalender:</strong> {status.googleCalendarStatus.calendarName}</p>
                            <p><strong>Zeitzone:</strong> {status.googleCalendarStatus.timeZone}</p>
                            <code className="text-[10px] bg-green-100 px-1.5 py-0.5 rounded">
                              {status.googleCalendarStatus.calendarId}
                            </code>
                          </div>
                        )}
                        {status.googleCalendarStatus.error && (
                          <div className="space-y-1">
                            <p className="text-xs text-red-800 leading-relaxed">
                              {status.googleCalendarStatus.error}
                            </p>
                            {status.googleCalendarStatus.errorType === 'auth' && (
                              <p className="text-xs text-red-700 font-medium">
                                → Refresh Token möglicherweise abgelaufen oder ungültig
                              </p>
                            )}
                            {status.googleCalendarStatus.errorType === 'calendar' && (
                              <p className="text-xs text-red-700 font-medium">
                                → Überprüfen Sie die GOOGLE_CALENDAR_ID
                              </p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {!status.googleCalendarStatus && status.byCategory.google.some(c => !c.status) && (
                  <div className="p-2.5 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <div className="flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-yellow-800">
                        Verbindungstest wird durchgeführt sobald alle Google-Variablen gesetzt sind
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <Separator />

            {/* Webflow (Optional) */}
            <div>
              <h4 className="text-xs font-semibold text-gray-900 mb-2 flex items-center gap-1.5">
                <div className={`w-2 h-2 rounded-full ${getCategoryColor('webflow')}`}></div>
                Webflow CMS
                <Badge variant="outline" className="text-[10px] bg-gray-100 text-gray-600 ml-1">
                  Optional
                </Badge>
                <Badge variant="outline" className="text-[10px] ml-auto">
                  {status.byCategory.webflow.filter(c => c.status).length} / {status.byCategory.webflow.length}
                </Badge>
              </h4>
              <div className="space-y-1.5">
                {status.byCategory.webflow.map((check) => (
                  <div
                    key={check.key}
                    className="flex items-center justify-between p-2 bg-gray-50 rounded-lg text-xs border"
                  >
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                      {check.status ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-gray-900 font-medium truncate">{check.name}</p>
                        <p className="text-gray-600 text-[10px] truncate">{check.description}</p>
                      </div>
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] flex-shrink-0 ml-2 ${
                        check.status
                          ? 'bg-green-50 text-green-800 border-green-300'
                          : 'bg-gray-100 text-gray-600 border-gray-300'
                      }`}
                    >
                      {check.value}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            {/* Setup-Anleitung */}
            {status.needsAttention && (
              <>
                <Separator />
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-blue-900 mb-1">
                        Setup erforderlich
                      </p>
                      <p className="text-xs text-blue-800 leading-relaxed mb-2">
                        Fehlende Umgebungsvariablen müssen in den Webflow-Umgebungseinstellungen gesetzt werden. 
                        Nach dem Setzen klicken Sie auf "Testen" um die Konfiguration zu überprüfen.
                      </p>
                      <a
                        href="https://university.webflow.com/lesson/environment-variables"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-blue-700 hover:text-blue-900"
                      >
                        Webflow Docs: Environment Variables
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        ) : (
          <div className="p-3 bg-red-50 border border-red-200 rounded-xl">
            <div className="flex items-start gap-2">
              <XCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-red-900 mb-1">
                  Fehler beim Laden des System-Status
                </p>
                <p className="text-xs text-red-800">
                  Bitte versuchen Sie es erneut oder kontaktieren Sie den Support.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
