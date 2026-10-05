import { describe, it, expect, vi, beforeEach } from "vitest";

// Model the real lifecycle: the callback runs, then afterCommit hooks run and are awaited.
vi.mock("../config/postgres.js", () => ({
  sequelize: {
    transaction: vi.fn(async (cb) => {
      const hooks = [];
      const tx = { LOCK: { UPDATE: "UPDATE" }, afterCommit: (fn) => hooks.push(fn) };
      const result = await cb(tx);
      for (const h of hooks) await h();
      return result;
    }),
  },
  connectPostgres: vi.fn(),
}));
vi.mock("../models/Appointments.js", () => ({
  default: { findAll: vi.fn(), findOne: vi.fn(), create: vi.fn(), update: vi.fn(), count: vi.fn() },
}));
vi.mock("../models/Therapist.js", () => ({
  default: { findOne: vi.fn(), findByPk: vi.fn(), findAll: vi.fn(), belongsTo: vi.fn() },
}));
vi.mock("../models/TherapistAvailability.js", () => ({
  default: { findOne: vi.fn(), findAll: vi.fn(() => []), create: vi.fn() },
}));
vi.mock("../models/User.js", () => ({
  default: { findOne: vi.fn(), findByPk: vi.fn(), findAll: vi.fn(() => []) },
}));
vi.mock("../services/email/emailService.js", () => ({
  default: {
    sendAppointmentConfirmationEmail: vi.fn(),
    sendSlotTakenEmail: vi.fn(),
    sendRejectionEmail: vi.fn(),
  },
}));
vi.mock("../services/googleCalendarService.js", () => ({ createGoogleMeetEvent: vi.fn() }));
vi.mock("../services/therapists/therapistAvailabilityService.js", () => ({
  default: { deleteTimeSlot: vi.fn() },
}));
vi.mock("axios", () => ({
  default: { post: vi.fn(async () => ({ data: { clientLink: "https://meet/c", proLink: "https://meet/p" } })) },
}));

const { default: appointmentService } = await import("../services/appointments/appointmentService.js");
const { default: Appointments } = await import("../models/Appointments.js");
const { default: Therapist } = await import("../models/Therapist.js");
const { default: User } = await import("../models/User.js");
const { default: emailService } = await import("../services/email/emailService.js");

function setup({ languages = ["English"], status = "pending" } = {}) {
  const appointment = {
    id: "a1",
    user_id: "u1",
    therapist_id: "t1",
    status,
    scheduled_at: new Date("2026-07-28T08:00:00Z"),
    session_duration: 60,
    update: vi.fn(async (values) => Object.assign(appointment, values)),
  };
  Therapist.findOne.mockResolvedValue({ id: "t1", user_id: "tu1", languages_spoken: languages });
  Appointments.findOne.mockResolvedValue(appointment);
  Appointments.findAll.mockResolvedValue([]);
  User.findByPk.mockImplementation(async (id) =>
    id === "u1"
      ? { id: "u1", username: "Ana", email: "ana@example.com" }
      : { id: "tu1", username: "Belén", email: "belen@example.com", google_tokens: null }
  );
  return appointment;
}

beforeEach(() => vi.clearAllMocks());

