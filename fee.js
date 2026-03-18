// ============================================================
// fee.js — Complete fee management system
// Discounts, free consultations, doctor instructions,
// full audit trail, daily settlement, operation bill
// ============================================================

import { restUpdate, restAdd, serverTimestamp } from './firebase.js';
import { CU, CACHE, allPatients, getDoctorCut, MONTHS, curMonth } from './state.js';
import { safeWrite, showToast } from './ui.js';

// ─── helpers ─────────────────────────────────────────────
function _getRec(id, col) {
  return col === 'token'
    ? CACHE.tokens.find(t => t.id === id)
    : CACHE.patients.find(p => p.id === id);
}
function _closeFee() { if (typeof closeMo === 'function') closeMo('mo-fee'); }
function _fsClass(fs) {
  if (!fs || fs === 'Pending') return 'br';
  if (['Paid','Counter-Paid','Settled','Free'].includes(fs)) return 'bg';
  if (fs === 'Doctor-Collected') return 'ba';
  return 'br';
}
async function _feeUpdate(id, col, update, action, amount, note, shortfall) {
  const rec = _getRec(id, col); if (!rec) return;
  const entry = { action, by: CU.name||CU.email, at: new Date().toISOString(), amount: amount||0, note: note||'' };
  if (shortfall > 0) entry.shortfall = shortfall;
  update.feeHistory = (rec.feeHistory || []).concat([entry]);
  return safeWrite(() => restUpdate(col === 'token' ? 'tokens' : 'patients', id, update));
}

