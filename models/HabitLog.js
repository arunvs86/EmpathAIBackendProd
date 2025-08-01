// models/HabitLog.js
import mongoose from "mongoose";

const habitLogSchema = new mongoose.Schema({
  habitId:      { type: mongoose.Types.ObjectId, ref: "Habit", required: true },
  userId:       { type: String, required: true },  
  date:         { type: Date, required: true },   // normalized to midnight UTC
  completed:    { type: Boolean, default: false },
  notes:        { type: String, default: "" },    // optional reflection
});
habitLogSchema.index({ habitId:1, userId:1, date:1 }, { unique: true });
export default mongoose.model("HabitLog", habitLogSchema);
