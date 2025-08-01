import express from "express";
import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

const router = express.Router();

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  process.env.GOOGLE_REDIRECT_URI
);

// Step 1: Redirect user to Google
router.get("/auth", (req, res) => {
  const scopes = ["https://www.googleapis.com/auth/calendar.events"];
  const url = oauth2Client.generateAuthUrl({
    access_type: "offline",
    scope: scopes,
    prompt: "consent"
  });
  res.redirect(url);
});

// Step 2: Handle callback and exchange code for tokens
router.get("/callback", async (req, res) => {
  const { code } = req.query;
  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);
  
  // Save tokens in DB or session
  console.log("Access Token:", tokens.access_token);
  console.log("Refresh Token:", tokens.refresh_token);

  res.send("Google Auth Success. You can now create meetings.");
});

export default router;
