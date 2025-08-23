import appointmentService from "../services/appointments/appointmentService.js"
import {
    validateBookSessionPayload,
    validateDecisionPayload,
    validateReschedulePayload,
  } from "../validators/appointments.js";
  
class AppointmentController {
    /**
     *  Book a Therapy Session
     */
    async bookSession(req, res) {
        try {
            validateBookSessionPayload(req.body);
            const userId = req.user.id;
            const result = await appointmentService.bookSession(userId, req.body);
            res.status(201).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    /**
     *  Accept/Reject an Appointment
     */
    async handleAppointmentDecision(req, res) {
        try {
            validateDecisionPayload(req.body);
            const therapistId = req.user.id;
            const { decision } = req.body; 
            const result = await appointmentService.handleAppointmentDecision(therapistId, req.params.id, decision);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    // async cancelAppointment(req, res) {
    //     try {
    //         const userId = req.user.id;
    //         const role = req.user.role; 
    //         const result = await appointmentService.cancelAppointment(userId, req.params.id, role);
    //         res.status(200).json(result);
    //     } catch (error) {
    //         res.status(400).json({ error: error.message });
    //     }
    // }

    async cancelAppointment(req, res) {
        try {
          const role = req.user.role;
          if (!["user", "therapist"].includes(role)) throw new Error("Invalid role.");
          const userId = req.user.id;
          const result = await appointmentService.cancelAppointment(userId, req.params.id, role);
          res.status(200).json(result);
        } catch (error) {
          res.status(400).json({ error: error.message });
        }
      }

    async requestReschedule(req, res) {
        try {
            validateReschedulePayload(req.body);
            const userId = req.user.id;
            const { newScheduledAt } = req.body;
            const result = await appointmentService.requestReschedule(userId, req.params.id, newScheduledAt);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    /**
     *  Approve/Reject Rescheduling Request
     */
    async handleRescheduleDecision(req, res) {
        try {
            validateDecisionPayload(req.body);
            const therapistId = req.user.id;
            const { decision } = req.body;
            const result = await appointmentService.handleRescheduleDecision(therapistId, req.params.id, decision);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async getTherapistAppointments(req, res) {
      try {
        const therapistId = req.params.id; // therapist's User.id
        const appointments = await appointmentService.getAppointmentsByTherapist(therapistId);
        res.status(200).json(appointments);
      } catch (error) {
        console.error("Error in getTherapistAppointments:", error);
        res.status(400).json({ error: error.message });
      }
      }

      async getUpcomingAppointments(req, res) {
        try {
          const userId = req.user.id;
          const role   = req.user.role; // "therapist" or "user"
          const appointments = await appointmentService.getUpcomingAppointments(userId, role);
          res.status(200).json(appointments);
        } catch (error) {
          console.error("Error in getUpcomingAppointments:", error);
          res.status(400).json({ error: error.message });
        }
      }

      async proposeTimes(req, res) {
        try {
          const therapistUserId = req.user.id;
          const { proposed_slots, note } = req.body;
          const result = await appointmentService.proposeTimes(
            therapistUserId, req.params.id, proposed_slots, note
          );
          res.status(200).json(result);
        } catch (e) {
          res.status(400).json({ error: e.message });
        }
      }
    
      async acceptProposal(req, res) {
        try {
          const userId = req.user.id;
          const { chosen_time } = req.body;
          const result = await appointmentService.acceptProposal(userId, req.params.id, chosen_time);
          res.status(200).json(result);
        } catch (e) {
          res.status(400).json({ error: e.message });
        }
      }
    
      async rejectProposal(req, res) {
        try {
          const userId = req.user.id;
          const result = await appointmentService.rejectProposal(userId, req.params.id);
          res.status(200).json(result);
        } catch (e) {
          res.status(400).json({ error: e.message });
        }
      }

      async getOccupiedSlots(req, res) {
        try {
          const therapistId = req.params.id;        // Therapist PK
          const { from, to } = req.query;           // "YYYY-MM-DD"
          const data = await appointmentService.getOccupiedSlots(therapistId, { from, to });
          res.status(200).json(data);
        } catch (err) {
          res.status(400).json({ error: err.message });
        }
      }
}

export default new AppointmentController();
