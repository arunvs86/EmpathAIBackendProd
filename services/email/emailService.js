import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import axios from "axios";
dotenv.config();
import { DateTime } from "luxon";
import { copyFor, fallbackNamesFor } from "./emailCopy.js";

const uk = (d) =>
  DateTime.fromJSDate(new Date(d), { zone: "utc" })
    .setZone("Europe/London")
    .toFormat("dd LLL yyyy, HH:mm z"); // e.g., "22 Oct 2025, 17:00 BST"

// Optional: if you want start–end range (uses session_duration minutes)
const ukRange = (d, minutes = 30) => {
  const start = DateTime.fromJSDate(new Date(d), { zone: "utc" }).setZone("Europe/London");
  const end = start.plus({ minutes });
  return `${start.toFormat("dd LLL yyyy, HH:mm")}–${end.toFormat("HH:mm z")}`;
};

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.SMTP_USER,
                pass: "noxmgflpsaxwszxw"
                ,
            },
        });
    }

    /**
     * Sends a verification email to the user
     */
    async sendVerificationEmail(user) {
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );

        const verificationLink = `https://empathai-server-gkhjhxeahmhkghd6.uksouth-01.azurewebsites.net/auth/verify-email?token=${token}`;

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: "Verify Your Email - EmpathAI",
            text: `Hello ${user.username},\n\nClick the link below to verify your email:\n\n${verificationLink}\n\nThis link expires in 1 hour.`,
        };

        await this.transporter.sendMail(mailOptions);
    }

    /**
     * Verifies email using the provided token
     */
    async verifyEmail(token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            return decoded;
        } catch (error) {
            throw new Error("Invalid or expired token.");
        }
    }

    async sendPasswordResetEmail(user) {
        const token = jwt.sign(
            { id: user.id, email: user.email },
            process.env.RESET_PASSWORD_SECRET,
            { expiresIn: process.env.RESET_PASSWORD_EXPIRY }
        );

        console.log("Reset token", token)
        const resetLink = `https://ambitious-river-0a69e4c03.1.azurestaticapps.net/reset-password?token=${token}`;

        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to: user.email,
            subject: "Reset Your Password - EmpathAI",
            text: `Hello ${user.username},\n\nClick the link below to reset your password:\n\n${resetLink}\n\nThis link expires in 1 hour.`,
        };

        await this.transporter.sendMail(mailOptions);
    }

    // async sendAppointmentRequestEmail(appointment, user, therapist) {
    //     const scheduledAt = uk(appointment.scheduled_at);
    
    //     const mailOptions = {
    //       from: process.env.EMAIL_FROM,
    //       to: user.email,
    //       subject: "Appointment Request - EmpathAI",
    //       text: `Hello ${user.username},\n\nYour appointment with ${therapist.username} has been requested at ${scheduledAt}.\n\nThank you for choosing EmpathAI.\n\nBest regards,\nEmpathAI Team`,
    //     };
    
    //     await this.transporter.sendMail(mailOptions);
    //   }

    async sendAppointmentRequestEmail(appointment, user, therapist, locale = "en") {
      const when = uk(appointment.scheduled_at);
      const c = copyFor(locale);
      const names = { clientName: user.username, therapistName: therapist.username, when };

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: user.email,
        ...c.requestClient(names),
      });
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: therapist.email,
        ...c.requestTherapist(names),
      });
    }
    

// async sendAppointmentConfirmationEmail(appointment, user, therapist,googleMeetLink = null) {
//   // 1) generate meeting links
//   let clientLink, proLink;
//   console.log("Appointment details", appointment)
//   try {
//     const { data } = await axios.post(
//       "https://empathaimeet.onrender.com/api/v1/links",
//       {
//         professionalsFullName: therapist.username,
//         proId: therapist.id,
//         clientName: user.username,
//         apptDate: new Date(appointment.scheduled_at).getTime(),
//       },
//       { headers: { "Content-Type": "application/json" } }
//     );

//     console.log(data)

//     const makeHashUrl = (rawUrl) => {
//       const url = new URL(rawUrl);
//       console.log("URL", url)
//       return `${url.origin}/#${url.pathname}${url.search}`;
//     };

//     clientLink = data.clientLink;
//     // clientLink = makeHashUrl(data.clientLink);
//     console.log(clientLink)
//     // proLink    = makeHashUrl(data.proLink);
//     proLink    = data.proLink;
//     console.log(proLink)

//   } catch (err) {
//     console.error("Could not generate meeting links:", err);
//   }

//   // 2) format date
//   const when = uk(appointment.scheduled_at);

//   // 3) build and send the client email
//   const clientMail = {
//     from: process.env.EMAIL_FROM,
//     to:   user.email,
//     subject: "Your EmpathAI Appointment is Confirmed",
//     text: `Hello ${user.username},