// ─── Open fee modal ───────────────────────────────────────
export function openFeeModal(id, col) {
  let rec = col === 'token'
    ? CACHE.tokens.find(t => t.id === id)
    : CACHE.patients.find(p => p.id === id);
  if (!rec) { rec = CACHE.tokens.find(t => t.id === id); if (rec) col = 'token'; }
  if (!rec) { showToast('Record not found', true); return; }

  document.getElementById('fee-mo-id').value  = id;
  document.getElementById('fee-mo-col').value = col;

  const stdFee   = rec.standardFee || rec.checkupFee || 0;
  const finalFee = rec.checkupFee || 0;
  const discount = rec.discountAmt || 0;
  const isFree   = rec.isFree || rec.paid === 'Free' || (finalFee === 0 && rec.feeStatus !== 'Pending');
  const fs       = rec.feeStatus || 'Pending';

  document.getElementById('fee-mo-title').textContent = '💰 Fee — ' + rec.patientName;
  document.getElementById('fee-mo-patient').innerHTML =
    `<div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;flex-wrap:wrap;">
       <div>
         <strong style="font-size:15px;">${rec.patientName}</strong>
         ${rec.tokenId ? `<span style="color:var(--muted);font-size:12px;margin-left:8px;">${rec.tokenId}</span>` : ''}
         <br><span style="font-size:12px;color:var(--muted);">Dr. ${rec.doctorName||'—'} · ${rec.checkFor||'—'}</span>
       </div>
       <div style="text-align:right;">
         ${discount > 0 ? `<span style="font-size:11px;color:var(--muted);text-decoration:line-through;display:block;">Std: ₨${stdFee.toLocaleString()}</span>` : ''}
         <span style="font-size:18px;font-weight:700;color:${isFree?'var(--green)':'var(--teal-dark)'};">
           ${isFree ? 'FREE' : '₨' + finalFee.toLocaleString()}
         </span>
         ${discount > 0 && !isFree ? `<span class="badge ba" style="font-size:10px;margin-left:6px;">-₨${discount.toLocaleString()}</span>` : ''}
         <br><span class="badge ${_fsClass(fs)}" style="font-size:10px;margin-top:3px;">${fs}</span>
       </div>
     </div>`;

  // Audit trail
  const hist = rec.feeHistory || [];
  const hw = document.getElementById('fee-mo-hist-wrap');
  const hel = document.getElementById('fee-mo-hist');
  if (hw && hel && hist.length) {
    hw.style.display = 'block';
    hel.innerHTML = hist.map(h => {
      const at = h.at ? new Date(h.at).toLocaleString('en-PK',{hour:'2-digit',minute:'2-digit',day:'numeric',month:'short'}) : '';
      const amtStr   = h.amount !== undefined ? ` · <span style="color:var(--teal);">₨${Number(h.amount).toLocaleString()}</span>` : '';
      const noteStr  = h.note   ? ` · <em style="color:var(--muted);">${h.note}</em>` : '';
      const shortStr = h.shortfall > 0 ? ` <span style="color:var(--red);font-weight:600;">⚠ SHORT ₨${h.shortfall}</span>` : '';
      return `<div style="padding:2px 0;border-bottom:1px dotted var(--border);">
        <strong>${h.action}</strong> — ${h.by}${amtStr}${noteStr}${shortStr}
        <span style="float:right;font-size:11px;color:var(--muted);">${at}</span></div>`;
    }).join('');
  } else if (hw) hw.style.display = 'none';

  // Show correct section
  ['fee-doc-section','fee-staff-section','fee-admin-section'].forEach(s => {
    const el = document.getElementById(s); if (el) el.style.display = 'none';
  });

  const role = CU.role;
  if (role === 'admin') {
    document.getElementById('fee-admin-section').style.display = 'block';
    document.getElementById('fee-admin-form').innerHTML =
      `<div style="font-size:12px;color:var(--muted);">Status: <strong>${fs}</strong>
       ${rec.feeCollectedBy ? ' · By: '+rec.feeCollectedBy : ''}
       ${rec.feeCollectedAmount ? ' · ₨'+Number(rec.feeCollectedAmount).toLocaleString() : ''}</div>`;
  } else if (role === 'doctor') {
    document.getElementById('fee-doc-section').style.display = 'block';
    document.getElementById('fee-doc-form').innerHTML = '';
  } else {
    // Staff
    const alertEl = document.getElementById('fee-staff-alert');
    const formEl  = document.getElementById('fee-staff-form');
    document.getElementById('fee-staff-section').style.display = 'block';

    if (fs === 'Doctor-Collected') {
      const docAmt = rec.feeCollectedAmount || finalFee;
      alertEl.style.cssText = 'background:#fef3c7;border-radius:8px;padding:12px;margin-bottom:12px;font-size:13px;color:#92400e;line-height:1.7;';
      alertEl.innerHTML = `<strong>⚠ Dr. ${rec.feeCollectedBy||rec.doctorName} collected this fee.</strong><br>Amount: <strong>₨${Number(docAmt).toLocaleString()}</strong>${rec.feeNote?' · '+rec.feeNote:''}`;
      formEl.innerHTML  = `
        <div class="fl" style="margin-bottom:10px;"><label>Confirm Amount Received (PKR)</label>
          <input type="number" id="fee-staff-amount" value="${docAmt}"></div>
        <div class="fl" style="margin-bottom:12px;"><label>Your Note</label>
          <input type="text" id="fee-staff-note" placeholder="e.g. Received from Dr. Ahmed in full"></div>
        <div class="brow">
          <button class="btn bt" style="background:var(--green);flex:1;" onclick="confirmStaffReceipt()">✅ Confirm Receipt</button>
          <button class="btn bred" onclick="reportShortfall()">⚠ Short</button>
        </div>`;
    } else if (fs === 'Doctor-Free') {
      alertEl.style.cssText = 'background:#c6f6d5;border-radius:8px;padding:12px;margin-bottom:12px;font-size:13px;color:#276749;';
      alertEl.innerHTML     = `<strong>✅ Doctor marked FREE</strong><br>${rec.doctorFreeReason||''}`;
      formEl.innerHTML      = `<button class="btn bt" style="width:100%;background:var(--green);" onclick="confirmFreeByCounter()">✅ Acknowledge — No Collection</button>`;
    } else if (fs === 'Counter-Instruct') {
      const ia = rec.counterInstructAmount || finalFee;
      alertEl.style.cssText = 'background:#bee3f8;border-radius:8px;padding:12px;margin-bottom:12px;font-size:13px;color:#2c5282;';
      alertEl.innerHTML     = `<strong>📋 Doctor says: collect ₨${Number(ia).toLocaleString()}</strong><br>${rec.counterInstructNote||''}`;
      formEl.innerHTML      = `
        <div class="fl" style="margin-bottom:10px;"><label>Amount (PKR)</label>
          <input type="number" id="fee-counter-amount" value="${ia}"></div>
        <div class="fl" style="margin-bottom:12px;"><label>Receipt / Note</label>
          <input type="text" id="fee-counter-note" placeholder="e.g. Cash, receipt #12"></div>
        <button class="btn bt" style="width:100%;background:var(--green);" onclick="saveCounterFee()">✅ Collected — Mark Paid</button>`;
    } else if (fs === 'Return-Requested') {
      alertEl.style.cssText = 'background:#fed7d7;border-radius:8px;padding:12px;margin-bottom:12px;font-size:13px;color:#9b2c2c;';
      alertEl.innerHTML     = `<strong>↩ Doctor requests RETURN</strong><br>${rec.returnReason||''}<br>Amount: ₨${(rec.feeCollectedAmount||finalFee).toLocaleString()}`;
      formEl.innerHTML      = `
        <div class="fl" style="margin-bottom:12px;"><label>Note after returning money</label>
          <input type="text" id="fee-return-note" placeholder="e.g. Returned ₨500 cash to patient"></div>
        <button class="btn bred" style="width:100%;" onclick="confirmReturnToPatient()">↩ Money Returned to Patient</button>`;
    } else if (isFree || fs === 'Free') {
      alertEl.style.cssText = 'background:#c6f6d5;border-radius:8px;padding:12px;margin-bottom:12px;font-size:13px;color:#276749;';
      alertEl.innerHTML     = `<strong>✅ FREE</strong><br>${rec.discountReason||'No charge'}`;
      formEl.innerHTML      = `<button class="btn bt" style="width:100%;background:var(--green);" onclick="confirmFreeByCounter()">✅ Acknowledge</button>`;
    } else {
      alertEl.style.cssText = ''; alertEl.innerHTML = '';
      formEl.innerHTML = `
        <div class="fl" style="margin-bottom:10px;"><label>Amount to Collect (PKR)</label>
          <input type="number" id="fee-counter-amount" value="${finalFee}"></div>
        <div class="fl" style="margin-bottom:12px;"><label>Receipt / Note</label>
          <input type="text" id="fee-counter-note" placeholder="e.g. Cash, receipt #12"></div>
        <div class="brow">
          <button class="btn bt" style="background:var(--green);flex:1;" onclick="saveCounterFee()">✅ Collected at Counter</button>
          <button class="btn bo" onclick="markPatientDeferred()">⏳ Defer</button>
        </div>`;
    }
  }
  if (typeof openMo === 'function') openMo('mo-fee');
}

