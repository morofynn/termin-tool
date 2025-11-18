globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../../renderers.mjs';

const DELETE = async ({ locals }) => {
  try {
    const D1 = locals?.runtime?.env?.DB;
    const KV = locals?.runtime?.env?.APPOINTMENTS_KV;
    if (!D1) {
      return new Response(
        JSON.stringify({ message: "Database not available" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }
    const appointments = await D1.prepare(
      "SELECT id, googleEventId FROM appointments"
    ).all();
    const googleClientId = locals?.runtime?.env?.GOOGLE_CLIENT_ID || "";
    const googleClientSecret = locals?.runtime?.env?.GOOGLE_CLIENT_SECRET || "";
    const googleRefreshToken = locals?.runtime?.env?.GOOGLE_REFRESH_TOKEN || "";
    const googleCalendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || "";
    if (googleClientId && googleClientSecret && googleRefreshToken && googleCalendarId) {
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
      if (tokenResponse.ok) {
        const { access_token } = await tokenResponse.json();
        for (const apt of appointments.results) {
          if (apt.googleEventId) {
            try {
              await fetch(
                `https://www.googleapis.com/calendar/v3/calendars/${encodeURIComponent(googleCalendarId)}/events/${apt.googleEventId}`,
                {
                  method: "DELETE",
                  headers: {
                    "Authorization": `Bearer ${access_token}`
                  }
                }
              );
            } catch (error) {
              console.error("Error deleting calendar event:", apt.googleEventId, error);
            }
          }
        }
      }
    }
    await D1.prepare("DELETE FROM appointments").run();
    if (KV) {
      const auditEntry = {
        id: `audit_log:${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        action: "All appointments deleted",
        details: `${appointments.results.length} Termine wurden gelöscht`,
        user: "Admin"
      };
      await KV.put(auditEntry.id, JSON.stringify(auditEntry));
    }
    return new Response(
      JSON.stringify({
        message: "Alle Termine wurden erfolgreich gelöscht",
        deletedCount: appointments.results.length
      }),
      { status: 200, headers: { "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error deleting all appointments:", error);
    return new Response(
      JSON.stringify({ message: "Fehler beim Löschen der Termine" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
};

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
  __proto__: null,
  DELETE
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
