// calendar.js  (with "type": "module" in package.json)

import { google } from 'googleapis';

const calendar = google.calendar('v3');
const auth = new google.auth.GoogleAuth({
  keyFile: '/Users/arunsoundararajan/Documents/EmpathAI/backend/empathaibot-8480f429ef0a.json',
  scopes: ['https://www.googleapis.com/auth/calendar']
});

/**
 * Create a Google Meet link via Calendar API.
 * @param {{ summary: string, description: string, startDateTime: string, endDateTime: string, attendeesEmails: string[] }} opts
 * @returns {Promise<string>} the Meet URL
 */
export default async function createMeetEvent({ summary, description, startDateTime, endDateTime, attendeesEmails }) {
  console.log("attendeesEmails", attendeesEmails)
  attendeesEmails = ['vstk18@gmail.com','arunvs7475@gmail.com']
  const authClient = await auth.getClient();
  const res = await calendar.events.insert({
    auth: authClient,
    calendarId: 'primary',
    conferenceDataVersion: 1,
    requestBody: {
      summary,
      description,
      start: { dateTime: startDateTime },
      end:   { dateTime: endDateTime },
      attendees: attendeesEmails.map(email => ({ email })),
      conferenceData: {
        createRequest: {
          requestId: `meet-${Date.now()}-${Math.random()}`,
          conferenceSolutionKey: { type: 'hangoutsMeet' }
        }
      }
    }
  });

  console.log('✅ Created Meet link:', res.data.hangoutLink);
  return res.data.hangoutLink;
}