// ─── Doctor actions ───────────────────────────────────────
export function feeDocAction(action) {
  const id  = document.getElementById('fee-mo-id')?.value;
  const col = document.getElementById('fee-mo-col')?.value;
  const rec = _getRec(id, col);
  const fee = rec?.checkupFee || 0;
  const form = document.getElementById('fee-doc-form');
  if (!form) return;

  if (action === 'collect') {
    form.innerHTML = `
      <div class="fl" style="margin-bottom:10px;"><label>Amount I Collected (PKR)</label>
        <input type="number" id="fee-doc-amount" value="${fee}"></div>
      <div class="fl" style="margin-bottom:12px;"><label>Note for Counter Staff</label>
        <input type="text" id="fee-doc-note" placeholder="e.g. Cash in hand — will handover"></div>
      <button class="btn bt" style="width:100%;" onclick="saveDoctorFee()">💰 Mark Collected by Me</button>`;
  } else if (action === 'free') {
    form.innerHTML = `
      <div style="background:#c6f6d5;border-radius:8px;padding:10px;margin-bottom:10px;font-size:13px;color:#276749;">Counter will see this as FREE — no collection.</div>
      <div class="fl" style="margin-bottom:12px;"><label>Reason (required)</label>
        <input type="text" id="fee-free-reason" placeholder="e.g. Staff relative, poor patient, follow-up"></div>
      <button class="btn bt" style="width:100%;background:var(--green);" onclick="saveDoctorFree()">✅ Mark as Free</button>`;
  } else if (action === 'instruct') {
    form.innerHTML = `
      <div style="background:#bee3f8;border-radius:8px;padding:10px;margin-bottom:10px;font-size:13px;color:#2c5282;">Counter staff will see your exact instruction.</div>
      <div class="fl" style="margin-bottom:10px;"><label>Counter Should Collect (PKR)</label>
        <input type="number" id="fee-instruct-amt" value="${fee}"></div>
      <div class="fl" style="margin-bottom:12px;"><label>Instruction Note</label>
        <input type="text" id="fee-instruct-note" placeholder="e.g. Patient paid half, collect ₨250 only"></div>
      <button class="btn bt" style="width:100%;background:#d69e2e;color:white;" onclick="saveDoctorInstruct()">📋 Send Instruction</button>`;
  } else if (action === 'return') {
    form.innerHTML = `
      <div style="background:#fed7d7;border-radius:8px;padding:10px;margin-bottom:10px;font-size:13px;color:#9b2c2c;">Counter will be told to return the fee to the patient.</div>
      <div class="fl" style="margin-bottom:12px;"><label>Reason for Return (required)</label>
        <input type="text" id="fee-return-reason" placeholder="e.g. Patient cannot afford, billing error"></div>
      <button class="btn bred" style="width:100%;" onclick="saveDoctorReturn()">↩ Request Return to Patient</button>`;
  }
}

export async function saveDoctorFee() {
  const id  = document.getElementById('fee-mo-id').value;
  const col = document.getElementById('fee-mo-col').value;
  const amt  = parseFloat(document.getElementById('fee-doc-amount')?.value) || 0;
  const note = document.getElementById('fee-doc-note')?.value.trim() || '';
  await _feeUpdate(id, col, {
    feeStatus:'Doctor-Collected', feeCollectedBy:CU.name||CU.email,
    feeCollectedAt:new Date().toISOString(), feeCollectedAmount:amt, feeNote:note
  }, 'Doctor collected', amt, note);
  showToast('✓ Marked as collected by you'); _closeFee();
}

export async function saveDoctorFree() {
  const id     = document.getElementById('fee-mo-id').value;
  const col    = document.getElementById('fee-mo-col').value;
  const reason = document.getElementById('fee-free-reason')?.value.trim() || '';
  if (!reason) { showToast('Reason required', true); return; }
  await _feeUpdate(id, col, {
    feeStatus:'Doctor-Free', paid:'Free', isFree:true,
    doctorFreeReason:reason, doctorFreeBy:CU.name||CU.email,
    doctorFreeAt:new Date().toISOString()
  }, 'Doctor marked FREE', 0, reason);
  showToast('✅ Marked free — counter notified'); _closeFee();
}

export async function saveDoctorInstruct() {
  const id  = document.getElementById('fee-mo-id').value;
  const col = document.getElementById('fee-mo-col').value;
  const amt  = parseFloat(document.getElementById('fee-instruct-amt')?.value) || 0;
  const note = document.getElementById('fee-instruct-note')?.value.trim() || '';
  await _feeUpdate(id, col, {
    feeStatus:'Counter-Instruct', counterInstructAmount:amt,
    counterInstructNote:note, counterInstructBy:CU.name||CU.email,
    counterInstructAt:new Date().toISOString()
  }, `Doctor instructed counter: collect ₨${amt}`, amt, note);
  showToast('📋 Counter told the amount'); _closeFee();
}

export async function saveDoctorReturn() {
  const id     = document.getElementById('fee-mo-id').value;
  const col    = document.getElementById('fee-mo-col').value;
  const reason = document.getElementById('fee-return-reason')?.value.trim() || '';
  if (!reason) { showToast('Reason required', true); return; }
  await _feeUpdate(id, col, {
    feeStatus:'Return-Requested', returnReason:reason,
    returnRequestedBy:CU.name||CU.email, returnRequestedAt:new Date().toISOString()
  }, 'Doctor requested RETURN to patient', 0, reason);
  showToast('↩ Return request sent'); _closeFee();
}

// ─── Staff/Counter actions ────────────────────────────────
export async function confirmStaffReceipt() {
  const id  = document.getElementById('fee-mo-id').value;
  const col = document.getElementById('fee-mo-col').value;
  const amt  = parseFloat(document.getElementById('fee-staff-amount')?.value) || 0;
  const note = document.getElementById('fee-staff-note')?.value.trim() || '';
  const rec  = _getRec(id, col); if (!rec) return;
  const expected  = rec.feeCollectedAmount || rec.checkupFee || 0;
  const shortfall = Math.max(0, expected - amt);
  let action = 'Staff confirmed receipt from doctor';
  if (shortfall > 0) action += ` — SHORT ₨${shortfall}`;
  await _feeUpdate(id, col, {
    feeStatus:'Paid', paid:'Paid',
    feeConfirmedBy:CU.name||CU.email, feeConfirmedAt:new Date().toISOString(),
    feeConfirmedAmount:amt,
    ...(shortfall > 0 ? {feeShortfall:shortfall, hasShortfall:true} : {})
  }, action, amt, note, shortfall);
  if (shortfall > 0) showToast(`⚠ Confirmed with ₨${shortfall} shortfall — flagged`, true);
  else showToast('✅ Receipt confirmed — marked Paid');
  _closeFee();
}

export async function reportShortfall() {
  const noteEl = document.getElementById('fee-staff-note');
  if (noteEl) noteEl.value = 'SHORTFALL REPORTED: ' + (noteEl.value || 'Amount does not match');
  await confirmStaffReceipt();
}

