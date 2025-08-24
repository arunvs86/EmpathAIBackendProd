// import TherapistAvailability from "../../models/TherapistAvailability.js";
// import Therapist from "../../models/Therapist.js";
// import User from "../../models/User.js";
// import { splitOnDash } from "../../utils/timeSlots.js";

// Therapist.belongsTo(User, { foreignKey: "user_id" });


// class TherapistAvailabilityService {
//   /**
//    * Create or Update Therapist Availability
//    */
//   async getAllTherapists() {
//     const therapists = await Therapist.findAll({
//       include: [
//         {
//           model: User,
//           attributes: ["username", "profile_picture"],
//         },
//       ],
//       order: [["created_at", "DESC"]],
//     });
//     return therapists;
//   }

//   async getTherapistById(therapistId) {
//     const therapist = await Therapist.findOne({
//       where: { id: therapistId },
//       include: [
//         {
//           model: User,
//           attributes: ["username", "profile_picture"],
//         },
//       ],
//     });
//     if (!therapist) throw new Error("Therapist not found");
//     return therapist;
//   }

//   async getTherapistByUserId(therapistId) {
//     const therapist = await Therapist.findOne({
//       where: { user_id: therapistId },
//       include: [
//         {
//           model: User,
//           attributes: ["username", "profile_picture"],
//         },
//       ],
//     });
//     if (!therapist) throw new Error("Therapist not found");
//     return therapist;
//   }

// // splitTimeRange(timeRange) {
// //   console.log("splitTimeRange input:", timeRange);
// //   try {
// //     // Remove extra spaces and any 'am/pm' (assuming a 24-hour format for simplicity)
// //     const cleanRange = timeRange.trim().replace(/\s*(am|pm)/gi, "");
// //     console.log("cleanRange:", cleanRange);
    
// //     // Split by hyphen; note that if you are using an en dash or em dash, the split will fail.
// //     const rangeParts = cleanRange.split("-");
// //     if (rangeParts.length !== 2) {
// //       console.error("Time range not in expected format:", timeRange);
// //       return [];
// //     }
    
// //     // Trim each part to remove accidental spaces.
// //     const [startStr, endStr] = rangeParts.map(str => str.trim());
// //     const startParts = startStr.split(":").map(Number);
// //     const endParts = endStr.split(":").map(Number);
    
// //     if (
// //       startParts.length !== 2 ||
// //       endParts.length !== 2 ||
// //       isNaN(startParts[0]) ||
// //       isNaN(startParts[1]) ||
// //       isNaN(endParts[0]) ||
// //       isNaN(endParts[1])
// //     ) {
// //       console.error("Invalid time provided:", timeRange);
// //       return [];
// //     }
    
// //     const [startHour, startMinute] = startParts;
// //     const [endHour, endMinute] = endParts;
    
// //     // Convert times to total minutes
// //     const startMinutes = startHour * 60 + startMinute;
// //     const endMinutes = endHour * 60 + endMinute;
    
// //     const slots = [];
// //     // Generate one-hour slots
// //     for (let t = startMinutes; t < endMinutes; t += 60) {
// //       const slotStart = t;
// //       const slotEnd = t + 60;
// //       // Only add the slot if the full hour fits in the range
// //       if (slotEnd <= endMinutes) {
// //         slots.push(`${this.formatTime(slotStart)}-${this.formatTime(slotEnd)}`);
// //       }
// //     }
// //     console.log("Generated slots:", slots);
// //     return slots;
// //   } catch (error) {
// //     console.error("Error in splitTimeRange:", error);
// //     return [];
// //   }
// // }

// splitTimeRange(timeRange) {
//   try {
//     const [startStr, endStr] = splitOnDash(timeRange);
//     if (!startStr || !endStr) return [];

//     const [h1, m1] = startStr.split(":").map(Number);
//     const [h2, m2] = endStr.split(":").map(Number);
//     if ([h1, m1, h2, m2].some(isNaN)) return [];

//     const start = h1 * 60 + m1;
//     const end   = h2 * 60 + m2;

//     const slots = [];
//     for (let t = start; t < end; t += 60) {
//       const sH = String(Math.floor(t / 60)).padStart(2, "0");
//       const sM = String(t % 60).padStart(2, "0");
//       const eH = String(Math.floor((t + 60) / 60)).padStart(2, "0");
//       const eM = String((t + 60) % 60).padStart(2, "0");
//       if (t + 60 <= end) slots.push(`${sH}:${sM}-${eH}:${eM}`);
//     }
//     return slots;
//   } catch { return []; }
// }

// formatTime(totalMinutes) {
//   const hour = Math.floor(totalMinutes / 60);
//   const minute = totalMinutes % 60;
//   return `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
// }


// async setAvailability(therapistId, availabilityData) {
//   let availability = await TherapistAvailability.findOne({ where: { therapist_id: therapistId } });

//   const therapist = await Therapist.findOne({ where: { user_id: therapistId } });
//   if (!therapist) {
//     throw new Error("Therapist does not exist. Ensure the account is verified. ID: " + therapistId);
//   }

//   // Process selected_time_slots: split any range into one-hour slots.
//   const processedTimeSlots = {};
//   // Assuming availabilityData.selected_time_slots is an object mapping dates to arrays of slot strings.
//   for (const date in availabilityData.selected_time_slots) {
//     processedTimeSlots[date] = [];
//     for (const slot of availabilityData.selected_time_slots[date]) {
//       if (slot.includes("-")) {
//         // Call the helper function to split the range.
//         let oneHourSlots = this.splitTimeRange(slot);
//         if (!Array.isArray(oneHourSlots)) {
//           console.error("splitTimeRange did not return an array for slot:", slot);
//           oneHourSlots = [];
//         }
//         processedTimeSlots[date].push(...oneHourSlots);
//       } else {
//         processedTimeSlots[date].push(slot);
//       }
//     }
//   }

//   // Create a new record if none exists, otherwise update the existing one.
//   if (!availability) {
//     availability = await TherapistAvailability.create({
//       therapist_id: therapist.id,
//       selected_dates: availabilityData.selected_dates || [],
//       selected_time_slots: processedTimeSlots,
//       availability_type: availabilityData.availability_type || "manual",
//       ai_input_text: availabilityData.ai_input_text || null,
//       ai_processed_slots: availabilityData.ai_processed_slots || {}
//     });
//   } else {
//     await availability.update({
//       selected_dates: availabilityData.selected_dates || [],
//       selected_time_slots: processedTimeSlots,
//       availability_type: availabilityData.availability_type || "manual",
//       ai_input_text: availabilityData.ai_input_text || null,
//       ai_processed_slots: availabilityData.ai_processed_slots || {}
//     });
//   }

//   return { message: "Availability updated successfully!" };
// }


//   async getAvailability(therapistId) {
//     // 1) fetch all records
//     const records = await TherapistAvailability.findAll({
//       where: { therapist_id: therapistId },
//     });

//     if (!records.length) {
//       throw new Error("No availability set for this therapist.");
//     }

