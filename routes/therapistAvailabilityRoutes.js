// import express from "express";
// import therapistAvailabilityController from "../controllers/therapistAvailabilityContoller.js";
// import authMiddleware from "../middleware/authMiddleware.js";

// const router = express.Router();

// /**
//  * Specific routes FIRST
//  */
// router.get("/therapistByUser/:id", therapistAvailabilityController.getTherapistByUserId);
// router.get(
//   "/therapists/:therapistId/availability",
//   authMiddleware,
//   therapistAvailabilityController.getAvailabilityForTherapist
// );

// // General collections
// router.get("/", therapistAvailabilityController.getAllTherapists);
// router.get("/list", therapistAvailabilityController.listAllAvailabilities);

// // Single therapist by **Therapist PK** LAST (generic matcher)
// router.get("/:id", therapistAvailabilityController.getTherapistById);

// // Availability CRUD
// router.post("/", authMiddleware, therapistAvailabilityController.setAvailability);
// router.put("/", authMiddleware, therapistAvailabilityController.updateAvailability);
// router.delete("/", authMiddleware, therapistAvailabilityController.deleteTimeSlot);
// router.post("/book-slot", authMiddleware, therapistAvailabilityController.markSlotAsBooked);

// export default router;
import express from "express";
import therapistAvailabilityController from "../controllers/therapistAvailabilityContoller.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

/** Specific routes FIRST */
router.get("/therapistByUser/:id", therapistAvailabilityController.getTherapistByUserId);

// This router is mounted at /therapists, so don't prefix with /therapists again.
router.get(
  "/:therapistId/availability",
  authMiddleware,
  therapistAvailabilityController.getAvailabilityForTherapist
);

router.get(
  "/:therapistId/availability/conflicts",
  authMiddleware,
  therapistAvailabilityController.previewConflicts
);

/** General collections */
router.get("/", therapistAvailabilityController.getAllTherapists);
router.get("/list", therapistAvailabilityController.listAllAvailabilities);

/** Single therapist by PK LAST */
router.get("/:id", therapistAvailabilityController.getTherapistById);

/** Availability CRUD */
router.post("/", authMiddleware, therapistAvailabilityController.setAvailability);
router.put("/", authMiddleware, therapistAvailabilityController.updateAvailability);

router.patch("/availability/slot", authMiddleware, therapistAvailabilityController.editTimeSlot);

// Accepts body OR querystring
router.delete("/availability/slot", authMiddleware, therapistAvailabilityController.deleteTimeSlotWithPolicy);

router.delete("/availability/date", authMiddleware, therapistAvailabilityController.deleteDate);

export default router;
