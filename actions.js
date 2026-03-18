// ============================================================
// actions.js — All write/update operations
// (patient intake, fee collection, prescriptions, billing,
//  staff management, budget, consumables, distribution)
// ============================================================

import { restAdd, restSet, restUpdate, restDelete, serverTimestamp } from './firebase.js';
import { CU, CACHE, getDoctorCut, curMonth } from './state.js';
import { safeWrite, showToast, populateDropdowns, renderUsers,
         renderEarnings, renderBudget, renderExpenses, renderConsumables } from './ui.js';
import { viewToken, printToken } from './token.js';

// ── Discount helpers (delegated to fee.js but also exported here for intake)
export function toggleIntakeDiscount() {
  // handled via fee.js exposed to window — this stub kept for import compatibility
  if (typeof window._feeToggleIntakeDiscount === 'function') window._feeToggleIntakeDiscount();
}
export function calcIntakeFee() {
  if (typeof window._feeCalcIntakeFee === 'function') window._feeCalcIntakeFee();
}

// ── Shared modal helpers ──────────────────────────────────
export function openMo(id)  { document.getElementById(id)?.classList.add('open');    }
export function closeMo(id) { document.getElementById(id)?.classList.remove('open'); }

// ── Toggle use action context ─────────────────────────────
export function toggleUseAction() {
  const act = document.getElementById('use-act')?.value;
  const ctx = document.getElementById('use-context-wrap');
  if (ctx) ctx.style.display = (act === 'use') ? 'block' : 'none';
}