//     // 2) compute “today at midnight” so we only show dates >= today
//     const today = new Date();
//     // today.setHours(0, 0, 0, 0);

//     // 3) keep only records that have at least one future date
//     const futureRecords = records.filter((rec) => {
//       // selected_dates is e.g. ['2025-05-17', '2025-05-18']
//       return rec.selected_dates.some((d) => {
//         const dt = new Date(d);
//         return dt >= today;
//       });
//     });

//     console.log("futureRecords",futureRecords)
//     return futureRecords;
//   }

//   /**
//    * Fetch ALL Availabilities (optional - for debugging/admin)
//    */
//   async listAllAvailabilities() {
//     return await TherapistAvailability.findAll();
//   }

//   /**
//    * Update Existing Availability
//    */
//   async updateAvailability(therapistId, updatedData) {
//     const availability = await TherapistAvailability.findOne({ where: { therapist_id: therapistId } });
//     if (!availability) throw new Error("No availability found for this therapist.");

//     await availability.update(updatedData);
//     return { message: "Availability updated successfully!" };
//   }

//   /**
//    * Delete a Specific Time Slot
//    */
//   async deleteTimeSlot(therapistId, date, timeSlot) {
//     console.log(therapistId)
//     const therapist = await Therapist.findOne({where:{id : therapistId}})
//     const availability = await TherapistAvailability.findOne({ where: { therapist_id: therapist.id } });
//     if (!availability) throw new Error("No availability found for this therapist.");

//     if (availability.selected_time_slots[date]) {
//       // Remove the matching slot from the array
//       availability.selected_time_slots[date] =
//         availability.selected_time_slots[date].filter(slot => slot !== timeSlot);

//       // If no slots left for that date, remove the date key
//       if (availability.selected_time_slots[date].length === 0) {
//         delete availability.selected_time_slots[date];
//       }
//     }

//     await availability.save();
//     return { message: "Time slot removed successfully!" };
//   }

//   /**
//    * Mark a Time Slot as Booked
//    * (Useful if you want to remove or flag a slot once it's booked)
//    */
//   async markSlotAsBooked(therapistId, date, timeSlot) {
//     const availability = await TherapistAvailability.findOne({ where: { therapist_id: therapistId } });
//     if (!availability) throw new Error("No availability found for this therapist.");

//     // Example approach: remove it from selected_time_slots
//     if (availability.selected_time_slots[date]) {
//       availability.selected_time_slots[date] =
//         availability.selected_time_slots[date].filter(slot => slot !== timeSlot);

//       if (availability.selected_time_slots[date].length === 0) {
//         delete availability.selected_time_slots[date];
//       }
//     }

//     // Or set availability.status = "booked" if you prefer to mark it instead
//     // availability.status = "booked";

//     await availability.save();
//     return { message: `Slot ${timeSlot} on ${date} is now booked.` };
//   }
// }

// export default new TherapistAvailabilityService();


// import TherapistAvailability from "../../models/TherapistAvailability.js";
// import Therapist from "../../models/Therapist.js";
// import User from "../../models/User.js";
// import { splitOnDash, normalizeSlot, union } from "../../utils/timeSlots.js";

// Therapist.belongsTo(User, { foreignKey: "user_id" });

// async function getTherapistByUser(userId) {
//   const t = await Therapist.findOne({ where: { user_id: userId } });
//   if (!t) throw new Error("Therapist not found for this user.");
//   return t;
// }

// async function getTherapistIdByUser(userId) {
//   const t = await Therapist.findOne({ where: { user_id: userId }, attributes: ["id"] });
//   if (!t) throw new Error("Therapist not found for this user.");
//   return t;
// }

// function slotHasDash(slot = "") {
//   return /-|–|—/.test(slot);
// }

// class TherapistAvailabilityService {
//   async getAllTherapists() {
//     const therapists = await Therapist.findAll({
//       include: [{ model: User, attributes: ["username", "profile_picture"] }],
//       order: [["created_at", "DESC"]],
//     });
//     return therapists;
//   }

//   async getTherapistById(therapistId) {
//     const therapist = await Therapist.findOne({
//       where: { id: therapistId },
//       include: [{ model: User, attributes: ["username", "profile_picture"] }],
//     });
//     if (!therapist) throw new Error("Therapist not found");
//     return therapist;
//   }

//   async getTherapistByUserId(userId) {
//     const therapist = await Therapist.findOne({
//       where: { user_id: userId },
//       include: [{ model: User, attributes: ["username", "profile_picture"] }],
//     });
//     if (!therapist) throw new Error("Therapist not found");
//     return therapist;
//   }

//   // 30-min splitting
//   splitTimeRange(timeRange) {
//     try {
//       const [startStr, endStr] = splitOnDash(timeRange);
//       if (!startStr || !endStr) return [];

//       const [h1, m1] = startStr.split(":").map(Number);
//       const [h2, m2] = endStr.split(":").map(Number);
//       if ([h1, m1, h2, m2].some(isNaN)) return [];

//       const start = h1 * 60 + m1;
//       const end   = h2 * 60 + m2;

//       const slots = [];
//       for (let t = start; t < end; t += 30) {
//         const sH = String(Math.floor(t / 60)).padStart(2, "0");
//         const sM = String(t % 60).padStart(2, "0");
//         const eT = t + 30;
//         const eH = String(Math.floor(eT / 60)).padStart(2, "0");
//         const eM = String(eT % 60).padStart(2, "0");
//         if (eT <= end) slots.push(`${sH}:${sM}-${eH}:${eM}`);
//       }
//       return slots;
//     } catch {
//       return [];
//     }
//   }

//   // Normalize & expand (30-min)
//   expandSlotsMap(selected_time_slots = {}) {
//     const out = {};
//     for (const date of Object.keys(selected_time_slots || {})) {
//       out[date] = [];
//       for (const raw of selected_time_slots[date] || []) {
//         const slot = normalizeSlot(raw);
//         if (slotHasDash(slot)) {
//           const parts = this.splitTimeRange(slot); // 30-min chunks
//           out[date].push(...parts);
//         } else {
//           out[date].push(slot);
//         }
//       }
//       // dedupe
//       out[date] = Array.from(new Set(out[date]));
//     }
//     return out;
//   }

//   // Merge helper
//   mergeTimeSlots(existing = {}, incoming = {}) {
//     const merged = { ...(existing || {}) };
//     for (const date of Object.keys(incoming || {})) {
//       merged[date] = union(merged[date] || [], incoming[date] || []);
//       if (merged[date].length === 0) delete merged[date];
//     }
//     return merged;
//   }

//   async setAvailability(userId, availabilityData) {
//     // map user -> therapist PK
//     const therapist = await getTherapistByUser(userId);

//     // fetch/create
//     let availability = await TherapistAvailability.findOne({
//       where: { therapist_id: therapist.id },
//     });

//     const incoming = this.expandSlotsMap(availabilityData.selected_time_slots || {});
//     const incomingDates = Object.keys(incoming);