export async function saveCounterFee() {
  const id  = document.getElementById('fee-mo-id').value;
  const col = document.getElementById('fee-mo-col').value;
  const amt  = parseFloat(document.getElementById('fee-counter-amount')?.value) || 0;
  const note = document.getElementById('fee-counter-note')?.value.trim() || '';
  const rec  = _getRec(id, col); if (!rec) return;
  const ia = rec.counterInstructAmount;
  let action = 'Counter collected';
  if (ia && amt !== ia) action += ` (instructed ₨${ia}, got ₨${amt})`;
  await _feeUpdate(id, col, {
    feeStatus:'Counter-Paid', paid:'Paid',
    feeCollectedBy:CU.name||CU.email, feeCollectedAt:new Date().toISOString(),
    feeCollectedAmount:amt, feeNote:note
  }, action, amt, note);
  showToast('✅ Collected at counter'); _closeFee();
}

export async function confirmFreeByCounter() {
  const id  = document.getElementById('fee-mo-id').value;
  const col = document.getElementById('fee-mo-col').value;
  await _feeUpdate(id, col, {feeStatus:'Free', paid:'Free'}, 'Counter acknowledged FREE', 0, '');
  showToast('✅ Acknowledged as free'); _closeFee();
}

export async function confirmReturnToPatient() {
  const id   = document.getElementById('fee-mo-id').value;
  const col  = document.getElementById('fee-mo-col').value;
  const note = document.getElementById('fee-return-note')?.value.trim() || 'Returned to patient';
  const rec  = _getRec(id, col);
  await _feeUpdate(id, col, {
    feeStatus:'Returned', paid:'Returned',
    returnConfirmedBy:CU.name||CU.email, returnConfirmedAt:new Date().toISOString()
  }, 'Money RETURNED to patient', rec?.feeCollectedAmount||0, note);
  showToast('↩ Return confirmed'); _closeFee();
}

export async function markPatientDeferred() {
  const id  = document.getElementById('fee-mo-id').value;
  const col = document.getElementById('fee-mo-col').value;
  await _feeUpdate(id, col, {feeStatus:'Deferred', paid:'Pending'}, 'Payment deferred', 0, '');
  showToast('⏳ Marked deferred'); _closeFee();
}

// ─── Admin fee override ───────────────────────────────────
export function feeAdminAction(type) {
  const id  = document.getElementById('fee-mo-id')?.value;
  const col = document.getElementById('fee-mo-col')?.value;
  const rec = _getRec(id, col);
  const fee = rec?.checkupFee || 0;
  const form = document.getElementById('fee-admin-form');
  if (!form) return;

  if (type === 'paid') {
    form.innerHTML = `
      <div class="fl" style="margin-bottom:10px;"><label>Amount (PKR)</label>
        <input type="number" id="adm-amt" value="${fee}"></div>
      <div class="fl" style="margin-bottom:12px;"><label>Note</label>
        <input type="text" id="adm-note" placeholder="Admin override note"></div>
      <button class="btn bt" style="width:100%;background:var(--green);" onclick="saveAdminFee('paid')">✅ Mark Paid</button>`;
  } else if (type === 'free') {
    form.innerHTML = `
      <div class="fl" style="margin-bottom:12px;"><label>Reason</label>
        <input type="text" id="adm-note" placeholder="e.g. Admin approved — charity case"></div>
      <button class="btn bt" style="width:100%;background:var(--green);" onclick="saveAdminFee('free')">🆓 Mark Free</button>`;
  } else if (type === 'return') {
    form.innerHTML = `
      <div class="fl" style="margin-bottom:12px;"><label>Note</label>
        <input type="text" id="adm-note" placeholder="e.g. Returned ₨500 cash, confirmed by admin"></div>
      <button class="btn bred" style="width:100%;" onclick="saveAdminFee('returned')">↩ Mark Returned</button>`;
  } else if (type === 'discount') {
    form.innerHTML = `
      <div class="fgrid" style="margin-bottom:10px;">
        <div class="fl"><label>Type</label>
          <select id="adm-disc-type"><option value="percent">%</option><option value="fixed">PKR</option><option value="free">100% Free</option></select>
        </div>
        <div class="fl"><label>Value</label>
          <input type="number" id="adm-disc-val" placeholder="e.g. 50"></div>
      </div>
      <div class="fl" style="margin-bottom:12px;"><label>Reason</label>
        <input type="text" id="adm-note" placeholder="e.g. Admin approved 50% discount"></div>
      <button class="btn bt" style="width:100%;" onclick="applyAdminDiscount()">💸 Apply Discount</button>`;
  }
}

export async function saveAdminFee(type) {
  const id   = document.getElementById('fee-mo-id').value;
  const col  = document.getElementById('fee-mo-col').value;
  const note = document.getElementById('adm-note')?.value.trim() || '';
  const rec  = _getRec(id, col); if (!rec) return;
  let update = {}, action = '', amt = 0;

  if (type === 'paid') {
    amt = parseFloat(document.getElementById('adm-amt')?.value) || rec.checkupFee || 0;
    update = {feeStatus:'Paid', paid:'Paid', feeCollectedBy:CU.name||CU.email,
              feeCollectedAt:new Date().toISOString(), feeCollectedAmount:amt, feeNote:note};
    action = 'Admin marked Paid';
  } else if (type === 'free') {
    update = {feeStatus:'Free', paid:'Free', isFree:true, discountReason:note,
              checkupFee:0, totalFee:rec.treatmentCharges||0, hospitalCut:0, doctorCut:0};
    action = 'Admin marked FREE';
  } else if (type === 'returned') {
    amt = rec.feeCollectedAmount || rec.checkupFee || 0;
    update = {feeStatus:'Returned', paid:'Returned', returnNote:note,
              returnConfirmedBy:CU.name||CU.email, returnConfirmedAt:new Date().toISOString()};
    action = 'Admin marked RETURNED to patient';
  }
  await _feeUpdate(id, col, update, action, amt, note);
  showToast('✅ Admin override saved'); _closeFee();
}

