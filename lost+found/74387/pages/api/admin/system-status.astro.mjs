globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../../renderers.mjs';

const __vite_import_meta_env__ = {"ASSETS_PREFIX": undefined, "BASE_URL": "/", "DEV": false, "MODE": "production", "PROD": true, "SITE": undefined, "SSR": true};
const GET = async ({ locals }) => {
  try {
    const env = locals?.runtime?.env || Object.assign(__vite_import_meta_env__, { WEBFLOW_API_HOST: "https://api-cdn.webflow.com/v2", WEBFLOW_CMS_SITE_API_TOKEN: process.env.WEBFLOW_CMS_SITE_API_TOKEN, GOOGLE_CLIENT_ID: "", GOOGLE_CLIENT_SECRET: "", GOOGLE_REFRESH_TOKEN: "", GOOGLE_CALENDAR_ID: "", ADMIN_SECRET_PATH: "secure-admin-panel-xyz789", ADMIN_PASSWORD: "MeinSicheresPasswort123!", _: process.env._, PATH: process.env.PATH });
    const checks = {
      adminPassword: {
        name: "Admin-Passwort",
        key: "ADMIN_PASSWORD",
        status: !!env.ADMIN_PASSWORD,
        value: env.ADMIN_PASSWORD ? "✓ Gesetzt" : "✗ Fehlt",
        required: true,
        category: "admin",
        description: "Passwort für den Admin-Zugang"
      },
      adminSecretPath: {
        name: "Admin Secret Path",
        key: "ADMIN_SECRET_PATH",
        status: !!env.ADMIN_SECRET_PATH,
        value: env.ADMIN_SECRET_PATH ? "✓ Gesetzt" : "✗ Fehlt",
        required: true,
        category: "admin",
        description: "Geheimer Pfad zum Admin-Panel"
      },
      googleCalendarId: {
        name: "Google Calendar ID",
        key: "GOOGLE_CALENDAR_ID",
        status: !!env.GOOGLE_CALENDAR_ID,
        value: env.GOOGLE_CALENDAR_ID ? "✓ Gesetzt" : "✗ Fehlt",
        required: true,
        category: "google",
        description: "ID des Google Kalenders"
      },
      googleClientId: {
        name: "Google Client ID",
        key: "GOOGLE_CLIENT_ID",
        status: !!env.GOOGLE_CLIENT_ID,
        value: env.GOOGLE_CLIENT_ID ? "✓ Gesetzt" : "✗ Fehlt",
        required: true,
        category: "google",
        description: "OAuth Client ID aus Google Cloud Console"
      },
      googleClientSecret: {
        name: "Google Client Secret",
        key: "GOOGLE_CLIENT_SECRET",
        status: !!env.GOOGLE_CLIENT_SECRET,
        value: env.GOOGLE_CLIENT_SECRET ? "✓ Gesetzt" : "✗ Fehlt",
        required: true,
        category: "google",
        description: "OAuth Client Secret aus Google Cloud Console"
      },
      googleRefreshToken: {
        name: "Google Refresh Token",
        key: "GOOGLE_REFRESH_TOKEN",
        status: !!env.GOOGLE_REFRESH_TOKEN,
        value: env.GOOGLE_REFRESH_TOKEN ? "✓ Gesetzt" : "✗ Fehlt",
        required: true,
        category: "google",
        description: "Refresh Token für langfristigen Zugriff"
      },
      googleUserEmail: {
        name: "Google User Email",
        key: "GOOGLE_USER_EMAIL",
        status: !!env.GOOGLE_USER_EMAIL,
        value: env.GOOGLE_USER_EMAIL ? "✓ Gesetzt" : "✗ Fehlt",
        required: true,
        category: "google",
        description: "E-Mail-Adresse des Google-Kontos"
      },
      webflowApiHost: {
        name: "Webflow API Host",
        key: "WEBFLOW_API_HOST",
        status: !!env.WEBFLOW_API_HOST,
        value: env.WEBFLOW_API_HOST ? "✓ Gesetzt" : "✗ Fehlt",
        required: false,
        category: "webflow",
        description: "API Host für Webflow (optional)"
      },
      webflowCmsToken: {
        name: "Webflow CMS Token",
        key: "WEBFLOW_CMS_SITE_API_TOKEN",
        status: !!env.WEBFLOW_CMS_SITE_API_TOKEN,
        value: env.WEBFLOW_CMS_SITE_API_TOKEN ? "✓ Gesetzt" : "✗ Fehlt",
        required: false,
        category: "webflow",
        description: "Token für CMS-Zugriff (optional)"
      }
    };
    const requiredChecks = Object.values(checks).filter((c) => c.required);
    const allRequired = requiredChecks.every((c) => c.status);
    const missingRequired = requiredChecks.filter((c) => !c.status);
    const byCategory = {
      admin: Object.values(checks).filter((c) => c.category === "admin"),
      google: Object.values(checks).filter((c) => c.category === "google"),
      webflow: Object.values(checks).filter((c) => c.category === "webflow")
    };
    let googleCalendarStatus = null;
    const googleVarsComplete = byCategory.google.filter((c) => c.required).every((c) => c.status);
    if (googleVarsComplete) {
      try {
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: env.GOOGLE_CLIENT_ID,
            client_secret: env.GOOGLE_CLIENT_SECRET,
            refresh_token: env.GOOGLE_REFRESH_TOKEN,
            grant_type: "refresh_token"
          })
        });
        if (!tokenResponse.ok) {
          const errorData = await tokenResponse.json();
          googleCalendarStatus = {
            success: false,
            error: `Token-Authentifizierung fehlgeschlagen: ${errorData.error_description || errorData.error || "Unbekannter Fehler"}`,
            errorType: "auth"
          };
        } else {
          const tokenData = await tokenResponse.json();
          const calendarId = env.GOOGLE_CALENDAR_ID || "primary";
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
            googleCalendarStatus = {
              success: false,
              error: `Kalender nicht gefunden: ${errorData.error?.message || "Überprüfen Sie die GOOGLE_CALENDAR_ID"}`,
              errorType: "calendar"
            };
          } else {
            const calendarInfo = await calendarResponse.json();
            googleCalendarStatus = {
              success: true,
              calendarName: calendarInfo.summary,
              calendarId: calendarInfo.id,
              timeZone: calendarInfo.timeZone
            };
          }
        }
      } catch (error) {
        googleCalendarStatus = {
          success: false,
          error: error instanceof Error ? error.message : "Unbekannter Verbindungsfehler",
          errorType: "network"
        };
      }
    }
    const summary = {
      total: Object.keys(checks).length,
      passed: Object.values(checks).filter((c) => c.status).length,
      failed: Object.values(checks).filter((c) => !c.status).length,
      requiredMissing: missingRequired.length,
      requiredTotal: requiredChecks.length
    };
    return new Response(
      JSON.stringify({
        success: true,
        allRequired,
        missingRequired: missingRequired.map((c) => ({
          name: c.name,
          key: c.key,
          description: c.description
        })),
        checks,
        byCategory,
        googleCalendarStatus,
        summary,
        needsAttention: !allRequired || googleCalendarStatus && !googleCalendarStatus.success
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Error checking system status:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unbekannter Fehler",
        needsAttention: true
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