//     if (!availability) {
//       availability = await TherapistAvailability.create({
//         therapist_id: therapist.id,
//         selected_dates: incomingDates,
//         selected_time_slots: incoming,
//         availability_type: availabilityData.availability_type || "manual",
//         ai_input_text: availabilityData.ai_input_text || null,
//         ai_processed_slots: availabilityData.ai_processed_slots || {},
//       });
//       return { message: "Availability created successfully!" };
//     }

//     // MERGE with existing
//     const mergedSlots = this.mergeTimeSlots(availability.selected_time_slots || {}, incoming);
//     const mergedDates = union(availability.selected_dates || [], Object.keys(mergedSlots));

//     await availability.update({
//       selected_dates: mergedDates,
//       selected_time_slots: mergedSlots,
//       availability_type: availabilityData.availability_type || availability.availability_type || "manual",
//       ai_input_text: availabilityData?.ai_input_text ?? availability.ai_input_text ?? null,
//       ai_processed_slots: availabilityData?.ai_processed_slots ?? availability.ai_processed_slots ?? {},
//     });

//     return { message: "Availability updated successfully!" };
//   }

//   async getAvailability(therapistId) {
//     const records = await TherapistAvailability.findAll({
//       where: { therapist_id: therapistId },
//     });

//     if (!records.length) {
//       throw new Error("No availability set for this therapist.");
//     }

//     const today = new Date();
//     today.setHours(0, 0, 0, 0); // FIX: include today

//     const futureRecords = records.filter((rec) =>
//       rec.selected_dates.some((d) => new Date(d) >= today)
//     );

//     return futureRecords;
//   }

//   async listAllAvailabilities() {
//     return await TherapistAvailability.findAll();
//   }

//   async updateAvailability(userId, updatedData) {
//     const therapist = await getTherapistByUser(userId);
//     const availability = await TherapistAvailability.findOne({
//       where: { therapist_id: therapist.id },
//     });
//     if (!availability) throw new Error("No availability found for this therapist.");

//     // allow partial updates with merge semantics
//     const incoming = this.expandSlotsMap(updatedData.selected_time_slots || {});
//     const mergedSlots = this.mergeTimeSlots(availability.selected_time_slots || {}, incoming);
//     const mergedDates = union(availability.selected_dates || [], Object.keys(mergedSlots));

//     await availability.update({
//       selected_dates: mergedDates,
//       selected_time_slots: mergedSlots,
//       availability_type: updatedData.availability_type || availability.availability_type || "manual",
//       ai_input_text: updatedData?.ai_input_text ?? availability.ai_input_text ?? null,
//       ai_processed_slots: updatedData?.ai_processed_slots ?? availability.ai_processed_slots ?? {},
//     });

//     return { message: "Availability updated successfully!" };
//   }

//   parseJsonMaybe(v, fallback) {
//     if (v == null) return fallback;
//     if (typeof v === "string") {
//       try { return JSON.parse(v); } catch { return fallback; }
//     }
//     if (typeof v === "object") return v;
//     return fallback;
//   }

//   toArrayMaybe(v) {
//     if (Array.isArray(v)) return v;
//     if (typeof v === "string") {
//       try { const a = JSON.parse(v); return Array.isArray(a) ? a : []; } catch { return []; }
//     }
//     return [];
//   }

//   normalizeSlotLocal(slot = "") {
//     const parts = String(slot).split(/-|–|—/);
//     if (parts.length !== 2) return String(slot).trim();
//     const [s, e] = parts.map(x => x.trim());
//     const pad = n => String(n).padStart(2, "0");
//     const [h1, m1] = s.split(":").map(n => pad(n));
//     const [h2, m2] = e.split(":").map(n => pad(n));
//     return `${h1}:${m1}-${h2}:${m2}`;
//   }

//   async handlePolicyForSlot(therapistPk, date, slot, policy, alternatives, tx) {
//     const { startUTC, endUTC } = this.toUTCBounds(date, slot);

//     const conflicts = await Appointments.findAll({
//       where: {
//         therapist_id: therapistPk,
//         scheduled_at: { [Op.gte]: startUTC, [Op.lt]: endUTC },
//         status: { [Op.in]: ["pending", "confirmed", "reschedule_pending"] },
//       },
//       transaction: tx,
//       lock: tx.LOCK.UPDATE,
//     });

//     const pending = conflicts.filter(c => c.status === "pending");
//     const confirmed = conflicts.filter(c => c.status === "confirmed");

//     if (policy === "block_on_conflict") {
//       if (confirmed.length || pending.length) {
//         const msg = `Conflict: ${confirmed.length} confirmed, ${pending.length} pending`;
//         throw new Error(msg);
//       }
//       return { pending, confirmed };
//     }

//     if (policy === "reject_pending") {
//       if (confirmed.length) {
//         throw new Error(`Conflict: ${confirmed.length} confirmed exists — cannot modify.`);
//       }
//       if (pending.length) {
//         await Appointments.update(
//           { status: "rejected" },
//           {
//             where: {
//               id: { [Op.in]: pending.map(p => p.id) },
//             },
//             transaction: tx,
//           }
//         );
//         // Optionally email each pending user here (try/catch)
//       }
//       return { pending, confirmed };
//     }

//     if (policy === "propose_reschedule") {
//       if (!Array.isArray(alternatives) || alternatives.length === 0) {
//         throw new Error("Alternatives required for propose_reschedule.");
//       }
//       // For both pending and (optionally) confirmed — here we only handle pending by default
//       for (const appt of pending) {
//         await appt.update(
//           {
//             status: "reschedule_pending",
//             proposed_slots: alternatives,
//             proposal_expires_at: DateTime.now().plus({ days: 2 }).toJSDate(),
//           },
//           { transaction: tx }
//         );
//         // Optionally email the user with proposals
//       }
//       // If you want to support confirmed too, mirror the same logic for confirmed.
//       return { pending, confirmed };
//     }

//     throw new Error("Unknown policy.");
//   }

//   async deleteTimeSlot(userId, date, timeSlot, opts = {}) {
//     const { policy = "block_on_conflict", alternatives = [] } = opts;
//     const therapist = await getTherapistByUser(userId);

//     return await sequelize.transaction(async (tx) => {
//       // 1) policy handling — may throw 409-equivalent
//       const { pending, confirmed } = await this.handlePolicyForSlot(
//         therapist.id, date, timeSlot, policy, alternatives, tx
//       );

//       // 2) proceed to actual slot removal (your fixed JSON reassign)
//       const availability = await TherapistAvailability.findOne({
//         where: { therapist_id: therapist.id },
//         transaction: tx,
//         lock: tx.LOCK.UPDATE,
//       });
//       if (!availability) throw new Error("No availability found for this therapist.");

//       const slotsMap = { ...this.parseJsonMaybe(availability.selected_time_slots, {}) };
//       const datesArr = [...this.toArrayMaybe(availability.selected_dates)];

//       const nSlot = this.normalizeSlotLocal(timeSlot);
//       const current = Array.isArray(slotsMap[date]) ? [...slotsMap[date]] : [];
//       const next = current.filter(s => this.normalizeSlotLocal(s) !== nSlot);

