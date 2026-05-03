<?php
session_start();
if (!empty($_SESSION['user_id'])) { header('Location: dashboard.php'); exit; }
$theme = $_COOKIE['theme'] ?? 'light';
?><!DOCTYPE html>
<html lang="en" data-theme="<?= $theme ?>">
<head>
<meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>Create Account — EcoBudget</title>
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
    <h1 class="auth-title">Create your account</h1>
    <p class="auth-sub">Start tracking your finances today — it's free</p>
    <div class="auth-error" id="regError"></div>
    <div class="form-group">
      <label class="form-label" for="name">Full name</label>
      <input class="form-control" type="text" id="name" placeholder="Your name" autocomplete="name">
    </div>
    <div class="form-group">
      <label class="form-label" for="email">Email address</label>
      <input class="form-control" type="email" id="email" placeholder="you@example.com" autocomplete="email">
    </div>
    <div class="form-group">
      <label class="form-label" for="password">Password <span style="color:var(--muted);font-weight:400">(min. 6 characters)</span></label>
      <input class="form-control" type="password" id="password" placeholder="••••••••" autocomplete="new-password">
    </div>
    <button class="btn btn-primary" style="width:100%;margin-top:4px" id="regBtn">Create account</button>
    <div class="auth-footer">Already have an account? <a href="login.php">Sign in</a></div>
  </div>
</div>
<script src="https://unpkg.com/lucide@latest/dist/umd/lucide.min.js"></script>
<script>
const regBtn = document.getElementById('regBtn');
const errEl  = document.getElementById('regError');

async function doRegister() {
  const name     = document.getElementById('name').value.trim();
  const email    = document.getElementById('email').value.trim();
  const password = document.getElementById('password').value;
  if (!name || !email || !password) { showErr('Please fill in all fields'); return; }
  regBtn.disabled = true; regBtn.textContent = 'Creating account…';
  try {
    const res  = await fetch('api/register.php', { method:'POST', headers:{'Content-Type':'application/json'}, body: JSON.stringify({name, email, password}) });
    const data = await res.json();
    if (!res.ok) { showErr(data.error); return; }
    window.location.href = 'dashboard.php';
  } catch(e) { showErr('Connection error. Please try again.'); }
  finally { regBtn.disabled = false; regBtn.textContent = 'Create account'; }
}

function showErr(msg) { errEl.textContent = msg; errEl.classList.add('show'); }

regBtn.addEventListener('click', doRegister);
document.addEventListener('keydown', e => { if (e.key === 'Enter') doRegister(); });
lucide.createIcons();
</script>
</body>
</html>
