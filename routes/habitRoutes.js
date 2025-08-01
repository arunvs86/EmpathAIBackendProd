// routes/habitRoutes.js
import express from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import habitController from "../controllers/habitController.js";

const router = express.Router();

// Protect all
router.use(authMiddleware);

// Habit CRUD
router.get("/",      habitController.list);
router.post("/",     habitController.create);
router.get("/:id",   habitController.get);
router.put("/:id",   habitController.update);
router.delete("/:id",habitController.remove);

// Logs
router.get("/:id/logs", habitController.listLogs);
router.post("/:id/log", habitController.upsertLog);

export default router;