export async function applyAdminDiscount() {
  const id   = document.getElementById('fee-mo-id').value;
  const col  = document.getElementById('fee-mo-col').value;
  const note = document.getElementById('adm-note')?.value.trim() || '';
  const type = document.getElementById('adm-disc-type')?.value || 'percent';
  const val  = parseFloat(document.getElementById('adm-disc-val')?.value) || 0;
  const rec  = _getRec(id, col); if (!rec) return;
  const stdFee = rec.standardFee || rec.checkupFee || 0;
  let final = stdFee, discAmt = 0;
  if (type === 'free')         { final = 0; discAmt = stdFee; }
  else if (type === 'percent') { discAmt = Math.round(stdFee * val/100); final = stdFee - discAmt; }
  else                         { discAmt = Math.min(val, stdFee); final = stdFee - discAmt; }
  final = Math.max(0, final);
  const cuts = getDoctorCut(rec.doctorName, final);
  await _feeUpdate(id, col, {
    standardFee:stdFee, checkupFee:final, discountAmt:discAmt,
    discountType:type, discountReason:note, isFree:final===0,
    totalFee:final+(rec.treatmentCharges||0),
    hospitalCut:cuts.hospitalCut, doctorCut:cuts.doctorCut,
    feeStatus:final===0?'Free':(rec.feeStatus||'Pending')
  }, `Admin discount -₨${discAmt}`, discAmt, note);
  showToast(`💸 Discount applied — final ₨${final.toLocaleString()}`); _closeFee();
}

// ─── Intake discount helpers ──────────────────────────────
export function toggleIntakeDiscount() {
  const type = document.getElementById('i-discount-type')?.value;
  const vw   = document.getElementById('i-disc-val-wrap');
  const rw   = document.getElementById('i-disc-reason-wrap');
  const fw   = document.getElementById('i-final-fee-wrap');
  const lbl  = document.getElementById('i-disc-val-label');
  if (vw) vw.style.display = (type==='percent'||type==='fixed') ? 'block' : 'none';
  if (rw) rw.style.display = type !== 'none' ? 'block' : 'none';
  if (fw) fw.style.display = type !== 'none' ? 'block' : 'none';
  if (lbl) lbl.textContent = type==='percent' ? 'Discount %' : 'Discount Amount (PKR)';
  calcIntakeFee();
}

export function calcIntakeFee() {
  const stdFee  = parseFloat(document.getElementById('i-fee')?.value) || 0;
  const type    = document.getElementById('i-discount-type')?.value || 'none';
  const dVal    = parseFloat(document.getElementById('i-disc-val')?.value) || 0;
  const display = document.getElementById('i-final-fee-display');
  if (!display) return;
  let final = stdFee, discAmt = 0;
  if (type==='free')         { final = 0; discAmt = stdFee; }
  else if (type==='percent') { discAmt = Math.round(stdFee*dVal/100); final = stdFee-discAmt; }
  else if (type==='fixed')   { discAmt = Math.min(dVal,stdFee); final = stdFee-discAmt; }
  final = Math.max(0, final);
  display.textContent = '₨' + final.toLocaleString();
  display.style.color = final===0 ? 'var(--green)' : 'var(--teal-dark)';
}

export function getIntakeDiscountData() {
  const stdFee = parseFloat(document.getElementById('i-fee')?.value) || 0;
  const type   = document.getElementById('i-discount-type')?.value || 'none';
  const dVal   = parseFloat(document.getElementById('i-disc-val')?.value) || 0;
  const reason = document.getElementById('i-disc-reason')?.value.trim() || '';
  let final = stdFee, discAmt = 0;
  if (type==='free')         { final = 0; discAmt = stdFee; }
  else if (type==='percent') { discAmt = Math.round(stdFee*dVal/100); final = stdFee-discAmt; }
  else if (type==='fixed')   { discAmt = Math.min(dVal,stdFee); final = stdFee-discAmt; }
  return { standardFee:stdFee, checkupFee:Math.max(0,final), discountAmt:discAmt,
           discountType:type, discountReason:reason, isFree:Math.max(0,final)===0 };
}

// ─── Settlement ───────────────────────────────────────────
export function openSettleModal() {
  const d = document.getElementById('settle-date');
  if (d && !d.value) d.value = new Date().toISOString().slice(0,10);
  ['settle-result','settle-preview','settle-signoffs'].forEach(id => {
    const el = document.getElementById(id); if (el) el.innerHTML = '';
  });
  if (typeof openMo === 'function') openMo('mo-settle');
}

export function previewSettlement() {
  const dateStr = document.getElementById('settle-date')?.value;
  if (!dateStr) { showToast('Select a date', true); return; }
  const all      = allPatients();
  const records  = all.filter(p => {
    if (!p.timestamp) return false;
    const d = new Date(p.timestamp.seconds ? p.timestamp.seconds*1000 : p.timestamp);
    return d.toISOString().slice(0,10) === dateStr;
  });
  const toSettle = records.filter(p => ['Counter-Paid','Doctor-Collected','Paid'].includes(p.feeStatus));
  const prevEl   = document.getElementById('settle-preview');
  const signEl   = document.getElementById('settle-signoffs');

  if (!toSettle.length) {
    if (prevEl) prevEl.innerHTML = '<div class="alert as">✅ No outstanding collections for this date.</div>';
    return;
  }

  const byPerson = {};
  toSettle.forEach(p => {
    const by = p.feeCollectedBy || p.feeConfirmedBy || 'Unknown';
    if (!byPerson[by]) byPerson[by] = {records:[],total:0};
    byPerson[by].records.push(p);
    byPerson[by].total += p.feeCollectedAmount || p.checkupFee || 0;
  });
  const totalAmt = Object.values(byPerson).reduce((s,v)=>s+v.total,0);

  let html = `<div style="background:#f0faf9;border-radius:8px;padding:12px;font-size:13px;margin-bottom:10px;">
    <strong>${dateStr} · ${toSettle.length} records · Total: ₨${totalAmt.toLocaleString()}</strong></div>`;
  let signHtml = '';
  Object.entries(byPerson).forEach(([p,data]) => {
    html += `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);font-size:13px;">
      <span><strong>${p}</strong> · ${data.records.length} records</span>
      <span style="color:var(--teal-dark);font-weight:600;">₨${data.total.toLocaleString()}</span></div>`;
    const sid = p.replace(/[^a-z0-9]/gi,'_');
    signHtml += `<div style="margin-bottom:10px;padding:10px;background:#f9fafb;border-radius:8px;border:1px solid var(--border);">
      <div style="font-size:13px;font-weight:600;margin-bottom:6px;">${p} — ₨${data.total.toLocaleString()}</div>
      <input type="text" id="signoff_${sid}" placeholder="Signature / confirmation note for ${p}"
             style="width:100%;padding:8px 10px;border:1.5px solid var(--border);border-radius:7px;font-family:'DM Sans',sans-serif;font-size:13px;background:white;">
    </div>`;
  });
  if (prevEl) prevEl.innerHTML = html;
  if (signEl) signEl.innerHTML = signHtml ? `<div style="font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:8px;">Sign-off per Collector</div>` + signHtml : '';
}

