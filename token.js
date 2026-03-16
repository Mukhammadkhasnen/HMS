// ============================================================
// token.js — Patient token generation and printing
// ============================================================

import { CACHE } from './state.js';
import { showPage } from './ui.js';

/**
 * Navigate to the ticket page and render the token for a given record.
 * type: 'token' (from tokens collection) | 'patient' (from patients collection)
 */
export function viewToken(id, type) {
  const rec = type === 'token'
    ? CACHE.tokens.find(x => x.id === id)
    : CACHE.patients.find(x => x.id === id);
  if (!rec) return;
  showPage('ticket');
  document.getElementById('tkcon').innerHTML = genToken(rec, type);
}

/**
 * Build the full HTML for a patient token / consultation slip.
 */
export function genToken(t, type) {
  const isT    = type === 'token';
  const num    = isT ? t.tokenId : (t.tokenId || t.id.slice(-5));
  const ts     = t.timestamp ? new Date(t.timestamp.seconds ? t.timestamp.seconds * 1000 : t.timestamp) : new Date();
  const timeStr = ts.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  const dateStr = ts.toLocaleDateString('en-PK',  { day: 'numeric', month: 'short', year: 'numeric' });

  let h = `<div class="tcard" id="the-token">`;

  // ── Header ──────────────────────────────────────────────
  h += `<div class="ttop">
    <h2>🏥 Mazhar Surgical Hospital</h2>
    <p>Patient Consultation Token</p>
    <div class="tnum">${num}</div>
    <div class="ttime">📅 ${dateStr} 🕐 ${timeStr}</div>
  </div>`;

  h += `<div class="tbody">`;

  // ── Patient details ──────────────────────────────────────
  h += `<div class="tsec" style="margin-top:0;border-top:none;padding-top:0;">Patient Details</div>`;
  h += row('Name',     t.patientName);
  if (t.age || t.gender) h += row('Age / Gender', `${t.age || '?'} ${t.gender || ''}`);
  if (t.phone)            h += row('Phone',        t.phone);
  h += row('Doctor',   t.doctorName);
  h += row('Complaint',t.checkFor);
  if (t.symptomDuration) h += row('Since', t.symptomDuration);

  // ── Vitals ───────────────────────────────────────────────
  if (t.bp || t.pulse || t.temperature) {
    h += `<div class="tsec">Vital Signs</div><div class="vgrid">`;
    if (t.bp)          h += vbox(t.bp, 'BP');
    if (t.pulse)       h += vbox(t.pulse, 'Pulse (bpm)');
    if (t.temperature) h += vbox(t.temperature + '°', 'Temp (°F)');
    if (t.spo2)        h += vbox(t.spo2 + '%', 'SpO₂');
    if (t.weight)      h += vbox(t.weight + ' kg', 'Weight');
    if (t.height)      h += vbox(t.height + ' cm', 'Height');
    h += `</div>`;
  }

  // ── Medical history ──────────────────────────────────────
  if (t.allergies || t.medications || t.medHistory) {
    h += `<div class="tsec">Medical History</div>`;
    if (t.allergies)   h += row('<span style="color:var(--red);">⚠ Allergies</span>',  `<span style="color:var(--red);">${t.allergies}</span>`);
    if (t.medications) h += row('Medications', t.medications);
    if (t.medHistory)  h += row('Past History', t.medHistory);
  }

  // ── Nurse notes ──────────────────────────────────────────
  if (t.notes) h += `<div class="tsec">Nurse Notes</div><div style="font-size:13px;padding:5px 0;">${t.notes}</div>`;

  // ── Prescription box ─────────────────────────────────────
  h += `<div class="rxbox"><div class="rxt">℞ — Doctor's Prescription</div>`;
  if (t.prescription) {
    if (t.diagnosis) h += `<div style="font-size:12px;color:var(--muted);margin-bottom:5px;">Dx: <strong>${t.diagnosis}</strong></div>`;
    h += `<div class="rxc">${t.prescription}</div>`;
    if (t.rxAdvice)  h += `<div style="font-size:12px;color:var(--muted);margin-top:7px;padding-top:6px;border-top:1px dashed #ddd;">Advice: ${t.rxAdvice}</div>`;
    if (t.rxFollowup)h += `<div style="font-size:12px;color:var(--muted);margin-top:3px;">Follow-up: ${t.rxFollowup}</div>`;
  } else {
    h += `<div style="font-size:12px;color:var(--muted);font-style:italic;">Awaiting prescription...</div>`;
  }
  h += `</div>`;

  // ── Billing (full records only) ───────────────────────────
  if (!isT) {
    h += `<div class="tsec">Billing</div>`;
    h += row('Checkup Fee', `₨${(t.checkupFee || 0).toLocaleString()}`);
    if (t.indoor === 'Yes') h += row('Treatment Charges', `₨${(t.treatmentCharges || 0).toLocaleString()}`);
    h += `<div class="trow" style="border-top:2px solid var(--teal);margin-top:4px;padding-top:5px;">
            <span class="tl"><strong>Total</strong></span>
            <span class="tv" style="font-size:15px;color:var(--teal-dark);">₨${(t.totalFee || 0).toLocaleString()}</span>
          </div>`;

    // Fee status
    const fs  = t.feeStatus || t.paid || 'Pending';
    const fsc = (fs === 'Paid' || fs === 'Counter-Paid') ? 'var(--green)' : fs === 'Doctor-Collected' ? '#d69e2e' : 'var(--red)';
    let feeHtml = `<span style="color:${fsc};font-weight:600;">${fs}</span>`;
    if (t.feeCollectedBy) feeHtml += `<br><span style="font-size:11px;color:var(--muted);">By: ${t.feeCollectedBy}</span>`;
    if (t.feeNote)        feeHtml += `<br><span style="font-size:11px;color:var(--muted);">Note: ${t.feeNote}</span>`;
    h += row('Fee Status', feeHtml);

    // Fee history
    if (t.feeHistory && t.feeHistory.length > 0) {
      h += `<div class="trow" style="flex-direction:column;align-items:flex-start;">
              <span class="tl" style="margin-bottom:6px;">Fee History</span>`;
      t.feeHistory.forEach(fh => {
        const fat = fh.at ? new Date(fh.at).toLocaleString('en-PK', { hour:'2-digit', minute:'2-digit', day:'numeric', month:'short' }) : '';
        h += `<div style="font-size:11px;color:var(--muted);padding:3px 0;border-bottom:1px solid var(--border);width:100%;">
                ${fat} — <strong>${fh.action}</strong> by ${fh.by}
                ${fh.amount ? ` · ₨${Number(fh.amount).toLocaleString()}` : ''}
                ${fh.note   ? ` · ${fh.note}` : ''}
              </div>`;
      });
      h += `</div>`;
    }
  }

  h += `</div>`; // .tbody
  h += `<div class="tfoot">Mazhar Surgical Hospital · ${num} · ${dateStr} ${timeStr}<br>Present this slip to the doctor</div>`;
  h += `</div>`; // .tcard
  return h;
}

