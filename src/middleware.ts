import type { MiddlewareHandler } from 'astro';
import { baseUrl } from './lib/base-url';

export const onRequest: MiddlewareHandler = async (ctx, next) => {
  const { request, cookies, locals, redirect } = ctx;
  const url = new URL(request.url);

  if (import.meta.env.DEV && url.pathname === '/-wf/ready') {
    const resHeaders = new Headers({
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    });

    return new Response(JSON.stringify({ ready: true }), {
      headers: resHeaders,
    });
  }

  // ============================================================
  // CRON JOB HANDLER - Cloudflare Cron Trigger
  // ============================================================
  const cronHeader = request.headers.get('cf-cron');
  if (cronHeader && url.pathname === `${baseUrl}/api/send-reminders`) {
    console.log('🔔 Cron trigger detected, executing reminder job...');
    return next();
  }

  // Verhindere unauthorized access zu send-reminders
  if (url.pathname === `${baseUrl}/api/send-reminders`) {
    if (import.meta.env.DEV) {
      return next();
    }
    
    const authToken = cookies.get('admin_auth')?.value;
    const adminPassword = locals?.runtime?.env?.ADMIN_PASSWORD || import.meta.env.ADMIN_PASSWORD || 'moro';
    
    if (authToken === adminPassword) {
      return next();
    }
    
    return new Response(
      JSON.stringify({ message: 'Unauthorized' }),
      { status: 403, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // ============================================================
  // ADMIN BEREICH SCHUTZ - DYNAMISCHER PATH
  // ============================================================
  const adminSecretPath = locals?.runtime?.env?.ADMIN_SECRET_PATH || 
                         import.meta.env.ADMIN_SECRET_PATH || 
                         'admin';
  const adminPassword = locals?.runtime?.env?.ADMIN_PASSWORD || 
                       import.meta.env.ADMIN_PASSWORD || 
                       'moro';
  
  const adminPath = `${baseUrl}/${adminSecretPath}`;

  // Prüfe ob Admin-Bereich aufgerufen wird
  if (url.pathname === `${baseUrl}/${adminSecretPath}`) {
    // Prüfe Session-Cookie
    const authToken = cookies.get('admin_auth')?.value;
    
    if (authToken === adminPassword) {
      // Authentifiziert - rewrite zu /admin
      return ctx.rewrite(`${baseUrl}/admin`);
    }

    // Nicht authentifiziert - zeige Login-Seite
    return new Response(
      `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Admin Login</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .login-container {
      background: white;
      padding: 40px;
      border-radius: 16px;
      box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
      max-width: 400px;
      width: 100%;
    }
    h1 {
      text-align: center;
      color: #333;
      margin-bottom: 10px;
      font-size: 24px;
    }
    .subtitle {
      text-align: center;
      color: #666;
      margin-bottom: 30px;
      font-size: 14px;
    }
    .form-group {
      margin-bottom: 20px;
    }
    label {
      display: block;
      margin-bottom: 8px;
      color: #555;
      font-weight: 500;
      font-size: 14px;
    }
    input[type="password"] {
      width: 100%;
      padding: 12px 16px;
      border: 2px solid #e0e0e0;
      border-radius: 8px;
      font-size: 16px;
      transition: border-color 0.3s;
    }
    input[type="password"]:focus {
      outline: none;
      border-color: #667eea;
    }
    button {
      width: 100%;
      padding: 14px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }
    button:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }
    button:active {
      transform: translateY(0);
    }
    .error {
      color: #e74c3c;
      text-align: center;
      margin-top: 15px;
      font-size: 14px;
      display: none;
    }
    .error.show {
      display: block;
    }
    .lock-icon {
      width: 60px;
      height: 60px;
      margin: 0 auto 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .lock-icon svg {
      width: 30px;
      height: 30px;
      fill: white;
    }
  </style>
</head>
<body>
  <div class="login-container">
    <div class="lock-icon">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
        <path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zm6 10l.002 8H6v-8h12zm-9-2V7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9z"/>
      </svg>
    </div>
    <h1>🔒 Admin-Bereich</h1>
    <p class="subtitle">Bitte geben Sie das Passwort ein</p>
    <form id="loginForm">
      <div class="form-group">
        <label for="password">Passwort</label>
        <input 
          type="password" 
          id="password" 
          name="password" 
          required 
          autofocus
          placeholder="••••••••"
        >
      </div>
      <button type="submit">Anmelden</button>
      <div class="error" id="error">❌ Falsches Passwort</div>
    </form>
  </div>

  <script>
    document.getElementById('loginForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const password = document.getElementById('password').value;
      const errorDiv = document.getElementById('error');
      
      try {
        const response = await fetch(window.location.pathname + '/auth', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password })
        });

        if (response.ok) {
          window.location.reload();
        } else {
          errorDiv.classList.add('show');
          document.getElementById('password').value = '';
          document.getElementById('password').focus();
          setTimeout(() => errorDiv.classList.remove('show'), 3000);
        }
      } catch (error) {
        errorDiv.textContent = '❌ Fehler bei der Anmeldung';
        errorDiv.classList.add('show');
      }
    });
  </script>
</body>
</html>`,
      {
        status: 200,
        headers: { 'Content-Type': 'text/html; charset=utf-8' },
      }
    );
  }

  // Auth-Endpoint für Login
  if (url.pathname === `${baseUrl}/${adminSecretPath}/auth` && request.method === 'POST') {
    try {
      const body = await request.json() as { password?: string };
      
      if (body.password === adminPassword) {
        // Setze Cookie für 7 Tage
        cookies.set('admin_auth', adminPassword, {
          path: '/',
          maxAge: 60 * 60 * 24 * 7,
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
        });
        
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      } else {
        return new Response(JSON.stringify({ success: false }), {
          status: 401,
          headers: { 'Content-Type': 'application/json' },
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({ success: false }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }
  }

  // Blockiere direkten Zugriff auf /admin (nur über rewrite erlaubt)
  if (url.pathname === `${baseUrl}/admin`) {
    const authToken = cookies.get('admin_auth')?.value;
    if (authToken !== adminPassword) {
      return redirect(`${baseUrl}/${adminSecretPath}`, 302);
    }
  }

  return next();
};
