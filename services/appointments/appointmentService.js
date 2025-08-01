import { Op } from "sequelize";
import { sequelize } from "../../config/postgres.js";
import Appointments from "../../models/Appointments.js";
import Therapist from "../../models/Therapist.js";
import TherapistAvailability from "../../models/TherapistAvailability.js";
import User from "../../models/User.js";
import emailService from "../email/emailService.js";
import createMeetEvent from '../../utils/calender.js';
import { DateTime } from "luxon";
import { createGoogleMeetEvent } from "../googleCalendarService.js";

class AppointmentService {
   
    async bookSession(userId, appointmentData) {
      const {
        therapist_id,
        scheduled_at,
        session_type,
        session_duration,
        primary_concern,
        attended_before,
        session_goals,
        additional_details,
      } = appointmentData;
  
      // 1) Fetch user & therapist
      const user = await User.findByPk(userId);
      if (!user) throw new Error("User not found.");
  
      const therapistDetails = await Therapist.findByPk(therapist_id);
      if (!therapistDetails) throw new Error("Therapist record not found.");
  
      const therapist = await User.findByPk(therapistDetails.user_id);
      if (!therapist) throw new Error("Therapist user not found.");
  
      // 2) Fetch ALL availability records
      const availRecords = await TherapistAvailability.findAll({
        where: { therapist_id },
      });
      if (!availRecords.length) {
        throw new Error("Therapist has not set any availability.");
      }
  
      // 3) Merge into a master map
      const masterMap = {};
      for (const rec of availRecords) {
        const slotsObj = rec.selected_time_slots;
        if (!slotsObj || typeof slotsObj !== "object") continue;
  
        for (const [dateStr, slotArr] of Object.entries(slotsObj)) {
          if (!Array.isArray(slotArr)) continue;
          masterMap[dateStr] = masterMap[dateStr] || new Set();
          for (const slot of slotArr) {
            masterMap[dateStr].add(slot);
          }
        }
      }
  
      // 4) Convert Sets → arrays
      const mergedSlotsByDate = {};
      for (const [dateStr, slotSet] of Object.entries(masterMap)) {
        mergedSlotsByDate[dateStr] = Array.from(slotSet);
      }
  
      // //5) Parse the requested time
      // const requestedDateObj = new Date(scheduled_at);
      // if (isNaN(requestedDateObj)) {
      //   throw new Error("Invalid scheduled_at format.");
      // }
      // const reqDate = requestedDateObj.toISOString().split("T")[0];
      // const reqMinutes =
      //   requestedDateObj.getHours() * 60 + requestedDateObj.getMinutes();

      const dt = DateTime.fromISO(scheduled_at, { zone: "Europe/London" });
      if (!dt.isValid) throw new Error("Invalid scheduled_at format.");

      const reqDate    = dt.toFormat("yyyy-MM-dd");      // e.g. "2025-05-17"
      const reqMinutes = dt.hour * 60 + dt.minute;       // e.g. 12*60 + 15 = 735

      console.log("slots for", reqDate, "→", mergedSlotsByDate[reqDate]);
      console.log("reqDate/reqMinutes:", reqDate, reqMinutes);
  
      // 6) Available slots for that date
      const availableSlotsForDate = mergedSlotsByDate[reqDate] || [];
      console.log(availableSlotsForDate)
      // 7) Check it falls in one of those slots
      const isAvailable = availableSlotsForDate.some((slotStr) => {
        const [startStr, endStr] = slotStr.split(/\s*[–-]\s*/);
        if (!startStr || !endStr) return false;
  
        const [h1, m1] = startStr.split(":").map(Number);
        const [h2, m2] = endStr.split(":").map(Number);
        if ([h1, m1, h2, m2].some(isNaN)) return false;
  
        const startMin = h1 * 60 + m1;
        const endMin = h2 * 60 + m2;
        return reqMinutes >= startMin && reqMinutes < endMin;
      });
  
      if (!isAvailable) {
        throw new Error("Therapist is not available at the requested time.");
      }
  
      // 8) Block if already confirmed
      const conflict = await Appointments.findOne({
        where: {
          therapist_id,
          scheduled_at,
          status: "confirmed",
        },
      });
      if (conflict) {
        throw new Error("Slot already taken.");
      }
  
      // 9) All good — create the **pending** appointment, including questionnaire
      const newAppointment = await Appointments.create({
        user_id: userId,
        therapist_id,
        scheduled_at,
        session_duration,
        session_type,
        status: "pending",
        primary_concern,
        attended_before,
        session_goals,
        additional_details,
      });
  
      // 10) Mark that slot as requested
      {
        // reuse reqDate & reqMinutes
        const matchingAvailability = availRecords.find((rec) => {
          const slotsArr = rec.selected_time_slots?.[reqDate] || [];
          return slotsArr.some((slotStr) => {
            const [startStr, endStr] = slotStr.split(/\s*[–-]\s*/);
            const [h1, m1] = startStr.split(":").map(Number);
            const [h2, m2] = endStr.split(":").map(Number);
            if ([h1, m1, h2, m2].some(isNaN)) return false;
            const startMin = h1 * 60 + m1;
            const endMin = h2 * 60 + m2;
            return reqMinutes >= startMin && reqMinutes < endMin;
          });
        });
        if (matchingAvailability) {
          await matchingAvailability.update({ status: "requested" });
        }
      }
  
      // 11) Send confirmation
      await emailService.sendAppointmentRequestEmail(
        newAppointment,
        user,
        therapist
      );
  
      return {
        message: "Appointment request sent successfully!",
        appointment: newAppointment,
      };
    }
  
