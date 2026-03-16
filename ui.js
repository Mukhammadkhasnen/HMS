// ============================================================
// ui.js — All page rendering and UI helpers
// ============================================================

import { CU, CACHE, tabs, setEtab, setBtab,
         allPatients, getDoctorCut, curMonth, allMonths, MONTHS } from './state.js';

// ── Toast notification ────────────────────────────────────
export function showToast(msg, isError = false) {
  const t = document.getElementById('savingToast');
  t.textContent   = msg;
  t.style.background = isError ? '#e53e3e' : '#065a50';
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), isError ? 3500 : 2200);
}

// ── Safe write wrapper ────────────────────────────────────
export async function safeWrite(fn) {
  try { return await fn(); }
  catch (err) {
    console.error('Write error:', err.code, err.message);
    const isOffline = err.code === 'unavailable' || err.message.toLowerCase().includes('offline');
    showToast(isOffline ? '⚠ Offline — will sync when reconnected' : `❌ Error: ${err.message}`, true);
    return null;
  }
}

// ── Online/offline banner ─────────────────────────────────
export function startOnlineMonitor() {
  const update = () => {
    const b = document.getElementById('offlineBanner');
    if (b) b.style.display = navigator.onLine ? 'none' : 'block';
  };
  window.addEventListener('online',  update);
  window.addEventListener('offline', update);
  update();
}

// ── Page switcher ─────────────────────────────────────────
export function showPage(id) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('nav a').forEach(a => a.classList.remove('active'));
  document.getElementById(`page-${id}`)?.classList.add('active');
  document.getElementById(`nav-${id}`)?.classList.add('active');
  const renders = {
    dashboard:    renderDash,
    patients:     renderPts,
    'my-patients':renderDocPts,
    queue:        renderQueue,
    earnings:     renderEarnings,
    budget:       renderBudget,
    users:        renderUsers,
  };
  if (renders[id]) renders[id]();
}

// ── Navigation ────────────────────────────────────────────
export function buildNav() {
  const r = CU.role;
  const items = [{ id: 'dashboard', icon: '📊', label: 'Dashboard' }];

  if (r === 'staff') {
    items.push({ id: 'intake',   icon: '📋', label: 'Register Patient' });
    items.push({ id: 'queue',    icon: '⏳', label: 'Waiting Queue'    });
    items.push({ id: 'patients', icon: '🗂️', label: 'All Patients'     });
    items.push({ id: 'budget',   icon: '📦', label: 'Consumables'      });
  }
  if (r === 'admin') {
    items.push({ id: 'intake',       icon: '📋', label: 'Register Patient'        });
    items.push({ id: 'queue',        icon: '⏳', label: 'Waiting Queue'           });
    items.push({ id: 'add-patient',  icon: '🧾', label: 'Backdate / Walk-in'      });
    items.push({ id: 'patients',     icon: '🗂️', label: 'All Patients'            });
    items.push({ id: 'earnings',     icon: '💰', label: 'Earnings & Distribution' });
    items.push({ id: 'budget',       icon: '📊', label: 'Budget & Consumables'    });
    items.push({ id: 'users',        icon: '⚙️', label: 'Manage Staff'            });
    items.push({ id: 'data-mgmt',    icon: '🗃️', label: 'Data Management'         });
  }
  if (r === 'doctor') {
    items.push({ id: 'queue',       icon: '⏳', label: 'My Queue'    });
    items.push({ id: 'my-patients', icon: '👤', label: 'My Patients' });
    items.push({ id: 'earnings',    icon: '💰', label: 'My Earnings' });
  }

  document.getElementById('snav').innerHTML = items
    .map(x => `<a onclick="showPage('${x.id}')" id="nav-${x.id}">
                  <span style="width:18px;text-align:center;">${x.icon}</span>${x.label}
                </a>`)
    .join('');

  const ab = document.getElementById('apb');
  if (ab) ab.style.display = r === 'admin' ? '' : 'none';
}

// ── Dropdowns ─────────────────────────────────────────────
export function populateDropdowns() {
  const doctors = CACHE.staff.filter(s => s.role === 'doctor');
  const opts    = doctors.map(d => `<option value="${d.doctorName||d.name}">${d.doctorName||d.name}</option>`).join('');

  // Any modal open? Don't reset dropdowns mid-form
  const modalOpen = document.querySelector('.mo.open');

  ['f-doc', 'i-doc', 'e-doc'].forEach(id => {
    const el = document.getElementById(id); if (!el) return;
    const prev  = el.value; // always preserve current selection
    const blank = id === 'e-doc' ? '' : '<option value="">— Select Doctor —</option>';
    el.innerHTML = blank + opts;
    if (prev) el.value = prev; // restore after rebuild
  });

  // Only update filter dropdown if no modal is open
  if (!modalOpen) {
    const pdoc = document.getElementById('pdoc');
    if (pdoc) pdoc.innerHTML = '<option value="">All Doctors</option>' + opts;
  }
}

