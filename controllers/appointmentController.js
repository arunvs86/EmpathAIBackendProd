import appointmentService from "../services/appointments/appointmentService.js"

class AppointmentController {
    /**
     *  Book a Therapy Session
     */
    async bookSession(req, res) {
        try {
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
            const therapistId = req.user.id;
            const { decision } = req.body; 
            const result = await appointmentService.handleAppointmentDecision(therapistId, req.params.id, decision);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async cancelAppointment(req, res) {
        try {
            const userId = req.user.id;
            const role = req.user.role; 
            const result = await appointmentService.cancelAppointment(userId, req.params.id, role);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async requestReschedule(req, res) {
        try {
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
          // The therapist's ID is passed as a URL parameter.
          const therapistId = req.params.id;
          
          // Call the service to fetch all appointments for this therapist.
          const appointments = await appointmentService.getAppointmentsByTherapist(therapistId);
          
          // Return the appointments as JSON.
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
      
}

export default new AppointmentController();