//       if (next.length > 0) {
//         slotsMap[date] = next;
//         if (!datesArr.includes(date)) datesArr.push(date);
//       } else {
//         delete slotsMap[date];
//         const idx = datesArr.indexOf(date);
//         if (idx !== -1) datesArr.splice(idx, 1);
//       }

//       availability.set("selected_time_slots", slotsMap);
//       availability.set("selected_dates", datesArr);
//       availability.changed("selected_time_slots", true);
//       availability.changed("selected_dates", true);

//       await availability.save({ transaction: tx });

//       return {
//         message:
//           confirmed.length || pending.length
//             ? `Slot removed. Affected: ${confirmed.length} confirmed, ${pending.length} pending (policy: ${policy}).`
//             : "Time slot removed successfully.",
//       };
//     });
//   }

  
//   /* --- FIXED: delete entire date --- */
//   async editTimeSlot(userId, date, oldSlot, newSlot, opts = {}) {
//     const { policy = "block_on_conflict", alternatives = [] } = opts;
  
//     // Map user → therapist PK
//     const therapist = await getTherapistByUser(userId);
//     if (!therapist) throw new Error("Therapist not found.");
  
//     return await sequelize.transaction(async (tx) => {
//       // 1) Policy check on the OLD slot (this is the slot that might have bookings)
//       await this.handlePolicyForSlot(
//         therapist.id, date, oldSlot, policy, alternatives, tx
//       );
  
//       // 2) Load availability row with lock
//       const availability = await TherapistAvailability.findOne({
//         where: { therapist_id: therapist.id },
//         transaction: tx,
//         lock: tx.LOCK.UPDATE,
//       });
//       if (!availability) throw new Error("No availability found for this therapist.");
  
//       // 3) Clone + normalize, then replace
//       const slotsMap = { ...this.parseJsonMaybe(availability.selected_time_slots, {}) };
//       const datesArr = [...this.toArrayMaybe(availability.selected_dates)];
  
//       const nOld = this.normalizeSlotLocal(oldSlot);
//       const nNew = this.normalizeSlotLocal(newSlot);
  
//       const current = Array.isArray(slotsMap[date]) ? [...slotsMap[date]] : [];
//       const filtered = current.filter((s) => this.normalizeSlotLocal(s) !== nOld);
//       if (!filtered.includes(nNew)) filtered.push(nNew);
//       filtered.sort();
  
//       if (filtered.length > 0) {
//         slotsMap[date] = filtered;
//         if (!datesArr.includes(date)) datesArr.push(date);
//       } else {
//         delete slotsMap[date];
//         const idx = datesArr.indexOf(date);
//         if (idx !== -1) datesArr.splice(idx, 1);
//       }
  
//       // 4) Reassign to mark as changed
//       availability.set("selected_time_slots", slotsMap);
//       availability.set("selected_dates", datesArr);
//       availability.changed("selected_time_slots", true);
//       availability.changed("selected_dates", true);
  
//       await availability.save({ transaction: tx });
  
//       return { message: `Slot updated from ${nOld} to ${nNew} (policy: ${policy}).` };
//     });
//   }
  
  
  

//   async markSlotAsBooked(userId, date, timeSlot) {
//     const therapist = await getTherapistByUser(userId);
//     const availability = await TherapistAvailability.findOne({
//       where: { therapist_id: therapist.id },
//     });
//     if (!availability) throw new Error("No availability found for this therapist.");

//     const nSlot = normalizeSlot(timeSlot);
//     if (availability.selected_time_slots?.[date]) {
//       availability.selected_time_slots[date] =
//         (availability.selected_time_slots[date] || []).filter((slot) => normalizeSlot(slot) !== nSlot);

//       if (availability.selected_time_slots[date].length === 0) {
//         delete availability.selected_time_slots[date];
//         availability.selected_dates = (availability.selected_dates || []).filter((d) => d !== date);
//       }
//     }

//     await availability.save();
//     return { message: `Slot ${nSlot} on ${date} is now booked.` };
//   }

//   toUTCBounds(date, slot) {
//     // date: "YYYY-MM-DD", slot: "HH:mm-HH:mm" (any dash)
//     const [s, e] = String(slot).split(/-|–|—/).map(x => x.trim());
//     const start = DateTime.fromISO(`${date}T${s}`, { zone: "Europe/London" });
//     const end   = DateTime.fromISO(`${date}T${e}`, { zone: "Europe/London" });
//     if (!start.isValid || !end.isValid) throw new Error("Invalid date or slot.");
//     return {
//       startUTC: start.toUTC().toJSDate(),
//       endUTC: end.toUTC().toJSDate(),
//     };
//   }

//   async conflictsForSlot(therapistPk, date, slot) {
//     if (!date || !slot) throw new Error("date & slot are required.");
//     const { startUTC, endUTC } = this.toUTCBounds(date, slot);

//     const rows = await Appointments.findAll({
//       where: {
//         therapist_id: therapistPk,
//         scheduled_at: { [Op.gte]: startUTC, [Op.lt]: endUTC },
//         status: { [Op.in]: ["pending", "confirmed", "reschedule_pending"] },
//       },
//       order: [["scheduled_at", "ASC"]],
//     });

//     return {
//       confirmed: rows.filter(r => r.status === "confirmed"),
//       pending: rows.filter(r => r.status === "pending"),
//       reschedule_pending: rows.filter(r => r.status === "reschedule_pending"),
//       total: rows.length,
//     };
//   }

  
  
//   toUTCBounds(date, slot) {
//     // slot "HH:mm-HH:mm" (supports en dash too)
//     const [s, e] = String(slot).split(/-|–|—/).map(x => x.trim());
//     const start = DateTime.fromFormat(`${date} ${s}`, "yyyy-MM-dd HH:mm", { zone: "Europe/London" }).toUTC();
//     const end   = DateTime.fromFormat(`${date} ${e}`, "yyyy-MM-dd HH:mm", { zone: "Europe/London" }).toUTC();
//     if (!start.isValid || !end.isValid) throw new Error("Invalid date/slot.");
//     return { startUTC: start.toJSDate(), endUTC: end.toJSDate() };
//   }
  
//   async previewConflicts(therapistPk, date, slot) {
//     const { startUTC, endUTC } = this.toUTCBounds(date, slot);
//     const [confirmed, pending] = await Promise.all([
//       Appointments.findAll({
//         where: {
//           therapist_id: therapistPk,
//           status: "confirmed",
//           scheduled_at: { [Op.gte]: startUTC, [Op.lt]: endUTC },
//         },
//         attributes: ["id", "user_id", "scheduled_at"],
//         order: [["scheduled_at", "ASC"]],
//       }),
//       Appointments.findAll({
//         where: {
//           therapist_id: therapistPk,
//           status: "pending",
//           scheduled_at: { [Op.gte]: startUTC, [Op.lt]: endUTC },
//         },
//         attributes: ["id", "user_id", "scheduled_at"],
//         order: [["scheduled_at", "ASC"]],
//       }),
//     ]);
//     return {
//       confirmed,
//       pending,
//       total: confirmed.length + pending.length,
//     };
//   }
  