    /**
     *  Accept/Reject an Appointment Request
     */
    async handleAppointmentDecision(therapistId, appointmentId, decision) {
      console.log("appointmentid:", appointmentId);
      console.log("therapistid:", therapistId);
  
      const therapist = await Therapist.findOne({
        where: { user_id: therapistId },
      });
  
      return sequelize.transaction(async (tx) => {
        const appointment = await Appointments.findOne({
          where: { id: appointmentId, therapist_id: therapist.id },
          transaction: tx,
        });
  
        console.log("appointment:", appointment);
  
        const user = await User.findByPk(appointment.user_id);
        const therapistDetails = await User.findByPk(therapist.user_id);
        if (!appointment) {
          throw new Error("Appointment not found or unauthorized.");
        }
        if (appointment.status !== "pending") {
          throw new Error("Appointment has already been processed.");
        }
  
        if (decision === "accept") {
          // 1) Confirm appointment
          await appointment.update({ status: "confirmed" }, { transaction: tx });
  
          // 2) Generate & persist Meet link (if you still want this)
          // const meetLink = await createMeetEvent({ … });
          // await appointment.update({ meet_url: meetLink }, { transaction: tx });
  
          // 3) Mark availability as booked
          {
            const apptDateObj = new Date(appointment.scheduled_at);
            const apptDateStr = apptDateObj.toISOString().split("T")[0];
            const apptMinutes =
              apptDateObj.getHours() * 60 + apptDateObj.getMinutes();
  
            const availRecs = await TherapistAvailability.findAll({
              where: { therapist_id: therapist.id },
              transaction: tx,
            });
  
            for (const rec of availRecs) {
              const slotsArr = rec.selected_time_slots?.[apptDateStr] || [];
              const matches = slotsArr.some((slotStr) => {
                const [startStr, endStr] = slotStr.split(/\s*[–-]\s*/);
                const [h1, m1] = startStr.split(":").map(Number);
                const [h2, m2] = endStr.split(":").map(Number);
                if ([h1, m1, h2, m2].some(isNaN)) return false;
                const startMin = h1 * 60 + m1;
                const endMin = h2 * 60 + m2;
                return apptMinutes >= startMin && apptMinutes < endMin;
              });
              if (matches) {
                await rec.update({ status: "booked" }, { transaction: tx });
              }
            }
          }

          let googleMeetLink = null;

if (therapist.google_tokens) {
  try {
    const start = new Date(appointment.scheduled_at);
    const end = new Date(start.getTime() + 30 * 60000); // +30 min

    googleMeetLink = await createGoogleMeetEvent(
      therapist.google_tokens,
      `Session with ${user.username}`,
      start.toISOString(),
      end.toISOString()
    );
  } catch (err) {
    console.error("Google Meet creation failed:", err.message);
  }
}
if (googleMeetLink) {
  await appointment.update({ meet_url: googleMeetLink }, { transaction: tx });
}
          // 4) Send confirmation email
          await emailService.sendAppointmentConfirmationEmail(
            appointment,
            user,
            therapistDetails,
            googleMeetLink
          );
  
          // 5) Bulk‑reject other pendings at same slot
          await Appointments.update(
            { status: "rejected" },
            {
              where: {
                therapist_id: therapist.id,
                scheduled_at: appointment.scheduled_at,
                status: "pending",
                id: { [Op.ne]: appointmentId },
              },
              transaction: tx,
            }
          );
  
          // 6) Notify those users
          const rejectedList = await Appointments.findAll({
            where: {
              therapist_id: therapist.id,
              scheduled_at: appointment.scheduled_at,
              status: "rejected",
            },
            transaction: tx,
          });
          for (const rej of rejectedList) {
            const u = await User.findByPk(rej.user_id, { transaction: tx });
            await emailService.sendSlotTakenEmail(rej, u, therapist);
          }
        } else if (decision === "reject") {
          await appointment.update({ status: "rejected" }, { transaction: tx });
          const u = await User.findByPk(appointment.user_id);
          await emailService.sendRejectionEmail(appointment, u, therapist);
        } else {
          throw new Error("Invalid decision. Use 'accept' or 'reject'.");
        }
  
        return { message: `Appointment ${appointment.status} successfully!` };
      });
    }