describe("handleAppointmentDecision — accept", () => {
  it("confirms the appointment", async () => {
    const appt = setup();

    const res = await appointmentService.handleAppointmentDecision("tu1", "a1", "accept");

    expect(appt.update).toHaveBeenCalledWith({ status: "confirmed" }, expect.anything());
    expect(res.message).toMatch(/confirmed successfully/);
  });

  it("sends the confirmation email with the meet links", async () => {
    setup();

    await appointmentService.handleAppointmentDecision("tu1", "a1", "accept");

    expect(emailService.sendAppointmentConfirmationEmail).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ email: "ana@example.com" }),
      expect.objectContaining({ email: "belen@example.com" }),
      { clientLink: "https://meet/c", proLink: "https://meet/p" },
      "en"
    );
  });

  // The locale wiring in this function was previously unverified.
  it("asks for Spanish when the therapist practises in Spanish", async () => {
    setup({ languages: ["Spanish"] });

    await appointmentService.handleAppointmentDecision("tu1", "a1", "accept");

    const call = emailService.sendAppointmentConfirmationEmail.mock.calls[0];
    expect(call[4]).toBe("es");
  });

  it("passes the locale to the slot-taken emails too", async () => {
    setup({ languages: ["Spanish"] });
    // Another client lost this slot.
    Appointments.findAll.mockResolvedValue([
      { id: "a2", user_id: "u2", scheduled_at: new Date("2026-07-28T08:00:00Z"), status: "rejected" },
    ]);
    User.findAll.mockResolvedValue([{ id: "u2", username: "Carlos", email: "carlos@example.com" }]);

    await appointmentService.handleAppointmentDecision("tu1", "a1", "accept");

    expect(emailService.sendSlotTakenEmail).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ email: "carlos@example.com" }),
      expect.anything(),
      "es"
    );
  });

  it("auto-rejects other pending requests for the same slot", async () => {
    setup();

    await appointmentService.handleAppointmentDecision("tu1", "a1", "accept");

    expect(Appointments.update).toHaveBeenCalledWith(
      { status: "rejected" },
      expect.objectContaining({ where: expect.objectContaining({ status: "pending" }) })
    );
  });

  it("still confirms when the meet-link service is down", async () => {
    setup();
    const { default: axios } = await import("axios");
    axios.post.mockRejectedValue(new Error("meet service down"));

    const res = await appointmentService.handleAppointmentDecision("tu1", "a1", "accept");

    expect(res.message).toMatch(/confirmed successfully/);
  });

  it("still confirms when the confirmation email fails", async () => {
    setup();
    emailService.sendAppointmentConfirmationEmail.mockRejectedValue(new Error("SMTP down"));

    const res = await appointmentService.handleAppointmentDecision("tu1", "a1", "accept");

    expect(res.message).toMatch(/confirmed successfully/);
  });
});

describe("handleAppointmentDecision — reject", () => {
  it("rejects and emails the client in the therapist's language", async () => {
    const appt = setup({ languages: ["Spanish"] });

    const res = await appointmentService.handleAppointmentDecision("tu1", "a1", "reject");

    expect(appt.update).toHaveBeenCalledWith({ status: "rejected" }, expect.anything());
    expect(res.message).toMatch(/rejected successfully/);
    const call = emailService.sendRejectionEmail.mock.calls[0];
    expect(call[3]).toBe("es");
  });

  it("uses English for an English therapist", async () => {
    setup({ languages: ["English"] });

    await appointmentService.handleAppointmentDecision("tu1", "a1", "reject");

    expect(emailService.sendRejectionEmail.mock.calls[0][3]).toBe("en");
  });
});

describe("handleAppointmentDecision — guards", () => {
  it("refuses an appointment that is not pending", async () => {
    setup({ status: "confirmed" });

    await expect(appointmentService.handleAppointmentDecision("tu1", "a1", "accept")).rejects.toThrow(
      /already been processed/
    );
  });

  it("refuses an appointment belonging to another therapist", async () => {
    setup();
    Appointments.findOne.mockResolvedValue(null);

    await expect(appointmentService.handleAppointmentDecision("tu1", "a1", "accept")).rejects.toThrow(
      /not found or unauthorized/
    );
  });

  it("refuses a user with no therapist record", async () => {
    setup();
    Therapist.findOne.mockResolvedValue(null);

    await expect(appointmentService.handleAppointmentDecision("nobody", "a1", "accept")).rejects.toThrow(
      /Therapist record not found/
    );
  });

  it("refuses an unknown decision", async () => {
    setup();

    await expect(appointmentService.handleAppointmentDecision("tu1", "a1", "maybe")).rejects.toThrow(
      /Use 'accept' or 'reject'/
    );
  });

  it("locks the appointment row while deciding", async () => {
    setup();

    await appointmentService.handleAppointmentDecision("tu1", "a1", "accept");

    expect(Appointments.findOne).toHaveBeenCalledWith(expect.objectContaining({ lock: "UPDATE" }));
  });
});