//   /** Apply policy for a single slot, using therapist USER id (auth) */
//   async handlePolicyForSlotByUser(userId, date, slot, policy = "block_on_conflict", alternatives = [], tx = null) {
//     const therapist = await getTherapistIdByUser(userId);
//     return this.handlePolicyForSlot(therapist.id, date, slot, policy, alternatives, tx);
//   }
  
//   /** Core policy handler (therapist PK) */
//   async handlePolicyForSlot(therapistPk, date, slot, policy = "block_on_conflict", alternatives = [], tx = null) {
//     const { startUTC, endUTC } = this.toUTCBounds(date, slot);
  
//     const confirmedCount = await Appointments.count({
//       where: {
//         therapist_id: therapistPk,
//         status: "confirmed",
//         scheduled_at: { [Op.gte]: startUTC, [Op.lt]: endUTC },
//       },
//       transaction: tx,
//     });
  
//     const pendings = await Appointments.findAll({
//       where: {
//         therapist_id: therapistPk,
//         status: "pending",
//         scheduled_at: { [Op.gte]: startUTC, [Op.lt]: endUTC },
//       },
//       transaction: tx,
//     });
  
//     if (policy === "block_on_conflict" && (confirmedCount > 0 || pendings.length > 0)) {
//       throw new Error(`Cannot modify: ${confirmedCount} confirmed and ${pendings.length} pending appointment(s) in this slot.`);
//     }
  
//     if (policy === "reject_pending" && pendings.length > 0) {
//       await Appointments.update(
//         { status: "rejected" },
//         { where: { id: pendings.map(p => p.id) }, transaction: tx }
//       );
//     }
  
//     if (policy === "propose_reschedule" && pendings.length > 0) {
//       // Minimal implementation: mark as reschedule_pending (you can extend to store proposed slots)
//       await Appointments.update(
//         { status: "reschedule_pending" },
//         { where: { id: pendings.map(p => p.id) }, transaction: tx }
//       );
//     }
  
//     return { confirmedCount, pending: pendings.map(p => p.id) };
//   }
  
//   /** Delete entire date (already shared earlier with policy)—keep your version */
//   async deleteDate(userId, date, opts = {}) {
//     const { policy = "block_on_conflict", alternatives = [] } = opts;
//     const therapist = await getTherapistIdByUser(userId);
  
//     return await sequelize.transaction(async (tx) => {
//       const availability = await TherapistAvailability.findOne({
//         where: { therapist_id: therapist.id },
//         transaction: tx,
//         lock: tx.LOCK.UPDATE,
//       });
//       if (!availability) throw new Error("No availability found for this therapist.");
  
//       const slotsMap = { ...this.parseJsonMaybe(availability.selected_time_slots, {}) };
//       const datesArr = [...this.toArrayMaybe(availability.selected_dates)];
//       const daySlots = Array.isArray(slotsMap[date]) ? [...slotsMap[date]] : [];
  
//       // enforce policy per slot
//       for (const slot of daySlots) {
//         await this.handlePolicyForSlot(therapist.id, date, slot, policy, alternatives, tx);
//       }
  
//       // drop the date
//       delete slotsMap[date];
//       const idx = datesArr.indexOf(date);
//       if (idx !== -1) datesArr.splice(idx, 1);
  
//       availability.set("selected_time_slots", slotsMap);
//       availability.set("selected_dates", datesArr);
//       availability.changed("selected_time_slots", true);
//       availability.changed("selected_dates", true);
  
//       await availability.save({ transaction: tx });
//       return { message: `All slots on ${date} removed (policy: ${policy}).` };
//     });
//   }

// }

// export default new TherapistAvailabilityService();

// services/therapists/therapistAvailabilityService.js
import { Op } from "sequelize";
import { DateTime } from "luxon";
import { sequelize } from "../../config/postgres.js";

import TherapistAvailability from "../../models/TherapistAvailability.js";
import Therapist from "../../models/Therapist.js";
import User from "../../models/User.js";
import Appointments from "../../models/Appointments.js";
import emailService from "../email/emailService.js"; // adjust relative path if needed


import { splitOnDash, normalizeSlot, union } from "../../utils/timeSlots.js";

// In case association isn't set elsewhere
Therapist.belongsTo(User, { foreignKey: "user_id" });

/* ----------------------- helpers ----------------------- */

async function getTherapistRowByUser(userId) {
  const t = await Therapist.findOne({ where: { user_id: userId } });
  if (!t) throw new Error("Therapist not found for this user.");
  return t; // has .id (therapist PK)
}

function slotHasDash(slot = "") {
  return /-|–|—/.test(slot);
}

function parseJsonMaybe(v, fallback) {
  if (v == null) return fallback;
  if (typeof v === "string") {
    try { return JSON.parse(v); } catch { return fallback; }
  }
  if (typeof v === "object") return v;
  return fallback;
}

function toArrayMaybe(v) {
  if (Array.isArray(v)) return v;
  if (typeof v === "string") {
    try {
      const a = JSON.parse(v);
      return Array.isArray(a) ? a : [];
    } catch { return []; }
  }
  return [];
}

function normalizeSlotLocal(slot = "") {
  const parts = String(slot).split(/-|–|—/);
  if (parts.length !== 2) return String(slot).trim();
  const [s, e] = parts.map(x => x.trim());
  const pad = n => String(n).padStart(2, "0");
  const [h1, m1] = s.split(":").map(n => pad(n));
  const [h2, m2] = e.split(":").map(n => pad(n));
  return `${h1}:${m1}-${h2}:${m2}`;
}

function toUTCBounds(date, slot) {
  // date: "yyyy-MM-dd", slot: "HH:mm-HH:mm" (any dash)
  const [s, e] = String(slot).split(/-|–|—/).map(x => x.trim());
  const start = DateTime.fromISO(`${date}T${s}`, { zone: "Europe/London" });
  const end   = DateTime.fromISO(`${date}T${e}`, { zone: "Europe/London" });
  if (!start.isValid || !end.isValid) throw new Error("Invalid date or slot.");
  return { startUTC: start.toUTC().toJSDate(), endUTC: end.toUTC().toJSDate() };
}

/* ----------------------- service ----------------------- */

class TherapistAvailabilityService {
  /* ---- therapists directory ---- */

  async getAllTherapists() {
    return Therapist.findAll({
      include: [{ model: User, attributes: ["username", "profile_picture"] }],
      order: [["created_at", "DESC"]],
    });
  }

  async getTherapistById(therapistId) {
    const therapist = await Therapist.findOne({
      where: { id: therapistId },
      include: [{ model: User, attributes: ["username", "profile_picture"] }],
    });
    if (!therapist) throw new Error("Therapist not found");
    return therapist;
  }

  async getTherapistByUserId(userId) {
    const therapist = await Therapist.findOne({
      where: { user_id: userId },
      include: [{ model: User, attributes: ["username", "profile_picture"] }],
    });
    if (!therapist) throw new Error("Therapist not found");
    return therapist;
  }

