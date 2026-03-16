// ============================================================
// datamgmt.js — Admin data management: preview & delete records
// ============================================================

import { restDelete } from './firebase.js';
import { CACHE } from './state.js';
import { safeWrite, showToast } from './ui.js';

// ── Toggle custom date input ──────────────────────────────
export function toggleDelCustom() {
  const range = document.getElementById('del-range')?.value;
  const wrap  = document.getElementById('del-custom-wrap');
  if (wrap) wrap.style.display = range === 'custom' ? 'block' : 'none';
}

// ── Calculate the cutoff date from the selected range ─────
function getCutoff() {
  const range = document.getElementById('del-range')?.value;
  const now   = new Date();

  if (range === 'all') return new Date('2099-01-01'); // matches everything

  if (range === 'custom') {
    const v = document.getElementById('del-custom-date')?.value;
    if (!v) return null;
    return new Date(v);
  }

  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (range === 'prev-month') {
    // Everything before the 1st of current month
    return new Date(now.getFullYear(), now.getMonth(), 1);
  }
  if (range === 'older-3')  { d.setMonth(d.getMonth() - 3);  return d; }
  if (range === 'older-6')  { d.setMonth(d.getMonth() - 6);  return d; }
  if (range === 'older-12') { d.setMonth(d.getMonth() - 12); return d; }
  return null;
}

// ── Get the timestamp of a record as a Date ───────────────
function getRecordDate(rec) {
  if (!rec.timestamp) return null;
  if (rec.timestamp.seconds) return new Date(rec.timestamp.seconds * 1000);
  if (typeof rec.timestamp === 'string') return new Date(rec.timestamp);
  if (rec.date) return new Date(rec.date);
  return null;
}

// ── Get records that will be deleted ─────────────────────
function getTargetRecords() {
  const target = document.getElementById('del-target')?.value;
  const cutoff = getCutoff();
  if (!cutoff) return { tokens: [], patients: [], expenses: [] };

  const inRange = rec => {
    const d = getRecordDate(rec);
    return d && d < cutoff;
  };

  return {
    tokens:   (target === 'tokens'   || target === 'both') ? CACHE.tokens.filter(inRange)   : [],
    patients: (target === 'patients' || target === 'both') ? CACHE.patients.filter(inRange) : [],
    expenses: (target === 'expenses')                      ? CACHE.expenses.filter(inRange) : [],
  };
}

// ── Preview — show what will be deleted without deleting ──
export function previewDeletion() {
  const range   = document.getElementById('del-range')?.value;
  const cutoff  = getCutoff();
  const preview = document.getElementById('del-preview');
  if (!preview) return;

  if (range === 'custom' && !cutoff) {
    preview.innerHTML = '<span style="color:var(--red);">Please select a date first.</span>';
    return;
  }

  const recs = getTargetRecords();
  const total = recs.tokens.length + recs.patients.length + recs.expenses.length;

  if (total === 0) {
    preview.innerHTML = '<span style="color:var(--green);">✅ No records match this criteria — nothing to delete.</span>';
    return;
  }

  const cutoffStr = range === 'all' ? 'ALL records' : `records before ${cutoff.toLocaleDateString('en-PK')}`;

  let html = `<strong>${total} record(s) will be deleted</strong> — ${cutoffStr}<br><br>`;

  if (recs.tokens.length) {
    html += `<span style="color:var(--amber);">⏳ ${recs.tokens.length} token/queue records</span><br>`;
    const sample = recs.tokens.slice(0, 3).map(t => `${t.tokenId || t.id.slice(-5)} · ${t.patientName}`).join(', ');
    if (recs.tokens.length > 0) html += `<span style="color:var(--muted);font-size:11px;">e.g. ${sample}${recs.tokens.length > 3 ? ` …+${recs.tokens.length - 3} more` : ''}</span><br>`;
  }
  if (recs.patients.length) {
    html += `<span style="color:var(--blue);">🗂 ${recs.patients.length} patient billing records</span><br>`;
    const sample = recs.patients.slice(0, 3).map(p => `${p.patientName}`).join(', ');
    if (recs.patients.length > 0) html += `<span style="color:var(--muted);font-size:11px;">e.g. ${sample}${recs.patients.length > 3 ? ` …+${recs.patients.length - 3} more` : ''}</span><br>`;
  }
  if (recs.expenses.length) {
    const totalAmt = recs.expenses.reduce((s, e) => s + (e.amount || 0), 0);
    html += `<span style="color:var(--red);">💸 ${recs.expenses.length} expense records (₨${totalAmt.toLocaleString()} total)</span>`;
  }

  preview.innerHTML = html;
}

// ── Confirm and execute deletion ──────────────────────────
export async function confirmAndDelete() {
  const range  = document.getElementById('del-range')?.value;
  const cutoff = getCutoff();
  const result = document.getElementById('del-result');

  if (range === 'custom' && !cutoff) {
    if (result) result.innerHTML = '<div class="alert ae">Please select a date first.</div>';
    return;
  }

  const recs  = getTargetRecords();
  const total = recs.tokens.length + recs.patients.length + recs.expenses.length;

  if (total === 0) {
    if (result) result.innerHTML = '<div class="alert as">No matching records found.</div>';
    return;
  }

  // Double confirmation for large or all-records deletion
  const confirmMsg = range === 'all'
    ? `⚠ PERMANENT DELETE\n\nThis will delete ALL ${total} records permanently.\nThis cannot be undone!\n\nType DELETE to confirm:`
    : `Delete ${total} record(s) before ${cutoff.toLocaleDateString('en-PK')}?\n\nThis cannot be undone. Type DELETE to confirm:`;

  const typed = window.prompt(confirmMsg);
  if (typed !== 'DELETE') {
    if (result) result.innerHTML = '<div class="alert ae">Deletion cancelled — you must type DELETE exactly to confirm.</div>';
    return;
  }

  if (result) result.innerHTML = '<div class="alert ai">⏳ Deleting records...</div>';

  let deleted = 0;
  let failed  = 0;

  // Delete in batches, show progress
  const allToDelete = [
    ...recs.tokens.map(r => ({ col: 'tokens', id: r.id })),
    ...recs.patients.map(r => ({ col: 'patients', id: r.id })),
    ...recs.expenses.map(r => ({ col: 'expenses', id: r.id })),
  ];

  for (let i = 0; i < allToDelete.length; i++) {
    const { col, id } = allToDelete[i];
    try {
      await restDelete(col, id);
      deleted++;
      // Update progress every 5 records
      if (i % 5 === 0 && result) {
        result.innerHTML = `<div class="alert ai">⏳ Deleting... ${deleted}/${total} done</div>`;
      }
    } catch (err) {
      console.error(`Failed to delete ${col}/${id}:`, err.message);
      failed++;
    }
  }

  // Reset preview
  const preview = document.getElementById('del-preview');
  if (preview) preview.innerHTML = '';

  const msg = failed > 0
    ? `<div class="alert ae">⚠ Deleted ${deleted} records. ${failed} failed — try again.</div>`
    : `<div class="alert as">✅ Successfully deleted ${deleted} record(s).</div>`;

  if (result) result.innerHTML = msg;
  showToast(`🗑 Deleted ${deleted} records`);
}
