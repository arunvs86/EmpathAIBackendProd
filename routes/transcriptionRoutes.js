import express from "express";
import transcriptionController from "../controllers/transcriptionController.js";

const router = express.Router();

// POST /api/transcribe
router.post("/transcribe", transcriptionController.transcribeAudio);

export default router;