  /* ---- availability core helpers ---- */

  // Expand any range into 30-minute slots (inclusive of start, exclusive of end)
  splitTimeRange(timeRange) {
    try {
      const [startStr, endStr] = splitOnDash(timeRange);
      if (!startStr || !endStr) return [];

      const [h1, m1] = startStr.split(":").map(Number);
      const [h2, m2] = endStr.split(":").map(Number);
      if ([h1, m1, h2, m2].some(isNaN)) return [];

      const start = h1 * 60 + m1;
      const end   = h2 * 60 + m2;

      const slots = [];
      for (let t = start; t < end; t += 30) {
        const sH = String(Math.floor(t / 60)).padStart(2, "0");
        const sM = String(t % 60).padStart(2, "0");
        const eT = t + 30;
        const eH = String(Math.floor(eT / 60)).padStart(2, "0");
        const eM = String(eT % 60).padStart(2, "0");
        if (eT <= end) slots.push(`${sH}:${sM}-${eH}:${eM}`);
      }
      return slots;
    } catch {
      return [];
    }
  }

  // Normalize & expand (30-min) all slots for incoming availability
  expandSlotsMap(selected_time_slots = {}) {
    const out = {};
    for (const date of Object.keys(selected_time_slots || {})) {
      out[date] = [];
      for (const raw of selected_time_slots[date] || []) {
        const slot = normalizeSlot(raw); // unify dash/spacing
        if (slotHasDash(slot)) {
          out[date].push(...this.splitTimeRange(slot));
        } else {
          out[date].push(slot);
        }
      }
      out[date] = Array.from(new Set(out[date])); // dedupe
    }
    return out;
  }

  // Merge helper (keeps unique slots)
  mergeTimeSlots(existing = {}, incoming = {}) {
    const merged = { ...(existing || {}) };
    for (const date of Object.keys(incoming || {})) {
      merged[date] = union(merged[date] || [], incoming[date] || []);
      if (merged[date].length === 0) delete merged[date];
    }
    return merged;
  }

  /* ---- availability CRUD ---- */

  async setAvailability(userId, availabilityData) {
    const therapist = await getTherapistRowByUser(userId);

    let availability = await TherapistAvailability.findOne({
      where: { therapist_id: therapist.id },
    });

    const incoming = this.expandSlotsMap(availabilityData.selected_time_slots || {});
    const incomingDates = Object.keys(incoming);

    if (!availability) {
      await TherapistAvailability.create({
        therapist_id: therapist.id,
        selected_dates: incomingDates,
        selected_time_slots: incoming,
        availability_type: availabilityData.availability_type || "manual",
        ai_input_text: availabilityData.ai_input_text || null,
        ai_processed_slots: availabilityData.ai_processed_slots || {},
      });
      return { message: "Availability created successfully!" };
    }

    const mergedSlots = this.mergeTimeSlots(availability.selected_time_slots || {}, incoming);
    const mergedDates = union(availability.selected_dates || [], Object.keys(mergedSlots));

    await availability.update({
      selected_dates: mergedDates,
      selected_time_slots: mergedSlots,
      availability_type: availabilityData.availability_type || availability.availability_type || "manual",
      ai_input_text: availabilityData?.ai_input_text ?? availability.ai_input_text ?? null,
      ai_processed_slots: availabilityData?.ai_processed_slots ?? availability.ai_processed_slots ?? {},
    });

    return { message: "Availability updated successfully!" };
  }

  async getAvailability(therapistId) {
    const records = await TherapistAvailability.findAll({
      where: { therapist_id: therapistId },
    });
    if (!records.length) throw new Error("No availability set for this therapist.");

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const availability =  records.filter((rec) =>
      (rec.selected_dates || []).some((d) => new Date(d) >= today)
    );

    return availability
  }

  async listAllAvailabilities() {
    return TherapistAvailability.findAll();
  }

  async updateAvailability(userId, updatedData) {
    const therapist = await getTherapistRowByUser(userId);
    const availability = await TherapistAvailability.findOne({
      where: { therapist_id: therapist.id },
    });
    if (!availability) throw new Error("No availability found for this therapist.");

    const incoming = this.expandSlotsMap(updatedData.selected_time_slots || {});
    const mergedSlots = this.mergeTimeSlots(availability.selected_time_slots || {}, incoming);
    const mergedDates = union(availability.selected_dates || [], Object.keys(mergedSlots));

    await availability.update({
      selected_dates: mergedDates,
      selected_time_slots: mergedSlots,
      availability_type: updatedData.availability_type || availability.availability_type || "manual",
      ai_input_text: updatedData?.ai_input_text ?? availability.ai_input_text ?? null,
      ai_processed_slots: updatedData?.ai_processed_slots ?? availability.ai_processed_slots ?? {},
    });

    return { message: "Availability updated successfully!" };
  }

  /* ---- conflict/preview & policies ---- */

  async conflictsForSlot(therapistPk, date, slot) {
    if (!date || !slot) throw new Error("date & slot are required.");
    const { startUTC, endUTC } = toUTCBounds(date, slot);

    const rows = await Appointments.findAll({
      where: {
        therapist_id: therapistPk,
        scheduled_at: { [Op.gte]: startUTC, [Op.lt]: endUTC },
        status: { [Op.in]: ["pending", "confirmed", "reschedule_pending"] },
      },
      order: [["scheduled_at", "ASC"]],
    });

    return {
      confirmed: rows.filter(r => r.status === "confirmed"),
      pending: rows.filter(r => r.status === "pending"),
      reschedule_pending: rows.filter(r => r.status === "reschedule_pending"),
      total: rows.length,
    };
  }

  async previewConflicts(therapistPk, date, slot) {
    const { startUTC, endUTC } = toUTCBounds(date, slot);
    const [confirmed, pending] = await Promise.all([
      Appointments.findAll({
        where: {
          therapist_id: therapistPk,
          status: "confirmed",
          scheduled_at: { [Op.gte]: startUTC, [Op.lt]: endUTC },
        },
        attributes: ["id", "user_id", "scheduled_at"],
        order: [["scheduled_at", "ASC"]],
      }),
      Appointments.findAll({
        where: {
          therapist_id: therapistPk,
          status: "pending",
          scheduled_at: { [Op.gte]: startUTC, [Op.lt]: endUTC },
        },
        attributes: ["id", "user_id", "scheduled_at"],
        order: [["scheduled_at", "ASC"]],
      }),
    ]);
    return { confirmed, pending, total: confirmed.length + pending.length };
  }

  async handlePolicyForSlotByUser(userId, date, slot, policy = "block_on_conflict", alternatives = [], tx = null) {
    const therapist = await getTherapistRowByUser(userId);
    return this.handlePolicyForSlot(therapist.id, date, slot, policy, alternatives, tx);
  }

