import { describe, it, expect, vi, beforeEach } from "vitest";

const fakeTx = { LOCK: { UPDATE: "UPDATE" }, afterCommit: (fn) => fn() };

vi.mock("../config/postgres.js", () => ({
  sequelize: { transaction: vi.fn(async (cb) => cb(fakeTx)) },
  connectPostgres: vi.fn(),
}));
vi.mock("../models/Appointments.js", () => ({
  default: { findAll: vi.fn(() => []), findOne: vi.fn(), update: vi.fn(), count: vi.fn(() => 0) },
}));
vi.mock("../models/Therapist.js", () => ({
  default: { findOne: vi.fn(), findByPk: vi.fn(), findAll: vi.fn(), belongsTo: vi.fn() },
}));
vi.mock("../models/TherapistAvailability.js", () => ({
  default: { findOne: vi.fn(), findAll: vi.fn(), create: vi.fn() },
}));
vi.mock("../models/User.js", () => ({
  default: { findOne: vi.fn(), findByPk: vi.fn(), findAll: vi.fn() },
}));
vi.mock("../services/email/emailService.js", () => ({ default: {} }));

const { default: availabilityService } = await import(
  "../services/therapists/therapistAvailabilityService.js"
);
const { default: Therapist } = await import("../models/Therapist.js");
const { default: TherapistAvailability } = await import("../models/TherapistAvailability.js");

beforeEach(() => {
  vi.clearAllMocks();
  Therapist.findOne.mockResolvedValue({ id: "t1", user_id: "tu1" });
});

describe("setAvailability — silent data loss (the original report)", () => {
  // A date with no slots was dropped by mergeTimeSlots, yet the API answered
  // "Availability updated successfully!" — the therapist saw success and no data.
  it("refuses a date that carries no time slots instead of reporting success", async () => {
    const existing = { selected_dates: ["2026-10-01"], selected_time_slots: { "2026-10-01": ["19:00-20:00"] }, update: vi.fn() };
    TherapistAvailability.findOne.mockResolvedValue(existing);

    await expect(
      availabilityService.setAvailability("tu1", {
        selected_dates: ["2026-10-20"],
        selected_time_slots: { "2026-10-20": [] },
      })
    ).rejects.toThrow(/Add at least one time slot for: 2026-10-20/);

    expect(existing.update).not.toHaveBeenCalled();
  });

  it("names every incomplete date", async () => {
    TherapistAvailability.findOne.mockResolvedValue({ selected_dates: [], selected_time_slots: {}, update: vi.fn() });

    await expect(
      availabilityService.setAvailability("tu1", {
        selected_time_slots: { "2026-10-21": [], "2026-10-20": [] },
      })
    ).rejects.toThrow(/2026-10-20, 2026-10-21/);
  });

  it("rejects a mixed payload rather than silently saving only the good part", async () => {
    const existing = { selected_dates: [], selected_time_slots: {}, update: vi.fn() };
    TherapistAvailability.findOne.mockResolvedValue(existing);

    await expect(
      availabilityService.setAvailability("tu1", {
        selected_time_slots: { "2026-10-21": ["19:00-20:00"], "2026-10-20": [] },
      })
    ).rejects.toThrow(/Add at least one time slot for: 2026-10-20/);

    expect(existing.update).not.toHaveBeenCalled();
  });

  // The create path used to store the empty date while the update path dropped it.
  it("applies the same rule on a therapist's very first save", async () => {
    TherapistAvailability.findOne.mockResolvedValue(null);

    await expect(
      availabilityService.setAvailability("tu1", { selected_time_slots: { "2026-10-20": [] } })
    ).rejects.toThrow(/Add at least one time slot/);

    expect(TherapistAvailability.create).not.toHaveBeenCalled();
  });
});

describe("setAvailability — valid saves still work", () => {
  it("creates a record on a first save", async () => {
    TherapistAvailability.findOne.mockResolvedValue(null);

    const res = await availabilityService.setAvailability("tu1", {
      selected_time_slots: { "2026-10-20": ["19:00-20:00"] },
    });

    expect(TherapistAvailability.create).toHaveBeenCalledWith(
      expect.objectContaining({
        therapist_id: "t1",
        selected_dates: ["2026-10-20"],
        selected_time_slots: { "2026-10-20": ["19:00-20:00"] },
      })
    );
    expect(res.message).toMatch(/created successfully/);
  });

  it("merges a new date into an existing record without losing the old ones", async () => {
    const existing = {
      selected_dates: ["2026-10-01"],
      selected_time_slots: { "2026-10-01": ["19:00-20:00"] },
      update: vi.fn(),
    };
    TherapistAvailability.findOne.mockResolvedValue(existing);

    const res = await availabilityService.setAvailability("tu1", {
      selected_time_slots: { "2026-10-20": ["09:00-09:50"] },
    });

    const [values] = existing.update.mock.calls[0];
    expect(values.selected_time_slots).toEqual({
      "2026-10-01": ["19:00-20:00"],
      "2026-10-20": ["09:00-09:50"],
    });
    expect(values.selected_dates).toEqual(expect.arrayContaining(["2026-10-01", "2026-10-20"]));
    expect(res.message).toMatch(/updated successfully/);
  });

  it("adds a slot to a date that already has one", async () => {
    const existing = {
      selected_dates: ["2026-10-01"],
      selected_time_slots: { "2026-10-01": ["09:00-10:00"] },
      update: vi.fn(),
    };
    TherapistAvailability.findOne.mockResolvedValue(existing);

    await availabilityService.setAvailability("tu1", {
      selected_time_slots: { "2026-10-01": ["11:00-12:00"] },
    });

    const [values] = existing.update.mock.calls[0];
    expect(values.selected_time_slots["2026-10-01"]).toEqual(["09:00-10:00", "11:00-12:00"]);
  });

  it("does not duplicate a slot that is already stored", async () => {
    const existing = {
      selected_dates: ["2026-10-01"],
      selected_time_slots: { "2026-10-01": ["09:00-10:00"] },
      update: vi.fn(),
    };
    TherapistAvailability.findOne.mockResolvedValue(existing);

    await availabilityService.setAvailability("tu1", {
      selected_time_slots: { "2026-10-01": ["09:00-10:00"] },
    });

    const [values] = existing.update.mock.calls[0];
    expect(values.selected_time_slots["2026-10-01"]).toEqual(["09:00-10:00"]);
  });

  it("accepts an empty payload as a no-op", async () => {
    const existing = { selected_dates: [], selected_time_slots: {}, update: vi.fn() };
    TherapistAvailability.findOne.mockResolvedValue(existing);

    await expect(availabilityService.setAvailability("tu1", {})).resolves.toBeTruthy();
  });

  it("fails clearly when the user has no therapist record", async () => {
    Therapist.findOne.mockResolvedValue(null);

    await expect(
      availabilityService.setAvailability("nobody", { selected_time_slots: { "2026-10-20": ["09:00-10:00"] } })
    ).rejects.toThrow(/Therapist not found for this user/);
  });
});
