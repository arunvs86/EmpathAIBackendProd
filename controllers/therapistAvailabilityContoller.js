// import therapistAvailabilityService from "../services/therapists/therapistAvailabilityService.js";

// class TherapistAvailabilityController {
//   /**
//    * Set or Create Therapist Availability
//    */
  
//   async getAllTherapists(req, res) {
//     try {
//       const therapists = await therapistAvailabilityService.getAllTherapists();
//       res.status(200).json(therapists);
//     } catch (error) {
//       res.status(400).json({ error: error.message });
//     }
//   }

//   async getTherapistById(req, res) {
//     try {
//       const therapist = await therapistAvailabilityService.getTherapistById(req.params.id);
//       res.status(200).json(therapist);
//     } catch (error) {
//       res.status(404).json({ error: error.message });
//     }
//   }
  
//   async getTherapistByUserId(req, res) {
//     try {
//       const therapist = await therapistAvailabilityService.getTherapistByUserId(req.params.id);
//       res.status(200).json(therapist);
//     } catch (error) {
//       res.status(404).json({ error: error.message });
//     }
//   }

//   async setAvailability(req, res) {
//     try {
//       // user.id is the userId from authMiddleware
//       const therapistId = req.user.id;
//       const result = await therapistAvailabilityService.setAvailability(therapistId, req.body);
//       res.status(200).json(result);
//     } catch (error) {
//       res.status(400).json({ error: error.message });
//     }
//   }

//   /**
//    * Fetch a Single Therapist's Availability
//    */
//   async getAvailability(req, res) {
//     try {
//       const result = await therapistAvailabilityService.getAvailability(req.params.id);
//       res.status(200).json(result);
//     } catch (error) {
//       res.status(400).json({ error: error.message });
//     }
//   }

//   /**
//    * List ALL Availabilities (optional)
//    */
//   async listAllAvailabilities(req, res) {
//     try {
//       const allAvail = await therapistAvailabilityService.listAllAvailabilities();
//       res.status(200).json(allAvail);
//     } catch (error) {
//       res.status(400).json({ error: error.message });
//     }
//   }

//   /**
//    * Update Therapist Availability
//    */
//   async updateAvailability(req, res) {
//     try {
//       const therapistId = req.user.id;
//       const result = await therapistAvailabilityService.updateAvailability(therapistId, req.body);
//       res.status(200).json(result);
//     } catch (error) {
//       res.status(400).json({ error: error.message });
//     }
//   }

//   /**
//    * Delete a Specific Time Slot
//    */
//   async deleteTimeSlot(req, res) {
//     try {
//       const therapistId = req.user.id;
//       const { date, timeSlot } = req.body;
//       const result = await therapistAvailabilityService.deleteTimeSlot(therapistId, date, timeSlot);
//       res.status(200).json(result);
//     } catch (error) {
//       res.status(400).json({ error: error.message });
//     }
//   }

//   /**
//    * Mark a Time Slot as Booked
//    */
//   async markSlotAsBooked(req, res) {
//     try {
//       const therapistId = req.user.id;
//       const { date, timeSlot } = req.body;
//       const result = await therapistAvailabilityService.markSlotAsBooked(therapistId, date, timeSlot);
//       res.status(200).json(result);
//     } catch (error) {
//       res.status(400).json({ error: error.message });
//     }
//   }

//   async getAvailabilityForTherapist(req, res) {
//     try {
//       const therapistId = req.params.therapistId; // this is the Therapist PK
//       const result = await therapistAvailabilityService.getAvailability(therapistId);
//       res.status(200).json(result);
//     } catch (err) {
//       res.status(400).json({ error: err.message });
//     }
//   }

// }

// export default new TherapistAvailabilityController();


import therapistAvailabilityService from "../services/therapists/therapistAvailabilityService.js";

