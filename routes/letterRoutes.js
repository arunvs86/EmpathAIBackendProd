// routes/letterRoutes.js
import express from "express";
import auth from "../middleware/authMiddleware.js";
import letterController from "../controllers/letterContoller.js";

const router = express.Router();

router.post(   "/",        auth, letterController.create);
router.get(    "/user",    auth, letterController.listByUser);
router.get(    "/:id",     auth, letterController.getOne);
router.put(    "/:id",     auth, letterController.update);
router.delete( "/:id",     auth, letterController.delete);

export default router;