export async function confirmSettlement() {
  const dateStr = document.getElementById('settle-date')?.value;
  const ref     = document.getElementById('settle-ref')?.value.trim() || 'Daily settlement';
  const resultEl = document.getElementById('settle-result');
  if (!dateStr) { showToast('Select a date', true); return; }
  const all      = allPatients();
  const records  = all.filter(p => {
    if (!p.timestamp) return false;
    const d = new Date(p.timestamp.seconds ? p.timestamp.seconds*1000 : p.timestamp);
    return d.toISOString().slice(0,10) === dateStr;
  });
  const toSettle = records.filter(p => ['Counter-Paid','Doctor-Collected','Paid'].includes(p.feeStatus));
  if (!toSettle.length) {
    if (resultEl) resultEl.innerHTML = '<div class="alert ae">No records to settle.</div>'; return;
  }
  if (resultEl) resultEl.innerHTML = `<div class="alert ai">⏳ Settling ${toSettle.length} records...</div>`;
  let done = 0, failed = 0;
  const totalAmt = toSettle.reduce((s,p)=>s+(p.feeCollectedAmount||p.checkupFee||0),0);
  for (const p of toSettle) {
    const col = p._fromToken ? 'tokens' : 'patients';
    const hist = (p.feeHistory||[]).concat([{
      action:'SETTLED — Daily Settlement', by:CU.name||CU.email,
      at:new Date().toISOString(), amount:p.feeCollectedAmount||p.checkupFee||0, note:ref
    }]);
    const ok = await safeWrite(() => restUpdate(col, p.id, {
      feeStatus:'Settled', paid:'Paid',
      settledDate:dateStr, settledBy:CU.name||CU.email,
      settledAt:new Date().toISOString(), receiptRef:ref, feeHistory:hist
    }));
    if (ok!==null) done++; else failed++;
    if (done%5===0 && resultEl) resultEl.innerHTML = `<div class="alert ai">⏳ ${done}/${toSettle.length}...</div>`;
  }
  await safeWrite(() => restAdd('settlements', {
    date:dateStr, settledBy:CU.name||CU.email, settledAt:serverTimestamp(),
    receiptRef:ref, totalAmount:totalAmt, recordCount:done, failedCount:failed
  }));
  if (resultEl) resultEl.innerHTML = failed
    ? `<div class="alert ae">⚠ Settled ${done}. ${failed} failed.</div>`
    : `<div class="alert as">✅ Settlement complete — ${done} records · ₨${totalAmt.toLocaleString()}</div>`;
  showToast(`✅ Settlement done — ₨${totalAmt.toLocaleString()}`);
  if (typeof closeMo === 'function') closeMo('mo-settle');
  renderSettlePage();
}