// ── View usage log for a consumable ──────────────────────
export function viewUsageLog(id) {
  const c = CACHE.consumables.find(x => x.id === id);
  if (!c) return;
  const log = c.usageLog || [];

  const rows = log.length
    ? log.slice().reverse().map(u => {
        const at    = u.at ? new Date(u.at).toLocaleString('en-PK',{day:'numeric',month:'short',hour:'2-digit',minute:'2-digit'}) : '—';
        const isUse = ['use','expire','transfer'].includes(u.action);
        return `<tr style="border-bottom:1px solid var(--border);">
          <td style="padding:6px 10px;font-size:12px;color:var(--muted);">${at}</td>
          <td style="padding:6px;"><span class="badge ${isUse?'br':'bg'}" style="font-size:10px;">${u.action||'use'}</span></td>
          <td style="padding:6px;font-weight:600;color:${isUse?'var(--red)':'var(--green)'};">${isUse?'-':'+'}${u.qty||1} ${c.unit||'pcs'}</td>
          <td style="padding:6px;font-size:12px;">${u.by||'—'}</td>
          <td style="padding:6px;font-size:12px;">${u.purpose||u.for||'—'}</td>
          <td style="padding:6px;font-size:12px;">${u.patientName||'—'}</td>
          <td style="padding:6px;font-size:12px;">${u.doctor||'—'}</td>
          <td style="padding:6px;font-size:12px;color:var(--muted);">${u.note||'—'}</td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="8" style="padding:20px;text-align:center;color:var(--muted);">No usage logged yet</td></tr>';

  // Build or reuse a usage-log modal
  let modal = document.getElementById('mo-usage-log');
  if (!modal) {
    modal = document.createElement('div');
    modal.className = 'mo';
    modal.id = 'mo-usage-log';
    document.body.appendChild(modal);
    modal.addEventListener('click', e => { if (e.target === modal) closeMo('mo-usage-log'); });
  }
  modal.innerHTML = `<div class="md" style="max-width:780px;">
    <div class="mh">
      <h3>📋 Usage Log — ${c.name}</h3>
      <button class="mclose" onclick="closeMo('mo-usage-log')">×</button>
    </div>
    <div style="font-size:13px;color:var(--muted);margin-bottom:12px;">
      Current stock: <strong style="color:var(--teal-dark);">${c.quantity||0} ${c.unit||'pcs'}</strong>
      &nbsp;·&nbsp; Min stock: ${c.minStock||'—'}
      &nbsp;·&nbsp; ${log.length} entries total
    </div>
    <div class="tw" style="max-height:420px;overflow-y:auto;">
      <table style="width:100%;border-collapse:collapse;font-size:13px;">
        <thead><tr style="background:#f0faf9;position:sticky;top:0;">
          <th style="padding:8px 10px;text-align:left;">Date/Time</th>
          <th style="padding:8px;">Action</th>
          <th style="padding:8px;">Qty</th>
          <th style="padding:8px;">By</th>
          <th style="padding:8px;">Purpose</th>
          <th style="padding:8px;">Patient</th>
          <th style="padding:8px;">Doctor</th>
          <th style="padding:8px;">Note</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>
    <div class="brow" style="margin-top:14px;">
      <button class="btn bo" onclick="closeMo('mo-usage-log')">Close</button>
    </div>
  </div>`;

  openMo('mo-usage-log');
}

// ─────────────────────────────────────────────────────────
// PATIENT INTAKE (register + print token)
// ─────────────────────────────────────────────────────────
export function toggleIntakeFee() {
  const v = document.getElementById('i-paid');
  const w = document.getElementById('i-counter-wrap');
  if (v && w) w.style.display = v.value === 'Counter-Paid' ? 'block' : 'none';
}
export function toggleIntakeIndoor() {
  const v    = document.getElementById('i-indoor');
  const show = v && v.value === 'Yes';
  document.getElementById('i-indoor-wrap')?.style && (document.getElementById('i-indoor-wrap').style.display = show ? 'block' : 'none');
  document.getElementById('i-indoor-charge-wrap')?.style && (document.getElementById('i-indoor-charge-wrap').style.display = show ? 'block' : 'none');
}

export function clearIntake() {
  ['i-nm','i-age','i-ph','i-cf','i-bp','i-pu','i-tp','i-o2','i-wt','i-ht',
   'i-al','i-md','i-hx','i-dur','i-nt','i-fee','i-cnote','i-tx','i-txc',
   'i-disc-val','i-disc-reason']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('i-doc').value = '';
  document.getElementById('i-gen').value = '';
  document.getElementById('ia').innerHTML = '';
  const ip  = document.getElementById('i-paid');         if (ip)  ip.value  = 'Pending';
  const ii  = document.getElementById('i-indoor');       if (ii)  ii.value  = 'No';
  const idt = document.getElementById('i-discount-type'); if (idt) idt.value = 'none';
  // Reset discount UI
  ['i-disc-val-wrap','i-disc-reason-wrap','i-final-fee-wrap'].forEach(id => {
    const el = document.getElementById(id); if (el) el.style.display = 'none';
  });
  toggleIntakeFee(); toggleIntakeIndoor();
}

export async function submitIntake() {
  const nm  = document.getElementById('i-nm').value.trim();
  const cf  = document.getElementById('i-cf').value.trim();
  const doc = document.getElementById('i-doc').value;
  if (!nm || !cf || !doc) {
    document.getElementById('ia').innerHTML = '<div class="alert ae">Fill: Patient Name, Complaint, and Doctor.</div>';
    return;
  }
  showToast('💾 Saving...');

  // Sequential token number for today
  const todayStr   = new Date().toISOString().slice(0, 10);
  const todayCount = CACHE.tokens.filter(t => {
    if (!t.timestamp) return false;
    return new Date(t.timestamp.seconds ? t.timestamp.seconds * 1000 : t.timestamp).toISOString().slice(0, 10) === todayStr;
  }).length;
  const seq = todayCount + 1;

  // Get discount data from fee.js helper (available on window after bootstrap)
  const discData = typeof window.getIntakeDiscountData === 'function'
    ? window.getIntakeDiscountData()
    : { standardFee: parseFloat(document.getElementById('i-fee').value)||0,
        checkupFee:  parseFloat(document.getElementById('i-fee').value)||0,
        discountAmt: 0, discountType: 'none', discountReason: '', isFree: false };

  const stdFee    = discData.standardFee;
  const fee       = discData.checkupFee;          // final after discount
  const txc       = parseFloat(document.getElementById('i-txc')?.value) || 0;
  const indoor    = document.getElementById('i-indoor').value;
  const feeStatus = document.getElementById('i-paid').value;
  const cuts      = getDoctorCut(doc, fee);

  const tk = {
    seq, tokenId: 'T' + String(seq).padStart(3, '0'),
    timestamp: serverTimestamp(),
    patientName:     nm,
    age:             document.getElementById('i-age').value.trim(),
    gender:          document.getElementById('i-gen').value,
    phone:           document.getElementById('i-ph').value.trim(),
    checkFor:        cf,
    doctorName:      doc,
    bp:              document.getElementById('i-bp').value.trim(),
    pulse:           document.getElementById('i-pu').value.trim(),
    temperature:     document.getElementById('i-tp').value.trim(),
    spo2:            document.getElementById('i-o2').value.trim(),
    weight:          document.getElementById('i-wt').value.trim(),
    height:          document.getElementById('i-ht').value.trim(),
    allergies:       document.getElementById('i-al').value.trim(),
    medications:     document.getElementById('i-md').value.trim(),
    medHistory:      document.getElementById('i-hx').value.trim(),
    symptomDuration: document.getElementById('i-dur').value.trim(),
    notes:           document.getElementById('i-nt').value.trim(),
    status:          'waiting',
    prescription:    null, diagnosis: '', rxAdvice: '', rxFollowup: '',
    createdBy:       CU.uid, createdByName: CU.name || CU.email,
    // Fee with discount support
    standardFee:     stdFee,
    checkupFee:      fee,
    discountAmt:     discData.discountAmt,
    discountType:    discData.discountType,
    discountReason:  discData.discountReason,
    isFree:          discData.isFree,
    indoor,
    treatmentDesc:   document.getElementById('i-tx')?.value.trim() || '',
    treatmentCharges: indoor === 'Yes' ? txc : 0,
    totalFee:        fee + (indoor === 'Yes' ? txc : 0),
    hospitalCut:     discData.isFree ? 0 : cuts.hospitalCut,
    doctorCut:       discData.isFree ? 0 : cuts.doctorCut,
    feeStatus:       discData.isFree ? 'Free' : feeStatus,
    paid:            discData.isFree ? 'Free' : (feeStatus === 'Counter-Paid' ? 'Paid' : 'Pending'),
    feeCollectedBy:  feeStatus === 'Counter-Paid' ? (CU.name || CU.email) : '',
    feeCollectedAt:  feeStatus === 'Counter-Paid' ? new Date().toISOString() : '',
    feeNote:         discData.isFree ? discData.discountReason : (feeStatus === 'Counter-Paid' ? document.getElementById('i-cnote').value.trim() : ''),
    feeHistory:      discData.isFree
      ? [{ action: 'Marked FREE at registration', by: CU.name||CU.email, at: new Date().toISOString(), amount: 0, note: discData.discountReason }]
      : feeStatus === 'Counter-Paid' ? [{
          action: 'Counter collected at registration', by: CU.name || CU.email,
          at: new Date().toISOString(), amount: fee,
          note: document.getElementById('i-cnote').value.trim()
        }] : []
  };

  const id = await safeWrite(() => restAdd('tokens', tk));
  if (!id) return;
  showToast('✓ Token saved!');
  document.getElementById('ia').innerHTML = `<div class="alert as">✓ Patient registered! Token ${tk.tokenId} generated.</div>`;
  setTimeout(() => {
    clearIntake();
    viewToken(id, 'token');
    setTimeout(printToken, 400);
  }, 600);
}

// ─────────────────────────────────────────────────────────
// MARK SEEN (queue)
// ─────────────────────────────────────────────────────────
export async function markSeen(id) {
  await safeWrite(() => restUpdate('tokens', id, { status: 'seen' }));
  showToast('✓ Marked as seen');
}

// ─────────────────────────────────────────────────────────
// FEE — delegated entirely to fee.js
// These stubs exist so any legacy references still work.
// ─────────────────────────────────────────────────────────
export function toggleCounterFee() {
  const v = document.getElementById('f-paid')?.value;
  const n = document.getElementById('f-counter-note');
  if (n) n.style.display = v === 'Counter-Paid' ? 'block' : 'none';
}

// openFeeModal, saveDoctorFee, confirmStaffReceipt, saveCounterFee
// are all exported from fee.js and exposed to window in the bootstrap.

// ─────────────────────────────────────────────────────────
// PRESCRIPTION
// ─────────────────────────────────────────────────────────
export function openRxMo(id, type) {
  const t = type === 'token'
    ? CACHE.tokens.find(x => x.id === id)
    : CACHE.patients.find(x => x.id === id);
  if (!t) return;
  document.getElementById('rx-pid').value  = id;
  document.getElementById('rx-type').value = type;
  document.getElementById('rxinfo').innerHTML =
    `<strong>${t.patientName}</strong> · ${t.age || '?'}y ${t.gender || ''} · <strong>${t.tokenId}</strong>
     <br><span style="color:var(--muted);">${t.checkFor}</span>
     ${t.allergies ? `<br><span style="color:var(--red);">⚠ ${t.allergies}</span>` : ''}`;
  document.getElementById('rx-diag').value = t.diagnosis   || '';
  document.getElementById('rx-txt').value  = t.prescription || '';
  document.getElementById('rx-adv').value  = t.rxAdvice    || '';
  document.getElementById('rx-fu').value   = t.rxFollowup  || '';
  openMo('mo-rx');
}

export async function saveRx() {
  const id   = document.getElementById('rx-pid').value;
  const type = document.getElementById('rx-type').value;
  const data = {
    diagnosis:    document.getElementById('rx-diag').value.trim(),
    prescription: document.getElementById('rx-txt').value.trim(),
    rxAdvice:     document.getElementById('rx-adv').value.trim(),
    rxFollowup:   document.getElementById('rx-fu').value
  };
  showToast('💾 Saving Rx...');
  await safeWrite(() => restUpdate(type === 'token' ? 'tokens' : 'patients', id, data));
  showToast('✓ Prescription saved!');
  closeMo('mo-rx');
  viewToken(id, type);
}

// ─────────────────────────────────────────────────────────
// BACKDATE / WALK-IN BILLING RECORD
// ─────────────────────────────────────────────────────────
export function toggleTx() {
  const v = document.getElementById('f-in')?.value;
  document.getElementById('ftw')?.style  && (document.getElementById('ftw').style.display  = v === 'Yes' ? 'block' : 'none');
  document.getElementById('ftfw')?.style && (document.getElementById('ftfw').style.display = v === 'Yes' ? 'block' : 'none');
}

export function clearForm() {
  ['f-nm','f-cf','f-bp','f-pu','f-tp','f-fee','f-cnote','f-td','f-tf','f-nt']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('f-doc').value  = '';
  document.getElementById('f-paid').value = 'Pending';
  document.getElementById('f-in').value   = 'No';
  toggleCounterFee(); toggleTx();
  document.getElementById('faa').innerHTML = '';
}

export async function submitPatient() {
  const nm  = document.getElementById('f-nm').value.trim();
  const cf  = document.getElementById('f-cf').value.trim();
  const doc = document.getElementById('f-doc').value;
  const fee = parseFloat(document.getElementById('f-fee').value) || 0;
  if (!nm || !cf || !doc || fee <= 0) {
    document.getElementById('faa').innerHTML = '<div class="alert ae">Fill: Name, Complaint, Doctor, Fee.</div>';
    return;
  }
  showToast('💾 Saving...');
  const indoor = document.getElementById('f-in').value;
  const tf     = parseFloat(document.getElementById('f-tf').value) || 0;
  const iF     = indoor === 'Yes' ? tf : 0;
  const cuts   = getDoctorCut(doc, fee);

  const pt = {
    timestamp:   serverTimestamp(),
    doctorName:  doc, patientName: nm, checkFor: cf, checkupFee: fee,
    bp:          document.getElementById('f-bp').value.trim(),
    pulse:       document.getElementById('f-pu').value.trim(),
    temperature: document.getElementById('f-tp').value.trim(),
    paid:        document.getElementById('f-paid').value,
    indoor,
    treatmentDesc:    indoor === 'Yes' ? document.getElementById('f-td').value.trim() : '',
    treatmentCharges: iF, totalFee: fee + iF,
    hospitalCut: cuts.hospitalCut, doctorCut: cuts.doctorCut,
    notes:       document.getElementById('f-nt').value.trim(),
    createdBy:   CU.uid
  };
  const id = await safeWrite(() => restAdd('patients', pt)); if (!id) return;
  showToast('✓ Patient saved!');
  document.getElementById('faa').innerHTML = '<div class="alert as">✓ Patient saved!</div>';
  setTimeout(() => { clearForm(); viewToken(id, 'patient'); }, 600);
}

// ─────────────────────────────────────────────────────────
// EDIT / DELETE PATIENT
// ─────────────────────────────────────────────────────────
export function editPt(id) {
  const p = CACHE.patients.find(x => x.id === id); if (!p) return;
  ['e-id','e-nm','e-cf','e-doc','e-fee','e-paid','e-bp','e-pu','e-tp','e-o2','e-in','e-td','e-tf','e-nt']
    .forEach(fid => {
      const el = document.getElementById(fid); if (!el) return;
      const map = { 'e-id':p.id,'e-nm':p.patientName,'e-cf':p.checkFor,'e-doc':p.doctorName,
                    'e-fee':p.checkupFee,'e-paid':p.paid,'e-bp':p.bp||'','e-pu':p.pulse||'',
                    'e-tp':p.temperature||'','e-o2':p.spo2||'','e-in':p.indoor||'No',
                    'e-td':p.treatmentDesc||'','e-tf':p.treatmentCharges||'','e-nt':p.notes||'' };
      el.value = map[fid] ?? '';
    });
  toggleEditTx(); openMo('mo-edit');
}
export function toggleEditTx() {
  const v = document.getElementById('e-in')?.value;
  document.getElementById('etw')?.style  && (document.getElementById('etw').style.display  = v === 'Yes' ? 'block' : 'none');
  document.getElementById('etfw')?.style && (document.getElementById('etfw').style.display = v === 'Yes' ? 'block' : 'none');
}
export async function saveEdit() {
  const id     = document.getElementById('e-id').value;
  const fee    = parseFloat(document.getElementById('e-fee').value) || 0;
  const indoor = document.getElementById('e-in').value;
  const tf     = parseFloat(document.getElementById('e-tf').value) || 0;
  const iF     = indoor === 'Yes' ? tf : 0;
  const doc    = document.getElementById('e-doc').value;
  const cuts   = getDoctorCut(doc, fee);
  showToast('💾 Saving...');
  await safeWrite(() => restUpdate('patients', id, {
    patientName:  document.getElementById('e-nm').value.trim(),
    checkFor:     document.getElementById('e-cf').value.trim(),
    doctorName:   doc, checkupFee: fee, paid: document.getElementById('e-paid').value,
    bp:           document.getElementById('e-bp').value,
    pulse:        document.getElementById('e-pu').value,
    temperature:  document.getElementById('e-tp').value,
    spo2:         document.getElementById('e-o2').value,
    indoor, treatmentDesc: document.getElementById('e-td').value,
    treatmentCharges: iF, totalFee: fee + iF,
    hospitalCut: cuts.hospitalCut, doctorCut: cuts.doctorCut,
    notes: document.getElementById('e-nt').value
  }));
  showToast('✓ Updated!'); closeMo('mo-edit');
}
export async function delPt(id) {
  // Record may be in 'patients' (full billing) or 'tokens' (registered via intake)
  const inPatients = CACHE.patients.find(x => x.id === id);
  const col = inPatients ? 'patients' : 'tokens';
  const rec = inPatients || CACHE.tokens.find(x => x.id === id);
  if (!rec) { showToast('Record not found', true); return; }

  try {
    await window.showConfirmModal(
      'Delete Patient Record',
      `Delete record for <strong>${rec.patientName}</strong>?<br>
       <span style="color:var(--color-text-secondary);font-size:13px;">Token: ${rec.tokenId || rec.id.slice(-5)} · ${rec.checkFor || '—'}</span><br><br>
       This cannot be undone.`
    );
  } catch { return; } // cancelled

  await safeWrite(() => restDelete(col, id));
  showToast('🗑 Record deleted');
}

// ─────────────────────────────────────────────────────────
// OPERATION FEE DISTRIBUTION
// ─────────────────────────────────────────────────────────
export function openDist(pid) {
  document.getElementById('d-pid').value = pid || '';
  const p  = pid ? CACHE.patients.find(x => x.id === pid) : null;
  const ex = pid ? CACHE.distributions.find(d => d.patientId === pid) : null;
  if (p) document.getElementById('dinfo').innerHTML =
    `<strong>${p.patientName}</strong> — ${p.treatmentDesc || '?'}<br>₨${(p.treatmentCharges||0).toLocaleString()} · ${p.doctorName}`;
  document.getElementById('d-type').value = ex ? ex.type    : 'all';
  document.getElementById('d-pct').value  = ex ? ex.percent : '';
  document.getElementById('d-amt').value  = ex ? ex.amount  : '';
  document.getElementById('d-nt').value   = ex ? ex.notes   : '';
  toggleDT(); openMo('mo-dist');
}
export function toggleDT() {
  const t = document.getElementById('d-type')?.value;
  document.getElementById('dpw').style.display = t === 'percent' ? 'block' : 'none';
  document.getElementById('daw').style.display = t === 'amount'  ? 'block' : 'none';
}
export async function saveDist() {
  const pid = document.getElementById('d-pid').value;
  const p   = CACHE.patients.find(x => x.id === pid); if (!p) return;
  const type = document.getElementById('d-type').value;
  const pct  = parseFloat(document.getElementById('d-pct').value) || 100;
  const amt  = parseFloat(document.getElementById('d-amt').value) || 0;
  const nt   = document.getElementById('d-nt').value;
  const tc   = p.treatmentCharges || 0;
  let dc = 0, hc = 0;
  if (type === 'all')     { dc = tc; }
  else if (type === 'percent') { dc = tc * (pct / 100); hc = tc - dc; }
  else if (type === 'amount')  { dc = Math.min(amt, tc); hc = tc - dc; }
  const rec = { patientId: pid, type, percent: pct, amount: amt, notes: nt, doctorCut: dc, hospitalCut: hc };
  const ex  = CACHE.distributions.find(d => d.patientId === pid);
  showToast('💾 Saving...');
  if (ex) await safeWrite(() => restUpdate('distributions', ex.id, rec));
  else    await safeWrite(() => restAdd('distributions', rec));
  showToast('✓ Saved!'); closeMo('mo-dist'); renderEarnings();
}

// ─────────────────────────────────────────────────────────
// BUDGET & CONSUMABLES
// ─────────────────────────────────────────────────────────
export function openBudgetSet() {
  const m = curMonth();
  const b = CACHE.budgets.find(x => x.month === m) || { total: 0 };
  const bm = document.getElementById('bm-month');
  if (bm) bm.value = m;
  document.getElementById('bm-amt').value = b.total     || '';
  document.getElementById('bm-sal').value = b.salaries  || '';
  document.getElementById('bm-med').value = b.medicines || '';
  document.getElementById('bm-ren').value = b.rent      || '';
  document.getElementById('bm-eqp').value = b.equipment || '';
  openMo('mo-budget');
}
export async function saveBudget() {
  const month = document.getElementById('bm-month').value;
  const data  = {
    month, total:    parseFloat(document.getElementById('bm-amt').value) || 0,
    salaries:  parseFloat(document.getElementById('bm-sal').value) || 0,
    medicines: parseFloat(document.getElementById('bm-med').value) || 0,
    rent:      parseFloat(document.getElementById('bm-ren').value) || 0,
    equipment: parseFloat(document.getElementById('bm-eqp').value) || 0
  };
  const ex = CACHE.budgets.find(b => b.month === month);
  showToast('💾 Saving...');
  if (ex) await safeWrite(() => restUpdate('budgets', ex.id, data));
  else    await safeWrite(() => restAdd('budgets', data));
  showToast('✓ Budget saved!'); closeMo('mo-budget');
}

export async function addExpense() {
  const cat  = document.getElementById('ex-cat').value;
  const item = document.getElementById('ex-item').value.trim();
  const amt  = parseFloat(document.getElementById('ex-amt').value) || 0;
  const date = document.getElementById('ex-date').value;
  const mon  = document.getElementById('ex-month').value;
  if (!cat || !item || !amt || !date) {
    document.getElementById('expa').innerHTML = '<div class="alert ae">Fill: Category, Item, Amount, Date.</div>';
    return;
  }
  showToast('💾 Saving...');
  await safeWrite(() => restAdd('expenses', {
    category: cat, item, amount: amt, date, month: mon,
    vendor:   document.getElementById('ex-vendor').value.trim(),
    notes:    document.getElementById('ex-nt').value.trim(),
    timestamp: serverTimestamp(), createdBy: CU.uid, createdByName: CU.name || CU.email
  }));
  showToast('✓ Expense added!');
  document.getElementById('expa').innerHTML = '<div class="alert as">✓ Expense added!</div>';
  ['ex-item','ex-amt','ex-vendor','ex-nt'].forEach(id => document.getElementById(id).value = '');
  document.getElementById('ex-cat').value = '';
}

export async function delExpense(id) {
  const rec = CACHE.expenses.find(x => x.id === id);
  try {
    await window.showConfirmModal(
      'Delete Expense',
      `Delete expense: <strong>${rec ? rec.item : 'this record'}</strong>?<br>
       ${rec ? `<span style="color:var(--color-text-secondary);font-size:13px;">₨${(rec.amount||0).toLocaleString()} · ${rec.category}</span>` : ''}`
    );
  } catch { return; }
  await safeWrite(() => restDelete('expenses', id));
  showToast('🗑 Expense deleted');
}

export async function addConsumable() {
  const nm  = document.getElementById('c-nm').value.trim();
  const qty = parseFloat(document.getElementById('c-qty').value) || 0;
  if (!nm) { document.getElementById('consa').innerHTML = '<div class="alert ae">Item name required.</div>'; return; }
  showToast('💾 Saving...');
  await safeWrite(() => restAdd('consumables', {
    name: nm, category: document.getElementById('c-cat').value,
    quantity: qty, unit: document.getElementById('c-unit').value.trim(),
    unitCost:  parseFloat(document.getElementById('c-cost').value) || 0,
    minStock:  parseFloat(document.getElementById('c-min').value)  || 0,
    supplier:  document.getElementById('c-sup').value.trim(),
    expiryDate:document.getElementById('c-exp').value,
    timestamp: serverTimestamp(), createdBy: CU.uid
  }));
  showToast('✓ Added!');
  document.getElementById('consa').innerHTML = '<div class="alert as">✓ Item added!</div>';
  ['c-nm','c-qty','c-unit','c-cost','c-min','c-sup','c-exp'].forEach(id => document.getElementById(id).value = '');
}

export async function delCons(id) {
  const rec = CACHE.consumables.find(x => x.id === id);
  try {
    await window.showConfirmModal(
      'Delete Consumable',
      `Delete <strong>${rec ? rec.name : 'this item'}</strong> from inventory?<br>
       ${rec ? `<span style="color:var(--color-text-secondary);font-size:13px;">Stock: ${rec.quantity||0} ${rec.unit||'pcs'}</span>` : ''}`
    );
  } catch { return; }
  await safeWrite(() => restDelete('consumables', id));
  showToast('🗑 Item deleted');
}

export function openUse(id, name, qty) {
  document.getElementById('use-id').value        = id;
  document.getElementById('use-item-name').value = name;
  document.getElementById('useinfo').innerHTML =
    `<strong>${name}</strong> &nbsp;·&nbsp; Current stock: <strong style="color:var(--teal-dark);">${qty}</strong>`;
  document.getElementById('use-qty').value  = '1';
  document.getElementById('use-nt').value   = '';
  document.getElementById('use-act').value  = 'use';
  document.getElementById('use-patient').value = '';

  // Populate doctor dropdown
  const doctors = CACHE.staff.filter(s => s.role === 'doctor');
  const sel = document.getElementById('use-doctor');
  if (sel) sel.innerHTML = '<option value="">— Select doctor or general use —</option>'
    + doctors.map(d => `<option value="${d.doctorName||d.name}">${d.doctorName||d.name}</option>`).join('');

  // Show context area for 'use' by default
  const ctx = document.getElementById('use-context-wrap');
  if (ctx) ctx.style.display = 'block';

  openMo('mo-use');
}

export async function doUseConsumable() {
  const id      = document.getElementById('use-id').value;
  const name    = document.getElementById('use-item-name').value;
  const act     = document.getElementById('use-act').value;
  const qty     = parseFloat(document.getElementById('use-qty').value) || 1;
  const note    = document.getElementById('use-nt').value.trim();
  const purpose = document.getElementById('use-purpose')?.value || '';
  const patient = document.getElementById('use-patient')?.value.trim() || '';
  const doctor  = document.getElementById('use-doctor')?.value || '';

  const c = CACHE.consumables.find(x => x.id === id); if (!c) return;

  // Calculate new quantity
  let newQty;
  if (act === 'use' || act === 'expire')    newQty = Math.max(0, (c.quantity || 0) - qty);
  else if (act === 'restock')               newQty = (c.quantity || 0) + qty;
  else if (act === 'transfer')              newQty = Math.max(0, (c.quantity || 0) - qty);
  else                                      newQty = (c.quantity || 0) - qty;

  // Build usage log entry
  const logEntry = {
    action:      act,
    qty,
    by:          CU.name || CU.email,
    role:        CU.role,
    at:          new Date().toISOString(),
    purpose:     purpose || (act === 'restock' ? 'Restock' : act === 'expire' ? 'Expired/Wasted' : ''),
    patientName: patient,
    doctor:      doctor,
    note,
    stockBefore: c.quantity || 0,
    stockAfter:  newQty,
  };

  // Append to existing usageLog array
  const usageLog = [...(c.usageLog || []), logEntry];
  // Keep only last 200 entries to avoid document size limits
  if (usageLog.length > 200) usageLog.splice(0, usageLog.length - 200);

  showToast('💾 Saving...');
  await safeWrite(() => restUpdate('consumables', id, { quantity: newQty, usageLog }));

  // Check if now below min stock — show warning
  if (c.minStock && newQty <= (c.minStock || 0) && act !== 'restock') {
    showToast(`⚠ ${name} is now LOW STOCK (${newQty} remaining — min: ${c.minStock})`, true);
  } else {
    showToast(`✓ Stock updated! ${name}: ${c.quantity||0} → ${newQty}`);
  }
  closeMo('mo-use');
}

// ─────────────────────────────────────────────────────────
// STAFF MANAGEMENT (admin only)
// ─────────────────────────────────────────────────────────
export function openUserMo() {
  document.getElementById('umtitle').textContent  = 'Add Staff Member';
  document.getElementById('usavebtn').textContent = 'Create Account';
  document.getElementById('usavebtn').onclick     = saveUser;
  document.getElementById('u-id').value = '';
  ['u-nm','u-em','u-pw','u-ph','u-dn'].forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('u-role').value = 'staff';
  document.getElementById('u-pw').required = true;
  toggleUR(); openMo('mo-user');
}

export function editUserMo(id) {
  const u = CACHE.staff.find(x => x.id === id); if (!u) return;
  document.getElementById('umtitle').textContent  = 'Edit Staff Member';
  document.getElementById('usavebtn').textContent = 'Save Changes';
  document.getElementById('usavebtn').onclick = () => saveEditUser(id);
  document.getElementById('u-id').value   = id;
  document.getElementById('u-nm').value   = u.name       || '';
  document.getElementById('u-em').value   = u.email      || '';
  document.getElementById('u-pw').value   = '';
  document.getElementById('u-ph').value   = u.phone      || '';
  document.getElementById('u-role').value = u.role       || 'staff';
  document.getElementById('u-dn').value   = u.doctorName || '';
  document.getElementById('u-pw').required = false;
  toggleUR();
  // Restore cut setting for doctors
  const cutEl = document.getElementById('u-cut');
  if (cutEl && u.role === 'doctor') {
    cutEl.value = u.hospitalKeepsAll ? 'hospital' : u.noSplit ? '0' : u.doctorCutPct && u.doctorCutPct !== 70 ? 'custom' : '70';
    if (cutEl.value === 'custom') document.getElementById('u-cut-pct').value = u.doctorCutPct;
    toggleCutField();
    // Restore fee schedule
    const fees = u.feeSchedule || {};
    _setFeeField('u-fee-checkup',    fees.checkup    || '');
    _setFeeField('u-fee-ultrasound', fees.ultrasound || '');
    _setFeeField('u-fee-minor',      fees.minor      || '');
    _setFeeField('u-fee-major',      fees.major      || '');
    _setFeeField('u-fee-followup',   fees.followup   || '');
    _setFeeField('u-fee-other-label',fees.otherLabel || '');
    _setFeeField('u-fee-other-amt',  fees.otherAmt   || '');
  }
  openMo('mo-user');
}

function _setFeeField(id, val) {
  const el = document.getElementById(id); if (el) el.value = val;
}

export function toggleUR() {
  const v     = document.getElementById('u-role')?.value;
  const isDoc = v === 'doctor';
  document.getElementById('udnw')?.style      && (document.getElementById('udnw').style.display      = isDoc ? 'block' : 'none');
  document.getElementById('u-cut-wrap')?.style && (document.getElementById('u-cut-wrap').style.display = isDoc ? 'block' : 'none');
  document.getElementById('u-fees-wrap')?.style && (document.getElementById('u-fees-wrap').style.display = isDoc ? 'block' : 'none');
  toggleCutField();
}
export function toggleCutField() {
  const cv = document.getElementById('u-cut');
  const cw = document.getElementById('u-cut-custom-wrap');
  if (cw) cw.style.display = cv && cv.value === 'custom' ? 'block' : 'none';
}

function _readCutSettings() {
  const cv  = document.getElementById('u-cut');
  const cw  = document.getElementById('u-cut-wrap');
  if (!cv || !cw || cw.style.display === 'none') return { noSplit: false, hospitalKeepsAll: false, doctorCutPct: 70 };
  if (cv.value === '0')        return { noSplit: true,  hospitalKeepsAll: false, doctorCutPct: 0 };
  if (cv.value === 'hospital') return { noSplit: true,  hospitalKeepsAll: true,  doctorCutPct: 0 };
  if (cv.value === 'custom')   return { noSplit: false, hospitalKeepsAll: false, doctorCutPct: parseFloat(document.getElementById('u-cut-pct').value) || 70 };
  return { noSplit: false, hospitalKeepsAll: false, doctorCutPct: 70 };
}

function _readFeeSchedule() {
  const fw = document.getElementById('u-fees-wrap');
  if (!fw || fw.style.display === 'none') return {};
  return {
    feeSchedule: {
      checkup:    parseFloat(document.getElementById('u-fee-checkup')?.value)    || 0,
      ultrasound: parseFloat(document.getElementById('u-fee-ultrasound')?.value) || 0,
      minor:      parseFloat(document.getElementById('u-fee-minor')?.value)      || 0,
      major:      parseFloat(document.getElementById('u-fee-major')?.value)      || 0,
      followup:   parseFloat(document.getElementById('u-fee-followup')?.value)   || 0,
      otherLabel: document.getElementById('u-fee-other-label')?.value.trim()     || '',
      otherAmt:   parseFloat(document.getElementById('u-fee-other-amt')?.value)  || 0,
    }
  };
}

export async function saveUser() {
  const { auth, createUserWithEmailAndPassword } = await import('./firebase.js');
  const uma  = document.getElementById('uma');
  const nm   = document.getElementById('u-nm').value.trim();
  const em   = document.getElementById('u-em').value.trim();
  const pw   = document.getElementById('u-pw').value;
  const role = document.getElementById('u-role').value;
  const dn   = document.getElementById('u-dn').value.trim();
  const ph   = document.getElementById('u-ph').value.trim();
  if (!nm || !em || !pw) { uma.innerHTML = '<div class="alert ae">Name, email and password required.</div>'; return; }
  if (pw.length < 6)     { uma.innerHTML = '<div class="alert ae">Password must be at least 6 characters.</div>'; return; }
  uma.innerHTML = '<div class="alert ai">⏳ Creating account...</div>';
  try {
    const cred = await createUserWithEmailAndPassword(auth, em, pw);
    await restSet('staff', cred.user.uid, {
      name: nm, email: em, role, doctorName: role === 'doctor' ? dn : null,
      phone: ph, active: true, uid: cred.user.uid,
      ..._readCutSettings(),
      ..._readFeeSchedule(),
      createdAt: serverTimestamp(), createdBy: CU.uid
    });
    uma.innerHTML = `<div class="alert as">✓ Account created for ${nm}!</div>`;
    setTimeout(() => closeMo('mo-user'), 1500);
  } catch (err) {
    uma.innerHTML = `<div class="alert ae">${err.code === 'auth/email-already-in-use' ? 'Email already in use.' : err.message}</div>`;
  }
}

export async function saveEditUser(id) {
  const uma  = document.getElementById('uma');
  const nm   = document.getElementById('u-nm').value.trim();
  const role = document.getElementById('u-role').value;
  const dn   = document.getElementById('u-dn').value.trim();
  const ph   = document.getElementById('u-ph').value.trim();
  if (!nm) { uma.innerHTML = '<div class="alert ae">Name required.</div>'; return; }
  showToast('💾 Saving...');
  await safeWrite(() => restUpdate('staff', id, {
    name: nm, role, doctorName: role === 'doctor' ? dn : null, phone: ph,
    ..._readCutSettings(),
    ..._readFeeSchedule()
  }));
  showToast('✓ Updated!'); closeMo('mo-user');
}

export async function toggleUserActive(id, active) {
  if (!confirm(`Are you sure you want to ${active ? 'enable' : 'disable'} this account?`)) return;
  await safeWrite(() => restUpdate('staff', id, { active }));
  showToast(`✓ Account ${active ? 'enabled' : 'disabled'}`);
}

// ─────────────────────────────────────────────────────────
// CSV EXPORT
// ─────────────────────────────────────────────────────────
// ── Quick role assignment from staff table ────────────────
export async function quickAssignRole(id, role) {
  const u = CACHE.staff.find(x => x.id === id);
  if (!u) return;
  const roleName = role === 'admin' ? 'Admin' : role === 'doctor' ? 'Doctor' : 'Nurse/Staff';
  try {
    await window.showConfirmModal(
      'Change Role',
      `Change <strong>${u.name||u.email}</strong>'s role to <strong>${roleName}</strong>?<br>
       <span style="font-size:13px;color:var(--color-text-secondary);">They will see a different menu next time they log in.</span>`
    );
  } catch { return; }
  await safeWrite(() => restUpdate('staff', id, { role }));
  showToast(`✓ Role changed to ${roleName}`);
}

export function exportCSV() {
  const s  = (document.getElementById('pts')?.value || '').toLowerCase();
  const pts = CACHE.patients.filter(p =>
    !s || (p.patientName||'').toLowerCase().includes(s) ||
          (p.checkFor||'').toLowerCase().includes(s) ||
          (p.doctorName||'').toLowerCase().includes(s)
  );
  const header = ['ID','Date','Patient','Doctor','Complaint','Checkup Fee','BP','Pulse','Temp','Paid','Indoor','Treatment','Tx Charges','Total','Hospital Cut','Doctor Cut'];
  const rows   = pts.map(p => {
    const ts = p.timestamp ? new Date(p.timestamp.seconds ? p.timestamp.seconds*1000 : p.timestamp) : new Date();
    return [p.id.slice(-8), ts.toLocaleDateString(), p.patientName, p.doctorName, p.checkFor,
            p.checkupFee, p.bp, p.pulse, p.temperature, p.paid, p.indoor,
            p.treatmentDesc, p.treatmentCharges, p.totalFee, p.hospitalCut, p.doctorCut]
      .map(v => `"${String(v || '').replace(/"/g, '""')}"`);
  });
  const csv = [header, ...rows].map(r => r.join(',')).join('\n');
  const a   = document.createElement('a');
  a.href    = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
  a.download = `patients_${new Date().toISOString().slice(0,10)}.csv`;
  a.click();
}

