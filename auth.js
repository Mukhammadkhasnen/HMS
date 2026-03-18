// ============================================================
// auth.js — Login, logout, and user profile management
// ============================================================

import {
  auth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  restGet, restSet, serverTimestamp
} from './firebase.js';
import { setCU, clearCU, CACHE, loadAllData, stopPolling } from './state.js';
import { buildNav, populateDropdowns, populateMonthDropdowns, showPage, startOnlineMonitor } from './ui.js';

// ── Bootstrap: watch auth state ──────────────────────────
export function initAuth() {
  onAuthStateChanged(auth, user => {
    if (user) loadUserProfile(user);
    else      showLoginScreen();
  });
}

// ── Login screen ──────────────────────────────────────────
export function showLoginScreen() {
  document.getElementById('loading').style.display    = 'none';
  document.getElementById('app').style.display        = 'none';
  // Hide hamburger, close sidebar and overlay
  document.getElementById('hamburger')?.classList.remove('logged-in');
  document.querySelector('.sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('open');
  const ls = document.getElementById('login-screen');
  ls.style.display        = 'flex';
  ls.style.flexDirection  = 'column';
  const lb = document.getElementById('lbtn');
  if (lb) { lb.textContent = 'Sign In →'; lb.disabled = false; }
  const le = document.getElementById('le');
  if (le) le.textContent = '';
}

// ── Sign in ───────────────────────────────────────────────
let _loadingProfile = false; // prevents double-call from onAuthStateChanged + doLogin

export async function doLogin() {
  const em = document.getElementById('lu').value.trim();
  const pw = document.getElementById('lp').value;
  const le = document.getElementById('le');
  const lb = document.getElementById('lbtn');
  if (!em || !pw) { le.textContent = 'Enter email and password.'; return; }
  lb.textContent = 'Signing in...'; lb.disabled = true; le.textContent = '';
  try {
    // onAuthStateChanged fires automatically after this and calls loadUserProfile
    await signInWithEmailAndPassword(auth, em, pw);
    document.getElementById('login-screen').style.display = 'none';
    document.getElementById('loading').style.display      = 'flex';
  } catch (err) {
    const msg =
      err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' ? 'Wrong email or password.' :
      err.code === 'auth/user-not-found'        ? 'No account found with this email.' :
      err.code === 'auth/too-many-requests'     ? 'Too many attempts. Wait a minute and try again.' :
      err.code === 'auth/network-request-failed'? 'Network error — check your internet connection.' :
      err.message;
    le.textContent = msg;
    lb.textContent = 'Sign In →'; lb.disabled = false;
  }
}

// ── Load user profile from Firestore ─────────────────────
export async function loadUserProfile(user, retryCount = 0) {
  if (_loadingProfile && retryCount === 0) return; // guard double-call
  if (retryCount === 0) _loadingProfile = true;

  const loadingEl = document.getElementById('loading');
  if (retryCount > 0 && loadingEl) {
    loadingEl.style.display = 'flex';
    const p = loadingEl.querySelector('p');
    if (p) p.textContent = `Retrying... (${retryCount}/8)`;
  }

  try {
    let profile = await restGet('staff', user.uid);
    if (!profile) {
      // First-ever login: auto-create admin profile
      profile = {
        name:       user.email.split('@')[0],
        email:      user.email,
        role:       'admin',
        doctorName: null,
        uid:        user.uid,
        active:     true
      };
      await restSet('staff', user.uid, profile);
    }
    setCU(Object.assign(profile, { uid: user.uid }));
  } catch (err) {
    console.warn('Profile load error:', err.message);
    if (retryCount < 8) {
      const delay = Math.min((retryCount + 1) * 1500, 8000);
      if (loadingEl) {
        const p = loadingEl.querySelector('p');
        if (p) p.textContent = `Connecting... retry ${retryCount + 1} (${Math.round(delay / 1000)}s)`;
      }
      setTimeout(() => loadUserProfile(user, retryCount + 1), delay);
      return;
    }
    // After 8 retries: show error screen
    _loadingProfile = false;
    if (loadingEl) loadingEl.innerHTML = `
      <div style="background:white;border-radius:18px;padding:32px 36px;max-width:460px;text-align:center;color:#2d3748;">
        <div style="font-size:44px;">📡</div>
        <h2 style="font-family:'DM Serif Display',serif;color:#e53e3e;margin:12px 0 8px;">Cannot Connect</h2>
        <p style="font-size:14px;color:#718096;margin-bottom:10px;">Tried 8 times. Your network is blocking Firebase.</p>
        <div style="background:#fef3c7;border-radius:9px;padding:13px 16px;font-size:13px;text-align:left;margin-bottom:18px;color:#92400e;">
          <strong>Try these:</strong><br>
          ✦ Switch to mobile data (4G/5G)<br>
          ✦ Try a VPN app<br>
          ✦ Use a different WiFi<br>
          ✦ Change DNS to 8.8.8.8
        </div>
        <p style="font-size:11px;color:#a0aec0;margin-bottom:16px;">Error: ${err.message}</p>
        <button onclick="location.reload()" style="padding:12px 28px;background:#0a7c6e;color:white;border:none;border-radius:10px;font-size:15px;font-weight:600;cursor:pointer;">🔄 Try Again</button>
      </div>`;
    return;
  }

  // ── Success ───────────────────────────────────────────
  _loadingProfile = false;
  const { CU } = await import('./state.js');

  document.getElementById('login-screen').style.display = 'none';
  document.getElementById('loading').style.display      = 'none';
  document.getElementById('app').style.display          = 'block';
  // Show hamburger now that user is logged in
  document.getElementById('hamburger')?.classList.add('logged-in');
  document.getElementById('sbn').textContent            = CU.name || CU.email;

  const pill = document.getElementById('srp');
  pill.textContent = CU.role === 'admin' ? 'Admin' : CU.role === 'doctor' ? 'Doctor' : 'Staff';
  pill.className   = `rp rp-${CU.role}`;

  buildNav();
  populateDropdowns();
  populateMonthDropdowns();
  startOnlineMonitor();
  // Tell rx.js which doctor is logged in (for per-doctor favourites)
  document.dispatchEvent(new CustomEvent('hms-user-ready', {
    detail: { uid: CU.uid, name: CU.name || CU.email, role: CU.role }
  }));
  await loadAllData();
  showPage('dashboard');
}

// ── Sign out ──────────────────────────────────────────────
export async function doLogout() {
  stopPolling();
  clearCU();
  // Hide hamburger and close sidebar + overlay on logout
  document.getElementById('hamburger')?.classList.remove('logged-in');
  document.querySelector('.sidebar')?.classList.remove('open');
  document.getElementById('sidebar-overlay')?.classList.remove('open');
  await signOut(auth);
}
