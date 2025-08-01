import therapistAvailabilityService from "../services/therapists/therapistAvailabilityService.js";

class TherapistAvailabilityController {
  /**
   * Set or Create Therapist Availability
   */
  
  async getAllTherapists(req, res) {
    try {
      const therapists = await therapistAvailabilityService.getAllTherapists();
      res.status(200).json(therapists);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getTherapistById(req, res) {
    try {
      const therapist = await therapistAvailabilityService.getTherapistById(req.params.id);
      res.status(200).json(therapist);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }
  
  async getTherapistByUserId(req, res) {
    try {
      const therapist = await therapistAvailabilityService.getTherapistByUserId(req.params.id);
      res.status(200).json(therapist);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  async setAvailability(req, res) {
    try {
      // user.id is the userId from authMiddleware
      const therapistId = req.user.id;
      const result = await therapistAvailabilityService.setAvailability(therapistId, req.body);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Fetch a Single Therapist's Availability
   */
  async getAvailability(req, res) {
    try {
      const result = await therapistAvailabilityService.getAvailability(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(404).json({ error: error.message });
    }
  }

  /**
   * List ALL Availabilities (optional)
   */
  async listAllAvailabilities(req, res) {
    try {
      const allAvail = await therapistAvailabilityService.listAllAvailabilities();
      res.status(200).json(allAvail);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Update Therapist Availability
   */
  async updateAvailability(req, res) {
    try {
      const therapistId = req.user.id;
      const result = await therapistAvailabilityService.updateAvailability(therapistId, req.body);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Delete a Specific Time Slot
   */
  async deleteTimeSlot(req, res) {
    try {
      const therapistId = req.user.id;
      const { date, timeSlot } = req.body;
      const result = await therapistAvailabilityService.deleteTimeSlot(therapistId, date, timeSlot);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  /**
   * Mark a Time Slot as Booked
   */
  async markSlotAsBooked(req, res) {
    try {
      const therapistId = req.user.id;
      const { date, timeSlot } = req.body;
      const result = await therapistAvailabilityService.markSlotAsBooked(therapistId, date, timeSlot);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAvailabilityForTherapist(req, res) {
    const therapistId = req.params.therapistId;
    console.log(therapistId)
    try {
      const records = await TherapistAvailability.findAll({
        where: { therapist_id: therapistId },
      });
      res.json(records);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  }

}

export default new TherapistAvailabilityController();
