import type { APIRoute } from 'astro';

/**
 * Google OAuth Callback Handler
 * 
 * Diese Route wird von Google nach der Autorisierung aufgerufen.
 * Sie tauscht den Authorization Code gegen einen Access Token und Refresh Token.
 */
export const GET: APIRoute = async ({ request, url }) => {
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const state = url.searchParams.get('state');

  // Fehler von Google
  if (error) {
    console.error('Google OAuth Error:', error);
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'Authorization failed',
        details: error 
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  // Kein Authorization Code
  if (!code) {
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: 'No authorization code received' 
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }

  try {
    const clientId = import.meta.env.GOOGLE_CLIENT_ID;
    const clientSecret = import.meta.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${url.origin}/api/auth/google-callback`;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials not configured');
    }

    // Tausche Authorization Code gegen Tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenResponse.ok) {
      const errorData = await tokenResponse.json();
      console.error('Token exchange failed:', errorData);
      throw new Error(`Token exchange failed: ${errorData.error_description || errorData.error}`);
    }

    const tokens = await tokenResponse.json();

    // Validiere dass wir einen Refresh Token bekommen haben
    if (!tokens.refresh_token) {
      console.warn('No refresh token received. User may need to revoke access and re-authorize.');
    }

    // HTML Response mit Tokens (für Copy & Paste in .env)
    const html = `
<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Google Calendar - Autorisierung erfolgreich</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
      max-width: 800px;
      width: 100%;
      padding: 40px;
    }
    .success-icon {
      width: 80px;
      height: 80px;
      background: #10b981;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 24px;
    }
    .success-icon svg {
      width: 48px;
      height: 48px;
      color: white;
    }
    h1 {
      text-align: center;
      color: #1f2937;
      font-size: 28px;
      margin-bottom: 16px;
    }
    p {
      text-align: center;
      color: #6b7280;
      margin-bottom: 32px;
      line-height: 1.6;
    }
    .token-section {
      background: #f9fafb;
      border: 2px solid #e5e7eb;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 24px;
    }
    .token-section h2 {
      color: #374151;
      font-size: 18px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .token-box {
      background: white;
      border: 1px solid #d1d5db;
      border-radius: 6px;
      padding: 16px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #1f2937;
      word-break: break-all;
      line-height: 1.6;
      position: relative;
      margin-bottom: 12px;
    }
    .copy-btn {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 10px 20px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: background 0.2s;
      width: 100%;
    }
    .copy-btn:hover {
      background: #2563eb;
    }
    .copy-btn:active {
      transform: scale(0.98);
    }
    .warning {
      background: #fef3c7;
      border: 2px solid #fbbf24;
      border-radius: 8px;
      padding: 16px;
      margin-top: 24px;
      display: flex;
      gap: 12px;
    }
    .warning-icon {
      color: #f59e0b;
      flex-shrink: 0;
    }
    .warning-text {
      color: #92400e;
      font-size: 14px;
      line-height: 1.6;
      text-align: left;
    }
    .warning-text strong {
      display: block;
      margin-bottom: 8px;
      font-size: 15px;
    }
    .steps {
      margin-top: 32px;
      padding-top: 32px;
      border-top: 2px solid #e5e7eb;
    }
    .steps h3 {
      color: #374151;
      font-size: 20px;
      margin-bottom: 16px;
    }
    .steps ol {
      padding-left: 24px;
    }
    .steps li {
      color: #4b5563;
      margin-bottom: 12px;
      line-height: 1.6;
    }
    .steps code {
      background: #f3f4f6;
      padding: 2px 6px;
      border-radius: 4px;
      font-family: 'Courier New', monospace;
      font-size: 13px;
      color: #ef4444;
    }
    ${!tokens.refresh_token ? `
    .no-refresh-warning {
      background: #fee2e2;
      border: 2px solid #ef4444;
      border-radius: 8px;
      padding: 20px;
      margin-top: 24px;
      color: #991b1b;
    }
    .no-refresh-warning h3 {
      font-size: 18px;
      margin-bottom: 12px;
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .no-refresh-warning p {
      text-align: left;
      color: #7f1d1d;
      margin-bottom: 16px;
    }
    .no-refresh-warning ol {
      text-align: left;
      padding-left: 24px;
      color: #7f1d1d;
    }
    .no-refresh-warning li {
      margin-bottom: 8px;
    }
    ` : ''}
  </style>
</head>
<body>
  <div class="container">
    <div class="success-icon">
      <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path>
      </svg>
    </div>
    
    <h1>✅ Autorisierung erfolgreich!</h1>
    <p>Google Calendar wurde erfolgreich verbunden. Kopieren Sie die folgenden Werte in Ihre <code>.env</code> Datei.</p>

    ${tokens.refresh_token ? `
    <div class="token-section">
      <h2>🔑 Refresh Token</h2>
      <div class="token-box" id="refreshToken">${tokens.refresh_token}</div>
      <button class="copy-btn" onclick="copyToken('refreshToken', 'GOOGLE_REFRESH_TOKEN')">
        📋 Refresh Token kopieren
      </button>
    </div>
    ` : ''}

    <div class="token-section">
      <h2>🎟️ Access Token (Optional)</h2>
      <div class="token-box" id="accessToken">${tokens.access_token}</div>
      <button class="copy-btn" onclick="copyToken('accessToken', 'GOOGLE_ACCESS_TOKEN')">
        📋 Access Token kopieren
      </button>
      <p style="margin-top: 12px; font-size: 13px; color: #6b7280; text-align: left;">
        ℹ️ Der Access Token läuft nach ${Math.floor(tokens.expires_in / 60)} Minuten ab. Verwenden Sie den Refresh Token für dauerhafte Integration.
      </p>
    </div>

    ${!tokens.refresh_token ? `
    <div class="no-refresh-warning">
      <h3>
        <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
        </svg>
        Kein Refresh Token erhalten
      </h3>
      <p><strong>Das bedeutet:</strong> Sie haben bereits Zugriff gewährt und müssen diesen erst widerrufen.</p>
      <p><strong>So beheben Sie das Problem:</strong></p>
      <ol>
        <li>Gehen Sie zu: <a href="https://myaccount.google.com/permissions" target="_blank" style="color: #2563eb;">myaccount.google.com/permissions</a></li>
        <li>Suchen Sie nach Ihrer App ("Terminbuchung" oder Ihr Projektname)</li>
        <li>Klicken Sie auf <strong>"Zugriff entfernen"</strong></li>
        <li>Gehen Sie zurück zum Admin-Panel und starten Sie die Autorisierung erneut</li>
      </ol>
    </div>
    ` : ''}

    <div class="warning">
      <svg class="warning-icon" width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
      </svg>
      <div class="warning-text">
        <strong>⚠️ Sicherheitshinweis</strong>
        Teilen Sie diese Tokens niemals öffentlich! Speichern Sie sie nur in Ihrer lokalen <code>.env</code> Datei und fügen Sie <code>.env</code> zu <code>.gitignore</code> hinzu.
      </div>
    </div>

    <div class="steps">
      <h3>📝 Nächste Schritte:</h3>
      <ol>
        <li>Kopieren Sie ${tokens.refresh_token ? 'den Refresh Token' : 'die Tokens'} oben</li>
        <li>Öffnen Sie Ihre <code>.env</code> Datei im Projekt</li>
        <li>Fügen Sie folgende Zeile hinzu (oder aktualisieren Sie sie):
          <br><code>GOOGLE_REFRESH_TOKEN="${tokens.refresh_token || 'REFRESH_TOKEN_HIER_EINFÜGEN'}"</code>
        </li>
        <li>Starten Sie Ihren Development Server neu</li>
        <li>Testen Sie die Integration im Admin-Panel</li>
      </ol>
    </div>
  </div>

  <script>
    function copyToken(elementId, envVarName) {
      const element = document.getElementById(elementId);
      const token = element.textContent;
      
      navigator.clipboard.writeText(token).then(() => {
        const btn = event.target;
        const originalText = btn.textContent;
        btn.textContent = '✅ Kopiert!';
        btn.style.background = '#10b981';
        
        setTimeout(() => {
          btn.textContent = originalText;
          btn.style.background = '#3b82f6';
        }, 2000);
      }).catch(err => {
        console.error('Copy failed:', err);
        alert('Kopieren fehlgeschlagen. Bitte manuell markieren und kopieren.');
      });
    }

    // Auto-close nach 5 Minuten (Sicherheit)
    setTimeout(() => {
      if (confirm('Diese Seite enthält sensible Daten und wird jetzt geschlossen. Haben Sie alle Tokens kopiert?')) {
        window.close();
      }
    }, 5 * 60 * 1000);
  </script>
</body>
</html>
    `;

    return new Response(html, {
      status: 200,
      headers: { 
        'Content-Type': 'text/html; charset=utf-8',
        'Cache-Control': 'no-store, no-cache, must-revalidate',
        'Pragma': 'no-cache',
      }
    });

  } catch (error) {
    console.error('Google OAuth Callback Error:', error);
    
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
