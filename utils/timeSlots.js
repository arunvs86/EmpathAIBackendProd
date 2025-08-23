// utils/timeSlots.js
// keep your existing exports
export function splitOnDash(input = "") {
  // splits on hyphen, en dash, or em dash
  const m = String(input).split(/-|–|—/);
  if (m.length !== 2) return [null, null];
  return m.map(s => s.trim());
}

// NEW: normalize variants of dashes and pad times
export function normalizeSlot(slot = "") {
  const [s, e] = splitOnDash(slot);
  if (!s || !e) return slot.trim();
  const [h1, m1] = s.split(":").map(n => String(n).padStart(2, "0"));
  const [h2, m2] = e.split(":").map(n => String(n).padStart(2, "0"));
  return `${h1}:${m1}-${h2}:${m2}`;
}

// NEW: union arrays (unique, stable)
export function union(arrA = [], arrB = []) {
  const set = new Set([...arrA, ...arrB]);
  return Array.from(set);
}