// ─────────────────────────────────────────────────────────
// DOCTOR FEE AUTO-FILL ON INTAKE
// ─────────────────────────────────────────────────────────
const FEE_TYPE_MAP = {
  consultation:'checkup', followup:'followup', ultrasound:'ultrasound',
  minor:'minor', major:'major', other:'otherAmt'
};

export function onIntakeDoctorChange() {
  const docName   = document.getElementById('i-doc')?.value;
  const visitType = document.getElementById('i-visit-type')?.value || 'consultation';
  const vtWrap    = document.getElementById('i-visit-type-wrap');
  const procWrap  = document.getElementById('i-procedures-wrap');
  const refWrap   = document.getElementById('i-referral-from-wrap');

  if (!docName) {
    if (vtWrap)  vtWrap.style.display  = 'none';
    if (procWrap) procWrap.style.display = 'none';
    if (refWrap) refWrap.style.display  = 'none';
    return;
  }
  if (vtWrap)  vtWrap.style.display  = 'block';
  if (refWrap) refWrap.style.display = visitType === 'referral' ? 'block' : 'none';

  const doctor = CACHE.staff.find(s => s.role === 'doctor' && (s.doctorName === docName || s.name === docName));
  const fees   = doctor?.feeSchedule || {};
  const feeKey = FEE_TYPE_MAP[visitType] || 'checkup';
  const autoFee = fees[feeKey] || 0;
  const feeInput = document.getElementById('i-fee');
  if (feeInput) feeInput.value = autoFee || '';

  if (procWrap) {
    const listEl = document.getElementById('i-procedures-list');
    const procs  = [];
    if (fees.ultrasound) procs.push({key:'ultrasound',label:`Ultrasound — ₨${fees.ultrasound.toLocaleString()}`,fee:fees.ultrasound});
    if (fees.minor)      procs.push({key:'minor',label:`Minor Procedure — ₨${fees.minor.toLocaleString()}`,fee:fees.minor});
    if (fees.major)      procs.push({key:'major',label:`Major Operation — ₨${fees.major.toLocaleString()}`,fee:fees.major});
    if (fees.otherAmt && fees.otherLabel) procs.push({key:'other',label:`${fees.otherLabel} — ₨${fees.otherAmt.toLocaleString()}`,fee:fees.otherAmt});
    if (procs.length && listEl) {
      procWrap.style.display = 'block';
      listEl.innerHTML = procs.map(p =>
        `<label style="display:flex;align-items:center;gap:6px;padding:6px 10px;background:var(--cream);border:1px solid var(--border);border-radius:7px;cursor:pointer;font-size:13px;">
           <input type="checkbox" id="proc-${p.key}" value="${p.fee}" onchange="recalcIntakeFeeFromProcs('${docName}')">
           ${p.label}
         </label>`
      ).join('');
    } else {
      procWrap.style.display = 'none';
    }
  }
  if (typeof window._feeCalcIntakeFee === 'function') window._feeCalcIntakeFee();
}

