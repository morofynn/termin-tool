import { useState, useEffect } from 'react';
import { getEventConfig, type EventDay } from '../lib/event-config';
import { baseUrl } from '../lib/base-url';

interface EventConfig {
  year: number;
  name: string;
  dates: {
    friday: string;
    saturday: string;
    sunday: string;
  };
  shortLabels: {
    friday: string;
    saturday: string;
    sunday: string;
  };
  longLabels: {
    friday: string;
    saturday: string;
    sunday: string;
  };
  dayNames: {
    friday: string;
    saturday: string;
    sunday: string;
  };
}

/**
 * Hook um Event-Config dynamisch zu laden
 * Lädt die Settings vom API und generiert die Event-Config daraus
 */
export function useEventConfig() {
  const [config, setConfig] = useState<EventConfig>(getEventConfig());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchConfig() {
      try {
        const response = await fetch(`${baseUrl}/api/admin/settings`);
        if (response.ok) {
          const data = await response.json();
          const newConfig = getEventConfig(data.settings);
          setConfig(newConfig);
        }
      } catch (error) {
        console.error('Error fetching event config:', error);
        // Fallback zu Default-Config
      } finally {
        setLoading(false);
      }
    }

    fetchConfig();
  }, []);

  return { config, loading };
}

/**
 * Hilfsfunktion: Konvertiert ISO Date String zu Date-Objekt
 */
export function getEventDateFromConfig(day: EventDay, config: EventConfig): Date {
  return new Date(config.dates[day]);
}
