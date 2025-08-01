import TherapistAvailability from "../../models/TherapistAvailability.js";
import Therapist from "../../models/Therapist.js";
import User from "../../models/User.js";

Therapist.belongsTo(User, { foreignKey: "user_id" });


class TherapistAvailabilityService {
  /**
   * Create or Update Therapist Availability
   */
  async getAllTherapists() {
    const therapists = await Therapist.findAll({
      include: [
        {
          model: User,
          attributes: ["username", "profile_picture"],
        },
      ],
      order: [["created_at", "DESC"]],
    });
    return therapists;
  }

  async getTherapistById(therapistId) {
    const therapist = await Therapist.findOne({
      where: { id: therapistId },
      include: [
        {
          model: User,
          attributes: ["username", "profile_picture"],
        },
      ],
    });
    if (!therapist) throw new Error("Therapist not found");
    return therapist;
  }

  async getTherapistByUserId(therapistId) {
    const therapist = await Therapist.findOne({
      where: { user_id: therapistId },
      include: [
        {
          model: User,
          attributes: ["username", "profile_picture"],
        },
      ],
    });
    if (!therapist) throw new Error("Therapist not found");
    return therapist;
  }

splitTimeRange(timeRange) {
  console.log("splitTimeRange input:", timeRange);
  try {
    // Remove extra spaces and any 'am/pm' (assuming a 24-hour format for simplicity)
    const cleanRange = timeRange.trim().replace(/\s*(am|pm)/gi, "");
    console.log("cleanRange:", cleanRange);
    
    // Split by hyphen; note that if you are using an en dash or em dash, the split will fail.
    const rangeParts = cleanRange.split("-");
    if (rangeParts.length !== 2) {
      console.error("Time range not in expected format:", timeRange);
      return [];
    }
    
    // Trim each part to remove accidental spaces.
    const [startStr, endStr] = rangeParts.map(str => str.trim());
    const startParts = startStr.split(":").map(Number);
    const endParts = endStr.split(":").map(Number);
    
    if (
      startParts.length !== 2 ||
      endParts.length !== 2 ||
      isNaN(startParts[0]) ||
      isNaN(startParts[1]) ||
      isNaN(endParts[0]) ||
      isNaN(endParts[1])
    ) {
      console.error("Invalid time provided:", timeRange);
      return [];
    }
    
    const [startHour, startMinute] = startParts;
    const [endHour, endMinute] = endParts;
    
    // Convert times to total minutes
    const startMinutes = startHour * 60 + startMinute;
    const endMinutes = endHour * 60 + endMinute;
    
    const slots = [];
    // Generate one-hour slots
    for (let t = startMinutes; t < endMinutes; t += 60) {
      const slotStart = t;
      const slotEnd = t + 60;
      // Only add the slot if the full hour fits in the range
      if (slotEnd <= endMinutes) {
        slots.push(`${this.formatTime(slotStart)}-${this.formatTime(slotEnd)}`);
      }
    }
    console.log("Generated slots:", slots);
    return slots;
  } catch (error) {
    console.error("Error in splitTimeRange:", error);
    return [];
  }
}

formatTime(totalMinutes) {
  const hour = Math.floor(totalMinutes / 60);
  const minute = totalMinutes % 60;
  return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
}


async setAvailability(therapistId, availabilityData) {
  let availability = await TherapistAvailability.findOne({ where: { therapist_id: therapistId } });

  const therapist = await Therapist.findOne({ where: { user_id: therapistId } });
  if (!therapist) {
    throw new Error("Therapist does not exist. Ensure the account is verified. ID: " + therapistId);
  }

  // Process selected_time_slots: split any range into one-hour slots.
  const processedTimeSlots = {};
  // Assuming availabilityData.selected_time_slots is an object mapping dates to arrays of slot strings.
  for (const date in availabilityData.selected_time_slots) {
    processedTimeSlots[date] = [];
    for (const slot of availabilityData.selected_time_slots[date]) {
      if (slot.includes("-")) {
        // Call the helper function to split the range.
        let oneHourSlots = this.splitTimeRange(slot);
        if (!Array.isArray(oneHourSlots)) {
          console.error("splitTimeRange did not return an array for slot:", slot);
          oneHourSlots = [];
        }
        processedTimeSlots[date].push(...oneHourSlots);
      } else {
        processedTimeSlots[date].push(slot);
      }
    }
  }

  // Create a new record if none exists, otherwise update the existing one.
  if (!availability) {
    availability = await TherapistAvailability.create({
      therapist_id: therapist.id,
      selected_dates: availabilityData.selected_dates || [],
      selected_time_slots: processedTimeSlots,
      availability_type: availabilityData.availability_type || "manual",
      ai_input_text: availabilityData.ai_input_text || null,
      ai_processed_slots: availabilityData.ai_processed_slots || {}
    });
  } else {
    await availability.update({
      selected_dates: availabilityData.selected_dates || [],
      selected_time_slots: processedTimeSlots,
      availability_type: availabilityData.availability_type || "manual",
      ai_input_text: availabilityData.ai_input_text || null,
      ai_processed_slots: availabilityData.ai_processed_slots || {}
    });
  }

  return { message: "Availability updated successfully!" };
}