export function renderSettlePage() {
  const filter = document.getElementById('settle-filter')?.value || 'today';
  const now    = new Date();
  const all    = allPatients();
  let records  = [];
  if (filter === 'today') {
    const today = now.toISOString().slice(0,10);
    records = all.filter(p => { if (!p.timestamp) return false; const d = new Date(p.timestamp.seconds?p.timestamp.seconds*1000:p.timestamp); return d.toISOString().slice(0,10)===today; });
  } else if (filter === 'yesterday') {
    const yd = new Date(now); yd.setDate(yd.getDate()-1);
    const yds = yd.toISOString().slice(0,10);
    records = all.filter(p => { if (!p.timestamp) return false; const d = new Date(p.timestamp.seconds?p.timestamp.seconds*1000:p.timestamp); return d.toISOString().slice(0,10)===yds; });
  } else if (filter === 'week') {
    const wk = new Date(now); wk.setDate(wk.getDate()-7);
    records = all.filter(p => { if (!p.timestamp) return false; const d = new Date(p.timestamp.seconds?p.timestamp.seconds*1000:p.timestamp); return d>=wk; });
  } else {
    records = all.filter(p => !['Settled','Free','Returned'].includes(p.feeStatus)&&p.paid!=='Free');
  }

  const collected = records.filter(p=>['Paid','Counter-Paid','Doctor-Collected','Settled'].includes(p.feeStatus));
  const pending   = records.filter(p=>['Pending','Doctor-Pending','Deferred'].includes(p.feeStatus));
  const free      = records.filter(p=>p.isFree||p.paid==='Free'||p.feeStatus==='Free');
  const flags     = records.filter(p=>p.hasShortfall);
  const totalColl = collected.reduce((s,p)=>s+(p.feeCollectedAmount||p.checkupFee||0),0);
  const totalPend = pending.reduce((s,p)=>s+(p.checkupFee||0),0);
  const totalDisc = records.reduce((s,p)=>s+(p.discountAmt||0),0);

  const statsEl = document.getElementById('settle-stats-top');
  if (statsEl) statsEl.innerHTML =
    `<div class="sc gr"><div class="lb">Collected</div><div class="vl">₨${totalColl.toLocaleString()}</div><div class="sb">${collected.length} records</div></div>
     <div class="sc am"><div class="lb">Still Pending</div><div class="vl">₨${totalPend.toLocaleString()}</div><div class="sb">${pending.length} records</div></div>
     <div class="sc bl"><div class="lb">Free Patients</div><div class="vl">${free.length}</div><div class="sb">₨${totalDisc.toLocaleString()} waived</div></div>
     ${flags.length?`<div class="sc rd"><div class="lb">⚠ Shortfalls</div><div class="vl">${flags.length}</div></div>`:''}`;

  const outEl = document.getElementById('settle-outstanding');
  if (outEl) {
    const out = records.filter(p=>!['Settled','Paid','Counter-Paid','Free','Returned'].includes(p.feeStatus));
    outEl.innerHTML = !out.length
      ? '<div style="text-align:center;padding:24px;color:var(--muted);">✅ All fees cleared</div>'
      : '<table style="width:100%;font-size:13px;border-collapse:collapse;">'
        + '<thead><tr style="background:#f0faf9;"><th style="padding:8px;text-align:left;">Patient</th><th>Doctor</th><th>Status</th><th>Amount</th><th>Action</th></tr></thead><tbody>'
        + out.map(p => {
            const col = p._fromToken?'token':'patient';
            const badge = {'Pending':'<span class="badge br" style="font-size:10px;">Pending</span>','Doctor-Collected':'<span class="badge ba" style="font-size:10px;">With Doctor</span>','Counter-Instruct':'<span class="badge bb" style="font-size:10px;">Instructed</span>','Deferred':'<span class="badge bgr" style="font-size:10px;">Deferred</span>'}[p.feeStatus]||`<span class="badge br" style="font-size:10px;">${p.feeStatus}</span>`;
            return `<tr style="border-bottom:1px solid var(--border);">
              <td style="padding:8px;"><strong>${p.patientName}</strong></td>
              <td style="font-size:12px;">${p.doctorName||'—'}</td>
              <td>${badge}</td>
              <td style="font-weight:600;">₨${(p.checkupFee||0).toLocaleString()}</td>
              <td><button class="btn bo bsm" onclick="openFeeModal('${p.id}','${col}')">View</button></td>
            </tr>`;
          }).join('') + '</tbody></table>';
  }

  const discTbl = document.getElementById('settle-disc-tbl');
  const discCnt = document.getElementById('settle-disc-count');
  const discounted = records.filter(p=>p.discountAmt>0||p.isFree||p.paid==='Free');
  if (discCnt) discCnt.textContent = discounted.length?`${discounted.length} records · ₨${totalDisc.toLocaleString()} waived`:'None';
  if (discTbl) discTbl.innerHTML = discounted.map(p => {
    const ts = p.timestamp?new Date(p.timestamp.seconds?p.timestamp.seconds*1000:p.timestamp):new Date();
    return `<tr><td style="font-size:12px;">${ts.toLocaleDateString()}</td><td><strong>${p.patientName}</strong></td>
      <td style="font-size:12px;">${p.doctorName||'—'}</td>
      <td>₨${(p.standardFee||p.checkupFee||0).toLocaleString()}</td>
      <td style="color:var(--red);">-₨${(p.discountAmt||0).toLocaleString()} ${p.isFree?'(FREE)':''}</td>
      <td style="color:var(--green);font-weight:600;">₨${(p.checkupFee||0).toLocaleString()}</td>
      <td style="font-size:12px;">${p.discountReason||p.doctorFreeReason||'—'}</td>
      <td style="font-size:12px;">${p.discountApprovedBy||p.doctorFreeBy||p.createdByName||'—'}</td></tr>`;
  }).join('')||'<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:12px;">None</td></tr>';

  const flagCard = document.getElementById('settle-flags-card');
  const flagTbl  = document.getElementById('settle-flags-tbl');
  if (flagCard) flagCard.style.display = flags.length?'block':'none';
  if (flagTbl&&flags.length) flagTbl.innerHTML = flags.map(p => {
    const ts = p.timestamp?new Date(p.timestamp.seconds?p.timestamp.seconds*1000:p.timestamp):new Date();
    return `<tr><td style="font-size:12px;">${ts.toLocaleDateString()}</td><td><strong>${p.patientName}</strong></td>
      <td>₨${(p.feeCollectedAmount||p.checkupFee||0).toLocaleString()}</td>
      <td>₨${(p.feeConfirmedAmount||0).toLocaleString()}</td>
      <td style="color:var(--red);font-weight:600;">-₨${(p.feeShortfall||0).toLocaleString()}</td>
      <td style="font-size:12px;">${p.feeCollectedBy||'—'}</td></tr>`;
  }).join('');

  const histTbl = document.getElementById('settle-history-tbl');
  if (histTbl) {
    const settled = all.filter(p=>p.feeStatus==='Settled').slice(0,30);
    histTbl.innerHTML = settled.length ? settled.map(p =>
      `<tr><td style="font-size:12px;">${p.settledDate||'—'}</td>
       <td>${p.feeCollectedBy||p.feeConfirmedBy||'—'}</td>
       <td><span class="badge bgr">staff</span></td>
       <td>₨${(p.feeCollectedAmount||p.checkupFee||0).toLocaleString()}</td>
       <td style="font-size:12px;">${p.receiptRef||'—'}</td>
       <td style="font-size:12px;">${p.settledBy||'—'}</td>
       <td style="font-size:12px;color:var(--muted);">${p.settledAt?new Date(p.settledAt.seconds?p.settledAt.seconds*1000:p.settledAt).toLocaleTimeString('en-PK',{hour:'2-digit',minute:'2-digit'}):'—'}</td></tr>`
    ).join('') : '<tr><td colspan="7" style="text-align:center;color:var(--muted);padding:16px;">No settled records yet</td></tr>';
  }
}

