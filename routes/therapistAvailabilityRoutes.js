import express from "express";
import therapistAvailabilityController from "../controllers/therapistAvailabilityContoller.js";
import authMiddleware from "../middleware/authMiddleware.js"

const router = express.Router();

router.get("/", therapistAvailabilityController.getAllTherapists);
// GET /therapists/:id → returns therapist details
router.get("/:id", therapistAvailabilityController.getTherapistById);

router.get("/therapistByUser/:id", therapistAvailabilityController.getTherapistByUserId);

// POST /availability -> set new or create availability
router.post("/", authMiddleware, therapistAvailabilityController.setAvailability);

// GET /availability/list -> list all (for admin or debugging)
router.get("/list", therapistAvailabilityController.listAllAvailabilities);

// GET /availability/:id -> get a single therapist's availability
router.get("/therapist/:id", therapistAvailabilityController.getAvailability);

// PUT /availability -> update
router.put("/", authMiddleware, therapistAvailabilityController.updateAvailability);

// DELETE /availability -> remove a specific slot
router.delete("/", authMiddleware, therapistAvailabilityController.deleteTimeSlot);

// POST /availability/book-slot -> mark a slot as booked
router.post("/book-slot", authMiddleware, therapistAvailabilityController.markSlotAsBooked);

router.get(
    "/therapists/:therapistId/availability",
    authMiddleware,
    therapistAvailabilityController.getAvailabilityForTherapist
  );
export default router;

