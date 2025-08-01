// models/Habit.js
import mongoose from "mongoose";

const habitSchema = new mongoose.Schema({
  userId:       { type: String, required: true },      // store your UUID here
  name:         { type: String, required: true },
  description:  { type: String, default: "" },
  icon:         { type: String, default: "🌱" },
  color:        { type: String, default: "#10B981" },
  frequency:    { type: String, enum: ["daily","weekly","custom"], default: "weekly" },
  schedule: {
    weekdays:   [{ type: Number }],      // 0=Sun…6=Sat for weekly habits
    // (future: monthlyDates, custom intervals, etc)
  },
  tags:         [{ type: String }],      // e.g. ["sunlight","walk"]
  createdAt:    { type: Date, default: Date.now },
  updatedAt:    { type: Date, default: Date.now },
});
export default mongoose.model("Habit", habitSchema);
