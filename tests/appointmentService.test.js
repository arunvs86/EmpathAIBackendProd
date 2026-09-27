import { describe, it, expect, vi, beforeEach } from "vitest";

// Keep the suite hermetic: no Sequelize instance, no database, no SMTP, no HTTP.
const fakeTx = { LOCK: { UPDATE: "UPDATE" }, afterCommit: (fn) => fn() };

vi.mock("../config/postgres.js", () => ({
  sequelize: { transaction: vi.fn(async (cb) => cb(fakeTx)) },
  connectPostgres: vi.fn(),
}));
vi.mock("../models/Appointments.js", () => ({
  default: { findAll: vi.fn(), findOne: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
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
vi.mock("../services/googleCalendarService.js", () => ({ createGoogleMeetEvent: vi.fn() }));
vi.mock("../services/therapists/therapistAvailabilityService.js", () => ({
  default: { deleteTimeSlot: vi.fn() },
}));
vi.mock("axios", () => ({ default: { post: vi.fn() } }));

const { default: appointmentService, overlapsExisting } = await import(
  "../services/appointments/appointmentService.js"
);
const { default: Appointments } = await import("../models/Appointments.js");
const { default: Therapist } = await import("../models/Therapist.js");
const { default: TherapistAvailability } = await import("../models/TherapistAvailability.js");
const { default: availabilityService } = await import(
  "../services/therapists/therapistAvailabilityService.js"
);

beforeEach(() => vi.clearAllMocks());

describe("overlapsExisting", () => {
  const at = (iso, session_duration) => ({ scheduled_at: new Date(iso), session_duration });
  const start = (iso) => new Date(iso).getTime();

  it("detects a booking starting inside an existing session", () => {
    // The old exact-start-time check missed exactly this case.
    const existing = [at("2026-07-21T08:00:00Z", 60)];
    expect(overlapsExisting({ startMs: start("2026-07-21T08:30:00Z"), durationMins: 30 }, existing)).toBe(true);
  });

  it("detects an existing session starting inside the new booking", () => {
    const existing = [at("2026-07-21T08:30:00Z", 30)];
    expect(overlapsExisting({ startMs: start("2026-07-21T08:00:00Z"), durationMins: 60 }, existing)).toBe(true);
  });

  it("detects an identical start time", () => {
    const existing = [at("2026-07-21T08:00:00Z", 50)];
    expect(overlapsExisting({ startMs: start("2026-07-21T08:00:00Z"), durationMins: 50 }, existing)).toBe(true);
  });

  it("allows back-to-back sessions that only touch at the boundary", () => {
    const existing = [at("2026-07-21T08:00:00Z", 60)];
    expect(overlapsExisting({ startMs: start("2026-07-21T09:00:00Z"), durationMins: 60 }, existing)).toBe(false);
  });

  it("allows a 50-minute session followed by one on the next hour", () => {
    const existing = [at("2026-07-21T08:00:00Z", 50)];
    expect(overlapsExisting({ startMs: start("2026-07-21T09:00:00Z"), durationMins: 50 }, existing)).toBe(false);
  });

  it("treats a missing duration as 30 minutes", () => {
    const existing = [{ scheduled_at: new Date("2026-07-21T08:00:00Z"), session_duration: null }];
    expect(overlapsExisting({ startMs: start("2026-07-21T08:15:00Z"), durationMins: 30 }, existing)).toBe(true);
    expect(overlapsExisting({ startMs: start("2026-07-21T08:30:00Z"), durationMins: 30 }, existing)).toBe(false);
  });

  it("is false against no existing appointments", () => {
    expect(overlapsExisting({ startMs: start("2026-07-21T08:00:00Z"), durationMins: 60 }, [])).toBe(false);
  });
});

describe("getOccupiedSlots", () => {
  it("returns the real booked interval, not fixed 30-minute blocks", async () => {
    // 07:00Z is 08:00 in London during BST.
    Appointments.findAll.mockResolvedValue([
      { scheduled_at: new Date("2026-07-21T07:00:00Z"), session_duration: 60, status: "confirmed" },
    ]);

    const occ = await appointmentService.getOccupiedSlots("t1");

    expect(occ).toEqual({
      "2026-07-21": [{ start: "08:00", end: "09:00", status: "confirmed" }],
    });
  });

  it("reports a 50-minute session as 50 minutes", async () => {
    Appointments.findAll.mockResolvedValue([
      { scheduled_at: new Date("2026-07-21T08:00:00Z"), session_duration: 50, status: "pending" },
    ]);

    const occ = await appointmentService.getOccupiedSlots("t1");

    expect(occ["2026-07-21"]).toEqual([{ start: "09:00", end: "09:50", status: "pending" }]);
  });

  it("handles GMT dates without shifting the hour", async () => {
    Appointments.findAll.mockResolvedValue([
      { scheduled_at: new Date("2026-01-14T10:00:00Z"), session_duration: 60, status: "confirmed" },
    ]);

    const occ = await appointmentService.getOccupiedSlots("t1");

    expect(occ["2026-01-14"]).toEqual([{ start: "10:00", end: "11:00", status: "confirmed" }]);
  });

  it("groups several bookings under their date", async () => {
    Appointments.findAll.mockResolvedValue([
      { scheduled_at: new Date("2026-07-21T07:00:00Z"), session_duration: 60, status: "confirmed" },
      { scheduled_at: new Date("2026-07-21T18:00:00Z"), session_duration: 50, status: "pending" },
    ]);

    const occ = await appointmentService.getOccupiedSlots("t1");

    expect(occ["2026-07-21"]).toHaveLength(2);
    expect(occ["2026-07-21"][1]).toEqual({ start: "19:00", end: "19:50", status: "pending" });
  });

  it("returns an empty object when nothing is booked", async () => {
    Appointments.findAll.mockResolvedValue([]);
    await expect(appointmentService.getOccupiedSlots("t1")).resolves.toEqual({});
  });
});

describe("requestReschedule", () => {
  const buildAppointment = () => ({
    id: "a1",
    user_id: "u1",
    therapist_id: "t1",
    status: "confirmed",
    scheduled_at: new Date("2026-07-21T07:00:00Z"),
    proposed_slots: [],
    proposal_expires_at: null,
    save: vi.fn(),
  });

  it("records the requested time without moving the confirmed one", async () => {
    const appt = buildAppointment();
    Appointments.findOne.mockResolvedValue(appt);
    TherapistAvailability.findOne.mockResolvedValue({
      selected_time_slots: { "2026-07-28": ["09:00-10:00"] },
    });

    await appointmentService.requestReschedule("u1", "a1", "2026-07-28T09:00:00+01:00");

    // The original time must survive so a rejection can fall back to it.
    expect(appt.scheduled_at).toEqual(new Date("2026-07-21T07:00:00Z"));
    expect(appt.status).toBe("reschedule_pending");
    expect(appt.proposed_slots).toHaveLength(1);
    expect(new Date(appt.proposed_slots[0]).toISOString()).toBe("2026-07-28T08:00:00.000Z");
    expect(appt.save).toHaveBeenCalled();
  });

  it("refuses a time the therapist is not available for", async () => {
    Appointments.findOne.mockResolvedValue(buildAppointment());
    TherapistAvailability.findOne.mockResolvedValue({
      selected_time_slots: { "2026-07-28": ["09:00-10:00"] },
    });

    await expect(
      appointmentService.requestReschedule("u1", "a1", "2026-07-28T15:00:00+01:00")
    ).rejects.toThrow(/not available at the requested time/);
  });

  it("refuses when the caller does not own the appointment", async () => {
    Appointments.findOne.mockResolvedValue(buildAppointment());
    await expect(
      appointmentService.requestReschedule("someone-else", "a1", "2026-07-28T09:00:00+01:00")
    ).rejects.toThrow(/only reschedule your own/);
  });
});

describe("handleRescheduleDecision", () => {
  const buildPending = () => ({
    id: "a1",
    status: "reschedule_pending",
    scheduled_at: new Date("2026-07-21T07:00:00Z"),
    proposed_slots: ["2026-07-28T08:00:00.000Z"],
    proposal_expires_at: new Date("2026-07-30T00:00:00Z"),
    save: vi.fn(),
  });

  beforeEach(() => Therapist.findOne.mockResolvedValue({ id: "t1", user_id: "tu1" }));

  it("accept moves the appointment to the requested time", async () => {
    const appt = buildPending();
    Appointments.findOne.mockResolvedValue(appt);

    await appointmentService.handleRescheduleDecision("tu1", "a1", "accept");

    expect(appt.scheduled_at).toEqual(new Date("2026-07-28T08:00:00Z"));
    expect(appt.status).toBe("confirmed");
    expect(appt.proposed_slots).toEqual([]);
  });

  // This is the regression: reject used to leave the appointment on the new time,
  // because requestReschedule had already overwritten scheduled_at.
  it("reject keeps the original time", async () => {
    const appt = buildPending();
    Appointments.findOne.mockResolvedValue(appt);

    await appointmentService.handleRescheduleDecision("tu1", "a1", "reject");

    expect(appt.scheduled_at).toEqual(new Date("2026-07-21T07:00:00Z"));
    expect(appt.status).toBe("confirmed");
    expect(appt.proposed_slots).toEqual([]);
  });

  it("rejects an unknown decision", async () => {
    Appointments.findOne.mockResolvedValue(buildPending());
    await expect(appointmentService.handleRescheduleDecision("tu1", "a1", "maybe")).rejects.toThrow(
      /Use 'accept' or 'reject'/
    );
  });

  it("refuses an appointment with no reschedule pending", async () => {
    Appointments.findOne.mockResolvedValue({ ...buildPending(), status: "confirmed" });
    await expect(appointmentService.handleRescheduleDecision("tu1", "a1", "accept")).rejects.toThrow(
      /No pending reschedule request/
    );
  });
});

describe("acceptProposal", () => {
  const buildAppt = (overrides = {}) => ({
    id: "a1",
    user_id: "u1",
    therapist_id: "t1",
    status: "reschedule_pending",
    session_duration: 60,
    proposed_slots: ["2026-07-28T08:00:00.000Z"],
    proposal_expires_at: new Date("2099-01-01T00:00:00Z"),
    update: vi.fn(),
    ...overrides,
  });

  beforeEach(() => Therapist.findByPk.mockResolvedValue({ id: "t1", user_id: "tu1" }));

  it("confirms a time the therapist actually offered", async () => {
    const appt = buildAppt();
    Appointments.findOne.mockResolvedValue(appt);

    await appointmentService.acceptProposal("u1", "a1", "2026-07-28T09:00:00+01:00");

    expect(appt.update).toHaveBeenCalledWith(
      expect.objectContaining({ status: "confirmed", scheduled_at: new Date("2026-07-28T08:00:00Z") }),
      expect.anything()
    );
  });

  // Without this check a client could confirm any time at all.
  it("refuses a time that was never proposed", async () => {
    Appointments.findOne.mockResolvedValue(buildAppt());

    await expect(
      appointmentService.acceptProposal("u1", "a1", "2026-07-28T15:00:00+01:00")
    ).rejects.toThrow(/not one of the proposed times/);
  });

  it("refuses an expired proposal", async () => {
    Appointments.findOne.mockResolvedValue(
      buildAppt({ proposal_expires_at: new Date("2020-01-01T00:00:00Z") })
    );

    await expect(
      appointmentService.acceptProposal("u1", "a1", "2026-07-28T09:00:00+01:00")
    ).rejects.toThrow(/expired/);
  });

  it("frees the slot using the appointment's real duration", async () => {
    Appointments.findOne.mockResolvedValue(buildAppt({ session_duration: 50 }));

    await appointmentService.acceptProposal("u1", "a1", "2026-07-28T09:00:00+01:00");

    // A hardcoded 30 minutes produced "09:00-09:30", which never matched a stored slot.
    expect(availabilityService.deleteTimeSlot).toHaveBeenCalledWith("tu1", "2026-07-28", "09:00-09:50");
  });

  it("requires a chosen_time", async () => {
    await expect(appointmentService.acceptProposal("u1", "a1", "")).rejects.toThrow(/chosen_time is required/);
  });
});