class TherapistAvailabilityController {
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
      const userId = req.user.id; // from auth
      const result = await therapistAvailabilityService.setAvailability(userId, req.body);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async getAvailability(req, res) {
    try {
      const result = await therapistAvailabilityService.getAvailability(req.params.id);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async listAllAvailabilities(req, res) {
    try {
      const allAvail = await therapistAvailabilityService.listAllAvailabilities();
      res.status(200).json(allAvail);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async updateAvailability(req, res) {
    try {
      const userId = req.user.id;
      const result = await therapistAvailabilityService.updateAvailability(userId, req.body);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  async markSlotAsBooked(req, res) {
    try {
      const userId = req.user.id;
      const { date, timeSlot } = req.body;
      const result = await therapistAvailabilityService.markSlotAsBooked(userId, date, timeSlot);
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }

  // GET /therapists/:therapistId/availability (therapist PK)
  async getAvailabilityForTherapist(req, res) {
    try {
      const therapistId = req.params.therapistId;
      const result = await therapistAvailabilityService.getAvailability(therapistId);
      res.status(200).json(result);
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  // GET /therapists/:therapistId/availability/conflicts?date=YYYY-MM-DD&slot=HH:mm-HH:mm
  async previewConflicts(req, res) {
    try {
      const { therapistId } = req.params; // Therapist PK
      const { date, slot } = req.query;
      const data = await therapistAvailabilityService.previewConflicts(therapistId, date, slot);
      res.status(200).json(data);
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  }

  // controllers/therapistAvailabilityContoller.js

// DELETE /therapists/availability/slot  body OR query:
// { date, timeSlot, policy, alternatives }
async deleteTimeSlotWithPolicy(req, res) {
  try {
    // DEBUG LOG
    console.log("[DELETE /therapists/availability/slot] body:", req.body, "query:", req.query);

    const userId = req.user.id;
    const src = (req.body && Object.keys(req.body).length) ? req.body : req.query;

    let { date, timeSlot, policy = "block_on_conflict", alternatives } = src || {};
    if (!date || !timeSlot) throw new Error("date and timeSlot are required.");

    // normalize alternatives if passed via query
    if (typeof alternatives === "string") {
      try { alternatives = JSON.parse(alternatives); } catch { alternatives = [alternatives]; }
    }
    if (!Array.isArray(alternatives)) alternatives = [];

    console.log("[DELETE slot] using policy:", policy, "date:", date, "slot:", timeSlot);

    const out = await therapistAvailabilityService.deleteTimeSlot(
      userId, date, timeSlot, { policy, alternatives }
    );
    res.status(200).json(out);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

// PATCH /therapists/availability/slot  body: { date, oldSlot, newSlot, policy?, alternatives? }
async editTimeSlot(req, res) {
  try {
    console.log("[PATCH /therapists/availability/slot] body:", req.body);

    const userId = req.user.id;
    let { date, oldSlot, newSlot, policy = "block_on_conflict", alternatives } = req.body || {};
    if (!date || !oldSlot || !newSlot) throw new Error("date, oldSlot and newSlot are required.");

    if (typeof alternatives === "string") {
      try { alternatives = JSON.parse(alternatives); } catch { alternatives = [alternatives]; }
    }
    if (!Array.isArray(alternatives)) alternatives = [];

    console.log("[EDIT slot] using policy:", policy, "date:", date, "old:", oldSlot, "new:", newSlot);

    const out = await therapistAvailabilityService.editTimeSlot(
      userId, date, oldSlot, newSlot, { policy, alternatives }
    );
    res.status(200).json(out);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}

// DELETE /therapists/availability/date  body OR query: { date, policy?, alternatives? }
async deleteDate(req, res) {
  try {
    console.log("[DELETE /therapists/availability/date] body:", req.body, "query:", req.query);

    const userId = req.user.id;
    const src = (req.body && Object.keys(req.body).length) ? req.body : req.query;

    let { date, policy = "block_on_conflict", alternatives } = src || {};
    if (!date) throw new Error("date is required.");

    if (typeof alternatives === "string") {
      try { alternatives = JSON.parse(alternatives); } catch { alternatives = [alternatives]; }
    }
    if (!Array.isArray(alternatives)) alternatives = [];

    console.log("[DELETE date] using policy:", policy, "date:", date);

    const out = await therapistAvailabilityService.deleteDate(
      userId, date, { policy, alternatives }
    );
    res.status(200).json(out);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
}


}

export default new TherapistAvailabilityController();

