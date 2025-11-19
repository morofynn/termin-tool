import { useState, useEffect, useRef } from 'react';
import QRCode from 'qrcode';
import { Download, Calendar } from 'lucide-react';
import { Card, CardContent, CardHeader } from './ui/card';
import { toast } from 'sonner';
import ical from 'ical-generator';

interface AppointmentData {
  name: string;
  company?: string;
  email: string;
  phone: string;
  date: string;
  startTime: string;
  endTime: string;
  message?: string;
}

interface Settings {
  companyName: string;
  companyEmail: string;
  companyPhone: string;
  companyAddress: string;
  companyWebsite: string;
  eventLocation: string;
  eventHall: string;
}

interface AppointmentQRCodeProps {
  appointmentId: string;
  appointmentData: AppointmentData;
  settings: Settings;
}

export default function AppointmentQRCode({ appointmentId, appointmentData, settings }: AppointmentQRCodeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    generateQRCode();
    
    // Auto-download wenn ?download=true in URL
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('download') === 'true') {
      setTimeout(() => {
        handleDownloadICS();
        window.history.replaceState({}, '', window.location.pathname);
      }, 500);
    }
  }, [appointmentId]);

  const generateQRCode = async () => {
    if (!canvasRef.current) return;

    try {
      // Vollständige URL mit Protokoll und Domain
      const fullUrl = `${window.location.origin}${window.location.pathname}?download=true`;
      
      // Generiere QR-Code auf Canvas mit weißem Muster auf transparentem Hintergrund
      await QRCode.toCanvas(canvasRef.current, fullUrl, {
        width: 512,
        margin: 2,
        color: {
          dark: '#FFFFFF',    // Weiß für das Muster
          light: '#00000000', // Transparent für den Hintergrund (Blau scheint durch)
        },
      });
    } catch (error) {
      console.error('Error generating QR code:', error);
      toast.error('QR-Code konnte nicht generiert werden');
    }
  };

  const handleDownloadICS = () => {
    try {
      const appointmentDate = new Date(appointmentData.date);
      const [startHours, startMinutes] = appointmentData.startTime.split(':').map(Number);
      const [endHours, endMinutes] = appointmentData.endTime.split(':').map(Number);

      const startDateTime = new Date(appointmentDate);
      startDateTime.setHours(startHours, startMinutes, 0, 0);

      const endDateTime = new Date(appointmentDate);
      endDateTime.setHours(endHours, endMinutes, 0, 0);

      const appointmentUrl = `${window.location.origin}${window.location.pathname}`;
      const location = `${settings.eventLocation}, ${settings.eventHall}`;

      const calendar = ical({ name: 'Terminbestätigung' });

      calendar.createEvent({
        start: startDateTime,
        end: endDateTime,
        summary: `Termin bei ${settings.companyName}`,
        description: `Ihr Termin bei ${settings.companyName}\n\n` +
          `Ort: ${location}\n\n` +
          `Kontakt:\n` +
          `${settings.companyName}\n` +
          `${settings.companyAddress}\n` +
          `Tel: ${settings.companyPhone}\n` +
          `E-Mail: ${settings.companyEmail}` +
          (settings.companyWebsite ? `\nWeb: ${settings.companyWebsite}` : '') +
          `\n\nTermindetails: ${appointmentUrl}`,
        location,
        // URL-Zeile entfernt - war doppelt mit description
        organizer: {
          name: settings.companyName,
          email: settings.companyEmail,
        },
      });

      const icsContent = calendar.toString();

      const blob = new Blob([icsContent], { type: 'text/calendar;charset=utf-8' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `termin-${appointmentId}.ics`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('Kalenderdatei heruntergeladen');
    } catch (error) {
      console.error('Error downloading ICS:', error);
      toast.error('Download fehlgeschlagen');
    }
  };

  return (
    <Card className="shadow-2xl rounded-2xl border-0 overflow-hidden bg-white">
      <CardHeader className="pb-4 pt-6 px-6 text-center">
        {/* Calendar Icon */}
        <div className="flex justify-center mb-4">
          <div className="p-4 bg-blue-50 rounded-xl">
            <Calendar className="w-7 h-7 text-blue-600" />
          </div>
        </div>

        {/* Überschrift */}
        <h3 className="text-xl font-semibold text-gray-900">
          Zu Ihrem Kalender hinzufügen
        </h3>
      </CardHeader>

      <CardContent className="pb-6 px-6">
        {/* QR-Code Canvas - weißes Muster auf transparentem Hintergrund */}
        <div className="flex justify-center mb-6">
          <button
            onClick={handleDownloadICS}
            className="group relative p-6 bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl shadow-lg transition-all duration-200 hover:scale-105 hover:shadow-xl cursor-pointer border-0 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            aria-label="QR-Code scannen oder klicken zum Herunterladen"
          >
            {/* Canvas QR-Code */}
            <div className="bg-white p-4 rounded-xl">
              <canvas
                ref={canvasRef}
                className="w-40 h-40"
                style={{ 
                  imageRendering: 'pixelated',
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />
            </div>
            
            {/* Download Icon Overlay */}
            <div className="absolute inset-0 bg-blue-700/95 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
              <div className="text-center">
                <Download className="w-12 h-12 text-white mx-auto mb-2" />
                <p className="text-sm text-white font-semibold">Kalender herunterladen</p>
              </div>
            </div>
          </button>
        </div>

        {/* Beschreibungstext */}
        <div className="text-center">
          <p className="text-xs text-gray-500">
            Scannen oder klicken Sie den QR-Code, um den Termin automatisch zu Ihrem Kalender hinzuzufügen
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