  async handlePolicyForSlot(therapistPk, date, slot, policy = "block_on_conflict", alternatives = [], tx = null) {
    const { startUTC, endUTC } = toUTCBounds(date, slot);
  
    // Load conflicts in the slot window
    const [confirmedRows, pendingRows, reschedRows] = await Promise.all([
      Appointments.findAll({
        where: {
          therapist_id: therapistPk,
          status: "confirmed",
          scheduled_at: { [Op.gte]: startUTC, [Op.lt]: endUTC },
        },
        transaction: tx,
        lock: tx?.LOCK?.UPDATE,
      }),
      Appointments.findAll({
        where: {
          therapist_id: therapistPk,
          status: "pending",
          scheduled_at: { [Op.gte]: startUTC, [Op.lt]: endUTC },
        },
        transaction: tx,
        lock: tx?.LOCK?.UPDATE,
      }),
      Appointments.findAll({
        where: {
          therapist_id: therapistPk,
          status: "reschedule_pending",
          scheduled_at: { [Op.gte]: startUTC, [Op.lt]: endUTC },
        },
        transaction: tx,
        lock: tx?.LOCK?.UPDATE,
      }),
    ]);
  
    const confirmedCount = confirmedRows.length;
    const pendingCount   = pendingRows.length;
    const reschedCount   = reschedRows.length;
  
    // helper: schedule work after commit (or immediately if no tx)
    const afterCommit = (fn) => {
      if (tx && typeof tx.afterCommit === "function") tx.afterCommit(fn);
      else fn();
    };
  
    // 1) Default hard block
    if (policy === "block_on_conflict") {
      if (confirmedCount > 0 || pendingCount > 0 || reschedCount > 0) {
        throw new Error(
          `Cannot modify: ${confirmedCount} confirmed, ${pendingCount} pending, ${reschedCount} reschedule-pending appointment(s) in this slot.`
        );
      }
      return {
        confirmedCount,
        pending: pendingRows.map(p => p.id),
        reschedule_pending: reschedRows.map(r => r.id),
      };
    }
  
    // 2) Reject only pending; confirmed must remain
    if (policy === "reject_pending") {
      if (confirmedCount > 0 || reschedCount > 0) {
        throw new Error(
          `Cannot modify: ${confirmedCount} confirmed and/or ${reschedCount} reschedule-pending exist. Use "propose_reschedule" or "cancel_and_delete".`
        );
      }
  
      if (pendingCount > 0) {
        await Appointments.update(
          { status: "rejected" },
          { where: { id: pendingRows.map(p => p.id) }, transaction: tx }
        );
  
        // Email affected pending users after commit
        const therapistRow  = await Therapist.findByPk(therapistPk, { attributes: ["user_id"], transaction: tx });
        const therapistUser = therapistRow ? await User.findByPk(therapistRow.user_id, { transaction: tx }) : null;
        const clientIds     = [...new Set(pendingRows.map(a => a.user_id))];
        const clients       = await User.findAll({
          where: { id: clientIds },
          attributes: ["id", "email", "username"],
          transaction: tx,
        });
        const clientMap = Object.fromEntries(clients.map(u => [u.id, u]));
  
        afterCommit(async () => {
          for (const appt of pendingRows) {
            try {
              await emailService.sendPendingRequestRejectedEmail(appt, clientMap[appt.user_id], therapistUser);
            } catch (e) {
              console.error("Email (reject_pending) failed for appt", appt.id, e.message);
            }
          }
          try {
            await emailService.sendTherapistAvailabilityChangeSummary(therapistUser, {
              action: "reject_pending",
              date,
              slot,
              affectedCounts: { rejected: pendingRows.length },
            });
          } catch {}
        });
      }
  
      return {
        confirmedCount,
        pending: pendingRows.map(p => p.id),
        reschedule_pending: reschedRows.map(r => r.id),
      };
    }
  
    // 3) Propose reschedule (works for pending AND confirmed)
    if (policy === "propose_reschedule") {
      if (!Array.isArray(alternatives) || alternatives.length === 0) {
        throw new Error("Alternatives required for propose_reschedule (ISO datetimes in Europe/London).");
      }
      const firstAlt = alternatives[0];
      const altDT = DateTime.fromISO(firstAlt, { zone: "Europe/London" });
      if (!altDT.isValid) throw new Error("Invalid alternative datetime.");
  
      const updatePayload = {
        status: "reschedule_pending",
        proposed_scheduled_at: altDT.toUTC().toJSDate(),
      };
  
      const toUpdateIds = [
        ...pendingRows.map(p => p.id),
        ...confirmedRows.map(c => c.id),
        ...reschedRows.map(r => r.id),
      ];
  
      if (toUpdateIds.length > 0) {
        await Appointments.update(updatePayload, {
          where: { id: toUpdateIds },
          transaction: tx,
        });
  
        // Email all affected (pending + confirmed + resched) after commit
        const affected      = [...pendingRows, ...confirmedRows, ...reschedRows];
        const therapistRow  = await Therapist.findByPk(therapistPk, { attributes: ["user_id"], transaction: tx });
        const therapistUser = therapistRow ? await User.findByPk(therapistRow.user_id, { transaction: tx }) : null;
        const clientIds     = [...new Set(affected.map(a => a.user_id))];
        const clients       = await User.findAll({
          where: { id: clientIds },
          attributes: ["id", "email", "username"],
          transaction: tx,
        });
        const clientMap = Object.fromEntries(clients.map(u => [u.id, u]));
  
        afterCommit(async () => {
          for (const appt of affected) {
            try {
              await emailService.sendTherapistProposedRescheduleEmail(appt, clientMap[appt.user_id], therapistUser, alternatives);
            } catch (e) {
              console.error("Email (propose_reschedule) failed for appt", appt.id, e.message);
            }
          }
          try {
            await emailService.sendTherapistAvailabilityChangeSummary(therapistUser, {
              action: "propose_reschedule",
              date,
              slot,
              affectedCounts: { proposed: toUpdateIds.length },
            });
          } catch {}
        });
      }
  
      return {
        confirmedCount,
        pending: pendingRows.map(p => p.id),
        reschedule_pending: reschedRows.map(r => r.id),
      };
    }
  
    // 4) 🚨 Force cancel everything in the window, then allow edit/delete
    if (policy === "cancel_and_delete") {
      const toCancelIds = [
        ...pendingRows.map(p => p.id),
        ...confirmedRows.map(c => c.id),
        ...reschedRows.map(r => r.id),
      ];
  
      if (toCancelIds.length > 0) {
        await Appointments.update(
          { status: "cancelled" },
          {
            where: {
              id: toCancelIds,
              status: { [Op.in]: ["pending", "confirmed", "reschedule_pending"] },
            },
            transaction: tx,
          }
        );
  
        // Email all affected (now-cancelled) after commit
        const affected      = [...pendingRows, ...confirmedRows, ...reschedRows];
        const therapistRow  = await Therapist.findByPk(therapistPk, { attributes: ["user_id"], transaction: tx });
        const therapistUser = therapistRow ? await User.findByPk(therapistRow.user_id, { transaction: tx }) : null;
        const clientIds     = [...new Set(affected.map(a => a.user_id))];
        const clients       = await User.findAll({
          where: { id: clientIds },
          attributes: ["id", "email", "username"],
          transaction: tx,
        });
        const clientMap = Object.fromEntries(clients.map(u => [u.id, u]));
  
        afterCommit(async () => {
          for (const appt of affected) {
            try {
              await emailService.sendTherapistCancelledAppointmentEmail(appt, clientMap[appt.user_id], therapistUser);
            } catch (e) {
              console.error("Email (cancelled) failed for appt", appt.id, e.message);
            }
          }
          try {
            await emailService.sendTherapistAvailabilityChangeSummary(therapistUser, {
              action: "cancel_and_delete",
              date,
              slot,
              affectedCounts: { cancelled: affected.length },
            });
          } catch {}
        });
      }
  
      return {
        cancelled: toCancelIds.length,
        confirmedCount,
        pending: pendingRows.map(p => p.id),
        reschedule_pending: reschedRows.map(r => r.id),
      };
    }
  
    throw new Error("Unknown policy.");
  }
  
