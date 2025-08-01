import express from "express";
import authController from "../controllers/authController.js";

const router = express.Router();

router.post("/register", authController.register);
router.post("/login", authController.login);
router.post("/refresh", authController.refreshToken);
router.post("/logout", authController.logout);
router.get("/verify-email", authController.verifyEmail); 
router.post("/forgot-password", authController.forgotPassword);
router.post("/reset-password", authController.resetPassword); 

export default router;
