// services/appointments/appointmentService.js
import { Op } from "sequelize";
import { sequelize } from "../../config/postgres.js";
import Appointments from "../../models/Appointments.js";
import Therapist from "../../models/Therapist.js";
import TherapistAvailability from "../../models/TherapistAvailability.js";
import User from "../../models/User.js";
import emailService from "../email/emailService.js";
import { DateTime } from "luxon";
// import createMeetEvent from "../../utils/calender.js"; // if you still use it
import { createGoogleMeetEvent } from "../googleCalendarService.js";
import therapistAvailabilityService from "../therapists/therapistAvailabilityService.js";
import axios from "axios";

 const toUKIso = (jsDate) =>
   DateTime.fromJSDate(jsDate, { zone: 'utc' })
     .setZone('Europe/London')
     .toISO({ suppressMilliseconds: true, includeOffset: true });

function parseSlot(slotStr = '') {
  // Normalize dash variants and spaces
  const cleaned = String(slotStr)
    .trim()
    .replace(/[—–−]/g, '-')  // em/en/minus → plain hyphen
    .replace(/\s*/g, '');    // remove all spaces

  const [start, end] = cleaned.split('-');
  if (!start || !end) return null;

  const toMin = (hhmm) => {
    const [h, m] = String(hhmm).split(':').map(Number);
    return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : NaN;
  };

  const startMin = toMin(start);
  const endMin   = toMin(end);

  if (!Number.isFinite(startMin) || !Number.isFinite(endMin) || endMin <= startMin) {
    return null;
  }
  return { startMin, endMin, start, end };
}


class AppointmentService {
  /**
   * Book a session (creates a PENDING appointment if slot is available)
   */
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

    const therapistUser = await User.findByPk(therapistDetails.user_id);
    if (!therapistUser) throw new Error("Therapist user not found.");

const availRecords = await TherapistAvailability.findAll({
  // where: { therapist_id, status: 'available' },
  where: { therapist_id },

});
if (!availRecords.length) {
  throw new Error("Therapist has not set any availability.");
}

// 3) Merge date -> unique raw slot strings
const masterMap = {};
for (const rec of availRecords) {
  const slotsObj = rec.selected_time_slots;
  if (!slotsObj || typeof slotsObj !== "object") continue;

  for (const [dateStr, slotArr] of Object.entries(slotsObj)) {
    if (!Array.isArray(slotArr)) continue;
    const set = (masterMap[dateStr] ||= new Set());
    for (const s of slotArr) set.add(String(s).trim());
  }
}

// 4) Normalize & parse + sort by start time
const mergedSlotsByDate = {};
for (const [dateStr, slotSet] of Object.entries(masterMap)) {
  const arr = [];
  for (const raw of slotSet) {
    const p = parseSlot(raw); // <- uses your helper above
    if (p) arr.push(p);
  }
  arr.sort((a, b) => a.startMin - b.startMin);
  mergedSlotsByDate[dateStr] = arr;
}

// 5) Parse requested time (respect offset, then London)
const dt = DateTime.fromISO(scheduled_at, { setZone: true }).setZone("Europe/London");
if (!dt.isValid) throw new Error("Invalid scheduled_at format.");

const reqDate = dt.toFormat("yyyy-MM-dd");
const reqMinutes = dt.hour * 60 + dt.minute;

// 6) Ensure the requested time falls within any configured slot (end exclusive)
const parsedSlots = mergedSlotsByDate[reqDate] || [];
const fits = parsedSlots.some(({ startMin, endMin }) => reqMinutes >= startMin && reqMinutes < endMin);

if (!fits) {
  console.warn('[bookSession no-fit]', {
    reqDate,
    reqTime: dt.toFormat('HH:mm'),
    reqMinutes,
    available: parsedSlots.map(s => `${s.start}-${s.end}`),
  });
  throw new Error("Therapist is not available at the requested time.");
}


    // 7) Conflict: already confirmed at this exact time?
    const scheduledAtUTC = dt.toUTC().toJSDate();
    const conflict = await Appointments.findOne({
      where: {
        therapist_id,
        scheduled_at: scheduledAtUTC,
        status: "confirmed",
      },
    });
    if (conflict) throw new Error("Slot already taken.");

    // 8) Create PENDING appointment + questionnaire answers
    const newAppointment = await Appointments.create({
      user_id: userId,
      therapist_id,
      scheduled_at: scheduledAtUTC,
      session_duration,
      session_type,
      status: "pending",
      primary_concern,
      attended_before,
      session_goals,
      additional_details,
    });

    // 9) Mark one availability record as "requested" (optional visual cue)
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

    // 10) Notify therapist
    await emailService.sendAppointmentRequestEmail(newAppointment, user, therapistUser);

