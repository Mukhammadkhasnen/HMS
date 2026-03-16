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

// ── Shared modal helpers ──────────────────────────────────
export function openMo(id)  { document.getElementById(id)?.classList.add('open');    }
export function closeMo(id) { document.getElementById(id)?.classList.remove('open'); }

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
   'i-al','i-md','i-hx','i-dur','i-nt','i-fee','i-cnote','i-tx','i-txc']
    .forEach(id => { const el = document.getElementById(id); if (el) el.value = ''; });
  document.getElementById('i-doc').value = '';
  document.getElementById('i-gen').value = '';
  document.getElementById('ia').innerHTML = '';
  const ip = document.getElementById('i-paid');   if (ip) ip.value = 'Pending';
  const ii = document.getElementById('i-indoor'); if (ii) ii.value = 'No';
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

  const fee = parseFloat(document.getElementById('i-fee').value) || 0;
  const txc = parseFloat(document.getElementById('i-txc')?.value) || 0;
  const indoor = document.getElementById('i-indoor').value;
  const feeStatus = document.getElementById('i-paid').value;
  const cuts = getDoctorCut(doc, fee);

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
    checkupFee:      fee,
    indoor,
    treatmentDesc:   document.getElementById('i-tx')?.value.trim() || '',
    treatmentCharges: indoor === 'Yes' ? txc : 0,
    totalFee:        fee + (indoor === 'Yes' ? txc : 0),
    hospitalCut:     cuts.hospitalCut,
    doctorCut:       cuts.doctorCut,
    feeStatus,
    paid:            feeStatus === 'Counter-Paid' ? 'Paid' : 'Pending',
    feeCollectedBy:  feeStatus === 'Counter-Paid' ? (CU.name || CU.email) : '',
    feeCollectedAt:  feeStatus === 'Counter-Paid' ? new Date().toISOString() : '',
    feeNote:         feeStatus === 'Counter-Paid' ? document.getElementById('i-cnote').value.trim() : '',
    feeHistory:      feeStatus === 'Counter-Paid' ? [{
      action: 'Counter collected', by: CU.name || CU.email,
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
    setTimeout(printToken, 400); // auto-print
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
// FEE COLLECTION WORKFLOW
// ─────────────────────────────────────────────────────────
export function toggleCounterFee() {
  const v = document.getElementById('f-paid')?.value;
  const n = document.getElementById('f-counter-note');
  if (n) n.style.display = v === 'Counter-Paid' ? 'block' : 'none';
}

export function openFeeModal(id, col, mode) {
  let rec = col === 'token'
    ? CACHE.tokens.find(t  => t.id  === id)
    : CACHE.patients.find(p => p.id === id);
  if (!rec) { rec = CACHE.tokens.find(t => t.id === id); if (rec) col = 'token'; }
  if (!rec) { showToast('Record not found — try refreshing', true); return; }

  document.getElementById('fee-mo-id').value  = id;
  document.getElementById('fee-mo-col').value = col;
  document.getElementById('fee-mo-patient').innerHTML =
    `<strong>${rec.patientName}</strong>${rec.tokenId ? ' · ' + rec.tokenId : ''}
     · <span style="color:var(--teal);">₨${(rec.checkupFee || 0).toLocaleString()}</span>
     · Doctor: ${rec.doctorName || '—'}`;

  ['fee-doc-section','fee-staff-section','fee-counter-section']
    .forEach(s => document.getElementById(s).style.display = 'none');

  if (mode === 'doctor') {
    document.getElementById('fee-mo-title').textContent = '💊 Doctor Fee Collection';
    document.getElementById('fee-doc-section').style.display = 'block';
    document.getElementById('fee-doc-amount').value = rec.checkupFee || '';
    document.getElementById('fee-doc-note').value   = '';
  } else if (mode === 'confirm') {
    document.getElementById('fee-mo-title').textContent = '✅ Confirm Fee Receipt from Doctor';
    document.getElementById('fee-staff-section').style.display = 'block';
    const docAmt = rec.feeCollectedAmount || rec.checkupFee || 0;
    document.getElementById('fee-staff-info').textContent =
      `Dr. ${rec.feeCollectedBy || rec.doctorName || 'Doctor'} collected ₨${Number(docAmt).toLocaleString()}` +
      (rec.feeNote ? ` — Note: ${rec.feeNote}` : '');
    document.getElementById('fee-staff-amount').value = docAmt;
    document.getElementById('fee-staff-note').value   = '';
  } else {
    document.getElementById('fee-mo-title').textContent = '💵 Collect Fee at Counter';
    document.getElementById('fee-counter-section').style.display = 'block';
    document.getElementById('fee-counter-amount').value = rec.checkupFee || '';
    document.getElementById('fee-counter-note').value   = '';
  }
  openMo('mo-fee');
}

export async function saveDoctorFee() {
  const id  = document.getElementById('fee-mo-id').value;
  const col = document.getElementById('fee-mo-col').value;
  const amt  = parseFloat(document.getElementById('fee-doc-amount').value) || 0;
  const note = document.getElementById('fee-doc-note').value.trim();
  const rec  = col === 'token' ? CACHE.tokens.find(t => t.id === id) : CACHE.patients.find(p => p.id === id);
  if (!rec) return;

  const hist = (rec.feeHistory || []).concat([{ action: 'Doctor collected', by: CU.name || CU.email, at: new Date().toISOString(), amount: amt, note }]);
  const ok   = await safeWrite(() => restUpdate(col === 'token' ? 'tokens' : 'patients', id, {
    feeStatus: 'Doctor-Collected', feeCollectedBy: CU.name || CU.email,
    feeCollectedAt: new Date().toISOString(), feeCollectedAmount: amt, feeNote: note, feeHistory: hist
  }));
  if (ok !== null) { showToast('✓ Fee marked as collected by doctor'); closeMo('mo-fee'); }
}

export async function confirmStaffReceipt() {
  const id  = document.getElementById('fee-mo-id').value;
  const col = document.getElementById('fee-mo-col').value;
  const amt  = parseFloat(document.getElementById('fee-staff-amount').value) || 0;
  const note = document.getElementById('fee-staff-note').value.trim();
  const rec  = col === 'token' ? CACHE.tokens.find(t => t.id === id) : CACHE.patients.find(p => p.id === id);
  if (!rec) return;

  const hist = (rec.feeHistory || []).concat([{ action: 'Staff confirmed receipt', by: CU.name || CU.email, at: new Date().toISOString(), amount: amt, note }]);
  const ok   = await safeWrite(() => restUpdate(col === 'token' ? 'tokens' : 'patients', id, {
    feeStatus: 'Paid', paid: 'Paid', feeConfirmedBy: CU.name || CU.email,
    feeConfirmedAt: new Date().toISOString(), feeNote: (rec.feeNote ? rec.feeNote + ' | ' : '') + note, feeHistory: hist
  }));
  if (ok !== null) { showToast('✅ Fee confirmed — marked as Paid'); closeMo('mo-fee'); }
}

export async function saveCounterFee() {
  const id  = document.getElementById('fee-mo-id').value;
  const col = document.getElementById('fee-mo-col').value;
  const amt  = parseFloat(document.getElementById('fee-counter-amount').value) || 0;
  const note = document.getElementById('fee-counter-note').value.trim();
  const rec  = col === 'token' ? CACHE.tokens.find(t => t.id === id) : CACHE.patients.find(p => p.id === id);
  if (!rec) return;

  const hist = (rec.feeHistory || []).concat([{ action: 'Counter collected', by: CU.name || CU.email, at: new Date().toISOString(), amount: amt, note }]);
  const ok   = await safeWrite(() => restUpdate(col === 'token' ? 'tokens' : 'patients', id, {
    feeStatus: 'Counter-Paid', paid: 'Paid', feeCollectedBy: CU.name || CU.email,
    feeCollectedAt: new Date().toISOString(), feeCollectedAmount: amt, feeNote: note, feeHistory: hist
  }));
  if (ok !== null) { showToast('✅ Fee collected at counter — marked Paid'); closeMo('mo-fee'); }
}

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
  if (!confirm('Delete this patient record?')) return;
  await safeWrite(() => restDelete('patients', id));
  showToast('🗑 Deleted');
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
  if (!confirm('Delete this expense?')) return;
  await safeWrite(() => restDelete('expenses', id));
  showToast('🗑 Deleted');
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
  if (!confirm('Delete this item?')) return;
  await safeWrite(() => restDelete('consumables', id));
  showToast('🗑 Deleted');
}

export function openUse(id, name, qty) {
  document.getElementById('use-id').value = id;
  document.getElementById('useinfo').innerHTML = `<strong>${name}</strong><br>Current stock: <strong>${qty}</strong>`;
  document.getElementById('use-qty').value = '1';
  document.getElementById('use-nt').value  = '';
  openMo('mo-use');
}
export async function doUseConsumable() {
  const id  = document.getElementById('use-id').value;
  const act = document.getElementById('use-act').value;
  const qty = parseFloat(document.getElementById('use-qty').value) || 1;
  const c   = CACHE.consumables.find(x => x.id === id); if (!c) return;
  const newQty = act === 'use' ? Math.max(0, (c.quantity || 0) - qty) : (c.quantity || 0) + qty;
  showToast('💾 Saving...');
  await safeWrite(() => restUpdate('consumables', id, { quantity: newQty }));
  showToast('✓ Stock updated!'); closeMo('mo-use');
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
  }
  openMo('mo-user');
}

export function toggleUR() {
  const v     = document.getElementById('u-role')?.value;
  const isDoc = v === 'doctor';
  document.getElementById('udnw')?.style      && (document.getElementById('udnw').style.display      = isDoc ? 'block' : 'none');
  document.getElementById('u-cut-wrap')?.style && (document.getElementById('u-cut-wrap').style.display = isDoc ? 'block' : 'none');
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
  if (cv.value === '0')       return { noSplit: true,  hospitalKeepsAll: false, doctorCutPct: 0 };
  if (cv.value === 'hospital') return { noSplit: true,  hospitalKeepsAll: true,  doctorCutPct: 0 };
  if (cv.value === 'custom')  return { noSplit: false, hospitalKeepsAll: false, doctorCutPct: parseFloat(document.getElementById('u-cut-pct').value) || 70 };
  return { noSplit: false, hospitalKeepsAll: false, doctorCutPct: 70 };
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
    ..._readCutSettings()
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
