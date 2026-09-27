import { describe, it, expect, vi, beforeEach } from "vitest";
import express from "express";
import request from "supertest";

// Authenticate as whoever the test sets, so the route + controller run for real.
let currentUser = { id: "tu1", role: "therapist", email: "t@example.com" };

vi.mock("../middleware/authMiddleware.js", () => ({
  default: (req, _res, next) => {
    req.user = currentUser;
    next();
  },
}));

vi.mock("../services/appointments/appointmentService.js", () => ({
  default: {
    bookSession: vi.fn(async () => ({ message: "Appointment request sent successfully!" })),
    handleAppointmentDecision: vi.fn(async () => ({ message: "Appointment confirmed successfully!" })),
    handleRescheduleDecision: vi.fn(async () => ({ message: "Reschedule request accepted successfully!" })),
    getAppointmentsByTherapist: vi.fn(async () => [{ id: "a1", primary_concern: "Anxiety" }]),
    cancelAppointment: vi.fn(async () => ({ message: "Appointment cancelled successfully!" })),
    requestReschedule: vi.fn(async () => ({ message: "Reschedule request sent successfully!" })),
    getUpcomingAppointments: vi.fn(async () => []),
    getOccupiedSlots: vi.fn(async () => ({})),
    proposeTimes: vi.fn(async () => ({ message: "Reschedule proposals sent." })),
    acceptProposal: vi.fn(async () => ({ message: "Reschedule accepted and confirmed." })),
    rejectProposal: vi.fn(async () => ({ message: "Reschedule proposal rejected. Original time kept." })),
  },
}));

const { default: appointmentRoutes } = await import("../routes/appointmentRoutes.js");
const { default: appointmentService } = await import("../services/appointments/appointmentService.js");

const app = express();
app.use(express.json());
app.use("/appointments", appointmentRoutes);

beforeEach(() => {
  vi.clearAllMocks();
  currentUser = { id: "tu1", role: "therapist", email: "t@example.com" };
});

describe("GET /appointments/therapist/:id — client data exposure (item 3)", () => {
  it("returns the therapist's own appointments", async () => {
    const res = await request(app).get("/appointments/therapist/tu1");

    expect(res.status).toBe(200);
    expect(res.body).toEqual([{ id: "a1", primary_concern: "Anxiety" }]);
  });

  // The whole point of the fix: being logged in is not authorisation.
  it("refuses a therapist asking for a different therapist's list", async () => {
    const res = await request(app).get("/appointments/therapist/someone-else");

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/only view your own/i);
    expect(appointmentService.getAppointmentsByTherapist).not.toHaveBeenCalled();
  });

  it("refuses a regular user, even asking for their own id", async () => {
    currentUser = { id: "u1", role: "user", email: "u@example.com" };

    const res = await request(app).get("/appointments/therapist/u1");

    expect(res.status).toBe(403);
    expect(appointmentService.getAppointmentsByTherapist).not.toHaveBeenCalled();
  });

  it("refuses a regular user probing a therapist's id", async () => {
    currentUser = { id: "u1", role: "user", email: "u@example.com" };

    const res = await request(app).get("/appointments/therapist/tu1");

    expect(res.status).toBe(403);
    expect(appointmentService.getAppointmentsByTherapist).not.toHaveBeenCalled();
  });

  it("ignores the URL param and uses the authenticated id", async () => {
    await request(app).get("/appointments/therapist/tu1");

    expect(appointmentService.getAppointmentsByTherapist).toHaveBeenCalledWith("tu1");
  });
});

describe("PATCH /appointments/:id/reschedule-decision — dead endpoint (item 6)", () => {
  // The frontend sends PATCH; the route only accepted POST, so this 404'd.
  it("accepts PATCH, which is what the frontend sends", async () => {
    const res = await request(app)
      .patch("/appointments/a1/reschedule-decision")
      .send({ decision: "accept" });

    expect(res.status).toBe(200);
    expect(appointmentService.handleRescheduleDecision).toHaveBeenCalledWith("tu1", "a1", "accept");
  });

  it("no longer answers POST on that path", async () => {
    const res = await request(app)
      .post("/appointments/a1/reschedule-decision")
      .send({ decision: "accept" });

    expect(res.status).toBe(404);
  });

  it("rejects an invalid decision", async () => {
    const res = await request(app)
      .patch("/appointments/a1/reschedule-decision")
      .send({ decision: "maybe" });

    expect(res.status).toBe(400);
    expect(appointmentService.handleRescheduleDecision).not.toHaveBeenCalled();
  });
});

describe("appointment routes — methods the frontend actually calls", () => {
  it("PATCH /:id/decision", async () => {
    const res = await request(app).patch("/appointments/a1/decision").send({ decision: "accept" });
    expect(res.status).toBe(200);
  });

  it("POST /:id/cancel", async () => {
    const res = await request(app).post("/appointments/a1/cancel");
    expect(res.status).toBe(200);
  });

  it("POST / to book", async () => {
    // Validation runs in the controller, so a valid payload is required.
    const res = await request(app).post("/appointments").send({
      therapist_id: "t1",
      scheduled_at: "2099-07-28T09:00:00+01:00",
      session_type: "video",
      primary_concern: "Anxiety",
      attended_before: false,
    });
    expect(res.status).toBe(201);
  });

  it("GET /appointments/therapists/:id/occupied", async () => {
    const res = await request(app).get("/appointments/therapists/t1/occupied?from=2026-07-01&to=2026-07-31");
    expect(res.status).toBe(200);
  });

  it("GET /appointments/upcoming", async () => {
    const res = await request(app).get("/appointments/upcoming");
    expect(res.status).toBe(200);
  });
});