    return {
      message: "Appointment request sent successfully!",
      appointment: newAppointment,
    };
  }

//   async handleAppointmentDecision(therapistUserId, appointmentId, decision) {
//     // Map auth user -> Therapist row
//     const therapistRow = await Therapist.findOne({ where: { user_id: therapistUserId } });
//     if (!therapistRow) throw new Error("Therapist record not found.");
  
//     // Wrap only DB mutations in a transaction
//     return sequelize.transaction(async (tx) => {
//       // Load the appointment that belongs to this therapist
//       const appointment = await Appointments.findOne({
//         where: { id: appointmentId, therapist_id: therapistRow.id },
//         transaction: tx,
//         lock: tx.LOCK.UPDATE,
//       });
  
//       if (!appointment) {
//         throw new Error("Appointment not found or unauthorized.");
//       }
//       if (appointment.status !== "pending") {
//         throw new Error("Appointment has already been processed.");
//       }
  
//       // Preload users we’ll need later (inside tx for consistency)
//       const clientUser = await User.findByPk(appointment.user_id, { transaction: tx });
//       const therapistUser = await User.findByPk(therapistRow.user_id, { transaction: tx });
  
//       if (decision === "accept") {
//         // 1) Confirm appointment immediately
//         await appointment.update({ status: "confirmed" }, { transaction: tx });
  
//         // 2) Mark availability as booked for the matching record
//         // const apptDT   = new Date(appointment.scheduled_at);
//         // const apptDate = apptDT.toISOString().split("T")[0];
//         // const apptMin  = apptDT.getHours() * 60 + apptDT.getMinutes();

//         const apptLux  = DateTime.fromJSDate(appointment.scheduled_at, { zone: 'utc' })
//                          .setZone('Europe/London');           // view in UK
//  const apptDate = apptLux.toFormat('yyyy-LL-dd');             // e.g. "2025-10-22"
//  const apptMin  = apptLux.hour * 60 + apptLux.minute;         // minutes since midnight (UK)
  
//         const availRecs = await TherapistAvailability.findAll({
//           where: { therapist_id: therapistRow.id },
//           transaction: tx,
//           lock: tx.LOCK.UPDATE,
//         });
  
//         for (const rec of availRecs) {
//           const slotsArr = rec.selected_time_slots?.[apptDate] || [];
//           const matches = slotsArr.some((slotStr) => {
//             const [startStr, endStr] = slotStr.split(/\s*[–-]\s*/);
//             const [h1, m1] = (startStr || "").split(":").map(Number);
//             const [h2, m2] = (endStr || "").split(":").map(Number);
//             if ([h1, m1, h2, m2].some(isNaN)) return false;
//             const s = h1 * 60 + m1;
//             const e = h2 * 60 + m2;
//             return apptMin >= s && apptMin < e;
//           });
//           if (matches) {
//             await rec.update({ status: "booked" }, { transaction: tx });
//           }
//         }
  
//         // 3) Bulk-reject other pendings at same slot atomically
//         await Appointments.update(
//           { status: "rejected" },
//           {
//             where: {
//               therapist_id: therapistRow.id,
//               scheduled_at: appointment.scheduled_at,
//               status: "pending",
//               id: { [Op.ne]: appointment.id },
//             },
//             transaction: tx,
//           }
//         );
  
//         // Fetch those newly rejected so we can email them after commit
//         const rejectedList = await Appointments.findAll({
//           where: {
//             therapist_id: therapistRow.id,
//             scheduled_at: appointment.scheduled_at,
//             status: "rejected",
//           },
//           transaction: tx,
//         });
  
//         // ---- Do slow/fragile work AFTER COMMIT ----
//         tx.afterCommit(async () => {
//           try {
//             // Create (optional) Google Meet link, then update the appt
//             let googleMeetLink = null;
//             if (therapistUser?.google_tokens) {
//               try {
//                 const start = new Date(appointment.scheduled_at);
//                 const end = new Date(start.getTime() + 30 * 60000); // +30 min
//                 googleMeetLink = await createGoogleMeetEvent(
//                   therapistUser.google_tokens,
//                   `Session with ${clientUser?.username || "client"}`,
//                   start.toISOString(),
//                   end.toISOString()
//                 );
//               } catch (err) {
//                 console.error("Google Meet creation failed:", err.message);
//               }
//             }
//             if (googleMeetLink) {
//               await Appointments.update(
//                 { meet_url: googleMeetLink },
//                 { where: { id: appointment.id } }
//               );
//             }
  
//             // Send confirmation emails to client & therapist
//             try {
//               await emailService.sendAppointmentConfirmationEmail(
//                 appointment,
//                 clientUser,
//                 therapistUser,
//                 googleMeetLink || null
//               );
//             } catch (e) {
//               console.error("sendAppointmentConfirmationEmail failed:", e.message);
//             }
  