  async getAvailability(therapistId) {
    // 1) fetch all records
    const records = await TherapistAvailability.findAll({
      where: { therapist_id: therapistId },
    });

    if (!records.length) {
      throw new Error("No availability set for this therapist.");
    }

    // 2) compute “today at midnight” so we only show dates >= today
    const today = new Date();
    // today.setHours(0, 0, 0, 0);

    // 3) keep only records that have at least one future date
    const futureRecords = records.filter((rec) => {
      // selected_dates is e.g. ['2025-05-17', '2025-05-18']
      return rec.selected_dates.some((d) => {
        const dt = new Date(d);
        return dt >= today;
      });
    });

    return futureRecords;
  }

  /**
   * Fetch ALL Availabilities (optional - for debugging/admin)
   */
  async listAllAvailabilities() {
    return await TherapistAvailability.findAll();
  }

  /**
   * Update Existing Availability
   */
  async updateAvailability(therapistId, updatedData) {
    const availability = await TherapistAvailability.findOne({ where: { therapist_id: therapistId } });
    if (!availability) throw new Error("No availability found for this therapist.");

    await availability.update(updatedData);
    return { message: "Availability updated successfully!" };
  }

  /**
   * Delete a Specific Time Slot
   */
  async deleteTimeSlot(therapistId, date, timeSlot) {
    const availability = await TherapistAvailability.findOne({ where: { therapist_id: therapistId } });
    if (!availability) throw new Error("No availability found for this therapist.");

    if (availability.selected_time_slots[date]) {
      // Remove the matching slot from the array
      availability.selected_time_slots[date] =
        availability.selected_time_slots[date].filter(slot => slot !== timeSlot);

      // If no slots left for that date, remove the date key
      if (availability.selected_time_slots[date].length === 0) {
        delete availability.selected_time_slots[date];
      }
    }

    await availability.save();
    return { message: "Time slot removed successfully!" };
  }

  /**
   * Mark a Time Slot as Booked
   * (Useful if you want to remove or flag a slot once it's booked)
   */
  async markSlotAsBooked(therapistId, date, timeSlot) {
    const availability = await TherapistAvailability.findOne({ where: { therapist_id: therapistId } });
    if (!availability) throw new Error("No availability found for this therapist.");

    // Example approach: remove it from selected_time_slots
    if (availability.selected_time_slots[date]) {
      availability.selected_time_slots[date] =
        availability.selected_time_slots[date].filter(slot => slot !== timeSlot);

      if (availability.selected_time_slots[date].length === 0) {
        delete availability.selected_time_slots[date];
      }
    }

    // Or set availability.status = "booked" if you prefer to mark it instead
    // availability.status = "booked";

    await availability.save();
    return { message: `Slot ${timeSlot} on ${date} is now booked.` };
  }
}

export default new TherapistAvailabilityService();
