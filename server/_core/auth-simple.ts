// server/_core/auth-simple.ts
import { COOKIE_NAME, ONE_YEAR_MS } from "@shared/const";
import type { Express, Request, Response } from "express";
import * as db from "../db";
import { getSessionCookieOptions } from "./cookies";

console.log("📝 Loading auth-simple.ts...");

// সিম্পল অ্যাডমিন লগইন - Environment Variables থেকে নিবে
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@fivex.local";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "@xtron123";

console.log(`✅ Admin credentials loaded - Email: ${ADMIN_EMAIL}`);

export function registerSimpleAuthRoutes(app: Express) {
  console.log("🚀 Registering simple auth routes...");
  
  // সুন্দর লগইন পেজ
  app.get("/login", (req: Request, res: Response) => {
    console.log("✅ /login route accessed");
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>FiveX.check - Admin Login</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: #0a0f1e;
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      overflow: hidden;
    }
    .background {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      z-index: 0;
    }
    .gradient {
      position: absolute;
      width: 100%;
      height: 100%;
      background: radial-gradient(circle at 50% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%);
      animation: pulse 8s ease-in-out infinite;
    }
    .grid {
      position: absolute;
      width: 100%;
      height: 100%;
      background-image: 
        linear-gradient(rgba(139, 92, 246, 0.1) 1px, transparent 1px),
        linear-gradient(90deg, rgba(139, 92, 246, 0.1) 1px, transparent 1px);
      background-size: 50px 50px;
      animation: gridMove 20s linear infinite;
    }
    @keyframes pulse { 0%,100%{opacity:0.5;transform:scale(1);} 50%{opacity:0.8;transform:scale(1.2);} }
    @keyframes gridMove { 0%{transform:translateY(0);} 100%{transform:translateY(50px);} }
    .login-container {
      position: relative;
      z-index: 1;
      width: 100%;
      max-width: 420px;
      padding: 2rem;
    }
    .logo { text-align: center; margin-bottom: 2rem; }
    .logo h1 {
      font-size: 2.5rem;
      font-weight: 800;
      background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: 0.5rem;
    }
    .logo p { color: #94a3b8; font-size: 0.875rem; font-weight: 500; }
    .login-card {
      background: rgba(15, 25, 50, 0.8);
      backdrop-filter: blur(10px);
      border: 1px solid rgba(139, 92, 246, 0.2);
      border-radius: 24px;
      padding: 2rem;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.5);
    }
    .login-header { text-align: center; margin-bottom: 2rem; }
    .login-header h2 { color: #f0faff; font-size: 1.5rem; font-weight: 700; margin-bottom: 0.5rem; }
    .login-header p { color: #94a3b8; font-size: 0.875rem; }
    .form-group { margin-bottom: 1.5rem; }
    .form-group label {
      display: block;
      color: #f0faff;
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
    }
    .input-wrapper input {
      width: 100%;
      padding: 0.875rem 1rem;
      background: rgba(26, 37, 66, 0.8);
      border: 2px solid rgba(139, 92, 246, 0.2);
      border-radius: 12px;
      color: #f0faff;
      font-size: 1rem;
      transition: all 0.3s ease;
    }
    .input-wrapper input:focus {
      outline: none;
      border-color: #8b5cf6;
      background: rgba(26, 37, 66, 1);
      box-shadow: 0 0 0 3px rgba(139, 92, 246, 0.2);
    }
    .login-btn {
      width: 100%;
      padding: 0.875rem;
      background: linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%);
      border: none;
      border-radius: 12px;
      color: white;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      margin-bottom: 1rem;
    }
    .login-btn:hover { transform: translateY(-2px); box-shadow: 0 10px 20px -5px rgba(139, 92, 246, 0.5); }
    .discord-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      width: 100%;
      padding: 0.75rem 1rem;
      margin-top: 0.5rem;
      background: rgba(88, 101, 242, 0.15);
      border: 2px solid rgba(88, 101, 242, 0.8);
      border-radius: 12px;
      color: #a5b4fc;
      font-size: 0.95rem;
      font-weight: 600;
      text-align: center;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      animation: neonGlow 2s ease-in-out infinite;
    }
    .discord-btn:hover {
      background: rgba(88, 101, 242, 0.35);
      border-color: #7289da;
      color: #c7d2fe;
      transform: translateY(-2px);
      animation: none;
      box-shadow: 0 0 25px rgba(88, 101, 242, 0.7), inset 0 0 20px rgba(88, 101, 242, 0.1);
    }
    .discord-btn svg { flex-shrink: 0; }
    @keyframes neonGlow {
      0%, 100% { box-shadow: 0 0 8px rgba(88, 101, 242, 0.5), 0 0 20px rgba(88, 101, 242, 0.2); }
      50% { box-shadow: 0 0 20px rgba(88, 101, 242, 0.8), 0 0 40px rgba(88, 101, 242, 0.4); }
    }
    .back-home-btn {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1rem;
      padding: 0.6rem 1.25rem;
      background: transparent;
      border: 2px solid rgba(139, 92, 246, 0.4);
      border-radius: 12px;
      color: #a5b4fc;
      font-size: 0.9rem;
      font-weight: 600;
      text-decoration: none;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    .back-home-btn:hover {
      background: rgba(139, 92, 246, 0.2);
      border-color: #8b5cf6;
      color: #c7d2fe;
    }
    .login-footer {
      text-align: center;
      margin-top: 1.5rem;
      color: #64748b;
      font-size: 0.75rem;
    }
    .login-footer a { color: #8b5cf6; text-decoration: none; font-weight: 600; }
    .alert {
      position: fixed;
      top: 2rem;
      right: 2rem;
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, #ff4444 0%, #ff6b6b 100%);
      border-radius: 12px;
      color: white;
      font-weight: 600;
      z-index: 1000;
      animation: slideIn 0.3s ease;
    }
    @keyframes slideIn { from{transform:translateX(100%);opacity:0;} to{transform:translateX(0);opacity:1;} }
    .loading { position: relative; pointer-events: none; opacity: 0.7; }
    .loading::after {
      content: '';
      position: absolute;
      width: 20px;
      height: 20px;
      top: 50%;
      left: 50%;
      margin-left: -10px;
      margin-top: -10px;
      border: 2px solid rgba(255,255,255,0.3);
      border-top-color: white;
      border-radius: 50%;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  </style>
</head>
<body>
  <div class="background"><div class="gradient"></div><div class="grid"></div></div>
  <div class="login-container">
    <div class="logo"><h1>FiveX.check</h1><p>Professional FiveM & PC Security Scanner</p></div>
    <div class="login-card">
      <div class="login-header"><h2>Admin Login</h2><p>Enter your credentials</p></div>
      <form id="loginForm" onsubmit="handleLogin(event)">
        <div class="form-group">
          <label>Email</label>
          <div class="input-wrapper"><input type="email" id="email" required placeholder="Enter your email" /></div>
        </div>
        <div class="form-group">
          <label>Password</label>
          <div class="input-wrapper"><input type="password" id="password" required placeholder="Enter your password" /></div>
        </div>
        <button type="submit" id="loginBtn" class="login-btn">Access Dashboard</button>
        <a href="https://discord.gg/sQQXgYk8" target="_blank" rel="noopener noreferrer" class="discord-btn">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028 14.09 14.09 0 0 0 1.226-1.994.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/></svg>
          <span>Join Discord</span>
        </a>
        <div style="text-align:center;">
          <a href="/" class="back-home-btn">← Back To Home</a>
        </div>
      </form>
    </div>
    <div class="login-footer">© 2026 FiveX.check By XTRON</div>
  </div>
  <script>
    async function handleLogin(event) {
      event.preventDefault();
      const btn = document.getElementById('loginBtn');
      const email = document.getElementById('email').value;
      const password = document.getElementById('password').value;
      btn.classList.add('loading'); btn.textContent = 'Authenticating...';
      try {
        const response = await fetch('/api/auth/login', {
          method: 'POST', headers: {'Content-Type': 'application/json'},
          body: JSON.stringify({ email, password })
        });
        if (response.ok) { window.location.href = '/'; } 
        else { 
          const errorMsg = await response.text();
          showAlert(errorMsg || 'Invalid credentials');
          btn.classList.remove('loading'); btn.textContent = 'Access Dashboard';
        }
      } catch (error) {
        showAlert('Connection error');
        btn.classList.remove('loading'); btn.textContent = 'Access Dashboard';
      }
    }
    function showAlert(message) {
      const alertDiv = document.createElement('div');
      alertDiv.className = 'alert';
      alertDiv.textContent = message;
      document.body.appendChild(alertDiv);
      setTimeout(() => alertDiv.remove(), 3000);
    }
  </script>
</body>
</html>`);
  });

  // লগইন API - ✅ এখানে role: "admin" যোগ করা হয়েছে
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    console.log("✅ /api/auth/login accessed");
    const { email, password } = req.body;

    if (email === ADMIN_EMAIL && password === ADMIN_PASSWORD) {
      console.log("✅ Login successful, creating admin user...");
      
      try {
        // ✅ এখানে role: "admin" স্পষ্টভাবে পাঠানো হয়েছে
        await db.upsertUser({
          openId: "admin-user",
          name: "Administrator",
          email: email,
          loginMethod: "simple",
          lastSignedIn: new Date(),
          role: "admin"  // ← এই লাইনটা যোগ করো
        });
        console.log("✅ Admin user created/updated in database");

        const sessionToken = Math.random().toString(36).substring(2);
        const cookieOptions = getSessionCookieOptions(req);
        res.cookie(COOKIE_NAME, sessionToken, { ...cookieOptions, maxAge: ONE_YEAR_MS });

        console.log("✅ Session created, redirecting to dashboard");
        res.redirect(302, "/");
      } catch (error) {
        console.error("❌ Database error:", error);
        res.status(500).send("Database error");
      }
    } else {
      res.status(401).send("Invalid credentials");
    }
  });

  // লগআউট
  app.post("/api/auth/logout", (req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME, { path: "/" });
    res.json({ success: true });
  });

  // কারেন্ট ইউজার চেক
  app.get("/api/auth/me", async (req: Request, res: Response) => {
    const token = req.cookies?.[COOKIE_NAME];
    if (token) {
      // ডাটাবেস থেকে ইউজার fetch করে role সহ পাঠানো ভালো
      const user = await db.getUserByOpenId("admin-user");
      if (user) {
        res.json({ user: { 
          id: user.id, 
          name: user.name || "Admin", 
          email: user.email || ADMIN_EMAIL,
          role: user.role || "admin" 
        }});
      } else {
        // ডাটাবেস না থাকলেও অ্যাডমিন অ্যাক্সেস দাও
        res.json({ user: { 
          id: 1, 
          name: "Admin", 
          email: ADMIN_EMAIL,
          role: "admin" 
        }});
      }
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
  });

  console.log("✅ Simple auth routes registered!");
  console.log("   - GET /login");
  console.log("   - POST /api/auth/login");
  console.log("   - POST /api/auth/logout");
  console.log("   - GET /api/auth/me");
}