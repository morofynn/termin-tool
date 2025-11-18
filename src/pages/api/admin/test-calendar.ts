import type { APIRoute } from 'astro';

/**
 * Test Google Calendar Connection
 * Verifiziert ob die Google Calendar API korrekt konfiguriert ist
 */
export const GET: APIRoute = async ({ locals }) => {
  try {
    const googleClientId = locals?.runtime?.env?.GOOGLE_CLIENT_ID || import.meta.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = locals?.runtime?.env?.GOOGLE_CLIENT_SECRET || import.meta.env.GOOGLE_CLIENT_SECRET;
    const googleRefreshToken = locals?.runtime?.env?.GOOGLE_REFRESH_TOKEN || import.meta.env.GOOGLE_REFRESH_TOKEN;

    // Prüfe ob alle Credentials vorhanden sind
    if (!googleClientId || !googleClientSecret || !googleRefreshToken) {
      return new Response(
        JSON.stringify({
          success: false,
          configured: false,
          message: 'Google Calendar ist nicht konfiguriert. Bitte fügen Sie die Umgebungsvariablen hinzu.',
          missing: {
            clientId: !googleClientId,
            clientSecret: !googleClientSecret,
            refreshToken: !googleRefreshToken,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Versuche ein Access Token zu holen
    try {
      const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: googleClientId,
          client_secret: googleClientSecret,
          refresh_token: googleRefreshToken,
          grant_type: 'refresh_token',
        }),
      });

      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json() as { error?: string; error_description?: string };
        return new Response(
          JSON.stringify({
            success: false,
            configured: true,
            message: 'Fehler bei der Token-Authentifizierung. Möglicherweise ist der Refresh Token abgelaufen.',
            error: errorData.error,
            errorDescription: errorData.error_description,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const tokenData = await tokenResponse.json() as { access_token: string };

      // Teste den Zugriff auf Calendar API
      const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || import.meta.env.GOOGLE_CALENDAR_ID || 'primary';
      
      const calendarResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`,
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
          },
        }
      );

      if (!calendarResponse.ok) {
        const errorData = await calendarResponse.json() as { error?: { message?: string } };
        return new Response(
          JSON.stringify({
            success: false,
            configured: true,
            message: 'Kalender konnte nicht gefunden werden. Überprüfen Sie die GOOGLE_CALENDAR_ID.',
            error: errorData.error?.message,
          }),
          {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      const calendarInfo = await calendarResponse.json() as { summary: string; timeZone: string; id: string };

      // Alles funktioniert
      return new Response(
        JSON.stringify({
          success: true,
          configured: true,
          message: 'Google Calendar ist korrekt konfiguriert und funktioniert.',
          calendar: {
            name: calendarInfo.summary,
            id: calendarInfo.id,
            timeZone: calendarInfo.timeZone,
          },
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    } catch (error) {
      console.error('Google Calendar test error:', error);
      return new Response(
        JSON.stringify({
          success: false,
          configured: true,
          message: 'Ein unerwarteter Fehler ist aufgetreten beim Testen der Verbindung.',
          error: error instanceof Error ? error.message : 'Unknown error',
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }
  } catch (error) {
    console.error('Test calendar error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        message: 'Ein unerwarteter Fehler ist aufgetreten.',
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
