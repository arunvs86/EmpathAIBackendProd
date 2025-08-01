// routes/adminMetrics.js
import express from "express";
import { signups, signupsDrill } from "../controllers/adminMetricsController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// New sign-ups trend & summary
router.get("/metrics/signups",      authMiddleware, signups);
// Drill-down for a particular day
router.get("/metrics/signups/drill", authMiddleware, signupsDrill);

export default router;