    async cancelAppointment(userId, appointmentId, role) {
        
        const appointment = await Appointments.findOne({ where: { id: appointmentId } });
        if (!appointment) throw new Error("Appointment not found.");

        if (role !== "therapist" && role !== "user") {
            throw new Error("Unauthorized: Only users or therapists can cancel sessions.");
        }

        if (role === "user" && appointment.user_id !== userId) {
            throw new Error("Unauthorized: You can only cancel your own appointments.");
        }

        if (role === "therapist" && appointment.therapist_id !== userId) {
            throw new Error("Unauthorized: You can only cancel your own sessions.");
        }

        if (appointment.status !== "pending" && appointment.status !== "confirmed") {
            throw new Error("Cannot cancel an appointment that is already processed.");
        }

        appointment.status = "cancelled";
        await appointment.save();

        return { message: "Appointment cancelled successfully!" };
    }

    async requestReschedule(userId, appointmentId, newScheduledAt) {
        // FIXED: use Appointments, not Appointment
        const appointment = await Appointments.findOne({ where: { id: appointmentId } });
        if (!appointment) throw new Error("Appointment not found.");
        
        if (appointment.user_id !== userId) {
            throw new Error("Unauthorized: You can only reschedule your own appointments.");
        }

        if (appointment.status !== "confirmed") {
            throw new Error("Only confirmed appointments can be rescheduled.");
        }

        const availability = await TherapistAvailability.findOne({
          where: { therapist_id: appointment.therapist_id }
        });
        if (!availability) throw new Error("Therapist has not set availability.");

        const requestedDate = newScheduledAt.split("T")[0]; 
        const requestedTime = newScheduledAt.split("T")[1]; 

        if (
          !availability.selected_time_slots[requestedDate] ||
          !availability.selected_time_slots[requestedDate].some(slot => {
            const [start, end] = slot.split("-");
            return requestedTime >= start && requestedTime < end;
          })
        ) {
            throw new Error("Therapist is not available at the requested time.");
        }

        appointment.status = "reschedule_pending";
        appointment.scheduled_at = newScheduledAt;
        await appointment.save();

        return { message: "Reschedule request sent successfully!" };
    }

