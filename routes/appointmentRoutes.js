import express from "express";
import appointmentController from "../controllers/appointmentController.js";
import authMiddleware from "../middleware/authMiddleware.js"

const router = express.Router();

router.post("/", authMiddleware, appointmentController.bookSession);
router.patch("/:id/decision", authMiddleware, appointmentController.handleAppointmentDecision);
router.post("/:id/cancel", authMiddleware, appointmentController.cancelAppointment);
router.post("/:id/reschedule", authMiddleware, appointmentController.requestReschedule);
router.post("/:id/reschedule-decision", authMiddleware, appointmentController.handleRescheduleDecision);
router.get("/therapist/:id", authMiddleware, appointmentController.getTherapistAppointments);

router.get("/upcoming",authMiddleware, appointmentController.getUpcomingAppointments);


// routes/appointment.routes.js
router.post("/:id/propose-times", authMiddleware, appointmentController.proposeTimes);
router.post("/:id/proposal/accept", authMiddleware, appointmentController.acceptProposal);
router.post("/:id/proposal/reject", authMiddleware, appointmentController.rejectProposal);

router.get(
    "/therapists/:id/occupied",
    authMiddleware,
    appointmentController.getOccupiedSlots
  );

export default router;
