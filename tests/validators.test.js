import { describe, it, expect } from "vitest";
import { DateTime } from "luxon";
import {
  validateBookSessionPayload,
  validateDecisionPayload,
  validateReschedulePayload,
} from "../validators/appointments.js";

const futureAt = (hour, minute) =>
  DateTime.now()
    .setZone("Europe/London")
    .plus({ days: 7 })
    .set({ hour, minute, second: 0, millisecond: 0 })
    .toISO({ suppressMilliseconds: true, includeOffset: true });

const payload = (overrides = {}) => ({
  therapist_id: "a766194b-6036-4060-81b1-7c3f79c30426",
  scheduled_at: futureAt(9, 0),
  session_type: "video",
  primary_concern: "Anxiety",
  attended_before: false,
  ...overrides,
});

describe("validateBookSessionPayload", () => {
  it("accepts an hour-aligned start", () => {
    expect(() => validateBookSessionPayload(payload())).not.toThrow();
  });

  // The old MINUTE_GRID of [:00, :30] made most 50-minute therapists' slots
  // unbookable, since their start times land on :10, :20, :40 and :50.
  it.each([10, 20, 40, 50])("accepts a start time at :%i past the hour", (minute) => {
    expect(() => validateBookSessionPayload(payload({ scheduled_at: futureAt(9, minute) }))).not.toThrow();
  });

  it("still rejects a time in the past", () => {
    const past = DateTime.now().setZone("Europe/London").minus({ days: 1 }).toISO();
    expect(() => validateBookSessionPayload(payload({ scheduled_at: past }))).toThrow(/must be in the future/);
  });

  it("rejects a malformed datetime", () => {
    expect(() => validateBookSessionPayload(payload({ scheduled_at: "not-a-date" }))).toThrow(/valid ISO datetime/);
  });

  it("requires therapist_id and primary_concern", () => {
    expect(() => validateBookSessionPayload(payload({ therapist_id: "" }))).toThrow(/therapist_id is required/);
    expect(() => validateBookSessionPayload(payload({ primary_concern: "  " }))).toThrow(/primary_concern is required/);
  });

  it("requires attended_before to be a boolean", () => {
    expect(() => validateBookSessionPayload(payload({ attended_before: "yes" }))).toThrow(/must be boolean/);
  });

  it("rejects an unknown session_type", () => {
    expect(() => validateBookSessionPayload(payload({ session_type: "hologram" }))).toThrow(/text\|voice\|video/);
  });

  // Duration now comes from the therapist record, so whatever the client sends is ignored.
  it("ignores a client-supplied session_duration", () => {
    expect(() => validateBookSessionPayload(payload({ session_duration: 9999 }))).not.toThrow();
  });

  it("validates session_goals entries", () => {
    expect(() => validateBookSessionPayload(payload({ session_goals: ["Improve sleep"] }))).not.toThrow();
    expect(() => validateBookSessionPayload(payload({ session_goals: [42] }))).toThrow(/must contain strings/);
  });
});

describe("validateDecisionPayload", () => {
  it("accepts accept/reject in any case", () => {
    expect(() => validateDecisionPayload({ decision: "accept" })).not.toThrow();
    expect(() => validateDecisionPayload({ decision: "REJECT" })).not.toThrow();
  });

  it("rejects anything else", () => {
    expect(() => validateDecisionPayload({ decision: "maybe" })).toThrow(/must be 'accept' or 'reject'/);
    expect(() => validateDecisionPayload({})).toThrow(/decision is required/);
  });
});

describe("validateReschedulePayload", () => {
  it("accepts a future time on any minute", () => {
    expect(() => validateReschedulePayload({ newScheduledAt: futureAt(14, 50) })).not.toThrow();
  });

  it("rejects a past time", () => {
    const past = DateTime.now().setZone("Europe/London").minus({ hours: 2 }).toISO();
    expect(() => validateReschedulePayload({ newScheduledAt: past })).toThrow(/must be in the future/);
  });
});
