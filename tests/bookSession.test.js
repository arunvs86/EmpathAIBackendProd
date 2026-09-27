import { describe, it, expect, vi, beforeEach } from "vitest";

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
vi.mock("../services/email/emailService.js", () => ({
  default: { sendAppointmentRequestEmail: vi.fn() },
}));
vi.mock("../services/googleCalendarService.js", () => ({ createGoogleMeetEvent: vi.fn() }));
vi.mock("../services/therapists/therapistAvailabilityService.js", () => ({
  default: { deleteTimeSlot: vi.fn() },
}));
vi.mock("axios", () => ({ default: { post: vi.fn() } }));

const { default: appointmentService } = await import("../services/appointments/appointmentService.js");
const { default: Appointments } = await import("../models/Appointments.js");
const { default: Therapist } = await import("../models/Therapist.js");
const { default: TherapistAvailability } = await import("../models/TherapistAvailability.js");
const { default: User } = await import("../models/User.js");
const { default: emailService } = await import("../services/email/emailService.js");

// 2026-07-28 is BST, so 09:00 London is 08:00Z.
const DATE = "2026-07-28";
const AT_9AM = "2026-07-28T09:00:00+01:00";

function setup({ sessionDuration = 60, slots = ["09:00-10:00"], existing = [] } = {}) {
  User.findByPk.mockImplementation(async (id) =>
    id === "u1"
      ? { id: "u1", username: "Client", email: "client@example.com" }
      : { id: "tu1", username: "Therapist", email: "therapist@example.com" }
  );
  Therapist.findByPk.mockResolvedValue({
    id: "t1",
    user_id: "tu1",
    session_duration: sessionDuration,
  });
  TherapistAvailability.findAll.mockResolvedValue([
    { selected_time_slots: { [DATE]: slots }, update: vi.fn() },
  ]);
  Appointments.findAll.mockResolvedValue(existing);
  Appointments.create.mockImplementation(async (values) => ({ id: "new1", ...values }));
}

const payload = (overrides = {}) => ({
  therapist_id: "t1",
  scheduled_at: AT_9AM,
  session_type: "video",
  primary_concern: "Anxiety",
  attended_before: false,
  ...overrides,
});

beforeEach(() => vi.clearAllMocks());

describe("bookSession — session length (items 2 & 8)", () => {
  it("stores the therapist's duration, not the client's", async () => {
    setup({ sessionDuration: 60 });

    // The old frontend hardcoded 30 and the backend stored it verbatim.
    await appointmentService.bookSession("u1", payload({ session_duration: 30 }));

    expect(Appointments.create).toHaveBeenCalledWith(
      expect.objectContaining({ session_duration: 60 }),
      expect.anything()
    );
  });

  it("stores 50 minutes for a 50-minute therapist", async () => {
    setup({ sessionDuration: 50, slots: ["09:00-09:50"] });

    await appointmentService.bookSession("u1", payload({ session_duration: 30 }));

    expect(Appointments.create).toHaveBeenCalledWith(
      expect.objectContaining({ session_duration: 50 }),
      expect.anything()
    );
  });

  it("falls back to 30 when the therapist has no usable duration", async () => {
    setup({ sessionDuration: null });

    await appointmentService.bookSession("u1", payload());

    expect(Appointments.create).toHaveBeenCalledWith(
      expect.objectContaining({ session_duration: 30 }),
      expect.anything()
    );
  });

  it("creates the appointment as pending, owned by the caller", async () => {
    setup();

    await appointmentService.bookSession("u1", payload());

    expect(Appointments.create).toHaveBeenCalledWith(
      expect.objectContaining({ user_id: "u1", therapist_id: "t1", status: "pending" }),
      expect.anything()
    );
  });

  it("converts the requested London time to the right UTC instant", async () => {
    setup();

    await appointmentService.bookSession("u1", payload());

    const [values] = Appointments.create.mock.calls[0];
    expect(values.scheduled_at.toISOString()).toBe("2026-07-28T08:00:00.000Z");
  });
});

