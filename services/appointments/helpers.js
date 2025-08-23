import TherapistAvailability from "../../models/TherapistAvailability.js";
import { DateTime } from "luxon";
import { splitOnDash } from "../../utils/timeSlots.js";

/**
 * Merge all TherapistAvailability rows into a single map:
 * { 'YYYY-MM-DD': ['HH:mm-HH:mm', ...] }
 * @param {string} therapistId  // Therapist PK (NOT user id)
 */
export async function mergeSlotsByDate(therapistId) {
  const recs = await TherapistAvailability.findAll({ where: { therapist_id: therapistId } });
  const master = {};
  for (const rec of recs) {
    const daySlots = rec.selected_time_slots || {};
    for (const [dateStr, slots] of Object.entries(daySlots)) {
      if (!Array.isArray(slots)) continue;
      if (!master[dateStr]) master[dateStr] = new Set();
      for (const s of slots) master[dateStr].add(s);
    }
  }
  const out = {};
  for (const [d, set] of Object.entries(master)) out[d] = Array.from(set);
  return out;
}

/**
 * Check if an ISO time (Europe/London) falls within any slot in slotsByDate.
 * Slots are strings like "09:00-10:00" (hyphen/en-dash/em-dash supported via splitOnDash).
 * @param {string} iso
 * @param {Record<string, string[]>} slotsByDate
 * @returns {boolean}
 */
export function isInAnySlot(iso, slotsByDate) {
  const dt = DateTime.fromISO(iso, { zone: "Europe/London" });
  if (!dt.isValid) return false;

  const dateKey = dt.toFormat("yyyy-LL-dd");
  const minutes = dt.hour * 60 + dt.minute;
  const slots = slotsByDate[dateKey] || [];

  return slots.some((slotStr) => {
    const [startStr, endStr] = splitOnDash(slotStr);
    if (!startStr || !endStr) return false;

    const [h1, m1] = startStr.split(":").map(Number);
    const [h2, m2] = endStr.split(":").map(Number);
    if ([h1, m1, h2, m2].some(Number.isNaN)) return false;

    const start = h1 * 60 + m1;
    const end = h2 * 60 + m2;
    return minutes >= start && minutes < end;
  });
}
