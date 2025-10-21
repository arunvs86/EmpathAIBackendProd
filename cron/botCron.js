import cron from "node-cron";
import botService from "../services/bot/botService.js";

// 1) Your list of possible topics
const BOT_TOPICS = [
  "Wellness tips",
  "Mindful meditation",
  "Self-Care",
  "Stress Management",
  "Emotional Healing",
  "Resilience",
  "Social Support",
  "Gratitude",
  "Sleep Hygiene",
  "Healthy Eating",
  "Religious Support",
  "Denial Support",
  "Anger Support",
  "Bargaining Support",
  "Depression Support",
  "Acceptance Support"
];

// 2) Helper to choose one at random
function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 3) Schedule: at minute 0 of every 2nd hour
cron.schedule(
    "0 */2 * * *",
    // "*/1 * * * *",
    async () => {
    const topic = pickRandom(BOT_TOPICS);
    // console.log(`🕑 [Bot Scheduler] Posting under topic: "${topic}"`);
    try {
      // your botService should take a single topic string
      // await botService.createScheduledPost(topic);
      console.log(`✅ [Bot Scheduler] ran Successfully `);
    } catch (err) {
      console.error(`❌ [Bot Scheduler] Failed to post "${topic}" tip:`, err);
    }
  },
  {
    scheduled: true,
    timezone: "Europe/London",
  }
);

console.log(
  "🤖 [Bot Scheduler] Initialized: will post one tip every 2 hours under a random topic."
);