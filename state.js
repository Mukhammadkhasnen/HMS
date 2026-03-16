// ============================================================
// state.js — Global app state, data polling, and cache
// ============================================================

// ── Current logged-in user profile ───────────────────────
export let CU = null;
export function setCU(profile) { CU = profile; }
export function clearCU()      { CU = null; }

// ── In-memory cache of all Firestore collections ─────────
export const CACHE = {
  patients:      [],
  tokens:        [],
  staff:         [],
  expenses:      [],
  consumables:   [],
  budgets:       [],
  distributions: []
};

// ── Tab state — stored as object so all modules share the same reference ──
// (ES module primitive exports are live bindings but reassigning from another
//  module doesn't propagate — using an object property fixes this)
export const tabs = { etab: 'summary', btab: 'overview' };
// Keep these for backwards compat
export function setEtab(t) { tabs.etab = t; }
export function setBtab(t) { tabs.btab = t; }

// ── Polling ───────────────────────────────────────────────
let _pollTimer = null;
let _pollCount = 0;

export function stopPolling() {
  if (_pollTimer) { clearInterval(_pollTimer); _pollTimer = null; }
  _pollCount = 0;
}

export async function loadAllData() {
  await pollAllData();
  if (_pollTimer) clearInterval(_pollTimer);
  _pollTimer = setInterval(pollAllData, 8000);
}

async function pollAllData() {
  const { restGetAll } = await import('./firebase.js');
  _pollCount++;
  const isFirst = (_pollCount === 1);

  async function fetchCol(name, sortFn) {
    try {
      let docs = await restGetAll(name);
      if (sortFn) docs.sort(sortFn);
      return { ok: true, docs };
    } catch (err) {
      if (isFirst) console.error(`fetch [${name}] error:`, err.message);
      return { ok: false, docs: [], err: { code: 'fetch-error', message: err.message } };
    }
  }

  const byTimestampDesc = (a, b) => {
    const ta = a.timestamp ? (a.timestamp.seconds || 0) : 0;
    const tb = b.timestamp ? (b.timestamp.seconds || 0) : 0;
    return tb - ta;
  };

  const results = await Promise.allSettled([
    fetchCol('staff'),
    fetchCol('patients', byTimestampDesc),
    fetchCol('tokens'),
    fetchCol('expenses'),
    fetchCol('consumables'),
    fetchCol('budgets'),
    fetchCol('distributions'),
  ]);

  const names = ['staff', 'patients', 'tokens', 'expenses', 'consumables', 'budgets', 'distributions'];
  let allOk = true;

  results.forEach((r, i) => {
    const name   = names[i];
    const result = r.status === 'fulfilled' ? r.value : { ok: false, docs: [], err: r.reason };

    if (result.ok) {
      if (isFirst) updateChk(`chk-${name}`, true, `${name}: OK (${result.docs.length} records)`);
      CACHE[name] = result.docs;

      // Re-render whichever page is currently visible
      const active = id => document.getElementById(`page-${id}`)?.classList.contains('active');
      if (name === 'staff') {
        import('./ui.js').then(ui => {
          ui.populateDropdowns();
          if (active('users')) ui.renderUsers();
        });
      }
      if (name === 'patients' || name === 'tokens') {
        import('./ui.js').then(ui => {
          if (active('dashboard'))   ui.renderDash();
          if (active('patients'))    ui.renderPts();
          if (active('my-patients')) ui.renderDocPts();
          if (active('earnings'))    ui.renderEarnings();
          if (active('queue'))       ui.renderQueue();
        });
      }
      if (name === 'expenses' || name === 'consumables' || name === 'budgets' || name === 'distributions') {
        if (active('budget') || active('earnings')) {
          import('./ui.js').then(ui => {
            if (active('budget'))   ui.renderBudget();
            if (active('earnings')) ui.renderEarnings();
          });
        }
      }
    } else {
      allOk = false;
      if (isFirst) {
        console.error(`[${name}] fetch failed:`, result.err?.code);
        updateChk(`chk-${name}`, false, `${name}: FAILED — ${result.err?.code || 'unknown error'}`);
        if (result.err?.code === 'permission-denied')
          showDbWarning(`Permission denied on <strong>${name}</strong>. Check Firestore Rules.`);
        if (result.err?.message?.toLowerCase().includes('offline'))
          showDbWarning('Cannot reach Firebase. Try mobile data or a VPN.');
      }
    }
  });

  if (isFirst && allOk) {
    const w = document.getElementById('db-warn');
    if (w) w.style.display = 'none';
    setTimeout(() => {
      const sc = document.getElementById('setup-checklist');
      if (sc) sc.style.display = 'none';
    }, 5000);
  }
}

// ── Merged patient list ───────────────────────────────────
/**
 * Returns all patients from both collections:
 *  - CACHE.patients  (full billing records added by admin)
 *  - CACHE.tokens    (all registered patients, including queue)
 * Tokens that already have a billing record are de-duplicated.
 */
export function allPatients() {
  const tokenIds = new Set(CACHE.patients.map(p => p.tokenId).filter(Boolean));
  const fromTokens = CACHE.tokens
    .filter(t => !tokenIds.has(t.tokenId))
    .map(t => Object.assign({ _fromToken: true }, t));
  const merged = CACHE.patients.concat(fromTokens);
  merged.sort((a, b) => {
    const ta = a.timestamp ? (a.timestamp.seconds || 0) : 0;
    const tb = b.timestamp ? (b.timestamp.seconds || 0) : 0;
    return tb - ta;
  });
  return merged;
}

// ── Doctor cut calculator ─────────────────────────────────
/**
 * Returns { doctorCut, hospitalCut } based on staff profile settings.
 * Default: 70% doctor / 30% hospital.
 */
export function getDoctorCut(doctorName, fee) {
  const s = CACHE.staff.find(x => x.doctorName === doctorName);
  if (!s)                 return { doctorCut: Math.round(fee * 0.7), hospitalCut: Math.round(fee * 0.3) };
  if (s.hospitalKeepsAll) return { doctorCut: 0, hospitalCut: fee };
  if (s.noSplit)          return { doctorCut: fee, hospitalCut: 0 };
  const pct = (s.doctorCutPct !== undefined ? s.doctorCutPct : 70) / 100;
  return { doctorCut: Math.round(fee * pct), hospitalCut: Math.round(fee * (1 - pct)) };
}

// ── UI helpers called from pollAllData ────────────────────
function updateChk(id, ok, msg) {
  const el = document.getElementById(id);
  if (!el) return;
  el.style.color  = ok ? 'var(--green)' : 'var(--red)';
  el.textContent  = (ok ? '✅ ' : '❌ ') + msg;
}
function showDbWarning(msg) {
  const w = document.getElementById('db-warn');
  if (!w) return;
  w.style.display = 'block';
  w.innerHTML = `⚠ <strong>Database issue:</strong> ${msg}`;
}

// ── Month helpers ─────────────────────────────────────────
export const MONTHS = ['January','February','March','April','May','June',
                       'July','August','September','October','November','December'];

export function curMonth() {
  const d = new Date();
  return `${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

export function allMonths() {
  const result = [];
  const now = new Date();
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    result.push(`${MONTHS[d.getMonth()]} ${d.getFullYear()}`);
  }
  return result;
}
