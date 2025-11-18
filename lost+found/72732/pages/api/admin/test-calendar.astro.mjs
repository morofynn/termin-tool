globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../../renderers.mjs';

const GET = async ({ locals }) => {
  try {
    const googleClientId = locals?.runtime?.env?.GOOGLE_CLIENT_ID || "1016862075130-uc8r6pv6pivrjr4a9ei88gp6puss9htg.apps.googleusercontent.com";
    const googleClientSecret = locals?.runtime?.env?.GOOGLE_CLIENT_SECRET || "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";
    const googleRefreshToken = locals?.runtime?.env?.GOOGLE_REFRESH_TOKEN || "1//04Ck84hmIis09CgYIARAAGAQSNwF-L9IrVeFqvKINk6q5UDZiNWKre6-6EK775cifbJvqLEoys19YAMGoGSCAZZhxOuCZv4gfpb4";
    if (!googleClientId || !googleClientSecret || !googleRefreshToken) ;
    try {
      const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          client_id: googleClientId,
          client_secret: googleClientSecret,
          refresh_token: googleRefreshToken,
          grant_type: "refresh_token"
        })
      });
      if (!tokenResponse.ok) {
        const errorData = await tokenResponse.json();
        return new Response(
          JSON.stringify({
            success: false,
            configured: true,
            message: "Fehler bei der Token-Authentifizierung. Möglicherweise ist der Refresh Token abgelaufen.",
            error: errorData.error,
            errorDescription: errorData.error_description
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      const tokenData = await tokenResponse.json();
      const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || "fynn.klinkow@moro-gmbh.de";
      const calendarResponse = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`,
        {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`
          }
        }
      );
      if (!calendarResponse.ok) {
        const errorData = await calendarResponse.json();
        return new Response(
          JSON.stringify({
            success: false,
            configured: true,
            message: "Kalender konnte nicht gefunden werden. Überprüfen Sie die GOOGLE_CALENDAR_ID.",
            error: errorData.error?.message
          }),
          {
            status: 200,
            headers: { "Content-Type": "application/json" }
          }
        );
      }
      const calendarInfo = await calendarResponse.json();
      return new Response(
        JSON.stringify({
          success: true,
          configured: true,
          message: "Google Calendar ist korrekt konfiguriert und funktioniert.",
          calendar: {
            name: calendarInfo.summary,
            id: calendarInfo.id,
            timeZone: calendarInfo.timeZone
          }
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    } catch (error) {
      console.error("Google Calendar test error:", error);
      return new Response(
        JSON.stringify({
          success: false,
          configured: true,
          message: "Ein unerwarteter Fehler ist aufgetreten beim Testen der Verbindung.",
          error: error instanceof Error ? error.message : "Unknown error"
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      );
    }
  } catch (error) {
    console.error("Test calendar error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        message: "Ein unerwarteter Fehler ist aufgetreten.",
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