export function populateMonthDropdowns() {
  const months = allMonths();
  const opts   = months.map(m => `<option${m === curMonth() ? ' selected' : ''}>${m}</option>`).join('');
  ['ex-month', 'efm', 'bm-month'].forEach(id => {
    const el = document.getElementById(id); if (el) el.innerHTML = opts;
  });
  const exDate = document.getElementById('ex-date');
  if (exDate && !exDate.value) exDate.value = new Date().toISOString().slice(0, 10);
}

// ═══════════════════════════════════════════════════════════
// DASHBOARD
// ═══════════════════════════════════════════════════════════
export function renderDash() {
  const isS = CU.role === 'staff', isD = CU.role === 'doctor';
  const pts  = isD ? CACHE.patients.filter(p => p.doctorName === CU.doctorName) : CACHE.patients;
  const today = new Date().toDateString();
  const tPts  = pts.filter(p => p.timestamp && new Date(p.timestamp.seconds ? p.timestamp.seconds * 1000 : p.timestamp).toDateString() === today);
  const wait  = CACHE.tokens.filter(t => t.status === 'waiting').length;
  const pend  = allPatients().filter(p => p.paid === 'Pending' && p.feeStatus !== 'Counter-Paid').length;
  const rev   = pts.reduce((s, p) => s + (p.checkupFee || 0), 0);

  document.getElementById('dg').textContent =
    `Welcome, ${CU.name || CU.email}! — ${new Date().toLocaleDateString('en-PK',{weekday:'long',day:'numeric',month:'long',year:'numeric'})}`;
  document.getElementById('dfl').textContent = isD ? CU.doctorName : 'All Doctors';

  let sh = `<div class="sc"><div class="lb">Total Records</div><div class="vl">${pts.length}</div><div class="sb">${tPts.length} today</div></div>`;
  sh += `<div class="sc pu"><div class="lb">Waiting Now</div><div class="vl">${wait}</div></div>`;
  sh += `<div class="sc am"><div class="lb">Pending Payment</div><div class="vl">${pend}</div></div>`;
  if (!isS) sh += `<div class="sc rd"><div class="lb">Revenue</div><div class="vl">₨${rev.toLocaleString()}</div></div>`;
  document.getElementById('dstats').innerHTML = sh;

  document.getElementById('dtbl').innerHTML = pts.slice(0, 8).map(p => {
    const ts = p.timestamp ? new Date(p.timestamp.seconds ? p.timestamp.seconds * 1000 : p.timestamp) : new Date();
    return `<tr>
      <td><strong style="color:var(--teal);font-size:12px;">${p.tokenId || p.id.slice(-5)}</strong></td>
      <td>${p.patientName}</td>
      <td style="font-size:12px;">${p.doctorName || '—'}</td>
      <td style="font-size:12px;">${p.checkFor || '—'}</td>
      <td>${isS ? '—' : '₨' + (p.checkupFee || 0).toLocaleString()}</td>
      <td style="font-size:11px;color:var(--muted);">${p.bp || '—'}/${p.pulse || '—'} bpm</td>
      <td><span class="badge ${p.paid === 'Paid' ? 'bg' : 'br'}">${p.paid}</span></td>
      <td style="color:var(--muted);font-size:12px;">${ts.toLocaleTimeString('en-PK',{hour:'2-digit',minute:'2-digit'})}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:24px;">No patients yet</td></tr>';
}

// ═══════════════════════════════════════════════════════════
// WAITING QUEUE
// ═══════════════════════════════════════════════════════════
export function renderQueue() {
  const isD = CU.role === 'doctor', isA = CU.role === 'admin';
  let tks = isD
    ? CACHE.tokens.filter(t => t.doctorName === CU.doctorName && t.status === 'waiting')
    : CACHE.tokens.filter(t => t.status === 'waiting');
  tks.sort((a, b) => (a.timestamp?.seconds || 0) - (b.timestamp?.seconds || 0));

  document.getElementById('qsub').textContent = isD
    ? `Your waiting patients — ${CU.doctorName}` : 'All patients waiting';

  const allW = CACHE.tokens.filter(t => t.status === 'waiting');
  const seen = CACHE.tokens.filter(t => t.status === 'seen');
  const byDoc = {};
  allW.forEach(t => { byDoc[t.doctorName] = (byDoc[t.doctorName] || 0) + 1; });
  const ds = Object.entries(byDoc).map(([k, v]) => `${k}: <strong>${v}</strong>`).join(' | ');

  document.getElementById('qstats').innerHTML =
    `<div class="sc pu"><div class="lb">Waiting</div><div class="vl">${allW.length}</div><div class="sb">${ds || 'None'}</div></div>
     <div class="sc gr"><div class="lb">Seen Today</div><div class="vl">${seen.length}</div></div>`;

  if (!tks.length) {
    document.getElementById('qwrap').innerHTML = '<div class="empty"><div class="eico">✅</div><h4>No patients waiting</h4></div>';
    return;
  }

  document.getElementById('qwrap').innerHTML = '<div class="qgrid">' + tks.map(t => {
    const ts  = t.timestamp ? new Date(t.timestamp.seconds ? t.timestamp.seconds * 1000 : t.timestamp) : new Date();
    const fs  = t.feeStatus || 'Pending';
    const feeAmt = t.checkupFee ? `₨${Number(t.checkupFee).toLocaleString()}` : 'No fee set';

    // Fee badge
    let feeBadge, feeBtn = '';
    if      (fs === 'Counter-Paid')    feeBadge = '<span class="badge bg" style="font-size:10px;">✅ Paid at Counter</span>';
    else if (fs === 'Doctor-Collected'){ feeBadge = '<span class="badge" style="background:#d69e2e;color:white;font-size:10px;">💊 Doctor Collected</span>'; if (!isD) feeBtn = `<button class="btn bsm" style="background:var(--green);color:white;" onclick="confirmStaffReceipt_btn('${t.id}','token')">✅ Confirm Receipt</button>`; }
    else if (fs === 'Doctor-Pending')  { feeBadge = '<span class="badge br" style="font-size:10px;">⏳ Doctor Collecting</span>'; if (isD) feeBtn = `<button class="btn bsm" style="background:#d69e2e;color:white;" onclick="openFeeModal('${t.id}','token','doctor')">💰 Mark I Collected</button>`; }
    else {
      feeBadge = '<span class="badge br" style="font-size:10px;">⏳ Fee Pending</span>';
      if (!isD) feeBtn = `<button class="btn bsm" style="background:var(--green);color:white;" onclick="openFeeModal('${t.id}','token','counter')">💵 Collect at Counter</button>`;
      if (isD)  feeBtn = `<button class="btn bsm" style="background:#d69e2e;color:white;" onclick="openFeeModal('${t.id}','token','doctor')">💰 I Collected Fee</button>`;
    }

    return `<div class="qcard">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:10px;">
        <div>
          <div style="font-size:15px;font-weight:700;">${t.patientName} <span class="qnum">${t.tokenId}</span></div>
          <div style="font-size:12px;color:var(--muted);margin-top:3px;">${t.doctorName} · ${t.age || '?'}y ${t.gender || ''}</div>
        </div>
        <div style="text-align:right;font-size:11px;color:var(--muted);">
          ${ts.toLocaleTimeString('en-PK',{hour:'2-digit',minute:'2-digit'})}
          <br><span class="badge ba" style="margin-top:3px;">Waiting</span>
        </div>
      </div>
      <div style="display:flex;align-items:center;gap:8px;margin-bottom:10px;padding:8px 10px;background:var(--cream);border-radius:8px;font-size:13px;flex-wrap:wrap;">
        <strong style="color:var(--teal);">${feeAmt}</strong>${feeBadge}
        ${t.feeNote ? `<span style="color:var(--muted);font-size:11px;">· ${t.feeNote}</span>` : ''}
      </div>
      ${t.bp || t.pulse ? `<div class="qvit">${t.bp?`<div class="qv">BP: ${t.bp}</div>`:''}${t.pulse?`<div class="qv">♥ ${t.pulse}</div>`:''}${t.temperature?`<div class="qv">🌡 ${t.temperature}°</div>`:''}${t.spo2?`<div class="qv">O₂ ${t.spo2}%</div>`:''}</div>` : ''}
      ${t.checkFor ? `<div style="font-size:13px;color:var(--muted);margin-top:8px;padding-top:8px;border-top:1px solid var(--border);"><strong>Complaint:</strong> ${t.checkFor}${t.symptomDuration ? ` (${t.symptomDuration})` : ''}</div>` : ''}
      ${t.allergies ? `<div style="font-size:12px;color:var(--red);margin-top:4px;"><strong>⚠ Allergy:</strong> ${t.allergies}</div>` : ''}
      ${t.notes     ? `<div style="font-size:12px;color:var(--muted);margin-top:4px;"><strong>Nurse Note:</strong> ${t.notes}</div>` : ''}
      <div style="display:flex;gap:7px;margin-top:12px;flex-wrap:wrap;">
        <button class="btn bo bsm" onclick="viewToken('${t.id}','token')">🎫 Token</button>
        ${isD ? `<button class="btn bt bsm" onclick="openRxMo('${t.id}','token')">✍ Prescribe</button>` : ''}
        ${isD || isA ? `<button class="btn bo bsm" onclick="markSeen('${t.id}')">✓ Seen</button>` : ''}
        ${feeBtn}
      </div>
    </div>`;
  }).join('') + '</div>';
}

// ═══════════════════════════════════════════════════════════
// ALL PATIENTS TABLE
// ═══════════════════════════════════════════════════════════
function getFiltPts() {
  const s  = (document.getElementById('pts')?.value || '').toLowerCase();
  const d  = document.getElementById('pdoc')?.value || '';
  const st = document.getElementById('pst')?.value  || '';
  const dt = document.getElementById('pdt')?.value  || '';
  return CACHE.patients.filter(p => {
    if (s  && !(p.patientName||'').toLowerCase().includes(s) && !(p.checkFor||'').toLowerCase().includes(s) && !(p.doctorName||'').toLowerCase().includes(s)) return false;
    if (d  && p.doctorName !== d) return false;
    if (st && p.paid !== st) return false;
    if (dt) { const ts = p.timestamp ? new Date(p.timestamp.seconds ? p.timestamp.seconds*1000 : p.timestamp) : new Date(); if (ts.toISOString().slice(0,10) !== dt) return false; }
    return true;
  });
}

export function renderPts() {
  // Temporarily swap cache so getFiltPts sees merged list
  const _orig = CACHE.patients;
  CACHE.patients = allPatients();
  const pts = getFiltPts();
  CACHE.patients = _orig;

  const tb = document.getElementById('ptbl');
  const em = document.getElementById('ptempty');
  const isA = CU.role === 'admin', isS = CU.role === 'staff';

  if (!pts.length) { tb.innerHTML = ''; em.style.display = 'block'; return; }
  em.style.display = 'none';

  tb.innerHTML = pts.map(p => {
    const ts = p.timestamp ? new Date(p.timestamp.seconds ? p.timestamp.seconds*1000 : p.timestamp) : new Date();
    const fs = p.feeStatus || p.paid || 'Pending';
    const fsBadgeClass = fs === 'Counter-Paid' || fs === 'Paid' ? 'bg' : fs === 'Doctor-Collected' ? 'ba' : 'br';
    const collectBtn = !isS && fs !== 'Paid' && fs !== 'Counter-Paid'
      ? `<br><button class="btn bsm" style="font-size:10px;padding:2px 7px;margin-top:3px;background:var(--green);color:white;" onclick="openFeeModal('${p.id}','patient','counter')">💵 Collect</button>` : '';
    return `<tr>
      <td><strong style="color:var(--teal);font-size:12px;">${p.tokenId || p.id.slice(-5)}</strong></td>
      <td style="color:var(--muted);font-size:12px;">${ts.toLocaleDateString()}</td>
      <td><strong>${p.patientName}</strong></td>
      <td style="font-size:12px;">${p.doctorName || '—'}</td>
      <td style="font-size:12px;">${p.checkFor || '—'}</td>
      <td>${isS ? '—' : '₨' + (p.checkupFee || 0).toLocaleString()}</td>
      <td>${isS ? '—' : '<strong>₨' + (p.totalFee || 0).toLocaleString() + '</strong>'}</td>
      <td><span class="badge ${fsBadgeClass}">${fs}</span>${collectBtn}</td>
      <td><div class="brow">
        <button class="btn bo bsm" onclick="viewToken('${p.id}','patient')">🎫</button>
        ${isA ? `<button class="btn bo bsm" onclick="editPt('${p.id}')">✏️</button><button class="btn bred bsm" onclick="delPt('${p.id}')">🗑</button>` : ''}
      </div></td>
    </tr>`;
  }).join('');
}

// ═══════════════════════════════════════════════════════════
// DOCTOR — MY PATIENTS
// ═══════════════════════════════════════════════════════════
export function renderDocPts() {
  const pts = allPatients().filter(p => p.doctorName === CU.doctorName);
  const s   = CACHE.staff.find(x => x.doctorName === CU.doctorName);
  const cutPct  = s ? (s.hospitalKeepsAll ? 0 : s.noSplit ? 100 : (s.doctorCutPct ?? 70)) : 70;
  const hospPct = 100 - cutPct;

  document.getElementById('dptitle').textContent = `My Patients — ${CU.doctorName}`;
  const tE  = pts.reduce((s, p) => s + (p.doctorCut || 0), 0);
  const tH  = pts.reduce((s, p) => s + (p.hospitalCut || 0), 0);
  const opR = pts.filter(p => p.indoor === 'Yes').reduce((s, p) => s + (p.treatmentCharges || 0), 0);

  document.getElementById('dpstats').innerHTML =
    `<div class="sc"><div class="lb">My Patients</div><div class="vl">${pts.length}</div></div>
     <div class="sc am"><div class="lb">My Earnings (${cutPct}%)</div><div class="vl">₨${tE.toLocaleString()}</div></div>
     <div class="sc bl"><div class="lb">Hospital Cut (${hospPct}%)</div><div class="vl">₨${tH.toLocaleString()}</div></div>
     <div class="sc rd"><div class="lb">Op. Revenue</div><div class="vl">₨${opR.toLocaleString()}</div></div>
     <div class="sc" style="background:linear-gradient(135deg,#553c9a,#6b46c1)"><div class="lb">Fee Split</div><div class="vl" style="font-size:14px;">Dr ${cutPct}% / Hosp ${hospPct}%</div></div>`;

  document.getElementById('dptbl').innerHTML = pts.map(p => {
    const ts = p.timestamp ? new Date(p.timestamp.seconds ? p.timestamp.seconds*1000 : p.timestamp) : new Date();
    return `<tr>
      <td><strong style="color:var(--teal);font-size:12px;">${p.tokenId || p.id.slice(-5)}</strong></td>
      <td style="font-size:12px;">${ts.toLocaleDateString()}</td>
      <td><strong>${p.patientName}</strong></td>
      <td style="font-size:12px;">${p.checkFor || '—'}</td>
      <td style="font-size:11px;color:var(--muted);">${p.bp || '—'}/${p.pulse || '—'}</td>
      <td>₨${(p.checkupFee || 0).toLocaleString()}</td>
      <td>${p.indoor === 'Yes' ? '<span class="badge bb">₨' + (p.treatmentCharges || 0).toLocaleString() + '</span>' : '—'}</td>
      <td><strong>₨${(p.totalFee || 0).toLocaleString()}</strong></td>
      <td style="color:var(--red);">₨${(p.hospitalCut || 0).toLocaleString()}</td>
      <td style="color:var(--green);font-weight:600;">₨${(p.doctorCut || 0).toLocaleString()}</td>
      <td><span class="badge ${p.paid === 'Paid' ? 'bg' : 'br'}">${p.paid}</span></td>
      <td><button class="btn bo bsm" onclick="viewToken('${p.id}','patient')">🎫</button></td>
    </tr>`;
  }).join('') || '<tr><td colspan="12" style="text-align:center;color:var(--muted);padding:24px;">No patients yet</td></tr>';
}

// ═══════════════════════════════════════════════════════════
// EARNINGS & DISTRIBUTION
// ═══════════════════════════════════════════════════════════
export function renderEarnings() { tabs.etab === 'summary' ? renderES() : renderEO(); }

export function switchET(t) {
  setEtab(t);
  document.getElementById('page-earnings')?.querySelectorAll('.tab')
    .forEach((el, i) => el.classList.toggle('active', (i===0&&t==='summary')||(i===1&&t==='ops')));
  document.getElementById('esumm').style.display = t === 'summary' ? 'block' : 'none';
  document.getElementById('eops').style.display  = t === 'ops'     ? 'block' : 'none';
  renderEarnings();
}

function renderES() {
  const isA    = CU.role === 'admin';
  const allPts = allPatients();
  const docs   = isA
    ? [...new Set(allPts.map(p => p.doctorName).filter(Boolean))]
    : [CU.doctorName];

  if (isA) {
    const tR = allPts.reduce((s, p) => s + (p.totalFee    || 0), 0);
    const tH = allPts.reduce((s, p) => s + (p.hospitalCut || 0), 0);
    const tD = allPts.reduce((s, p) => s + (p.doctorCut   || 0), 0);
    document.getElementById('ecards').innerHTML =
      `<div class="dc"><div class="dl">Total Revenue</div><div class="dv">₨${tR.toLocaleString()}</div></div>
       <div class="dc" style="background:linear-gradient(135deg,#2c5282,#3182ce)"><div class="dl">Hospital Cut</div><div class="dv">₨${tH.toLocaleString()}</div></div>
       <div class="dc" style="background:linear-gradient(135deg,#276749,#38a169)"><div class="dl">Doctor Cuts</div><div class="dv">₨${tD.toLocaleString()}</div></div>`;
  } else {
    document.getElementById('ecards').innerHTML = '';
  }

  document.getElementById('etbl').innerHTML = docs.map(doc => {
    const pts = allPts.filter(p => p.doctorName === doc);
    const cr  = pts.reduce((s, p) => s + (p.checkupFee   || 0), 0);
    const hc  = pts.reduce((s, p) => s + (p.hospitalCut  || 0), 0);
    const dc  = pts.reduce((s, p) => s + (p.doctorCut    || 0), 0);
    const or  = pts.filter(p => p.indoor === 'Yes').reduce((s, p) => s + (p.treatmentCharges || 0), 0);
    const odc = CACHE.distributions
      .filter(d => { const p = CACHE.patients.find(x => x.id === d.patientId); return p && p.doctorName === doc; })
      .reduce((s, d) => s + (d.doctorCut || 0), 0);
    // Show cut %
    const sf    = CACHE.staff.find(x => x.doctorName === doc);
    const pct   = sf ? (sf.hospitalKeepsAll ? 0 : sf.noSplit ? 100 : (sf.doctorCutPct ?? 70)) : 70;
    return `<tr>
      <td><strong>${doc || '—'}</strong><br><small style="color:var(--muted);">Dr ${pct}% / Hosp ${100-pct}%</small></td>
      <td>${pts.length}</td>
      <td>₨${cr.toLocaleString()}</td>
      <td style="color:var(--red);">₨${hc.toLocaleString()}</td>
      <td style="color:var(--green);font-weight:600;">₨${dc.toLocaleString()}</td>
      <td>₨${or.toLocaleString()}</td>
      <td style="color:var(--blue);">₨${odc.toLocaleString()}</td>
    </tr>`;
  }).join('');
}

function renderEO() {
  const isA = CU.role === 'admin';
  const ops = allPatients().filter(p => p.indoor === 'Yes' && (isA || p.doctorName === CU.doctorName));
  document.getElementById('opstbl').innerHTML = ops.map(p => {
    const dist = CACHE.distributions.find(d => d.patientId === p.id);
    const ts   = p.timestamp ? new Date(p.timestamp.seconds ? p.timestamp.seconds*1000 : p.timestamp) : new Date();
    return `<tr>
      <td><strong>${p.patientName}</strong></td>
      <td style="font-size:12px;">${p.doctorName || '—'}</td>
      <td style="font-size:12px;">${ts.toLocaleDateString()}</td>
      <td style="font-size:12px;">${p.treatmentDesc || '—'}</td>
      <td><strong>₨${(p.treatmentCharges || 0).toLocaleString()}</strong></td>
      <td>${dist ? `<span class="badge bg">Set</span><br><small>Doc: ₨${(dist.doctorCut||0).toLocaleString()}</small>` : '<span class="badge ba">Pending</span>'}</td>
      <td>${isA ? `<button class="btn bo bsm" onclick="openDist('${p.id}')">⚖️</button>` : '—'}</td>
    </tr>`;
  }).join('') || '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:24px;">No indoor cases</td></tr>';
}

// ═══════════════════════════════════════════════════════════
// BUDGET & CONSUMABLES
// ═══════════════════════════════════════════════════════════
export function renderBudget() {
  if (tabs.btab === 'overview')      renderBOverview();
  else if (tabs.btab === 'expenses') renderExpenses();
  else                               renderConsumables();
}

export function switchBT(t) {
  setBtab(t);
  document.getElementById('page-budget')?.querySelectorAll('.tab')
    .forEach((el, i) => el.classList.toggle('active', (i===0&&t==='overview')||(i===1&&t==='expenses')||(i===2&&t==='consumables')));
  document.getElementById('b-overview').style.display    = t === 'overview'    ? 'block' : 'none';
  document.getElementById('b-expenses').style.display    = t === 'expenses'    ? 'block' : 'none';
  document.getElementById('b-consumables').style.display = t === 'consumables' ? 'block' : 'none';
  renderBudget();
}

function getCurBudget() {
  const m = curMonth();
  return CACHE.budgets.find(b => b.month === m) || { month: m, total: 0 };
}
function getMonthExpenses(month) {
  return CACHE.expenses.filter(e => e.month === month);
}

function renderBOverview() {
  const m       = curMonth();
  const budget  = getCurBudget();
  const exps    = getMonthExpenses(m);
  const spent   = exps.reduce((s, e) => s + (e.amount || 0), 0);
  const revenue = CACHE.patients.reduce((s, p) => {
    if (!p.timestamp) return s;
    const ts = new Date(p.timestamp.seconds ? p.timestamp.seconds*1000 : p.timestamp);
    return (MONTHS[ts.getMonth()] + ' ' + ts.getFullYear()) === m ? s + (p.totalFee || 0) : s;
  }, 0);
  const lowStock = CACHE.consumables.filter(c => c.minStock && (c.quantity || 0) <= (c.minStock || 0)).length;

  document.getElementById('bstats').innerHTML =
    `<div class="sc"><div class="lb">Monthly Revenue</div><div class="vl">₨${revenue.toLocaleString()}</div><div class="sb">${m}</div></div>
     <div class="sc rd"><div class="lb">Total Spent</div><div class="vl">₨${spent.toLocaleString()}</div></div>
     <div class="sc gr"><div class="lb">Net</div><div class="vl">₨${(revenue - spent).toLocaleString()}</div></div>
     <div class="sc am"><div class="lb">Low Stock Items</div><div class="vl">${lowStock}</div><div class="sb">need restocking</div></div>`;

  const pct = budget.total > 0 ? Math.min(100, (spent / budget.total) * 100) : 0;
  const cls = pct > 90 ? 'over' : pct > 70 ? 'warn' : '';
  document.getElementById('bvs').innerHTML = budget.total > 0
    ? `<div style="display:flex;justify-content:space-between;font-size:13px;margin-bottom:6px;"><span>Spent: <strong>₨${spent.toLocaleString()}</strong></span><span>Budget: <strong>₨${budget.total.toLocaleString()}</strong></span></div>
       <div class="budget-bar"><div class="budget-fill ${cls}" style="width:${pct}%"></div></div>
       <div style="font-size:12px;color:var(--muted);margin-top:6px;">${pct.toFixed(1)}% used</div>`
    : '<div style="color:var(--muted);font-size:13px;">No budget set. <button onclick="openBudgetSet()" style="margin-top:8px;padding:6px 14px;background:var(--teal);color:white;border:none;border-radius:7px;cursor:pointer;font-size:13px;">Set Budget</button></div>';

  const cats = {};
  exps.forEach(e => { cats[e.category] = (cats[e.category] || 0) + (e.amount || 0); });
  document.getElementById('bcat').innerHTML = Object.entries(cats)
    .map(([k, v]) => `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px dotted var(--border);font-size:13px;"><span>${k}</span><span style="font-weight:600;">₨${v.toLocaleString()}</span></div>`)
    .join('') || '<div style="color:var(--muted);font-size:13px;">No expenses this month.</div>';

  const recent = [...CACHE.expenses]
    .sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0))
    .slice(0, 6);
  document.getElementById('rexptbl').innerHTML = recent
    .map(e => `<tr><td style="font-size:12px;color:var(--muted);">${e.date || '—'}</td><td><span class="badge bgr">${e.category}</span></td><td>${e.item}</td><td><strong>₨${(e.amount||0).toLocaleString()}</strong></td><td style="font-size:12px;color:var(--muted);">${e.createdByName || '—'}</td></tr>`)
    .join('') || '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px;">No expenses yet</td></tr>';
}