describe("bookSession — overlap protection (item 7)", () => {
  const existingAt = (iso, session_duration, status = "confirmed") => ({
    id: "old1",
    scheduled_at: new Date(iso),
    session_duration,
    status,
  });

  it("rejects a booking that starts inside an existing session", async () => {
    // 60-minute session at 09:00 London; someone tries 09:30.
    setup({
      sessionDuration: 30,
      slots: ["09:00-10:00"],
      existing: [existingAt("2026-07-28T08:00:00Z", 60)],
    });

    await expect(
      appointmentService.bookSession("u1", payload({ scheduled_at: "2026-07-28T09:30:00+01:00" }))
    ).rejects.toThrow(/Slot already taken/);
    expect(Appointments.create).not.toHaveBeenCalled();
  });

  it("rejects an exact double booking", async () => {
    setup({ existing: [existingAt("2026-07-28T08:00:00Z", 60)] });

    await expect(appointmentService.bookSession("u1", payload())).rejects.toThrow(/Slot already taken/);
  });

  it("rejects overlap with a merely pending request", async () => {
    setup({ existing: [existingAt("2026-07-28T08:00:00Z", 60, "pending")] });

    await expect(appointmentService.bookSession("u1", payload())).rejects.toThrow(/Slot already taken/);
  });

  it("allows a back-to-back booking that does not overlap", async () => {
    setup({
      sessionDuration: 60,
      slots: ["09:00-10:00", "10:00-11:00"],
      existing: [existingAt("2026-07-28T08:00:00Z", 60)],
    });

    await expect(
      appointmentService.bookSession("u1", payload({ scheduled_at: "2026-07-28T10:00:00+01:00" }))
    ).resolves.toBeTruthy();
    expect(Appointments.create).toHaveBeenCalled();
  });

  it("ignores cancelled and rejected appointments", async () => {
    // Those statuses aren't in the query filter, so they never reach the overlap check.
    setup({ existing: [] });

    await expect(appointmentService.bookSession("u1", payload())).resolves.toBeTruthy();

    const [{ where }] = Appointments.findAll.mock.calls[0];
    expect(where.status[Object.getOwnPropertySymbols(where.status)[0]]).toEqual([
      "pending",
      "confirmed",
      "reschedule_pending",
    ]);
  });

  it("holds a row lock while checking, so two requests cannot both pass", async () => {
    setup();

    await appointmentService.bookSession("u1", payload());

    const [options] = Appointments.findAll.mock.calls[0];
    expect(options.lock).toBe("UPDATE");
    expect(options.transaction).toBe(fakeTx);
  });

  it("creates the appointment inside the same transaction as the check", async () => {
    setup();

    await appointmentService.bookSession("u1", payload());

    expect(Appointments.create).toHaveBeenCalledWith(expect.anything(), { transaction: fakeTx });
  });
});

describe("bookSession — availability enforcement", () => {
  it("refuses a time outside the therapist's slots", async () => {
    setup({ slots: ["09:00-10:00"] });

    await expect(
      appointmentService.bookSession("u1", payload({ scheduled_at: "2026-07-28T15:00:00+01:00" }))
    ).rejects.toThrow(/not available at the requested time/);
  });

  it("refuses a date the therapist has not opened", async () => {
    setup({ slots: ["09:00-10:00"] });

    await expect(
      appointmentService.bookSession("u1", payload({ scheduled_at: "2026-08-04T09:00:00+01:00" }))
    ).rejects.toThrow(/not available at the requested time/);
  });

  it("refuses when the therapist has no availability at all", async () => {
    setup();
    TherapistAvailability.findAll.mockResolvedValue([]);

    await expect(appointmentService.bookSession("u1", payload())).rejects.toThrow(
      /has not set any availability/
    );
  });

  it("accepts a start time on a non-half-hour boundary for a 50-minute therapist", async () => {
    // These used to be blocked by the validator's :00/:30 grid.
    setup({ sessionDuration: 50, slots: ["09:10-10:00"] });

    await expect(
      appointmentService.bookSession("u1", payload({ scheduled_at: "2026-07-28T09:10:00+01:00" }))
    ).resolves.toBeTruthy();
  });

  it("rejects an unknown therapist", async () => {
    setup();
    Therapist.findByPk.mockResolvedValue(null);

    await expect(appointmentService.bookSession("u1", payload())).rejects.toThrow(
      /Therapist record not found/
    );
  });
});

describe("bookSession — notification failures (item 12)", () => {
  it("still succeeds when the therapist email fails", async () => {
    setup();
    emailService.sendAppointmentRequestEmail.mockRejectedValue(new Error("SMTP down"));

    // The row is already committed; failing here made clients retry and double-book.
    const result = await appointmentService.bookSession("u1", payload());

    expect(result.message).toMatch(/sent successfully/);
    expect(Appointments.create).toHaveBeenCalled();
  });

  it("notifies the therapist on success", async () => {
    setup();
    emailService.sendAppointmentRequestEmail.mockResolvedValue(undefined);

    await appointmentService.bookSession("u1", payload());

    expect(emailService.sendAppointmentRequestEmail).toHaveBeenCalled();
  });
});
