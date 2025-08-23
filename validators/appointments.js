import { DateTime } from "luxon";

const MINUTE_GRID = new Set([0, 30]); // change if you allow other steps
const SESSION_TYPES = new Set(["text", "voice", "video"]);

function parseLondonISO(iso) {
  const dt = DateTime.fromISO(iso, { zone: "Europe/London" });
  return dt.isValid ? dt : null;
}

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

export function validateBookSessionPayload(body) {
  assert(body, "Missing request body.");
  const {
    therapist_id,
    scheduled_at,
    session_type,
    session_duration,
    primary_concern,
    attended_before,
    session_goals,
    additional_details,
  } = body;

  assert(typeof therapist_id === "string" && therapist_id.length > 0, "therapist_id is required.");
  assert(typeof scheduled_at === "string" && scheduled_at.length > 0, "scheduled_at is required (ISO).");
  const dt = parseLondonISO(scheduled_at);
  assert(dt, "scheduled_at must be a valid ISO datetime.");
  assert(dt > DateTime.now().setZone("Europe/London"), "scheduled_at must be in the future.");
  assert(MINUTE_GRID.has(dt.minute), "scheduled_at must align to allowed minutes (:00 or :30).");

  if (session_type != null) {
    assert(SESSION_TYPES.has(session_type), "session_type must be one of text|voice|video.");
  }
  if (session_duration != null) {
    assert(Number.isInteger(session_duration) && session_duration > 0, "session_duration must be a positive integer.");
  }

  assert(typeof primary_concern === "string" && primary_concern.trim().length > 0, "primary_concern is required.");
  assert(typeof attended_before === "boolean", "attended_before must be boolean.");

  if (session_goals != null) {
    assert(Array.isArray(session_goals), "session_goals must be an array of strings.");
    for (const g of session_goals) assert(typeof g === "string", "session_goals must contain strings.");
  }
  if (additional_details != null) {
    assert(typeof additional_details === "string", "additional_details must be a string.");
  }
}

export function validateDecisionPayload(body) {
  assert(body && typeof body.decision === "string", "decision is required.");
  const d = body.decision.toLowerCase();
  assert(d === "accept" || d === "reject", "decision must be 'accept' or 'reject'.");
}

export function validateReschedulePayload(body) {
  assert(body && typeof body.newScheduledAt === "string", "newScheduledAt is required (ISO).");
  const dt = parseLondonISO(body.newScheduledAt);
  assert(dt, "newScheduledAt must be a valid ISO datetime.");
  assert(dt > DateTime.now().setZone("Europe/London"), "newScheduledAt must be in the future.");
  assert(MINUTE_GRID.has(dt.minute), "newScheduledAt must align to allowed minutes (:00 or :30).");
}
