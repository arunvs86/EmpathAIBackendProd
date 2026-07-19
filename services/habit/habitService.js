// src/services/habitService.js
import Habit from "../../models/Habit.js";
import HabitLog from "../../models/HabitLog.js";

/** Normalize a date to UTC midnight (timezone-stable day key). */
function toUtcMidnight(input) {
  if (typeof input === "string" && /^\d{4}-\d{2}-\d{2}$/.test(input)) {
    return new Date(`${input}T00:00:00.000Z`);
  }
  const d = new Date(input);
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()));
}

class HabitService {
  /** Fetch all habits for a user */
  async findByUser(userId) {
    return Habit.find({ userId }).sort("createdAt").exec();
  }

  /** Create a new habit */
  async create(userId, data) {
    const habit = new Habit({ userId, ...data });
    return habit.save();
  }

  /** Get one habit by ID & user */
  async getById(id, userId) {
    return Habit.findOne({ _id: id, userId }).exec();
  }

  /** Update a habit */
  async update(id, userId, updates) {
    return Habit.findOneAndUpdate(
      { _id: id, userId },
      updates,
      { new: true }
    ).exec();
  }

  /** Delete a habit (and its logs) */
  async remove(id, userId) {
    const res = await Habit.findOneAndDelete({ _id: id, userId }).exec();
    if (res) {
      await HabitLog.deleteMany({ habitId: id }).exec();
    }
    return res;
  }

  /** Get all logs for a habit */
  async findLogs(habitId, userId) {
    return HabitLog.find({ habitId, userId }).sort("date").exec();
  }

  /** Upsert a log entry */
  async upsertLog(habitId, userId, { date, completed, notes = "" }) {
    const logDate = toUtcMidnight(date);

    return HabitLog.findOneAndUpdate(
      { habitId, userId, date: logDate },
      { $set: { completed, notes } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    ).exec();
  }

  /** Count completed logs in a date range (for analytics) */
  async countCompleted(habitId, userId, from, to) {
    return HabitLog.countDocuments({
      habitId,
      userId,
      completed: true,
      date: { $gte: from, $lte: to },
    }).exec();
  }

  /** Compute current streak (consecutive completed days, UTC-based) */
  async computeStreak(habitId, userId) {
    let streak = 0;
    // Anchor to today's UTC midnight
    const now = new Date();
    const anchor = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
    for (;;) {
      const d = new Date(anchor);
      d.setUTCDate(d.getUTCDate() - streak);
      const exists = await HabitLog.exists({
        habitId,
        userId,
        completed: true,
        date: d,
      });
      if (exists) streak++;
      else break;
    }
    return streak;
  }
}

export default new HabitService();
