globalThis.process ??= {}; globalThis.process.env ??= {};
export { renderers } from '../../../renderers.mjs';

const GET = async ({ locals }) => {
  try {
    const googleClientId = locals?.runtime?.env?.GOOGLE_CLIENT_ID || "";
    const googleClientSecret = locals?.runtime?.env?.GOOGLE_CLIENT_SECRET || "";
    const googleRefreshToken = locals?.runtime?.env?.GOOGLE_REFRESH_TOKEN || "";
    const googleCalendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || "fynn.klinkow@mor\no-gmbh.de";
    const configured = !!(googleClientId && googleClientSecret && googleRefreshToken && googleCalendarId);
    return new Response(
      JSON.stringify({
        configured,
        details: {
          hasClientId: !!googleClientId,
          hasClientSecret: !!googleClientSecret,
          hasRefreshToken: !!googleRefreshToken,
          hasCalendarId: !!googleCalendarId
        }
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" }
      }
    );
  } catch (error) {
    console.error("Calendar status check error:", error);
    return new Response(
      JSON.stringify({
        configured: false,
        error: "Failed to check calendar configuration"
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