    /**
     *  Approve/Reject Rescheduling Request
     */
    async handleRescheduleDecision(therapistId, appointmentId, decision) {
        // FIXED: use Appointments, not Appointment
        const appointment = await Appointments.findOne({
          where: { id: appointmentId, therapist_id: therapistId }
        });
        if (!appointment) throw new Error("Appointment not found or unauthorized.");

        if (appointment.status !== "reschedule_pending") {
            throw new Error("No pending reschedule request for this appointment.");
        }

        if (decision === "accept") {
            appointment.status = "confirmed";
        } else if (decision === "reject") {
            appointment.status = "confirmed"; 
        } else {
            throw new Error("Invalid decision. Use 'accept' or 'reject'.");
        }

        await appointment.save();
        return { message: `Reschedule request ${decision}ed successfully!` };
    }

    async getAppointmentsByTherapist(therapistId) {
      console.log(therapistId)
      const therapist = await Therapist.findOne({
        where: { user_id: therapistId }})
        
        const appointments = await Appointments.findAll({
          where: { therapist_id: therapist.id },
          order: [["created_at", "DESC"]],
        });
        return appointments;
      }

      async getUpcomingAppointments(userId, role) {
        const now = new Date();
    
        let appts = [];
        if (role === "therapist") {
          // 1) find this therapist’s PK
          const therapist = await Therapist.findOne({
            where: { user_id: userId },
            attributes: ["id"],
          });
          if (!therapist) throw new Error("Therapist record not found.");
    
          // 2) load all their confirmed future appointments
          appts = await Appointments.findAll({
            where: {
              therapist_id: therapist.id,
              status: "confirmed",
              scheduled_at: { [Op.gte]: now },
            },
            order: [["scheduled_at", "ASC"]],
          });
    
          // 3) batch‑fetch all clients
          const clientIds = [...new Set(appts.map((a) => a.user_id))];
          const clients = await User.findAll({
            where: { id: clientIds },
            attributes: ["id", "username"],
          });
          const clientMap = Object.fromEntries(
            clients.map((u) => [u.id, u.username])
          );
    
          // 4) map appointments to plain objects with counterpart
          return appts.map((a) => {
            const obj = a.toJSON();
            return {
              ...obj,
              counterpart: clientMap[a.user_id] || "Unknown client",
            };
          });
        } else {
          // regular user
          appts = await Appointments.findAll({
            where: {
              user_id: userId,
              status: "confirmed",
              scheduled_at: { [Op.gte]: now },
            },
            order: [["scheduled_at", "ASC"]],
          });
    
          // 1) find all involved therapists
          const therapistIds = [...new Set(appts.map((a) => a.therapist_id))];
          const therapists = await Therapist.findAll({
            where: { id: therapistIds },
            attributes: ["id", "user_id"],
          });
          const therapistToUserId = Object.fromEntries(
            therapists.map((t) => [t.id, t.user_id])
          );
    
          // 2) batch‑fetch those user records
          const therapistUserIds = [
            ...new Set(Object.values(therapistToUserId)),
          ];
          const users = await User.findAll({
            where: { id: therapistUserIds },
            attributes: ["id", "username"],
          });
          const userMap = Object.fromEntries(
            users.map((u) => [u.id, u.username])
          );
    
          // 3) map appointments
          return appts.map((a) => {
            const obj = a.toJSON();
            const tUserId = therapistToUserId[a.therapist_id];
            return {
              ...obj,
              counterpart: userMap[tUserId] || "Unknown therapist",
            };
          });
        }
      }
}

export default new AppointmentService();
