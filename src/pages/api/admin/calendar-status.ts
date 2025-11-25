import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ locals }) => {
  try {
    // Check if Google Calendar credentials are configured
    const googleClientId = locals?.runtime?.env?.GOOGLE_CLIENT_ID || import.meta.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = locals?.runtime?.env?.GOOGLE_CLIENT_SECRET || import.meta.env.GOOGLE_CLIENT_SECRET;
    const googleRefreshToken = locals?.runtime?.env?.GOOGLE_REFRESH_TOKEN || import.meta.env.GOOGLE_REFRESH_TOKEN;
    const googleCalendarId = locals?.runtime?.env?.GOOGLE_CALENDAR_ID || import.meta.env.GOOGLE_CALENDAR_ID;

    const configured = !!(
      googleClientId &&
      googleClientSecret &&
      googleRefreshToken &&
      googleCalendarId
    );

    return new Response(
      JSON.stringify({
        configured,
        details: {
          hasClientId: !!googleClientId,
          hasClientSecret: !!googleClientSecret,
          hasRefreshToken: !!googleRefreshToken,
          hasCalendarId: !!googleCalendarId,
        },
      }),
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Calendar status check error:', error);
    return new Response(
      JSON.stringify({
        configured: false,
        error: 'Failed to check calendar configuration',
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
