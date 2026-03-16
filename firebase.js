// ============================================================
// firebase.js — Firebase Auth + Firestore REST API
// All Firestore calls use plain HTTPS (no WebSocket).
// This works on any network including Pakistani ISPs.
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged,
  createUserWithEmailAndPassword, updatePassword
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

const PROJECT = "mazhar-surgical-hospital";
const APIKEY  = "AIzaSyDPhtAfAqY2M-kVvEVA64J9YSLwbHETYsI";
const BASE    = `https://firestore.googleapis.com/v1/projects/${PROJECT}/databases/(default)/documents`;

const app  = initializeApp({
  apiKey:            APIKEY,
  authDomain:        `${PROJECT}.firebaseapp.com`,
  projectId:         PROJECT,
  storageBucket:     `${PROJECT}.firebasestorage.app`,
  messagingSenderId: "912311666081",
  appId:             "1:912311666081:web:45081f820b75761243b7e0"
});

export const auth = getAuth(app);
export { signInWithEmailAndPassword, signOut, onAuthStateChanged,
         createUserWithEmailAndPassword, updatePassword };

// ── Firestore value converters ────────────────────────────
function fromFV(fv) {
  if (!fv) return null;
  if ('stringValue'    in fv) return fv.stringValue;
  if ('integerValue'   in fv) return Number(fv.integerValue);
  if ('doubleValue'    in fv) return fv.doubleValue;
  if ('booleanValue'   in fv) return fv.booleanValue;
  if ('nullValue'      in fv) return null;
  if ('timestampValue' in fv) return { seconds: Math.floor(new Date(fv.timestampValue).getTime() / 1000) };
  if ('mapValue'       in fv) return fromFields(fv.mapValue.fields || {});
  if ('arrayValue'     in fv) return (fv.arrayValue.values || []).map(fromFV);
  return null;
}
function fromFields(fields) {
  const obj = {};
  Object.keys(fields || {}).forEach(k => { obj[k] = fromFV(fields[k]); });
  return obj;
}
function toFV(v) {
  if (v === null || v === undefined)  return { nullValue: null };
  if (typeof v === 'boolean')         return { booleanValue: v };
  if (typeof v === 'number')          return Number.isInteger(v) ? { integerValue: String(v) } : { doubleValue: v };
  if (typeof v === 'string')          return { stringValue: v };
  if (v && v._serverTimestamp)        return { timestampValue: new Date().toISOString() };
  if (Array.isArray(v))               return { arrayValue: { values: v.map(toFV) } };
  if (typeof v === 'object')          return { mapValue: { fields: toFields(v) } };
  return { stringValue: String(v) };
}
function toFields(obj) {
  const f = {};
  Object.keys(obj).forEach(k => { f[k] = toFV(obj[k]); });
  return f;
}

// ── Auth token helper ─────────────────────────────────────
async function getToken() {
  const user = auth.currentUser;
  if (!user) throw new Error('Not logged in');
  return user.getIdToken();
}

// ── REST operations ───────────────────────────────────────

/** Get a single document. Returns null if not found. */
export async function restGet(colPath, docId) {
  const token = await getToken();
  const r = await fetch(`${BASE}/${colPath}/${docId}?key=${APIKEY}`, {
    headers: { Authorization: `Bearer ${token}` }
  });
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GET ${colPath}/${docId} failed: ${r.status}`);
  const data = await r.json();
  return Object.assign({ id: docId }, fromFields(data.fields || {}));
}

/** Get all documents in a collection (handles pagination). */
export async function restGetAll(colPath) {
  const token = await getToken();
  const docs = [];
  let pageToken = null;
  do {
    const url = `${BASE}/${colPath}?key=${APIKEY}` + (pageToken ? `&pageToken=${pageToken}` : '');
    const r = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!r.ok) throw new Error(`GETALL ${colPath} failed: ${r.status}`);
    const data = await r.json();
    (data.documents || []).forEach(d => {
      const id = d.name.split('/').pop();
      docs.push(Object.assign({ id }, fromFields(d.fields || {})));
    });
    pageToken = data.nextPageToken;
  } while (pageToken);
  return docs;
}

/** Create a new document with auto-generated ID. Returns the new ID. */
export async function restAdd(colPath, obj) {
  const token = await getToken();
  const r = await fetch(`${BASE}/${colPath}?key=${APIKEY}`, {
    method:  'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ fields: toFields(obj) })
  });
  if (!r.ok) throw new Error(`ADD ${colPath} failed: ${r.status} ${await r.text()}`);
  const data = await r.json();
  return data.name.split('/').pop();
}

/** Overwrite an entire document by ID. */
export async function restSet(colPath, docId, obj) {
  const token = await getToken();
  const r = await fetch(`${BASE}/${colPath}/${docId}?key=${APIKEY}`, {
    method:  'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ fields: toFields(obj) })
  });
  if (!r.ok) throw new Error(`SET failed: ${r.status} ${await r.text()}`);
}

/** Update specific fields of a document (field mask PATCH). */
export async function restUpdate(colPath, docId, obj) {
  const token = await getToken();
  const fields = toFields(obj);
  const mask   = Object.keys(fields).map(k => `updateMask.fieldPaths=${k}`).join('&');
  const r = await fetch(`${BASE}/${colPath}/${docId}?key=${APIKEY}&${mask}`, {
    method:  'PATCH',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify({ fields })
  });
  if (!r.ok) throw new Error(`UPDATE failed: ${r.status} ${await r.text()}`);
}

/** Delete a document by ID. */
export async function restDelete(colPath, docId) {
  const token = await getToken();
  const r = await fetch(`${BASE}/${colPath}/${docId}?key=${APIKEY}`, {
    method:  'DELETE',
    headers: { Authorization: `Bearer ${token}` }
  });
  if (!r.ok) throw new Error(`DELETE failed: ${r.status}`);
}

/** Sentinel for server-side timestamp. */
export function serverTimestamp() { return { _serverTimestamp: true }; }
