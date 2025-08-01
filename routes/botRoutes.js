import express from "express";
import botController from "../controllers/botController.js";

const router = express.Router();

// Public endpoint to manually trigger one bot post under a topic
// e.g. GET /bot/run-once?topic=Wellness%20tips
router.get("/run-once", botController.runOnce);

export default router;