// ─── Operation Bill ───────────────────────────────────────
export function openOpBill(patientId) {
  const rec = allPatients().find(p=>p.id===patientId);
  if (!rec) { showToast('Patient not found', true); return; }
  const usageLogs = [];
  CACHE.consumables.forEach(c => {
    if (c.usageLog) c.usageLog
      .filter(u=>u.patientId===patientId||u.patientName===rec.patientName)
      .forEach(u=>usageLogs.push({...u, itemName:c.name, unit:c.unit||'pcs', unitCost:c.unitCost||0}));
  });
  const ts = rec.timestamp?new Date(rec.timestamp.seconds?rec.timestamp.seconds*1000:rec.timestamp):new Date();
  let consumableTotal = 0;

  let billHtml = `<div id="op-bill-print">
    <div style="text-align:center;margin-bottom:16px;">
      <h2 style="font-family:'DM Serif Display',serif;color:var(--teal-dark);">🏥 Mazhar Surgical Hospital</h2>
      <p style="font-size:12px;color:var(--muted);">Procedure / Operation Bill</p>
    </div>
    <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:13px;padding:12px;background:var(--cream);border-radius:8px;margin-bottom:14px;">
      <div><strong>Patient:</strong> ${rec.patientName}</div>
      <div><strong>Date:</strong> ${ts.toLocaleDateString('en-PK')}</div>
      <div><strong>Doctor:</strong> ${rec.doctorName||'—'}</div>
      <div><strong>Token:</strong> ${rec.tokenId||rec.id.slice(-5)}</div>
      <div><strong>Procedure:</strong> ${rec.treatmentDesc||'—'}</div>
      <div><strong>Diagnosis:</strong> ${rec.diagnosis||'—'}</div>
    </div>
    <table style="width:100%;border-collapse:collapse;font-size:13px;margin-bottom:14px;">
      <thead>
        <tr style="background:var(--teal-dark);color:white;">
          <th style="padding:8px;text-align:left;">Item / Consumable</th>
          <th style="padding:8px;text-align:center;">Qty</th>
          <th style="padding:8px;text-align:right;">Unit Cost</th>
          <th style="padding:8px;text-align:right;">Total</th>
        </tr>
      </thead><tbody>`;

  if (usageLogs.length) {
    usageLogs.forEach(u => {
      const lt = (u.qty||1)*(u.unitCost||0);
      consumableTotal += lt;
      billHtml += `<tr style="border-bottom:1px solid var(--border);">
        <td style="padding:8px;">${u.itemName}${u.note?`<br><small style="color:var(--muted);">${u.note}</small>`:''}
          ${u.by?`<br><small style="color:var(--muted);">Used by: ${u.by}${u.purpose?' ('+u.purpose+')':''}</small>`:''}
        </td>
        <td style="padding:8px;text-align:center;">${u.qty||1} ${u.unit}</td>
        <td style="padding:8px;text-align:right;">₨${(u.unitCost||0).toLocaleString()}</td>
        <td style="padding:8px;text-align:right;font-weight:600;">₨${lt.toLocaleString()}</td>
      </tr>`;
    });
  } else {
    billHtml += `<tr><td colspan="4" style="padding:16px;text-align:center;color:var(--muted);">No consumables logged for this patient</td></tr>`;
  }

  billHtml += `</tbody></table>`;

  const checkupFee = rec.checkupFee || 0;
  const treatFee   = rec.treatmentCharges || 0;
  const discount   = rec.discountAmt || 0;
  const grandTotal = checkupFee + treatFee + consumableTotal - discount;
  const fs         = rec.feeStatus || rec.paid || 'Pending';

  billHtml += `<div style="background:#f0faf9;border-radius:8px;padding:12px 16px;">
    <table style="width:100%;font-size:13px;border-collapse:collapse;">
      <tr><td>Consultation Fee</td><td style="text-align:right;">₨${checkupFee.toLocaleString()}</td></tr>
      ${treatFee?`<tr><td>Procedure / Treatment</td><td style="text-align:right;">₨${treatFee.toLocaleString()}</td></tr>`:''}
      ${consumableTotal?`<tr><td>Consumables Used</td><td style="text-align:right;">₨${consumableTotal.toLocaleString()}</td></tr>`:''}
      ${discount?`<tr style="color:var(--red);"><td>Discount</td><td style="text-align:right;">-₨${discount.toLocaleString()}</td></tr>`:''}
      <tr style="border-top:2px solid var(--teal);font-size:15px;font-weight:700;">
        <td style="padding-top:8px;color:var(--teal-dark);">TOTAL</td>
        <td style="text-align:right;padding-top:8px;color:var(--teal-dark);">₨${grandTotal.toLocaleString()}</td>
      </tr>
    </table>
    <div style="margin-top:8px;font-size:12px;color:var(--muted);">
      Status: <strong style="color:${['Paid','Settled','Free'].includes(fs)?'var(--green)':'var(--red)'};">${fs}</strong>
      ${rec.feeCollectedBy?' · Collected by: '+rec.feeCollectedBy:''}
    </div>
  </div>
  <div style="text-align:center;font-size:11px;color:var(--muted);margin-top:14px;padding-top:12px;border-top:1px solid var(--border);">
    Mazhar Surgical Hospital · ${ts.toLocaleDateString('en-PK')} · Thank you
  </div></div>`;

  document.getElementById('op-bill-body').innerHTML = billHtml;
  if (typeof openMo === 'function') openMo('mo-op-bill');
}

export function printOpBill() {
  const el = document.getElementById('op-bill-print'); if (!el) return;
  const w = window.open('','_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>Bill</title>
    <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet">
    <style>*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'DM Sans',sans-serif;padding:20px;max-width:600px;margin:0 auto;}
    :root{--teal:#0a7c6e;--teal-dark:#065a50;--muted:#718096;--border:#e2e8f0;--cream:#f9f6f0;--red:#e53e3e;--green:#38a169;}
    h2{font-family:'DM Serif Display',serif;}table{width:100%;border-collapse:collapse;}
    th{background:#065a50;color:white;padding:8px;text-align:left;}td{padding:8px;border-bottom:1px solid #e2e8f0;}
    @media print{button{display:none;}}</style></head>
    <body>${el.outerHTML}</body></html>`);
  w.document.close();
  setTimeout(()=>w.print(),500);
}
