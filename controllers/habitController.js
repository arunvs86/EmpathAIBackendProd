// controllers/habitController.js
import Habit from "../models/Habit.js";
import HabitLog from "../models/HabitLog.js";

class HabitController {
  // List all habits for the current user
  async list(req, res) {
    const userId = req.user.id;
    const habits = await Habit.find({ userId }).sort("createdAt");
    return res.json(habits);
  }

  // Create a new habit
  async create(req, res) {
    const userId = req.user.id;
    const data = { ...req.body, userId };
    const habit = await Habit.create(data);
    return res.status(201).json(habit);
  }

  // Get one habit
  async get(req, res) {
    const { id } = req.params;
    const habit = await Habit.findOne({ _id: id, userId: req.user.id });
    if (!habit) return res.status(404).json({ error: "Not found." });
    return res.json(habit);
  }

  // Update habit
  async update(req, res) {
    const { id } = req.params;
    const updates = req.body;
    const habit = await Habit.findOneAndUpdate(
      { _id: id, userId: req.user.id },
      updates,
      { new: true }
    );
    if (!habit) return res.status(404).json({ error: "Not found." });
    return res.json(habit);
  }

  // Delete habit
  async remove(req, res) {
    const { id } = req.params;
    const deleted = await Habit.findOneAndDelete({ _id: id, userId: req.user.id });
    if (!deleted) return res.status(404).json({ error: "Not found." });
    // Also remove its logs
    await HabitLog.deleteMany({ habitId: id });
    return res.status(204).end();
  }

  // List logs for a given habit
  async listLogs(req, res) {
    const { id } = req.params;
    const logs = await HabitLog.find({ habitId: id, userId: req.user.id })
      .sort("date");
    return res.json(logs);
  }

  // Create or update a log entry
  async upsertLog(req, res) {
    const { id } = req.params;         // habitId
    const userId = req.user.id;
    const { date, completed, notes } = req.body;
    const logDate = new Date(date);
    logDate.setHours(0,0,0,0);

    const result = await HabitLog.findOneAndUpdate(
      { habitId: id, userId, date: logDate },
      { $set: { completed, notes }},
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
    return res.json(result);
  }
}

export default new HabitController();
