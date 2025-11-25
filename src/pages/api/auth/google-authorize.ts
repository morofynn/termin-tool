import type { APIRoute } from 'astro';

/**
 * Google OAuth Authorization Initiator
 * 
 * Diese Route startet den OAuth Flow und leitet den User zu Google weiter.
 */
export const GET: APIRoute = async ({ url }) => {
  try {
    const clientId = import.meta.env.GOOGLE_CLIENT_ID;
    
    if (!clientId) {
      return new Response(
        JSON.stringify({ 
          success: false, 
          error: 'GOOGLE_CLIENT_ID not configured in environment variables' 
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      );
    }

    // Callback URL (muss in Google Cloud Console eingetragen sein)
    const redirectUri = `${url.origin}/api/auth/google-callback`;

    // Scopes die wir benötigen
    const scopes = [
      'https://www.googleapis.com/auth/calendar',
      'https://www.googleapis.com/auth/calendar.events',
    ];

    // Google OAuth URL bauen
    const authUrl = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    authUrl.searchParams.set('client_id', clientId);
    authUrl.searchParams.set('redirect_uri', redirectUri);
    authUrl.searchParams.set('response_type', 'code');
    authUrl.searchParams.set('scope', scopes.join(' '));
    authUrl.searchParams.set('access_type', 'offline'); // Wichtig für Refresh Token!
    authUrl.searchParams.set('prompt', 'consent'); // Force consent screen für neuen Refresh Token
    authUrl.searchParams.set('state', Math.random().toString(36).substring(7)); // CSRF Protection

    // Redirect zu Google
    return Response.redirect(authUrl.toString(), 302);

  } catch (error) {
    console.error('Google OAuth Authorization Error:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
};