export function renderExpenses() {
  const m    = document.getElementById('efm')?.value || curMonth();
  const exps = getMonthExpenses(m).sort((a, b) => (b.timestamp?.seconds || 0) - (a.timestamp?.seconds || 0));
  const total = exps.reduce((s, e) => s + (e.amount || 0), 0);
  document.getElementById('exptbl').innerHTML = exps
    .map(e => `<tr>
      <td style="font-size:12px;">${e.date}</td>
      <td><span class="badge bgr">${e.category}</span></td>
      <td>${e.item}</td>
      <td><strong>₨${e.amount.toLocaleString()}</strong></td>
      <td style="font-size:12px;color:var(--muted);">${e.vendor || '—'}</td>
      <td style="font-size:12px;color:var(--muted);">${e.createdByName || '—'}</td>
      <td><button class="btn bred bsm" onclick="delExpense('${e.id}')">🗑</button></td>
    </tr>`)
    .join('')
    + (total ? `<tr style="background:#f0faf9;"><td colspan="3"><strong>Total</strong></td><td colspan="4"><strong style="color:var(--teal-dark);">₨${total.toLocaleString()}</strong></td></tr>` : '')
    || `<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:24px;">No expenses for ${m}</td></tr>`;
}

export function renderConsumables() {
  const cons = [...CACHE.consumables].sort((a, b) => a.name < b.name ? -1 : 1);
  const low  = cons.filter(c => c.minStock && (c.quantity || 0) <= (c.minStock || 0));
  const lsel = document.getElementById('lowstock-count');
  if (lsel) lsel.textContent = low.length > 0 ? `⚠ ${low.length} low stock` : '';

  document.getElementById('constbl').innerHTML = cons.map(c => {
    const tv    = (c.quantity || 0) * (c.unitCost || 0);
    const isLow = c.minStock && (c.quantity || 0) <= (c.minStock || 0);
    let expiry  = '';
    if (c.expiryDate) {
      const ex   = new Date(c.expiryDate);
      const diff = (ex - new Date()) / (1000 * 60 * 60 * 24);
      expiry = diff < 30
        ? `<span style="color:var(--red);font-size:12px;">⚠ ${diff < 0 ? 'EXPIRED' : Math.round(diff) + 'd'}</span>`
        : ex.toLocaleDateString();
    }
    return `<tr>
      <td><strong>${c.name}</strong>${c.supplier ? `<br><small style="color:var(--muted);">${c.supplier}</small>` : ''}</td>
      <td style="font-size:12px;"><span class="badge bgr">${c.category}</span></td>
      <td><strong style="color:${isLow ? 'var(--red)' : 'var(--slate)'};">${c.quantity || 0}</strong> ${c.unit || 'pcs'}${isLow ? '<br><span style="color:var(--red);font-size:11px;">LOW STOCK</span>' : ''}</td>
      <td style="font-size:12px;">₨${(c.unitCost || 0).toLocaleString()}</td>
      <td style="font-size:12px;">₨${tv.toLocaleString()}</td>
      <td style="font-size:12px;">${expiry || '—'}</td>
      <td><span class="badge ${isLow ? 'br' : 'bg'}">${isLow ? 'Low' : 'OK'}</span></td>
      <td><div class="brow">
        <button class="btn bo bsm" onclick="openUse('${c.id}','${c.name.replace(/'/g,"\\'")}',${c.quantity||0})">📦</button>
        <button class="btn bred bsm" onclick="delCons('${c.id}')">🗑</button>
      </div></td>
    </tr>`;
  }).join('') || '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:24px;">No items yet</td></tr>';
}

