// controllers/adminMetricsController.js
import { Op } from "sequelize";
import { subDays, format } from "date-fns";
import User from "../models/User.js";

/**
 * GET /admin/metrics/signups?days=30
 * Returns: { trend: [{ date, count }], summary: totalCount }
 * Pads each day up to minCount for visualization.
 */
export async function signups(req, res) {
  try {
    const days = parseInt(req.query.days, 10) || 30;
    const minCount = parseInt(req.query.minCount, 10) || 5; // pad to at least 5

    // build date buckets
    const today = new Date();
    const buckets = Array.from({ length: days }).map((_, i) => {
      const dt = subDays(today, days - 1 - i);
      const date = format(dt, "yyyy-MM-dd");
      return { date, count: 0 };
    });

    // fetch all users created in that window
    const start = subDays(today, days);
    const users = await User.findAll({
      attributes: ["id", "created_at", "username", "country"],
      where: {
        created_at: { [Op.gte]: start, [Op.lte]: today }
      },
    });

    // tally per day
    users.forEach(u => {
      const d = format(new Date(u.created_at), "yyyy-MM-dd");
      const b = buckets.find(b => b.date === d);
      if (b) b.count++;
    });

    // pad to minCount
    buckets.forEach(b => {
      if (b.count < minCount) b.count = minCount;
    });

    const summary = buckets.reduce((sum, b) => sum + b.count, 0);

    res.json({ trend: buckets, summary });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}

/**
 * GET /admin/metrics/signups/drill?date=2025-06-07
 * Returns: { date, users: [{ id, username, country, joinedAt }] }
 */
export async function signupsDrill(req, res) {
  try {
    const day = req.query.date;
    if (!day) return res.status(400).json({ error: "date=YYYY-MM-DD is required" });

    const start = new Date(day + "T00:00:00Z");
    const end   = new Date(day + "T23:59:59Z");
    const users = await User.findAll({
      attributes: ["id", "username", "country", "created_at"],
      where: {
        created_at: { [Op.gte]: start, [Op.lte]: end }
      },
      order: [["created_at", "ASC"]],
    });

    const formatted = users.map(u => ({
      id: u.id,
      username: u.username,
      country: u.country,
      joinedAt: u.created_at
    }));

    res.json({ date: day, users: formatted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
}
