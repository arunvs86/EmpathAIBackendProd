import nodemailer from "nodemailer";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();

class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: process.env.SMTP_PORT,
            secure: false,
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
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

    async sendAppointmentRequestEmail(appointment, user, therapist) {
        const scheduledAt = new Date(appointment.scheduled_at).toLocaleString();
    
        const mailOptions = {
          from: process.env.EMAIL_FROM,
          to: user.email,
          subject: "Appointment Request - EmpathAI",
          text: `Hello ${user.username},\n\nYour appointment with ${therapist.username} has been requested at ${scheduledAt}.\n\nThank you for choosing EmpathAI.\n\nBest regards,\nEmpathAI Team`,
        };
    
        await this.transporter.sendMail(mailOptions);
      }

async sendAppointmentConfirmationEmail(appointment, user, therapist,googleMeetLink = null) {
  // 1) generate meeting links
  let clientLink, proLink;
  try {
    const { data } = await axios.post(
      "https://empathaimeet.onrender.com/api/v1/links",
      {
        professionalsFullName: therapist.username,
        proId: therapist.id,
        clientName: user.username,
        apptDate: new Date(appointment.scheduled_at).getTime(),
      },
      { headers: { "Content-Type": "application/json" } }
    );

    console.log(data)

    const makeHashUrl = (rawUrl) => {
      const url = new URL(rawUrl);
      return `${url.origin}/#${url.pathname}${url.search}`;
    };

    clientLink = makeHashUrl(data.clientLink);
    proLink    = makeHashUrl(data.proLink);
  } catch (err) {
    console.error("Could not generate meeting links:", err);
  }

  // 2) format date
  const when = new Date(appointment.scheduled_at).toLocaleString();

  // 3) build and send the client email
  const clientMail = {
    from: process.env.EMAIL_FROM,
    to:   user.email,
    subject: "Your EmpathAI Appointment is Confirmed",
    text: `Hello ${user.username},

Your appointment with ${therapist.username} is confirmed for ${when}.
${
  googleMeetLink
    ? `\nJoin your session via Google Meet:\n${googleMeetLink}`
    : clientLink
    ? `\nJoin your session here:\n${clientLink}`
    : ""
}

Thank you for choosing EmpathAI.

Warm regards,
The EmpathAI Team`,
  };

  console.log(clientMail)

  // 4) build and send the pro email
  const proMail = {
    from: process.env.EMAIL_FROM,
    to:   therapist.email,         // make sure you have therapist.email
    subject: "New EmpathAI Appointment Booked",
    text: `Hello ${therapist.username},

You have a new appointment with ${user.username} on ${when}.
${
  googleMeetLink
    ? `\nJoin your session via Google Meet:\n${googleMeetLink}`
    : clientLink
    ? `\nJoin your session here:\n${clientLink}`
    : ""
}

Best of luck,
The EmpathAI Team`,
  };

  console.log(proMail)


  // 5) send both
  await this.transporter.sendMail(clientMail);
  await this.transporter.sendMail(proMail);
}

      async sendSlotTakenEmail(appointment, user, therapist) {
        const scheduledAt = new Date(appointment.scheduled_at).toLocaleString();
    
        const mailOptions = {
          from: process.env.EMAIL_FROM,
          to: user.email,
          subject: "Appointment Slot taken - EmpathAI",
          text: `Hello ${user.username},\n\nYour appointment with ${therapist.username} has been taken by someone else in the queue.\n\nThank you for choosing EmpathAI.\n\nBest regards,\nEmpathAI Team`,
        };
    
        await this.transporter.sendMail(mailOptions);
      }

      async sendRejectionEmail(appointment, user, therapist) {
        const scheduledAt = new Date(appointment.scheduled_at).toLocaleString();
    
        const mailOptions = {
          from: process.env.EMAIL_FROM,
          to: user.email,
          subject: "Appointment denied - EmpathAI",
          text: `Hello ${user.username},\n\nYour appointment with ${therapist.username} has been cancelled due to scheduling reasons.\n\nThank you for choosing EmpathAI.\n\nBest regards,\nEmpathAI Team`,
        };
    
        await this.transporter.sendMail(mailOptions);
      }

  
  async sendCancellationEmail(appointment, cancellerUser, counterpartyUser) {
    const when = new Date(appointment.scheduled_at).toLocaleString();

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
    const oldWhen = new Date(appointment.scheduled_at).toLocaleString();
    const newWhen = new Date(requestedAtISO).toLocaleString();

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
    const oldWhen = new Date(appointment.scheduled_at).toLocaleString();
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
    async sendTherapistCancelledAppointmentEmail(appointment, clientUser, therapistUser) {
      if (!clientUser?.email) return;
      const when = new Date(appointment.scheduled_at).toLocaleString();
  
      const mail = {
        from: process.env.EMAIL_FROM,
        to: clientUser.email,
        subject: "Your EmpathAI session was cancelled",
        text: `Hello ${clientUser.username || "there"},
  
  Your appointment with ${therapistUser?.username || "your therapist"} on ${when} was cancelled because the therapist updated their schedule.
  
  You can book a new time in the app whenever you're ready.
  
  — EmpathAI`,
      };
  
      await this.transporter.sendMail(mail);
    }
  
    /**
     * Therapist edited/deleted a slot and proposes new times to the client.
     * `alternatives` are ISO strings (Europe/London in your UI), we format them here.
     */
    async sendTherapistProposedRescheduleEmail(appointment, clientUser, therapistUser, alternatives = []) {
      if (!clientUser?.email) return;
  
      const when = new Date(appointment.scheduled_at).toLocaleString();
      const altLines = (alternatives || [])
        .map(a => {
          const d = new Date(a);
          return `• ${isNaN(d) ? a : d.toLocaleString()}`;
        })
        .join("\n");
  
      const mail = {
        from: process.env.EMAIL_FROM,
        to: clientUser.email,
        subject: "Your therapist proposed a new time",
        text: `Hello ${clientUser.username || "there"},
  
  Your appointment with ${therapistUser?.username || "your therapist"} (previously ${when}) needs to be moved.
  They've proposed the following alternative time(s):
  
  ${altLines || "• (Open the app to choose a new time)"}
  
  Please open EmpathAI to accept one of the options or pick a different slot.
  
  — EmpathAI`,
      };
  
      await this.transporter.sendMail(mail);
    }
  
    /**
     * Therapist updated schedule and we auto-rejected a pending request.
     */
    async sendPendingRequestRejectedEmail(appointment, clientUser, therapistUser) {
      if (!clientUser?.email) return;
  
      const when = new Date(appointment.scheduled_at).toLocaleString();
      const mail = {
        from: process.env.EMAIL_FROM,
        to: clientUser.email,
        subject: "Your request couldn’t be accepted",
        text: `Hello ${clientUser.username || "there"},
  
  Your pending appointment request with ${therapistUser?.username || "the therapist"} for ${when} couldn’t be accepted because the therapist updated their availability.
  
  Please open EmpathAI to request a different time.
  
  — EmpathAI`,
      };
  
      await this.transporter.sendMail(mail);
    }
  
    /**
     * (Optional) Small helper to send a summary back to the therapist after a bulk change.
     */
    async sendTherapistAvailabilityChangeSummary(therapistUser, { action, date, slot, affectedCounts }) {
      if (!therapistUser?.email) return;
      const { cancelled = 0, proposed = 0, rejected = 0 } = affectedCounts || {};
  
      const subject = `Availability change processed: ${action}`;
      const text = `Hello ${therapistUser.username || "Therapist"},
  
  Your availability change has been applied:
  • Action: ${action}
  • Date/Slot: ${date || "-"} ${slot ? `(${slot})` : ""}
  
  Affected clients:
  • Cancelled: ${cancelled}
  • Proposed reschedule: ${proposed}
  • Auto-rejected (pending): ${rejected}
  
  — EmpathAI`;
  
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM,
        to: therapistUser.email,
        subject,
        text,
      });
    }

    async sendContactMessage({ name, email, message, page }) {
      const to = process.env.CONTACT_EMAIL || process.env.EMAIL_FROM;
      if (!to) throw new Error("CONTACT_EMAIL or EMAIL_FROM not configured");
  
      const subject = `[EmpathAI] Contact form submission from ${name}`;
      const text =
  `Name: ${name}
   Email: ${email}
  ---
  ${message}`;
  
      const mail = {
        from: process.env.EMAIL_FROM,
        to,
        subject,
        text,
        replyTo: email, 
      };
  
      await this.transporter.sendMail(mail);
    }
}

export default new EmailService();
