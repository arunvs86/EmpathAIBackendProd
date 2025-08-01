import botService from "../services/bot/botService.js";

class BotController {
  // Fire one-off bot post immediately
  async runOnce(req, res) {
    try {
      const topic = req.query.topic;
      if (!topic) {
        return res.status(400).json({ error: "Query param `topic` is required" });
      }
      const post = await botService.createScheduledPost(topic);
      return res.status(201).json(post);
    } catch (err) {
      console.error("Bot run-once error:", err);
      return res.status(500).json({ error: err.message });
    }
  }
}

export default new BotController();