/** Open a new window and print the token. */
export function printToken() {
  const el = document.getElementById('the-token'); if (!el) return;
  const w  = window.open('', '_blank');
  w.document.write(`<!DOCTYPE html><html><head><title>Token</title>
    <link href="https://fonts.googleapis.com/css2?family=DM+Serif+Display&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet">
    <style>
      *{box-sizing:border-box;margin:0;padding:0;}
      body{font-family:'DM Sans',sans-serif;background:#fff;display:flex;justify-content:center;padding:24px;}
      :root{--teal:#0a7c6e;--teal-dark:#065a50;--muted:#718096;--slate:#2d3748;--border:#e2e8f0;--green:#38a169;--red:#e53e3e;--amber:#d69e2e;}
      .tcard{border:2px solid var(--teal);border-radius:14px;max-width:400px;width:100%;overflow:hidden;}
      .ttop{background:linear-gradient(135deg,#065a50,#0a7c6e);color:white;padding:18px 22px;text-align:center;}
      .ttop h2{font-family:'DM Serif Display',serif;font-size:19px;}
      .ttop p{font-size:11px;opacity:.8;margin-top:2px;}
      .tnum{font-size:54px;font-weight:700;font-family:'DM Serif Display',serif;margin:6px 0;letter-spacing:2px;}
      .ttime{font-size:13px;opacity:.85;background:rgba(255,255,255,.15);display:inline-block;padding:3px 12px;border-radius:20px;}
      .tbody{padding:18px 22px;}
      .trow{display:flex;justify-content:space-between;align-items:flex-start;padding:6px 0;border-bottom:1px dotted #e2e8f0;font-size:13px;}
      .trow:last-child{border-bottom:none;}
      .tl{color:var(--muted);font-size:12px;min-width:100px;}
      .tv{font-weight:600;color:var(--slate);text-align:right;flex:1;}
      .tsec{font-size:10px;text-transform:uppercase;letter-spacing:1px;color:var(--teal);font-weight:700;margin:12px 0 5px;padding-top:9px;border-top:1px solid var(--border);}
      .vgrid{display:grid;grid-template-columns:repeat(3,1fr);gap:7px;margin:9px 0;}
      .vb{background:#f0faf9;border-radius:7px;padding:9px;text-align:center;}
      .vv{font-size:15px;font-weight:700;color:#065a50;}
      .vl2{font-size:10px;color:var(--muted);margin-top:2px;}
      .rxbox{background:#fffbf0;border:1px dashed var(--amber);border-radius:9px;padding:13px;margin-top:11px;min-height:75px;}
      .rxt{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:1px;color:var(--amber);margin-bottom:5px;}
      .rxc{font-size:13px;color:var(--slate);white-space:pre-wrap;}
      .tfoot{background:#f9f6f0;padding:11px 22px;text-align:center;font-size:11px;color:var(--muted);border-top:1px solid var(--border);}
    </style></head>
    <body>${el.outerHTML}</body></html>`);
  w.document.close();
  setTimeout(() => w.print(), 600);
}

// ── Helpers ───────────────────────────────────────────────
function row(label, value) {
  return `<div class="trow"><span class="tl">${label}</span><span class="tv">${value}</span></div>`;
}
function vbox(value, label) {
  return `<div class="vb"><div class="vv">${value}</div><div class="vl2">${label}</div></div>`;
}