  /* ---- slot/date mutations with policy ---- */

  async editTimeSlot(userId, date, oldSlot, newSlot, opts = {}) {
    const { policy = "block_on_conflict", alternatives = [] } = opts;
    const therapist = await getTherapistRowByUser(userId);

    return sequelize.transaction(async (tx) => {
      // Policy applies to the OLD slot
      await this.handlePolicyForSlot(therapist.id, date, oldSlot, policy, alternatives, tx);

      const availability = await TherapistAvailability.findOne({
        where: { therapist_id: therapist.id },
        transaction: tx,
        lock: tx.LOCK.UPDATE,
      });
      if (!availability) throw new Error("No availability found for this therapist.");

      const slotsMap = { ...parseJsonMaybe(availability.selected_time_slots, {}) };
      const datesArr = [...toArrayMaybe(availability.selected_dates)];

      const nOld = normalizeSlotLocal(oldSlot);
      const nNew = normalizeSlotLocal(newSlot);

      const current = Array.isArray(slotsMap[date]) ? [...slotsMap[date]] : [];
      const next = current.filter((s) => normalizeSlotLocal(s) !== nOld);
      if (!next.includes(nNew)) next.push(nNew);
      next.sort();

      if (next.length > 0) {
        slotsMap[date] = next;
        if (!datesArr.includes(date)) datesArr.push(date);
      } else {
        delete slotsMap[date];
        const idx = datesArr.indexOf(date);
        if (idx !== -1) datesArr.splice(idx, 1);
      }

      availability.set("selected_time_slots", slotsMap);
      availability.set("selected_dates", datesArr);
      availability.changed("selected_time_slots", true);
      availability.changed("selected_dates", true);

      await availability.save({ transaction: tx });

      return { message: `Slot updated from ${nOld} to ${nNew} (policy: ${policy}).` };
    });
  }

  async deleteTimeSlot(userId, date, timeSlot, opts = {}) {
    const { policy = "block_on_conflict", alternatives = [] } = opts;
    const therapist = await getTherapistRowByUser(userId);

    return sequelize.transaction(async (tx) => {
      await this.handlePolicyForSlot(therapist.id, date, timeSlot, policy, alternatives, tx);

      const availability = await TherapistAvailability.findOne({
        where: { therapist_id: therapist.id },
        transaction: tx,
        lock: tx.LOCK.UPDATE,
      });
      if (!availability) throw new Error("No availability found for this therapist.");

      const slotsMap = { ...parseJsonMaybe(availability.selected_time_slots, {}) };
      const datesArr = [...toArrayMaybe(availability.selected_dates)];

      const nSlot = normalizeSlotLocal(timeSlot);
      const current = Array.isArray(slotsMap[date]) ? [...slotsMap[date]] : [];
      const next = current.filter(s => normalizeSlotLocal(s) !== nSlot);

      if (next.length > 0) {
        slotsMap[date] = next;
        if (!datesArr.includes(date)) datesArr.push(date);
      } else {
        delete slotsMap[date];
        const idx = datesArr.indexOf(date);
        if (idx !== -1) datesArr.splice(idx, 1);
      }

      availability.set("selected_time_slots", slotsMap);
      availability.set("selected_dates", datesArr);
      availability.changed("selected_time_slots", true);
      availability.changed("selected_dates", true);

      await availability.save({ transaction: tx });

      return { message: `Time slot ${nSlot} on ${date} removed (policy: ${policy}).` };
    });
  }

  async deleteDate(userId, date, opts = {}) {
    const { policy = "block_on_conflict", alternatives = [] } = opts;
    const therapist = await getTherapistRowByUser(userId);

    return sequelize.transaction(async (tx) => {
      const availability = await TherapistAvailability.findOne({
        where: { therapist_id: therapist.id },
        transaction: tx,
        lock: tx.LOCK.UPDATE,
      });
      if (!availability) throw new Error("No availability found for this therapist.");

      const slotsMap = { ...parseJsonMaybe(availability.selected_time_slots, {}) };
      const datesArr = [...toArrayMaybe(availability.selected_dates)];
      const daySlots = Array.isArray(slotsMap[date]) ? [...slotsMap[date]] : [];

      // enforce policy per slot
      for (const slot of daySlots) {
        await this.handlePolicyForSlot(therapist.id, date, slot, policy, alternatives, tx);
      }

      // drop the date entirely
      delete slotsMap[date];
      const idx = datesArr.indexOf(date);
      if (idx !== -1) datesArr.splice(idx, 1);

      availability.set("selected_time_slots", slotsMap);
      availability.set("selected_dates", datesArr);
      availability.changed("selected_time_slots", true);
      availability.changed("selected_dates", true);

      await availability.save({ transaction: tx });
      return { message: `All slots on ${date} removed (policy: ${policy}).` };
    });
  }

  /* ---- mark booked (optional utility) ---- */

  async markSlotAsBooked(userId, date, timeSlot) {
    const therapist = await getTherapistRowByUser(userId);
    const availability = await TherapistAvailability.findOne({
      where: { therapist_id: therapist.id },
    });
    if (!availability) throw new Error("No availability found for this therapist.");

    const nSlot = normalizeSlotLocal(timeSlot);
    const slotsMap = { ...parseJsonMaybe(availability.selected_time_slots, {}) };
    const datesArr = [...toArrayMaybe(availability.selected_dates)];

    const current = Array.isArray(slotsMap[date]) ? [...slotsMap[date]] : [];
    const next = current.filter(s => normalizeSlotLocal(s) !== nSlot);

    if (next.length > 0) {
      slotsMap[date] = next;
    } else {
      delete slotsMap[date];
      const idx = datesArr.indexOf(date);
      if (idx !== -1) datesArr.splice(idx, 1);
    }

    availability.set("selected_time_slots", slotsMap);
    availability.set("selected_dates", datesArr);
    availability.changed("selected_time_slots", true);
    availability.changed("selected_dates", true);

    await availability.save();
    return { message: `Slot ${nSlot} on ${date} marked as booked.` };
  }
}

export default new TherapistAvailabilityService();