// Your appointment with ${therapist.username} is confirmed for ${when}.
// ${
//   googleMeetLink
//     ? `\nJoin your session via Google Meet:\n${googleMeetLink}`
//     : clientLink
//     ? `\nJoin your session here:\n${clientLink}`
//     : ""
// }

// Thank you for choosing EmpathAI.

// Warm regards,
// The EmpathAI Team`,
//   };

//   console.log(clientMail)

//   // 4) build and send the pro email
//   const proMail = {
//     from: process.env.EMAIL_FROM,
//     to:   therapist.email,         // make sure you have therapist.email
//     subject: "New EmpathAI Appointment Booked",
//     text: `Hello ${therapist.username},

// You have a new appointment with ${user.username} on ${when}.
// ${
//   googleMeetLink
//     ? `\nJoin your session via Google Meet:\n${googleMeetLink}`
//     : clientLink
//     ? `\nJoin your session here:\n${proLink}`
//     : ""
// }

// Please note that all appointments are based on the UK time zone. 

// Best of luck,
// The EmpathAI Team`,
//   };

//   console.log(proMail)


//   // 5) send both
//   await this.transporter.sendMail(clientMail);
//   await this.transporter.sendMail(proMail);
// }

// inside emailService.js
async sendAppointmentConfirmationEmail(appointment, clientUser, therapistUser, { clientLink, proLink }, locale = "en") {
  const when = uk(appointment.scheduled_at);
  const c = copyFor(locale);
  const names = { clientName: clientUser.username, therapistName: therapistUser.username, when };

  await this.transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: clientUser.email,
    ...c.confirmationClient({ ...names, link: clientLink }),
  });
  await this.transporter.sendMail({
    from: process.env.EMAIL_FROM,
    to: therapistUser.email,
    ...c.confirmationTherapist({ ...names, link: proLink }),
  });
}


      async sendSlotTakenEmail(appointment, user, therapist, locale = "en") {
        await this.transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: user.email,
          ...copyFor(locale).slotTaken({
            clientName: user.username,
            therapistName: therapist.username,
          }),
        });
      }

      async sendRejectionEmail(appointment, user, therapist, locale = "en") {
        await this.transporter.sendMail({
          from: process.env.EMAIL_FROM,
          to: user.email,
          ...copyFor(locale).rejection({
            clientName: user.username,
            therapistName: therapist.username,
          }),
        });
      }

  
  async sendCancellationEmail(appointment, cancellerUser, counterpartyUser) {
    const when = uk(appointment.scheduled_at);

    const toCanceller = {
      from: process.env.EMAIL_FROM,
      to: cancellerUser?.email,
      subject: "Your EmpathAI appointment was cancelled",
      text: `Hello ${cancellerUser?.username || "there"},

Your appointment scheduled for ${when} has been cancelled.

If this was a mistake, you can book again from the app.

— EmpathAI`,
    };

    const toCounterparty = {
      from: process.env.EMAIL_FROM,
      to: counterpartyUser?.email,
      subject: "Appointment cancelled",
      text: `Hello ${counterpartyUser?.username || "there"},

The appointment scheduled for ${when} was cancelled by ${cancellerUser?.username || "the other party"}.

— EmpathAI`,
    };

    if (toCanceller.to) await this.transporter.sendMail(toCanceller);
    if (toCounterparty.to) await this.transporter.sendMail(toCounterparty);
  }

  
  async sendRescheduleRequestEmail(appointment, user, therapistUser, requestedAtISO) {
    const oldWhen = uk(appointment.scheduled_at);
    const newWhen = uk(requestedAtISO);

    const toTherapist = {
      from: process.env.EMAIL_FROM,
      to: therapistUser?.email,
      subject: "Reschedule requested on EmpathAI",
      text: `Hello ${therapistUser?.username || "Therapist"},

${user?.username || "Your client"} requested to move the session:
From: ${oldWhen}
To:   ${newWhen}

Please review this request in your dashboard.

— EmpathAI`,
    };

    const toClientAck = {
      from: process.env.EMAIL_FROM,
      to: user?.email,
      subject: "We sent your reschedule request",
      text: `Hello ${user?.username || "there"},

We sent your reschedule request to ${therapistUser?.username || "your therapist"}:
From: ${oldWhen}
To:   ${newWhen}

You'll get an email once it's approved or rejected.

— EmpathAI`,
    };

    if (toTherapist.to) await this.transporter.sendMail(toTherapist);
    if (toClientAck.to) await this.transporter.sendMail(toClientAck);
  }

  
  async sendRescheduleDecisionEmail(appointment, user, therapistUser, decision, newISO = null, googleMeetLink = null) {
    const oldWhen = uk(appointment.scheduled_at);
    const newWhen = newISO ? new Date(newISO).toLocaleString() : null;

    const subject =
      decision === "accept"
        ? "Reschedule approved"
        : "Reschedule rejected";

    const clientText =
      decision === "accept"
        ? `Hello ${user?.username || "there"},

Your reschedule request was approved.
New time: ${newWhen}

${googleMeetLink ? `Join via Google Meet:\n${googleMeetLink}\n\n` : ""}— EmpathAI`
        : `Hello ${user?.username || "there"},

Your reschedule request was not approved.
Your session remains at: ${oldWhen}

— EmpathAI`;

    const therapistText =
      decision === "accept"
        ? `Hello ${therapistUser?.username || "Therapist"},

You approved a reschedule request.
New time: ${newWhen}

${googleMeetLink ? `Meet link:\n${googleMeetLink}\n\n` : ""}— EmpathAI`
        : `Hello ${therapistUser?.username || "Therapist"},

You rejected a reschedule request.
Appointment stays at: ${oldWhen}

— EmpathAI`;

    const toClient = {
      from: process.env.EMAIL_FROM,
      to: user?.email,
      subject,
      text: clientText,
    };

    const toTherapist = {
      from: process.env.EMAIL_FROM,
      to: therapistUser?.email,
      subject,
      text: therapistText,
    };

    if (toClient.to) await this.transporter.sendMail(toClient);
    if (toTherapist.to) await this.transporter.sendMail(toTherapist);
  }

    /**
   * Therapist cancelled a slot and we cancelled the appointment.
   * Notify the client.
   */
    async sendTherapistCancelledAppointmentEmail(appointment, clientUser, therapistUser, locale = "en") {
      if (!clientUser?.email) return;

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: clientUser.email,
        ...copyFor(locale).therapistCancelled({
          clientName: clientUser.username || fallbackNamesFor(locale).client,
          therapistName: therapistUser?.username || fallbackNamesFor(locale).therapist,
          when: uk(appointment.scheduled_at),
        }),
      });
    }
  
    /**
     * Therapist edited/deleted a slot and proposes new times to the client.
     * `alternatives` are ISO strings (Europe/London in your UI), we format them here.
     */
    async sendTherapistProposedRescheduleEmail(appointment, clientUser, therapistUser, alternatives = [], locale = "en") {
      if (!clientUser?.email) return;

      const names = fallbackNamesFor(locale);
      const altLines = (alternatives || [])
        .map((a) => `• ${Number.isNaN(new Date(a).getTime()) ? a : uk(a)}`)
        .join("\n");

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: clientUser.email,
        ...copyFor(locale).proposedReschedule({
          clientName: clientUser.username || names.client,
          therapistName: therapistUser?.username || names.therapist,
          when: uk(appointment.scheduled_at),
          altLines,
        }),
      });
    }
  
    /**
     * Therapist updated schedule and we auto-rejected a pending request.
     */
    async sendPendingRequestRejectedEmail(appointment, clientUser, therapistUser, locale = "en") {
      if (!clientUser?.email) return;

      const names = fallbackNamesFor(locale);
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: clientUser.email,
        ...copyFor(locale).pendingRejected({
          clientName: clientUser.username || names.client,
          therapistName: therapistUser?.username || names.therapistPlain,
          when: uk(appointment.scheduled_at),
        }),
      });
    }
  
    /**
     * (Optional) Small helper to send a summary back to the therapist after a bulk change.
     */
    async sendTherapistAvailabilityChangeSummary(therapistUser, { action, date, slot, affectedCounts }, locale = "en") {
      if (!therapistUser?.email) return;
      const { cancelled = 0, proposed = 0, rejected = 0 } = affectedCounts || {};

      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: therapistUser.email,
        ...copyFor(locale).availabilitySummary({
          therapistName: therapistUser.username || fallbackNamesFor(locale).therapistTitle,
          action,
          date,
          slot,
          cancelled,
          proposed,
          rejected,
        }),
      });
    }

    async sendContactMessage({ name, email, message, page }) {
      // Send to a dedicated contact address if set, otherwise fall back to the SMTP user
      const to = process.env.CONTACT_EMAIL || process.env.SMTP_USER || process.env.EMAIL_FROM;
      if (!to) throw new Error("No contact email configured (set CONTACT_EMAIL or SMTP_USER)");

      // Gmail requires the FROM address to match the authenticated SMTP user
      const from = `EmpathAI <${process.env.SMTP_USER || process.env.EMAIL_FROM}>`;

      const subject = `[EmpathAI] Contact form message from ${name}`;
      const text =
`Name: ${name}
Email: ${email}
Page: ${page || "unknown"}
---
${message}`;

      await this.transporter.sendMail({ from, to, subject, text, replyTo: email });
    }
}

export default new EmailService();
