globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../renderers.mjs';

const GET = async ({ locals, request }) => {
  try {
    const authHeader = request.headers.get("Authorization");
    const hasAuth = authHeader && authHeader.startsWith("Basic ");
    const clientId = locals?.runtime?.env?.GOOGLE_CLIENT_ID || "";
    const clientSecret = locals?.runtime?.env?.GOOGLE_CLIENT_SECRET || "";
    const refreshToken = locals?.runtime?.env?.GOOGLE_REFRESH_TOKEN || "";
    const calendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || "" || "primary";
    const userEmail = locals?.runtime?.env?.GOOGLE_USER_EMAIL || undefined                                 ;
    const config = {
      GOOGLE_CLIENT_ID: {
        set: !!clientId,
        length: clientId ? clientId.length : 0,
        preview: clientId ? `${clientId.substring(0, 20)}...` : "NOT SET"
      },
      GOOGLE_CLIENT_SECRET: {
        set: !!clientSecret,
        length: clientSecret ? clientSecret.length : 0,
        preview: clientSecret ? `${clientSecret.substring(0, 10)}...` : "NOT SET"
      },
      GOOGLE_REFRESH_TOKEN: {
        set: !!refreshToken,
        length: refreshToken ? refreshToken.length : 0,
        preview: refreshToken ? `${refreshToken.substring(0, 10)}...` : "NOT SET"
      },
      GOOGLE_CALENDAR_ID: {
        set: !!calendarId,
        value: calendarId
      },
      GOOGLE_USER_EMAIL: {
        set: !!userEmail,
        value: userEmail || "NOT SET"
      }
    };
    let tokenTest = {
      success: false,
      error: "",
      accessToken: "",
      scopes: []
    };
    if (clientId && clientSecret && refreshToken) {
      try {
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token"
          })
        });
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          tokenTest.success = true;
          tokenTest.accessToken = `${tokenData.access_token.substring(0, 20)}...`;
          tokenTest.scopes = tokenData.scope ? tokenData.scope.split(" ") : [];
        } else {
          const errorData = await tokenResponse.json();
          tokenTest.error = `${tokenResponse.status}: ${errorData.error || "Unknown error"} - ${errorData.error_description || ""}`;
        }
      } catch (error) {
        tokenTest.error = error instanceof Error ? error.message : "Unknown error";
      }
    } else {
      tokenTest.error = "Missing credentials (CLIENT_ID, CLIENT_SECRET, or REFRESH_TOKEN)";
    }
    let calendarTest = {
      success: false,
      error: "",
      calendarName: "",
      calendarTimezone: ""
    };
    if (tokenTest.success && clientId && clientSecret && refreshToken) {
      try {
        const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: new URLSearchParams({
            client_id: clientId,
            client_secret: clientSecret,
            refresh_token: refreshToken,
            grant_type: "refresh_token"
          })
        });
        if (tokenResponse.ok) {
          const tokenData = await tokenResponse.json();
          const calendarResponse = await fetch(
            `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(calendarId)}`,
            {
              headers: {
                Authorization: `Bearer ${tokenData.access_token}`
              }
            }
          );
          if (calendarResponse.ok) {
            const calendarData = await calendarResponse.json();
            calendarTest.success = true;
            calendarTest.calendarName = calendarData.summary;
            calendarTest.calendarTimezone = calendarData.timeZone;
          } else {
            const errorData = await calendarResponse.json();
            calendarTest.error = `${calendarResponse.status}: ${errorData.error?.message || "Unknown error"}`;
          }
        }
      } catch (error) {
        calendarTest.error = error instanceof Error ? error.message : "Unknown error";
      }
    } else {
      calendarTest.error = "Token test failed, cannot test calendar access";
    }
    const resendKey = locals?.runtime?.env?.RESEND_API_KEY || undefined                              ;
    const resendTest = {
      set: !!resendKey,
      length: resendKey ? resendKey.length : 0,
      preview: resendKey ? `${resendKey.substring(0, 10)}...` : "NOT SET"
    };
    return new Response(
      JSON.stringify({
        success: true,
        environment: locals?.runtime?.env ? "Cloudflare Workers (Production)" : "Local Development",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        config,
        tests: {
          tokenExchange: tokenTest,
          calendarAccess: calendarTest
        },
        resend: resendTest,
        recommendations: getRecommendations(config, tokenTest, calendarTest, resendTest)
      }, null, 2),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-store, no-cache, must-revalidate"
        }
      }
    );
  } catch (error) {
    console.error("Debug Error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error"
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
};
function getRecommendations(config, tokenTest, calendarTest, resendTest) {
  const recommendations = [];
  if (!config.GOOGLE_CLIENT_ID.set) {
    recommendations.push("❌ GOOGLE_CLIENT_ID ist nicht gesetzt. Setze es in Webflow Environment Variables.");
  }
  if (!config.GOOGLE_CLIENT_SECRET.set) {
    recommendations.push("❌ GOOGLE_CLIENT_SECRET ist nicht gesetzt. Setze es in Webflow Environment Variables.");
  }
  if (!config.GOOGLE_REFRESH_TOKEN.set) {
    recommendations.push("❌ GOOGLE_REFRESH_TOKEN ist nicht gesetzt. Generiere einen neuen Token via /api/auth/google-authorize");
  }
  if (config.GOOGLE_REFRESH_TOKEN.set && !tokenTest.success) {
    recommendations.push("⚠️ REFRESH_TOKEN ist gesetzt, aber Token Exchange schlägt fehl. Der Token ist möglicherweise abgelaufen oder ungültig.");
    recommendations.push("💡 Lösung: Gehe zu /api/auth/google-authorize und generiere einen neuen Token.");
  }
  if (tokenTest.success && !calendarTest.success) {
    recommendations.push("⚠️ Token funktioniert, aber Calendar-Zugriff schlägt fehl. Prüfe ob die richtigen Scopes gesetzt sind.");
    recommendations.push("💡 Benötigte Scopes: https://www.googleapis.com/auth/calendar + https://www.googleapis.com/auth/calendar.events");
  }
  if (tokenTest.success && tokenTest.scopes.length > 0) {
    const hasCalendarScope = tokenTest.scopes.some(
      (s) => s.includes("calendar") || s.includes("https://www.googleapis.com/auth/calendar")
    );
    if (!hasCalendarScope) {
      recommendations.push("❌ REFRESH_TOKEN hat keine Calendar-Scopes! Token wurde möglicherweise mit falschen Permissions generiert.");
      recommendations.push("💡 Lösung: Gehe zu /api/auth/google-authorize und autorisiere die App erneut mit Calendar-Scopes.");
    }
    const hasGmailScope = tokenTest.scopes.some((s) => s.includes("gmail"));
    if (hasGmailScope) {
      recommendations.push("⚠️ REFRESH_TOKEN hat Gmail-Scopes, die nicht benötigt werden. Das ist OK, aber nicht optimal.");
    }
  }
  if (!resendTest.set) {
    recommendations.push("❌ RESEND_API_KEY ist nicht gesetzt. E-Mail-Benachrichtigungen funktionieren nicht.");
    recommendations.push("💡 Lösung: Gehe zu resend.com, erstelle einen API Key und setze ihn in Webflow Environment Variables.");
  }
  if (config.GOOGLE_CLIENT_ID.set && config.GOOGLE_CLIENT_SECRET.set && config.GOOGLE_REFRESH_TOKEN.set && tokenTest.success && calendarTest.success) {
    recommendations.push("✅ Google Calendar ist vollständig konfiguriert und funktioniert!");
  }
  if (resendTest.set) {
    recommendations.push("✅ Resend API Key ist gesetzt. E-Mails sollten funktionieren.");
  }
  if (recommendations.length === 0) {
    recommendations.push("✅ Alle Checks bestanden! Die Integration sollte funktionieren.");
  }
  return recommendations;
}

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  GET
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