export function recalcIntakeFeeFromProcs(docName) {
  const doctor = CACHE.staff.find(s => s.role === 'doctor' && (s.doctorName === docName || s.name === docName));
  const fees   = doctor?.feeSchedule || {};
  const visitType = document.getElementById('i-visit-type')?.value || 'consultation';
  const feeKey = FEE_TYPE_MAP[visitType] || 'checkup';
  let total = fees[feeKey] || 0;
  ['ultrasound','minor','major','other'].forEach(k => {
    const cb = document.getElementById(`proc-${k}`);
    if (cb && cb.checked) total += parseFloat(cb.value) || 0;
  });
  const feeInput = document.getElementById('i-fee');
  if (feeInput) feeInput.value = total;
  if (typeof window._feeCalcIntakeFee === 'function') window._feeCalcIntakeFee();
}

// ─────────────────────────────────────────────────────────
// REFERRAL SYSTEM
// ─────────────────────────────────────────────────────────
export function openReferModal(id, col) {
  const rec = col === 'token'
    ? CACHE.tokens.find(t => t.id === id)
    : CACHE.patients.find(p => p.id === id);
  if (!rec) { showToast('Patient not found', true); return; }
  document.getElementById('refer-src-id').value  = id;
  document.getElementById('refer-src-col').value = col;
  document.getElementById('refer-patient-info').innerHTML =
    `<strong>${rec.patientName}</strong> · ${rec.age||'?'}y
     <span style="color:var(--muted);margin-left:8px;">${rec.checkFor||'—'}</span>
     <br><span style="font-size:12px;color:var(--muted);">Currently with: Dr. ${rec.doctorName||'—'}</span>`;
  const doctors = CACHE.staff.filter(s => s.role === 'doctor' && s.doctorName !== rec.doctorName);
  const sel = document.getElementById('refer-to-doctor');
  sel.innerHTML = '<option value="">— Select Doctor —</option>'
    + doctors.map(d => `<option value="${d.doctorName||d.name}">${d.doctorName||d.name}</option>`).join('');
  document.getElementById('refer-note').value = '';
  document.getElementById('refer-fee').value  = '';
  document.getElementById('refer-fee-hint').textContent = '';
  document.getElementById('refer-alert').style.display = 'none';
  openMo('mo-refer');
}