//             // Notify users whose pending got rejected for that slot
//             try {
//               // batch their user records
//               const ids = [...new Set(rejectedList.map(r => r.user_id))];
//               const users = await User.findAll({ where: { id: ids }, attributes: ["id", "email", "username"] });
//               const userMap = Object.fromEntries(users.map(u => [u.id, u]));
//               for (const rej of rejectedList) {
//                 try {
//                   await emailService.sendSlotTakenEmail(rej, userMap[rej.user_id], therapistUser);
//                 } catch (e) {
//                   console.error("sendSlotTakenEmail failed:", e.message);
//                 }
//               }
//             } catch (e) {
//               console.error("Rejected notifications failed:", e.message);
//             }
//           } catch (e) {
//             // Never throw here — post-commit work should not affect API result
//             console.error("afterCommit failed:", e.message);
//           }
//         });
  
//       } else if (decision === "reject") {
//         // Just reject this pending request
//         await appointment.update({ status: "rejected" }, { transaction: tx });
  
//         // Email after commit
//         tx.afterCommit(async () => {
//           try {
//             await emailService.sendRejectionEmail(appointment, clientUser, therapistUser);
//           } catch (e) {
//             console.error("sendRejectionEmail failed:", e.message);
//           }
//         });
//       } else {
//         throw new Error("Invalid decision. Use 'accept' or 'reject'.");
//       }
  
//       return { message: `Appointment ${decision === "accept" ? "confirmed" : "rejected"} successfully!` };
//     });
//   }