// ═══════════════════════════════════════════════════════════
// STAFF MANAGEMENT
// ═══════════════════════════════════════════════════════════
export function renderUsers() {
  document.getElementById('utbl').innerHTML = CACHE.staff.map(u => {
    const cutInfo = u.role === 'doctor'
      ? `<br><span style="font-size:10px;color:var(--muted);">${u.hospitalKeepsAll ? 'Hospital keeps 100%' : u.noSplit ? 'Doctor keeps 100%' : `Dr: ${u.doctorCutPct ?? 70}% / Hosp: ${100 - (u.doctorCutPct ?? 70)}%`}</span>`
      : '';
    return `<tr>
      <td><strong>${u.name || '—'}</strong></td>
      <td style="font-size:12px;">${u.email || '—'}</td>
      <td><span class="badge ${u.role==='admin'?'br':u.role==='doctor'?'bb':'bg'}">${u.role==='staff'?'Nurse/Staff':u.role}</span></td>
      <td style="font-size:12px;">${(u.doctorName || u.department || '—') + cutInfo}</td>
      <td><span class="badge ${u.active===false?'br':'bg'}">${u.active===false?'Inactive':'Active'}</span></td>
      <td><div class="brow">
        <button class="btn bo bsm" onclick="editUserMo('${u.id}')">✏️</button>
        ${u.id !== CU.uid ? `<button class="btn bred bsm" onclick="toggleUserActive('${u.id}',${u.active===false})">${u.active===false?'Enable':'Disable'}</button>` : ''}
      </div></td>
    </tr>`;
  }).join('');
}
