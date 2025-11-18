globalThis.process ??= {}; globalThis.process.env ??= {};
import './chunks/astro-designed-error-pages_lGlKdph_.mjs';
import './chunks/astro/server_EdVLS0R4.mjs';
import { s as sequence } from './chunks/index_COzjm4eB.mjs';

const baseUrl = "/".replace(/\/$/, "");

const onRequest$2 = async (ctx, next) => {
  const { request, cookies, locals } = ctx;
  const url = new URL(request.url);
  const adminSecretPath = locals?.runtime?.env?.ADMIN_SECRET_PATH || "secure-admin-panel-xyz789";
  const adminPassword = locals?.runtime?.env?.ADMIN_PASSWORD || "MeinSicheresPasswort123!";
  const adminPath = `${baseUrl}/${adminSecretPath}`;
  if (url.pathname === `${baseUrl}/${adminSecretPath}`) {
    const authToken = cookies.get("admin_auth")?.value;
    if (authToken === adminPassword) {
      return next();
    }
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
        const response = await fetch('${adminPath}/auth', {
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
        headers: { "Content-Type": "text/html; charset=utf-8" }
      }
    );
  }
  if (url.pathname === `${baseUrl}/${adminSecretPath}/auth` && request.method === "POST") {
    try {
      const body = await request.json();
      if (body.password === adminPassword) {
        cookies.set("admin_auth", adminPassword, {
          path: "/",
          maxAge: 60 * 60 * 24 * 7,
          httpOnly: true,
          secure: true,
          sameSite: "strict"
        });
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      } else {
        return new Response(JSON.stringify({ success: false }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        });
      }
    } catch (error) {
      return new Response(JSON.stringify({ success: false }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }
  }
  return next();
};

const onRequest$1 = (context, next) => {
  if (context.isPrerendered) {
    context.locals.runtime ??= {
      env: process.env
    };
  }
  return next();
};

const onRequest = sequence(
	onRequest$1,
	onRequest$2
	
);

export { onRequest };
