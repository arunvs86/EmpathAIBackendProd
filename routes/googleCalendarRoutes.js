import express from "express";
import { google } from "googleapis";
import dotenv from "dotenv";
import Therapist from "../models/Therapist.js";

dotenv.config();

const router = express.Router();

// Google OAuth setup
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Step 1: Redirect therapist to Google
router.get("/google/auth/:therapistId", async (req, res) => {
  const { therapistId } = req.params;

  const scopes = ["https://www.googleapis.com/auth/calendar.events"];
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: scopes,
    state: therapistId,
  });

  res.redirect(url);
});

// Step 2: Google redirects back here with tokens
router.get("/google/callback", async (req, res) => {
  const { code, state: therapistId } = req.query;

  try {
    const { tokens } = await oauth2Client.getToken(code);
    oauth2Client.setCredentials(tokens);

    // Save tokens in DB
    const therapist = await Therapist.findByPk(therapistId);
    if (!therapist) return res.status(404).send("Therapist not found");

    await therapist.update({ google_tokens: tokens });

    res.send("<h2>Google Calendar connected successfully!</h2><p>You can now accept bookings with Google Meet links.</p>");
  } catch (err) {
    console.error("OAuth Callback Error:", err);
    res.status(500).send("Google OAuth failed.");
  }
});

export default router;
