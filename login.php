<?php
session_start();
if (!empty($_SESSION['user_id'])) { header('Location: dashboard.php'); exit; }
$theme = $_COOKIE['theme'] ?? 'light';
?><!DOCTYPE html>
<html lang="en" data-theme="<?= $theme ?>">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Sign In — EcoBudget</title>
<link rel="stylesheet" href="assets/css/style.css">
</head>
<body>
<div class="auth-page">
  <div class="auth-card">
    <div class="auth-logo">
      <div class="brand-icon">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/>
        </svg>
      </div>
      <div class="brand-text">
        <span class="brand-name">EcoBudget</span>
        <span class="brand-sub">Personal Finance</span>
      </div>
    </div>
    <h1 class="auth-title">Welcome back</h1>
    <p class="auth-sub">Sign in to your account to continue</p>
    <div class="auth-error" id="loginError"></div>
    <div class="form-group">
      <label class="form-label" for="email">Email address</label>
      <input class="form-control" type="email" id="email" placeholder="you@example.com" autocomplete="email">
    </div>
    <div class="form-group">
      <label class="form-label" for="password">Password</label>
      <input class="form-control" type="password" id="password" placeholder="••••••••" autocomplete="current-password">
    </div>
    <button class="btn btn-primary" style="width:100%;margin-top:4px" id="loginBtn">Sign in</button>
    <div class="auth-footer">Don't have an account? <a href="register.php">Create one</a></div>
  </div>
</div>
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<script>
const loginBtn = document.getElementById('loginBtn');
const errEl    = document.getElementById('loginError');

async function doLogin() {
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  if (!email || !password) { showErr('Please fill in all fields'); return; }
  loginBtn.disabled = true; loginBtn.textContent = 'Signing in…';
  try {
    const res  = await fetch('api/login.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({email, password}) });
    const data = await res.json();
    if (!res.ok) { showErr(data.error); return; }
    window.location.href = 'dashboard.php';
  } catch(e) { showErr('Connection error. Please try again.'); }
  finally { loginBtn.disabled = false; loginBtn.textContent = 'Sign in'; }
}

function showErr(msg) { errEl.textContent = msg; errEl.classList.add('show'); }

loginBtn.addEventListener('click', doLogin);
document.addEventListener('keydown', e => { if (e.key === 'Enter') doLogin(); });
lucide.createIcons();
</script>
</body>
</html>