async handleAppointmentDecision(therapistUserId, appointmentId, decision) {
  // Map auth user -> Therapist row
  const therapistRow = await Therapist.findOne({ where: { user_id: therapistUserId } });
  if (!therapistRow) throw new Error("Therapist record not found.");

  // Only DB mutations inside the transaction
  return sequelize.transaction(async (tx) => {
    // 1. Load the appointment (and lock it so no race conditions)
    const appointment = await Appointments.findOne({
      where: { id: appointmentId, therapist_id: therapistRow.id },
      transaction: tx,
      lock: tx.LOCK.UPDATE,
    });

    if (!appointment) {
      throw new Error("Appointment not found or unauthorized.");
    }
    if (appointment.status !== "pending") {
      throw new Error("Appointment has already been processed.");
    }

    // 2. Fetch both sides' User rows (inside tx for consistency)
    const clientUser = await User.findByPk(appointment.user_id, { transaction: tx });
    const therapistUser = await User.findByPk(therapistRow.user_id, { transaction: tx });

    if (decision === "accept") {
      //
      // ACCEPT BRANCH
      //

      // A) Mark this appointment confirmed
      await appointment.update({ status: "confirmed" }, { transaction: tx });

      // B) Mark matching availability as "booked"
      const apptLux = DateTime.fromJSDate(appointment.scheduled_at, { zone: "utc" })
        .setZone("Europe/London"); // interpret in UK time for slot matching
      const apptDate = apptLux.toFormat("yyyy-LL-dd"); // e.g. "2025-10-22"
      const apptMin = apptLux.hour * 60 + apptLux.minute; // minutes since midnight in UK

      const availRecs = await TherapistAvailability.findAll({
        where: { therapist_id: therapistRow.id },
        transaction: tx,
        lock: tx.LOCK.UPDATE,
      });

      for (const rec of availRecs) {
        const slotsArr = rec.selected_time_slots?.[apptDate] || [];
        const matches = slotsArr.some((slotStr) => {
          const [startStr, endStr] = slotStr.split(/\s*[–-]\s*/);
          const [h1, m1] = (startStr || "").split(":").map(Number);
          const [h2, m2] = (endStr || "").split(":").map(Number);
          if ([h1, m1, h2, m2].some(isNaN)) return false;
          const s = h1 * 60 + m1;
          const e = h2 * 60 + m2;
          return apptMin >= s && apptMin < e;
        });

        if (matches) {
          await rec.update({ status: "booked" }, { transaction: tx });
        }
      }

      // C) Auto-reject every OTHER pending request for that exact slot
      await Appointments.update(
        { status: "rejected" },
        {
          where: {
            therapist_id: therapistRow.id,
            scheduled_at: appointment.scheduled_at,
            status: "pending",
            id: { [Op.ne]: appointment.id },
          },
          transaction: tx,
        }
      );

      // D) We'll need those rejected appointments to email them later
      const rejectedList = await Appointments.findAll({
        where: {
          therapist_id: therapistRow.id,
          scheduled_at: appointment.scheduled_at,
          status: "rejected",
        },
        transaction: tx,
      });

      //
      // E) AFTER COMMIT SIDE EFFECTS
      //
      tx.afterCommit(async () => {
        try {
          //
          // 1. Generate EmpathAI Meet links
          //
          let clientLink = null;
          let proLink = null;

          try {
            const { data } = await axios.post(
              "https://empathaimeet.onrender.com/api/v1/links",
              {
                professionalsFullName: therapistUser.username,
                proId: therapistUser.id,
                clientName: clientUser.username,
                apptDate: new Date(appointment.scheduled_at).getTime(),
              },
              { headers: { "Content-Type": "application/json" } }
            );

            console.log("data", data)
            clientLink = data?.clientLink || null;
            proLink = data?.proLink || null;
          } catch (err) {
            console.error("Could not generate meeting links:", err?.message || err);
          }

          //
          // 2. Save the links back onto the appointment row
          //
          // We have new TEXT columns: client_url, pro_url.
          // We also try to mirror proLink into meet_url (<=500 chars) for legacy UIs.
          try {
            const meetUrlToStore =
              proLink && proLink.length <= 500 ? proLink : null;

            await Appointments.update(
              {
                client_url: clientLink || null,
                pro_url: proLink || null,
                meet_url: meetUrlToStore, // keep old column happy if it fits
              },
              { where: { id: appointment.id } }
            );
          } catch (err) {
            console.error("Failed to store meeting URLs on appointment:", err?.message || err);
          }

          //
          // 3. Send confirmation emails to both parties
          //
          try {
            // NOTE: we changed the signature so we pass links explicitly
            await emailService.sendAppointmentConfirmationEmail(
              appointment,
              clientUser,
              therapistUser,
              {
                clientLink,
                proLink,
              }
            );
          } catch (e) {
            console.error("sendAppointmentConfirmationEmail failed:", e.message);
          }

          //
          // 4. Email everyone else who lost the slot
          //
          try {
            const ids = [...new Set(rejectedList.map((r) => r.user_id))];
            const users = await User.findAll({
              where: { id: ids },
              attributes: ["id", "email", "username"],
            });
            const userMap = Object.fromEntries(
              users.map((u) => [u.id, u])
            );

            for (const rej of rejectedList) {
              try {
                await emailService.sendSlotTakenEmail(
                  rej,
                  userMap[rej.user_id],
                  therapistUser
                );
              } catch (e) {
                console.error("sendSlotTakenEmail failed:", e.message);
              }
            }
          } catch (e) {
            console.error("Rejected notifications failed:", e.message);
          }
        } catch (e) {
          // IMPORTANT: never throw in afterCommit.
          console.error("afterCommit post-accept failed:", e.message);
        }
      });

    } else if (decision === "reject") {
      //
      // REJECT BRANCH
      //

      // A) mark this appointment rejected
      await appointment.update({ status: "rejected" }, { transaction: tx });

      // B) tell the client after commit
      tx.afterCommit(async () => {
        try {
          await emailService.sendRejectionEmail(
            appointment,
            clientUser,
            therapistUser
          );
        } catch (e) {
          console.error("sendRejectionEmail failed:", e.message);
        }
      });

    } else {
      throw new Error("Invalid decision. Use 'accept' or 'reject'.");
    }

    return {
      message: `Appointment ${
        decision === "accept" ? "confirmed" : "rejected"
      } successfully!`,
    };
  });
}

  
  /**
   * Cancel an appointment (user or therapist via role)
   */
  async cancelAppointment(userId, appointmentId, role) {
    const appointment = await Appointments.findOne({ where: { id: appointmentId } });
    if (!appointment) throw new Error("Appointment not found.");

    if (!["therapist", "user"].includes(role)) {
      throw new Error("Unauthorized: Only users or therapists can cancel sessions.");
    }
    if (role === "user" && appointment.user_id !== userId) {
      throw new Error("Unauthorized: You can only cancel your own appointments.");
    }
    if (role === "therapist") {
      const therapist = await Therapist.findOne({ where: { user_id: userId } });
      if (!therapist || appointment.therapist_id !== therapist.id) {
        throw new Error("Unauthorized: You can only cancel your own sessions.");
      }
    }
    if (!["pending", "confirmed"].includes(appointment.status)) {
      throw new Error("Cannot cancel an appointment that is already processed.");
    }

    appointment.status = "cancelled";
    await appointment.save();

    return { message: "Appointment cancelled successfully!" };
  }

  /**
   * User requests a reschedule (keeps simple validation vs availability)
   */
  async requestReschedule(userId, appointmentId, newScheduledAt) {
    const appointment = await Appointments.findOne({ where: { id: appointmentId } });
    if (!appointment) throw new Error("Appointment not found.");
    if (appointment.user_id !== userId) {
      throw new Error("Unauthorized: You can only reschedule your own appointments.");
    }
    if (appointment.status !== "confirmed") {
      throw new Error("Only confirmed appointments can be rescheduled.");
    }

    const availability = await TherapistAvailability.findOne({
      where: { therapist_id: appointment.therapist_id },
    });
    if (!availability) throw new Error("Therapist has not set availability.");

    const dt = DateTime.fromISO(newScheduledAt, { zone: "Europe/London" });
    if (!dt.isValid) throw new Error("Invalid newScheduledAt.");
    const requestedDate = dt.toFormat("yyyy-MM-dd");
    const requestedTime = dt.toFormat("HH:mm");

    const slots = availability.selected_time_slots?.[requestedDate] || [];
    const fits = slots.some((slot) => {
      const [start, end] = slot.split(/\s*[–-]\s*/);
      return requestedTime >= start && requestedTime < end;
    });
    if (!fits) throw new Error("Therapist is not available at the requested time.");

    appointment.status = "reschedule_pending";
    appointment.scheduled_at = dt.toUTC().toJSDate();
    await appointment.save();

    return { message: "Reschedule request sent successfully!" };
  }

  /**
   * Approve/Reject a reschedule request (simple path)
   */
  async handleRescheduleDecision(therapistId, appointmentId, decision) {
    const therapist = await Therapist.findOne({ where: { user_id: therapistId } });
    if (!therapist) throw new Error("Therapist not found.");

    const appointment = await Appointments.findOne({
      where: { id: appointmentId, therapist_id: therapist.id },
    });
    if (!appointment) throw new Error("Appointment not found or unauthorized.");
    if (appointment.status !== "reschedule_pending") {
      throw new Error("No pending reschedule request for this appointment.");
    }

    if (decision === "accept") {
      appointment.status = "confirmed";
    } else if (decision === "reject") {
      appointment.status = "confirmed"; // keep original time
    } else {
      throw new Error("Invalid decision. Use 'accept' or 'reject'.");
    }

    await appointment.save();
    return { message: `Reschedule request ${decision}ed successfully!` };
  }

  /**
   * New: Therapist proposes alternative times (bulk proposals)
   */
  async proposeTimes(therapistUserId, appointmentId, proposed_slots = [], note) {
    if (!Array.isArray(proposed_slots) || proposed_slots.length === 0) {
      throw new Error("proposed_slots is required (array of ISO datetimes).");
    }

    const therapist = await Therapist.findOne({ where: { user_id: therapistUserId } });
    if (!therapist) throw new Error("Therapist not found.");

    return await sequelize.transaction(async (tx) => {
      const appt = await Appointments.findOne({
        where: { id: appointmentId, therapist_id: therapist.id },
        transaction: tx,
        lock: tx.LOCK.UPDATE,
      });
      if (!appt) throw new Error("Appointment not found or unauthorized.");
      if (!["pending", "confirmed", "reschedule_pending"].includes(appt.status)) {
        throw new Error("Appointment not in a state that can be proposed.");
      }

      await appt.update(
        {
          status: "reschedule_pending",
          proposed_slots: proposed_slots,
          proposal_expires_at: DateTime.now().plus({ days: 2 }).toJSDate(),
        },
        { transaction: tx }
      );

      // Optional: email user with proposals (note)
      // await emailService.sendRescheduleProposalEmail(appt, proposed_slots, note);

      return { message: "Reschedule proposals sent." };
    });
  }

  /**
   * New: Client accepts one of the proposed times
   */
  async acceptProposal(userId, appointmentId, chosen_time) {
    if (!chosen_time) throw new Error("chosen_time is required.");
    const chosen = DateTime.fromISO(chosen_time, { zone: "Europe/London" });
    if (!chosen.isValid) throw new Error("Invalid chosen_time.");

    return await sequelize.transaction(async (tx) => {
      const appt = await Appointments.findOne({
        where: { id: appointmentId, user_id: userId },
        transaction: tx,
        lock: tx.LOCK.UPDATE,
      });
      if (!appt) throw new Error("Appointment not found or unauthorized.");
      if (appt.status !== "reschedule_pending") throw new Error("No pending proposal.");

      // Move time & confirm
      const chosenUTC = chosen.toUTC().toJSDate();
      await appt.update(
        {
          scheduled_at: chosenUTC,
          status: "confirmed",
          proposed_slots: [],
          proposal_expires_at: null,
        },
        { transaction: tx }
      );

      // Remove newly chosen slot from availability
      const dateStr = chosen.toFormat("yyyy-MM-dd");
      const startStr = chosen.toFormat("HH:mm");
      const endStr = chosen.plus({ minutes: 30 }).toFormat("HH:mm");
      const slot = `${startStr}-${endStr}`;

      const therapist = await Therapist.findByPk(appt.therapist_id, { transaction: tx });
      const therapistUserId = therapist.user_id;

      try {
        await therapistAvailabilityService.deleteTimeSlot(therapistUserId, dateStr, slot);
      } catch (e) {
        console.error("Failed to remove booked slot after proposal accept:", e.message);
      }

      // Optional: recreate/update Meet link & email both parties

      return { message: "Reschedule accepted and confirmed." };
    });
  }

  /**
   * New: Client rejects therapist proposals
   */
  async rejectProposal(userId, appointmentId) {
    return await sequelize.transaction(async (tx) => {
      const appt = await Appointments.findOne({
        where: { id: appointmentId, user_id: userId },
        transaction: tx,
        lock: tx.LOCK.UPDATE,
      });
      if (!appt) throw new Error("Appointment not found or unauthorized.");
      if (appt.status !== "reschedule_pending") throw new Error("No pending proposal.");

      await appt.update(
        { status: "confirmed", proposed_slots: [], proposal_expires_at: null },
        { transaction: tx }
      );

      // Optional: email both parties

      return { message: "Reschedule proposal rejected. Original time kept." };
    });
  }

  /**
   * Fetch all appointments for a therapist (param is therapist USER id)
   */
  async getAppointmentsByTherapist(therapistUserId) {
    const therapist = await Therapist.findOne({
      where: { user_id: therapistUserId },
      attributes: ["id"],
    });
    if (!therapist) throw new Error("Therapist record not found.");

    const appointments = await Appointments.findAll({
      where: { therapist_id: therapist.id },
      order: [["created_at", "DESC"]],
    });
    return appointments;
  }

  /**
   * Upcoming appointments for sidebar (role-aware)
   */
  // async getUpcomingAppointments(userId, role) {
  //   // const now = new Date();
  //   const now = DateTime.utc().toJSDate(); // compare in UTC


  //   let appts = [];
  //   if (role === "therapist") {
  //     const therapist = await Therapist.findOne({
  //       where: { user_id: userId },
  //       attributes: ["id"],
  //     });
  //     if (!therapist) throw new Error("Therapist record not found.");

  //     appts = await Appointments.findAll({
  //       where: {
  //         therapist_id: therapist.id,
  //         status: "confirmed",
  //         scheduled_at: { [Op.gte]: now },
  //       },
  //       order: [["scheduled_at", "ASC"]],
  //     });

  //     // map user ids → usernames
  //     const clientIds = [...new Set(appts.map((a) => a.user_id))];
  //     const clients = await User.findAll({
  //       where: { id: clientIds },
  //       attributes: ["id", "username"],
  //     });
  //     const clientMap = Object.fromEntries(clients.map((u) => [u.id, u.username]));

  //     return appts.map((a) => {
  //       const obj = a.toJSON();
  //       return { ...obj, counterpart: clientMap[a.user_id] || "Unknown client",scheduled_at_uk_iso: toUKIso(a.scheduled_at) };
  //     });
  //   } else {
  //     // regular user
  //     appts = await Appointments.findAll({
  //       where: {
  //         user_id: userId,
  //         status: "confirmed",
  //         scheduled_at: { [Op.gte]: now },
  //       },
  //       order: [["scheduled_at", "ASC"]],
  //     });

  //     // map therapist id → therapist user id → username
  //     const therapistIds = [...new Set(appts.map((a) => a.therapist_id))];
  //     const therapists = await Therapist.findAll({
  //       where: { id: therapistIds },
  //       attributes: ["id", "user_id"],
  //     });
  //     const therapistToUserId = Object.fromEntries(
  //       therapists.map((t) => [t.id, t.user_id])
  //     );

  //     const therapistUserIds = [...new Set(Object.values(therapistToUserId))];
  //     const users = await User.findAll({
  //       where: { id: therapistUserIds },
  //       attributes: ["id", "username"],
  //     });
  //     const userMap = Object.fromEntries(users.map((u) => [u.id, u.username]));

  //     return appts.map((a) => {
  //       const obj = a.toJSON();
  //       const tUserId = therapistToUserId[a.therapist_id];
  //       return { ...obj, counterpart: userMap[tUserId] || "Unknown therapist" , scheduled_at_uk_iso: toUKIso(a.scheduled_at)};
  //     });
  //   }
  // }

  // async getUpcomingAppointments(userId, role) {
  //   const now = DateTime.utc().toJSDate();
  
  //   let appts = [];
  //   if (role === "therapist") {
  //     const therapist = await Therapist.findOne({
  //       where: { user_id: userId },
  //       attributes: ["id"],
  //     });
  //     if (!therapist) throw new Error("Therapist record not found.");
  
  //     appts = await Appointments.findAll({
  //       where: {
  //         therapist_id: therapist.id,
  //         status: "confirmed",
  //         scheduled_at: { [Op.gte]: now },
  //       },
  //       order: [["scheduled_at", "ASC"]],
  //     });
  
  //     // map client usernames
  //     const clientIds = [...new Set(appts.map((a) => a.user_id))];
  //     const clients = await User.findAll({
  //       where: { id: clientIds },
  //       attributes: ["id", "username"],
  //     });
  //     const clientMap = Object.fromEntries(
  //       clients.map((u) => [u.id, u.username])
  //     );
  
  //     return appts.map((a) => {
  //       const obj = a.toJSON();
  //       return {
  //         id: obj.id,
  //         scheduled_at: obj.scheduled_at,
  //         scheduled_at_uk_iso: toUKIso(obj.scheduled_at),
  //         counterpart: clientMap[obj.user_id] || "Unknown client",
  //         join_url: obj.pro_url || obj.meet_url || null, // 👈 therapist link here
  //       };
  //     });
  //   } else {
  //     // role is "user" / client
  //     appts = await Appointments.findAll({
  //       where: {
  //         user_id: userId,
  //         status: "confirmed",
  //         scheduled_at: { [Op.gte]: now },
  //       },
  //       order: [["scheduled_at", "ASC"]],
  //     });
  
  //     // map therapist usernames
  //     const therapistIds = [...new Set(appts.map((a) => a.therapist_id))];
  //     const therapists = await Therapist.findAll({
  //       where: { id: therapistIds },
  //       attributes: ["id", "user_id"],
  //     });
  //     const therapistToUserId = Object.fromEntries(
  //       therapists.map((t) => [t.id, t.user_id])
  //     );
  
  //     const therapistUserIds = [...new Set(Object.values(therapistToUserId))];
  //     const users = await User.findAll({
  //       where: { id: therapistUserIds },
  //       attributes: ["id", "username"],
  //     });
  //     const userMap = Object.fromEntries(users.map((u) => [u.id, u.username]));
  
  //     return appts.map((a) => {
  //       const obj = a.toJSON();
  //       const tUserId = therapistToUserId[a.therapist_id];
  //       return {
  //         id: obj.id,
  //         scheduled_at: obj.scheduled_at,
  //         scheduled_at_uk_iso: toUKIso(obj.scheduled_at),
  //         counterpart: userMap[tUserId] || "Unknown therapist",
  //         join_url: obj.client_url || obj.meet_url || null, // 👈 client link here
  //       };
  //     });
  //   }
  // }

  async getUpcomingAppointments(viewerUserId, viewerRole) {
    const now = DateTime.utc().toJSDate();
  
    // If viewer might be a therapist, try to load their Therapist row to get therapist.id.
    let viewerTherapist = null;
    if (viewerRole === "therapist") {
      viewerTherapist = await Therapist.findOne({
        where: { user_id: viewerUserId },
        attributes: ["id", "user_id"],
      });
    }
    const viewerTherapistId = viewerTherapist ? viewerTherapist.id : null;
  
    // Pull all appointments where this user is either the therapist OR the client.
    // (This covers: therapist seeing their own sessions, AND therapist-as-client seeing sessions they booked)
    const appts = await Appointments.findAll({
      where: {
        status: "confirmed",
        scheduled_at: { [Op.gte]: now },
        [Op.or]: [
          { user_id: viewerUserId },                         // I'm the client
          viewerTherapistId ? { therapist_id: viewerTherapistId } : null, // I'm the therapist
        ].filter(Boolean),
      },
      order: [["scheduled_at", "ASC"]],
    });
  
    // We want counterpart name for display.
    // 1. collect all distinct client user_ids
    const clientIds = [...new Set(appts.map((a) => a.user_id))];
    const clientUsers = await User.findAll({
      where: { id: clientIds },
      attributes: ["id", "username"],
    });
    const clientMap = Object.fromEntries(
      clientUsers.map((u) => [u.id, u.username])
    );
  
    // 2. collect all distinct therapist_ids -> therapist.user_id -> therapist username
    const therapistIds = [...new Set(appts.map((a) => a.therapist_id))];
    const therapistRows = therapistIds.length
      ? await Therapist.findAll({
          where: { id: therapistIds },
          attributes: ["id", "user_id"],
        })
      : [];
    const therapistToUserId = Object.fromEntries(
      therapistRows.map((t) => [t.id, t.user_id])
    );
  
    const therapistUserIds = [...new Set(Object.values(therapistToUserId))];
    const therapistUsers = therapistUserIds.length
      ? await User.findAll({
          where: { id: therapistUserIds },
          attributes: ["id", "username"],
        })
      : [];
    const therapistUserMap = Object.fromEntries(
      therapistUsers.map((u) => [u.id, u.username])
    );
  
    // Build response per appointment
    return appts.map((a) => {
      const obj = a.toJSON();
  
      // figure out who viewer is IN THIS APPOINTMENT
      const isTherapistForThisAppt =
        viewerTherapistId && obj.therapist_id === viewerTherapistId;
      const isClientForThisAppt =
        obj.user_id === viewerUserId;
  
      // select correct session link per appointment
      let join_url = null;
      if (isTherapistForThisAppt) {
        // therapist link
        join_url = obj.pro_url || obj.meet_url || null;
      } else if (isClientForThisAppt) {
        // client link
        join_url = obj.client_url || obj.meet_url || null;
      } else {
        // shouldn't happen, but default safest side (client link)
        join_url = obj.client_url || null;
      }
  
      // pick counterpart display name:
      // - if I'm therapist, counterpart is client username
      // - if I'm client, counterpart is therapist username
      let counterpartName = "Unknown";
      if (isTherapistForThisAppt) {
        counterpartName = clientMap[obj.user_id] || "Unknown client";
      } else if (isClientForThisAppt) {
        const tUserId = therapistToUserId[obj.therapist_id];
        counterpartName = therapistUserMap[tUserId] || "Unknown therapist";
      } else {
        // fallback
        const tUserId = therapistToUserId[obj.therapist_id];
        counterpartName = therapistUserMap[tUserId] || clientMap[obj.user_id] || "Unknown";
      }
  
      return {
        id: obj.id,
        scheduled_at: obj.scheduled_at,
        scheduled_at_uk_iso: toUKIso(obj.scheduled_at),
        counterpart: counterpartName,
        join_url,
      };
    });
  }
  
  

  async getOccupiedSlots(therapistId, { from, to } = {}) {
    const where = { therapist_id: therapistId, status: { [Op.in]: ["pending","confirmed","reschedule_pending"] } };
  
    // bound by [from, to] (Europe/London → UTC)
    if (from) {
      const start = DateTime.fromISO(from, { zone: "Europe/London" }).startOf("day").toUTC().toJSDate();
      where.scheduled_at = { ...(where.scheduled_at || {}), [Op.gte]: start };
    }
    if (to) {
      const end = DateTime.fromISO(to, { zone: "Europe/London" }).endOf("day").toUTC().toJSDate();
      where.scheduled_at = { ...(where.scheduled_at || {}), [Op.lte]: end };
    }
  
    const rows = await Appointments.findAll({
      where,
      attributes: ["scheduled_at", "status", "session_duration"],
      order: [["scheduled_at", "ASC"]],
    });
  
    const occupied = {};
    const rank = { confirmed: 3, reschedule_pending: 2, pending: 1 };
  
    for (const r of rows) {
      const start = DateTime.fromJSDate(r.scheduled_at).setZone("Europe/London");
      const duration = Number(r.session_duration || 30);
      const end = start.plus({ minutes: duration });
  
      // expand to 30-min slots so 60-min appts block both half-hours
      for (
        let cursor = start;
        cursor < end;
        cursor = cursor.plus({ minutes: 30 })
      ) {
        const sH = cursor.toFormat("HH:mm");
        const eH = cursor.plus({ minutes: 30 }).toFormat("HH:mm");
        if (cursor.plus({ minutes: 30 }) > end) break; // only full 30-min blocks
        const dateKey = cursor.toFormat("yyyy-MM-dd");
        const slotKey = `${sH}-${eH}`;
  
        occupied[dateKey] = occupied[dateKey] || {};
        const prev = occupied[dateKey][slotKey];
        if (!prev || rank[r.status] > rank[prev]) {
          occupied[dateKey][slotKey] = r.status; // keep highest-priority status
        }
      }
    }
  
    return occupied;
  }

  async getAppointmentsByTherapist(therapistUserId) {
    const therapist = await Therapist.findOne({
      where: { user_id: therapistUserId },
      attributes: ["id"],
    });
    if (!therapist) throw new Error("Therapist record not found.");
  
    const appts = await Appointments.findAll({
      where: { therapist_id: therapist.id },
      order: [["created_at", "DESC"]],
    });
  
    const userIds = [...new Set(appts.map((a) => a.user_id))];
    const users = await User.findAll({
      where: { id: userIds },
      attributes: ["id", "username", "email", "profile_picture"],
    });
    const userMap = Object.fromEntries(users.map((u) => [u.id, u.toJSON()]));
  
    // append .User to each appointment (shape compatible with your UI)
    return appts.map((a) => {
      const obj = a.toJSON();
      obj.User = userMap[obj.user_id] || null;
      return obj;
    });  

}
}

export default new AppointmentService();
