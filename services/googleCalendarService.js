import { google } from "googleapis";
import dotenv from "dotenv";
dotenv.config();

export async function createGoogleMeetEvent(tokens, summary, startTime, endTime) {
  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI
  );
  oauth2Client.setCredentials(tokens);

  const calendar = google.calendar({ version: "v3", auth: oauth2Client });

  const event = {
    summary,
    start: { dateTime: startTime },
    end:   { dateTime: endTime },
    conferenceData: {
      createRequest: {
        requestId: "meet-" + Math.random().toString(36).substring(2),
        conferenceSolutionKey: { type: "hangoutsMeet" },
      },
    },
  };

  const response = await calendar.events.insert({
    calendarId: "primary",
    resource: event,
    conferenceDataVersion: 1,
  });

  return response.data.hangoutLink; // Google Meet URL
}