export function onReferDoctorChange() {
  const sel     = document.getElementById('refer-to-doctor');
  const docName = sel?.value;
  const reason  = document.getElementById('refer-reason')?.value;
  if (!docName) return;
  const doctor = CACHE.staff.find(s => s.role === 'doctor' && (s.doctorName === docName || s.name === docName));
  const fees   = doctor?.feeSchedule || {};
  const map = {'Ultrasound':fees.ultrasound,'Minor Procedure':fees.minor,'Operation':fees.major,'Follow-up':fees.followup,'Specialist Opinion':fees.checkup};
  const suggested = map[reason] || fees.checkup || 0;
  if (suggested) {
    document.getElementById('refer-fee').value = suggested;
    document.getElementById('refer-fee-hint').textContent = `Auto-filled from Dr. ${docName}'s fee schedule`;
  } else {
    document.getElementById('refer-fee-hint').textContent = `Dr. ${docName} has no fee set — enter manually`;
  }
}

export async function submitReferral() {
  const srcId    = document.getElementById('refer-src-id').value;
  const srcCol   = document.getElementById('refer-src-col').value;
  const toDoctor = document.getElementById('refer-to-doctor').value;
  const reason   = document.getElementById('refer-reason').value;
  const note     = document.getElementById('refer-note').value.trim();
  const fee      = parseFloat(document.getElementById('refer-fee').value) || 0;
  const alertEl  = document.getElementById('refer-alert');
  if (!toDoctor) {
    alertEl.style.display = 'block';
    alertEl.innerHTML = '<div class="alert ae">Select a doctor to refer to.</div>';
    return;
  }
  const src = srcCol === 'token'
    ? CACHE.tokens.find(t => t.id === srcId)
    : CACHE.patients.find(p => p.id === srcId);
  if (!src) return;

  const todayStr   = new Date().toISOString().slice(0,10);
  const todayCount = CACHE.tokens.filter(t => {
    if (!t.timestamp) return false;
    return new Date(t.timestamp.seconds?t.timestamp.seconds*1000:t.timestamp).toISOString().slice(0,10) === todayStr;
  }).length;
  const seq  = todayCount + 1;
  const cuts = getDoctorCut(toDoctor, fee);

  const newToken = {
    seq, tokenId: 'T' + String(seq).padStart(3,'0'),
    timestamp: serverTimestamp(),
    patientName: src.patientName, age: src.age||'', gender: src.gender||'', phone: src.phone||'',
    checkFor:    reason + (note ? ` — ${note}` : ''),
    doctorName:  toDoctor, status: 'waiting',
    isReferral: true, referredFrom: src.doctorName||CU.doctorName||'',
    referredFromId: srcId, referralReason: reason, referralNote: note,
    standardFee: fee, checkupFee: fee, discountAmt: 0, discountType: 'none',
    isFree: fee === 0, totalFee: fee,
    hospitalCut: cuts.hospitalCut, doctorCut: cuts.doctorCut,
    feeStatus: 'Pending', paid: 'Pending',
    feeHistory: [{
      action: `Referral token — Dr. ${src.doctorName||'Unknown'} → Dr. ${toDoctor}`,
      by: CU.name||CU.email, at: new Date().toISOString(), amount: fee,
      note: `${reason}${note?' — '+note:''}`
    }],
    bp: src.bp||'', pulse: src.pulse||'', temperature: src.temperature||'',
    spo2: src.spo2||'', allergies: src.allergies||'', medHistory: src.medHistory||'',
    createdBy: CU.uid, createdByName: CU.name||CU.email,
    prescription: null, diagnosis: '', rxAdvice: '', rxFollowup: '',
  };

  alertEl.style.display = 'block';
  alertEl.innerHTML = '<div class="alert ai">⏳ Creating referral token...</div>';
  const newId = await safeWrite(() => restAdd('tokens', newToken));
  if (!newId) return;

  await safeWrite(() => restUpdate(srcCol === 'token' ? 'tokens' : 'patients', srcId, {
    referredTo: toDoctor, referredToId: newId,
    referralReason: reason, referralNote: note, hasReferral: true,
  }));

  alertEl.innerHTML = `<div class="alert as">✅ Referral token ${newToken.tokenId} created for Dr. ${toDoctor}</div>`;
  showToast(`✓ Patient referred to Dr. ${toDoctor}`);
  setTimeout(() => { closeMo('mo-refer'); viewToken(newId, 'token'); }, 1400);
}

// ─────────────────────────────────────────────────────────
// DOCTOR SETTLEMENT (admin collects hospital cut from doctor)
// ─────────────────────────────────────────────────────────
export function openDocSettlement(doctorName) {
  const body = document.getElementById('doc-settle-body');
  if (!body) return;
  const all  = [...(CACHE.tokens||[]), ...(CACHE.patients||[])];
  const recs = all.filter(p =>
    p.doctorName === doctorName &&
    p.feeStatus === 'Doctor-Collected' &&
    !p.hospitalCutCollected
  );
  const hospitalOwed = recs.reduce((s,p) => s+(p.hospitalCut||0), 0);
  const doctorKept   = recs.reduce((s,p) => s+(p.doctorCut||0), 0);
  const totalColl    = recs.reduce((s,p) => s+(p.feeCollectedAmount||p.checkupFee||0), 0);

  if (!recs.length) {
    body.innerHTML = `<div class="alert as" style="margin:16px;">✅ No outstanding hospital cut from Dr. ${doctorName}.</div>`;
    openMo('mo-doc-settle'); return;
  }

  const idsJson = JSON.stringify(recs.map(r=>r.id)).replace(/"/g,'&quot;');
  body.innerHTML = `
    <div style="background:#f0faf9;border-radius:8px;padding:14px 18px;margin-bottom:14px;font-size:13px;">
      <strong style="font-size:15px;">Dr. ${doctorName}</strong>
      <div style="margin-top:8px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;">
        <div><div style="color:var(--muted);font-size:11px;">Total Collected</div><strong>₨${totalColl.toLocaleString()}</strong></div>
        <div><div style="color:var(--muted);font-size:11px;">Doctor Keeps</div><strong style="color:var(--green);">₨${doctorKept.toLocaleString()}</strong></div>
        <div><div style="color:var(--muted);font-size:11px;">Hospital Due From Doctor</div><strong style="color:var(--red);">₨${hospitalOwed.toLocaleString()}</strong></div>
      </div>
    </div>
    <div class="tw" style="margin-bottom:14px;max-height:220px;overflow-y:auto;">
      <table style="width:100%;font-size:12px;border-collapse:collapse;">
        <thead><tr style="background:#f0faf9;position:sticky;top:0;">
          <th style="padding:7px 10px;text-align:left;">Patient</th><th>Date</th>
          <th>Collected</th><th style="color:var(--green);">Dr. Keeps</th>
          <th style="color:var(--red);">Hosp. Due</th>
        </tr></thead>
        <tbody>
          ${recs.map(p => {
            const ts = p.timestamp
              ? new Date(p.timestamp.seconds?p.timestamp.seconds*1000:p.timestamp).toLocaleDateString('en-PK')
              : '—';
            return `<tr style="border-bottom:1px solid var(--border);">
              <td style="padding:7px 10px;"><strong>${p.patientName}</strong>
                <br><span style="color:var(--muted);font-size:11px;">${p.tokenId||p.id.slice(-5)}</span></td>
              <td style="padding:7px;">${ts}</td>
              <td style="padding:7px;">₨${(p.feeCollectedAmount||p.checkupFee||0).toLocaleString()}</td>
              <td style="padding:7px;color:var(--green);">₨${(p.doctorCut||0).toLocaleString()}</td>
              <td style="padding:7px;color:var(--red);font-weight:600;">₨${(p.hospitalCut||0).toLocaleString()}</td>
            </tr>`;
          }).join('')}
          <tr style="background:#f0faf9;font-weight:700;">
            <td colspan="4" style="padding:8px 10px;text-align:right;">TOTAL Hospital Due:</td>
            <td style="padding:8px;color:var(--red);font-size:15px;">₨${hospitalOwed.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>
    </div>
    <div class="fgrid" style="margin-bottom:12px;">
      <div class="fl"><label>Amount Received from Doctor (PKR)</label>
        <input type="number" id="doc-settle-amt" value="${hospitalOwed}" style="font-size:16px;font-weight:600;"></div>
      <div class="fl"><label>Receipt / Confirmation</label>
        <input type="text" id="doc-settle-note" placeholder="e.g. Cash received, counted by admin"></div>
    </div>
    <div id="doc-settle-verify" style="margin-bottom:10px;"></div>
    <div class="brow">
      <button class="btn bt" style="background:var(--green);" id="doc-settle-btn"
        onclick="confirmDocSettlement('${doctorName}','${idsJson}')">
        ✅ Confirm — Hospital Cut Received
      </button>
      <button class="btn bo" onclick="closeMo('mo-doc-settle')">Cancel</button>
    </div>`;
  openMo('mo-doc-settle');
}

export async function confirmDocSettlement(doctorName, idsRaw) {
  const recIds = JSON.parse(idsRaw.replace(/&quot;/g,'"'));
  const amt    = parseFloat(document.getElementById('doc-settle-amt')?.value) || 0;
  const note   = document.getElementById('doc-settle-note')?.value.trim() || '';
  const verEl  = document.getElementById('doc-settle-verify');
  const btn    = document.getElementById('doc-settle-btn');

  const all  = [...(CACHE.tokens||[]),...(CACHE.patients||[])];
  const recs = recIds.map(id => all.find(p => p.id === id)).filter(Boolean);
  const expect = recs.reduce((s,p) => s+(p.hospitalCut||0), 0);

  // Mismatch warning on first click
  if (amt < expect * 0.99 && btn && !btn.dataset.warned) {
    const short = expect - amt;
    verEl.innerHTML = `<div class="alert ae">
      ⚠ Amount is ₨${short.toLocaleString()} SHORT (expected ₨${expect.toLocaleString()}).
      If this is correct, click <strong>Confirm</strong> again to save with the shortfall noted.
    </div>`;
    btn.dataset.warned = '1';
    return;
  }

  verEl.innerHTML = '<div class="alert ai">⏳ Recording settlement...</div>';
  let done = 0;
  for (const p of recs) {
    const col  = (p._fromToken || CACHE.tokens.find(t=>t.id===p.id)) ? 'tokens' : 'patients';
    const hist = (p.feeHistory||[]).concat([{
      action: `Hospital cut ₨${(p.hospitalCut||0).toLocaleString()} collected from Dr. ${doctorName}`,
      by: CU.name||CU.email, at: new Date().toISOString(),
      amount: p.hospitalCut||0, note
    }]);
    await safeWrite(() => restUpdate(col, p.id, {
      hospitalCutCollected: true,
      hospitalCutCollectedBy:  CU.name||CU.email,
      hospitalCutCollectedAt:  new Date().toISOString(),
      hospitalCutNote: note,
      feeStatus: 'Paid', paid: 'Paid',
      feeHistory: hist,
    }));
    done++;
  }
  verEl.innerHTML = `<div class="alert as">✅ ₨${amt.toLocaleString()} received from Dr. ${doctorName} — ${done} records cleared.</div>`;
  showToast(`✅ Hospital cut collected from Dr. ${doctorName}`);
  setTimeout(() => closeMo('mo-doc-settle'), 1800);
}
