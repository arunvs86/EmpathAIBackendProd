// import postService from "../post/postService.js"; // adjust path
// import User from "../../models/User.js";
// // Replace with your real bot user ID from Postgres:
// const BOT_USER_ID = "4b4bea73-9b6f-4a65-a436-29a8d1d435bc";

// // Define topics & associated message templates:
// const TEMPLATES = {
//     "Wellness tips": [
//       "💧 Remember to stay hydrated—aim for 8 cups of water today.",
//       "🌳 Take a 10-minute walk outside and breathe in some fresh air.",
//       "🛁 Treat yourself to a warm bath with Epsom salts tonight.",
//       "🧘 Try a 5-minute guided stretch session first thing this morning.",
//       "📵 Unplug from screens for 30 minutes and read a book you love.",
//       "✍️ Jot down three accomplishments from today, however small.",
//       "🍎 Swap one snack for a piece of fruit or a handful of nuts.",
//       "🎵 Play your favorite uplifting song and really listen to it.",
//       "😴 Aim for consistent sleep—go to bed and wake up 15 minutes earlier.",
//       "🌿 Add a houseplant to your workspace for cleaner air and calm vibes.",
//     ],
  
//     "Mindful meditation": [
//       "🕯 Sit quietly and focus on your breath for 2 minutes—no judgment.",
//       "🌿 Perform a 3-minute sound meditation—notice each environmental noise.",
//       "🧘‍♂️ Do a 5-step body scan, from toes to crown of your head.",
//       "🖼 Visualize a calm place—a beach, forest, or mountain—and stay there 3 minutes.",
//       "📿 Use a simple mantra like “I am here” on each inhale and exhale.",
//       "🥣 Eat one snack mindfully—tune in to every flavor and texture.",
//       "🚶‍♀️ Practice walking meditation—feel each footstep and breath.",
//       "📱 Try a guided app meditation for 5 minutes before bedtime.",
//       "💭 Observe a single thought, let it pass without engaging.",
//       "🖌 Draw or doodle freely for 3 minutes, focusing on the motion.",
//     ],
  
//     "Self-Care": [
//       "🛌 Schedule a 20-minute power nap if you’re feeling drained.",
//       "☕ Brew your favorite tea or coffee and savor it slowly.",
//       "🧴 Give yourself a mini spa treatment—face mask or hand massage.",
//       "🎨 Do a quick creative activity—coloring, painting, or crafting.",
//       "📖 Read a chapter of a book that inspires or relaxes you.",
//       "✉️ Write a kind note to yourself—remind yourself you matter.",
//       "🧦 Wear your comfiest outfit for the next hour—just because.",
//       "📅 Block off 30 minutes in your calendar as “me time.”",
//       "📺 Watch a short, uplifting video or comedy clip.",
//       "💤 Do a bedtime ritual—dim lights, gentle stretch, and deep breaths.",
//     ],
  
//     "Stress Management": [
//       "🕹 Try 4-7-8 breathing: inhale 4s, hold 7s, exhale 8s, repeat 4×.",
//       "🎶 Play calming music and match your breathing to the beat.",
//       "📱 Do a digital detox—silence notifications for 1 hour.",
//       "🔄 Practice progressive muscle relaxation, tensing & releasing each muscle group.",
//       "📋 Make a quick to-do list—get worries out of your head onto paper.",
//       "⚽ Do 5 minutes of physical activity—jumping jacks or a quick jog.",
//       "🌻 Look around and name 5 things you see, 4 things you touch, 3 things you hear.",
//       "📝 Write down what’s stressing you—then cross off any solvable tasks.",
//       "🧂 Take a moment to notice flavors—try a small bite of salty snack mindfully.",
//       "🌬 Step outside and take 10 deep belly breaths under open sky.",
//     ],
  
//     "Emotional Healing": [
//       "💌 Write an honest letter to yourself—what do you most need right now?",
//       "🌅 Watch a sunrise or sunset and acknowledge one emotion you feel.",
//       "🗣 Say a positive affirmation out loud: “I am worthy of care and rest.”",
//       "🖼 Create a small vision board of things that bring you peace.",
//       "🤲 Do a loving-kindness meditation—send goodwill to yourself and others.",
//       "📆 Schedule a weekly check-in with a trusted friend or therapist.",
//       "🎭 Express an emotion through a quick sketch or doodle.",
//       "🛤 Visualize releasing one heavy thought as a balloon floating away.",
//       "📚 Read a short story or poem that mirrors what you’re feeling.",
//       "💧 Practice crying if you need to—let your tears wash stress away.",
//     ],
  
//     "Resilience": [
//       "🛠 Recall a past challenge you overcame—write down the lesson learned.",
//       "🌱 Set one small goal today—taking action builds confidence.",
//       "🎤 Share a brief story of your growth with someone you trust.",
//       "🐜 Break big tasks into tiny steps—tackle the first one now.",
//       "🏆 Remind yourself of three strengths you have in tough times.",
//       "🔄 When a setback happens, ask “What can I adjust?” instead of “Why me?”",
//       "🧭 Visualize your ideal future self overcoming today’s obstacle.",
//       "🧩 Tackle a small puzzle or brain teaser to shift perspective.",
//       "🤝 Reach out to someone who inspires your own resilience.",
//       "📖 Read a short biography of someone who persisted through hardship.",
//     ],
  
//     "Social Support": [
//       "☎️ Call or text someone you haven’t checked in with recently.",
//       "🍪 Bake or buy a small treat and share it with a neighbor or colleague.",
//       "📸 Send a funny or uplifting photo to a friend “just because.”",
//       "✉️ Write a thank-you note to someone who’s supported you.",
//       "👂 Offer an ear—ask a friend how they’re really doing today.",
//       "🌐 Join an online group or forum around a shared interest.",
//       "🚶 Invite a friend for a short walk and catch up.",
//       "🤗 Plan a virtual coffee date with someone far away.",
//       "🎲 Organize a quick game night (even a phone-based quiz).",
//       "💬 Share one positive thought in a group chat or community board.",
//     ],
  
//     "Gratitude": [
//       "🙏 List three things you’re grateful for right now in your journal.",
//       "📸 Take a photo of something small you appreciate and save it.",
//       "🗓 Each morning, pick one thing yesterday you’re thankful for.",
//       "🍂 Notice and name one simple pleasure in this moment.",
//       "💌 Send a gratitude text to someone who made your day better.",
//       "☕ Appreciate your next drink—savor its warmth or flavor fully.",
//       "🖼 Write a thank-you note to yourself for something you accomplished.",
//       "🌈 Spend 30 seconds looking at the sky—feel thankful for nature.",
//       "🎶 Listen to a song you love—be grateful for the joy it brings.",
//       "📚 Read a short gratitude story or poem online.",
//     ],
  
//     "Sleep Hygiene": [
//       "🌙 Dim lights 30 minutes before bed; try reading instead of screens.",
//       "📵 Put your phone on Do Not Disturb and place it away from your bed.",
//       "🛏 Keep your room cool (around 18–20 °C) for deeper sleep.",
//       "🕯 Light a lavender-scented candle (blow it out before sleep!).",
//       "🥱 Do gentle stretches for 2 minutes to relax before lying down.",
//       "📖 Journal 3 thoughts to clear your mind before lights out.",
//       "🎧 Listen to a 5-minute sleep story or calming music track.",
//       "☕ Avoid caffeine after 2 PM to help you wind down naturally.",
//       "💤 Try a brief guided meditation focusing on body relaxation.",
//       "⏰ Go to bed and wake up at the same times—even on weekends.",
//     ],
  
//     "Healthy Eating": [
//       "🥗 Add an extra serving of veggies to one meal today.",
//       "🚰 Start your day with a glass of water before anything else.",
//       "🍇 Replace a processed snack with a handful of fruit.",
//       "🥛 Swap one sugary drink for water or herbal tea.",
//       "🥙 Try a new healthy recipe this week—keep it simple!",
//       "🍽 Eat mindfully—chew slowly and notice every flavor.",
//       "🌶 Add a pinch of spice (like cayenne) to boost metabolism.",
//       "🍵 Enjoy a cup of green tea for a gentle antioxidant boost.",
//       "🥄 Measure portions instead of eating straight from the package.",
//       "🛒 Plan your next grocery trip—include at least 5 colorful foods.",
//     ],

//     "Religious Support": [
//   "🙏 Offer a silent prayer or moment of gratitude to your higher power, naming your grief and hopes.",
//   "📖 Read a comforting passage from a sacred text—psalms, sutras, verses or scriptures—finding solace.",
//   "🕯️ Light a candle at home or in a place of worship, reflecting on the light and warmth of love.",
//   "🛕 Visit a local temple, church, mosque or synagogue for a communal ritual or quiet meditation.",
//   "🧘‍♂️ Practice a brief mindful meditation focusing on compassion and acceptance of impermanence.",
//   "🎶 Listen to a spiritual hymn, chant or mantra that honors life and the journey through loss.",
//   "🤝 Join a prayer circle or support group to share memories and receive communal comfort.",
//   "🌸 Create a small altar with flowers and photos, offering beauty and remembrance to departed souls.",
//   "🗣️ Recite a short prayer of healing and hope at sunrise or sunset to mark a new beginning.",
//   "🛐 Place an offering of food, water or incense at an altar, symbolizing nurture for the spirit.",
//   "🖼️ Light incense or a fragrant stick, using the rising smoke as a prayer carrier to the divine.",
//   "🧿 Hold a blessed object—rosary beads, mala or prayer rope—to soothe anxiety and focus mind.",
//   "📜 Memorize and recite a teaching on compassion or resilience drawn from your faith tradition.",
//   "🕊️ Release a lantern or biodegradable balloon in memory, visualizing grief lifting away.",
//   "💧 Sprinkle or sip holy water as a symbol of purification and emotional renewal.",
//   "🔔 Ring a bell or use a gong to create a sound offering, shifting energy from sorrow to peace.",
//   "🍞 Share a simple meal in fellowship with others, offering prayers of gratitude before eating.",
//   "🤲 Perform an act of charity or service, dedicating kindness to the memory of your loved one.",
//   "🏵️ Attend or watch a memorial service or religious ceremony to channel grief through ritual.",
//   "🔥 Engage in a safe fire ritual—burning paper prayers or incense—to transform grief into light.",
//   "🦋 Collect a natural token—a leaf, stone or flower—as a tangible reminder of spiritual connection.",
//   "🕉️ Chant a calming mantra or sacred syllable (e.g. Om, Amen, Amin) for three minutes of focus.",
//   "✡️ Meditate on a sacred symbol (cross, star, wheel) that resonates with your beliefs and hope.",
//   "🎨 Paint or draw a spiritual symbol or mandala, visualizing healing and the cycle of life.",
//   "🌅 Watch the sunrise or sunset in stillness, reflecting on renewal and the promise of tomorrow.",
//   "📩 Write and share a gratitude note with your faith community, inviting collective support.",
//   "⏳ Observe a minute of silence at night under the stars, feeling the vastness beyond grief.",
//   "🙏 Close with a simple prayer of gratitude and hope, blessing yourself and those you love."
// ]
//   };

// class BotService {
//   async createScheduledPost(topic) {
//     if (!TEMPLATES[topic]) {
//       throw new Error(`Unknown topic: ${topic}`);
//     }
//     // Pick a random template for this topic:
//     const choices = TEMPLATES[topic];
//     const content = choices[Math.floor(Math.random() * choices.length)];
//     // Create the post via your existing service:
//     const newPost = await postService.createPost(BOT_USER_ID, {
//       content,
//       media: [],                // or omit if not needed
//       categories: [topic],      // tags it correctly
//       anonymous: false
//     });

//     const faithTopic = TEMPLATES["Religious Support"];
//     const faithContent = faithTopic[Math.floor(Math.random() * faithTopic.length)];
//     const newFaithBasedPost = await postService.createPost(BOT_USER_ID, {
//       content: faithContent,
//       media: [],                // or omit if not needed
//       categories: ['Religious Support'],      // tags it correctly
//       anonymous: false
//     });

//     console.log(`Bot post created: ${newFaithBasedPost._id} under "${topic}"`);
//     return newPost;
//   }
// }

// export default new BotService();


// botService.js
import postService from "../post/postService.js";

const BOT_USER_ID = "c7291129-8ed5-40d6-a504-b96f957ceb88";

export const BOT_TOPICS = [
  "Wellness tips", "Mindful meditation", "Self-Care", "Stress Management",
  "Emotional Healing", "Resilience", "Social Support", "Gratitude",
  "Sleep Hygiene", "Healthy Eating", "Religious Support",
  "Denial Support", "Anger Support", "Bargaining Reflection",
  "Depression Support", "Acceptance & Healing"
];

const PROMPT_TEMPLATES = {
  "Wellness tips": [
    "Share a practical wellness tip for someone struggling to care for themselves while grieving.",
    "What’s a gentle wellness habit someone grieving can try today?",
    "Suggest a daily ritual to support emotional wellness during loss.",
    "Offer a reminder about staying hydrated and nourished during grief.",
    "Share a small physical act that can improve wellness amid grief.",
    "What’s a simple grounding practice for someone overwhelmed?",
    "List one soothing activity to calm the body and mind.",
    "Suggest a low-effort act of self-care for a grieving person.",
    "Share one way to bring comfort through physical space or environment.",
    "What’s a kind thing someone can do for their body today?"
  ],

  "Mindful meditation": [
    "Guide a short meditation to help calm grief-related anxiety.",
    "Describe a breathing technique for those struggling with sorrow.",
    "What’s a 2-minute mindfulness practice to ground emotions?",
    "Help someone center themselves when feeling emotionally lost.",
    "Offer a gentle body scan meditation for the grieving.",
    "Suggest a mantra to repeat during emotional overwhelm.",
    "How can someone create a peaceful mental space amid grief?",
    "Write a nature-based mindfulness practice to restore calm.",
    "Guide someone through accepting painful thoughts with compassion.",
    "What’s one mindful act someone can do this evening to find peace?"
  ],

  "Self-Care": [
    "Offer a self-care idea that doesn’t require much energy or motivation.",
    "Describe one small way to feel cared for during emotional pain.",
    "Suggest a gentle activity for someone neglecting their own needs.",
    "How can someone show compassion to themselves today?",
    "Give an example of a quiet self-kindness practice.",
    "Recommend a sensory-based self-care action (scent, touch, sound, etc).",
    "Share a slow, simple way to reset emotionally.",
    "What’s a soothing bedtime self-care ritual for the grieving?",
    "Describe a caring thing someone can do for their future self.",
    "What’s one thing someone can forgive themselves for today?"
  ],

  "Stress Management": [
    "Give a simple strategy to calm racing thoughts due to grief.",
    "How can someone release tension from their body gently?",
    "Describe a grounding exercise to manage emotional overwhelm.",
    "What’s one tiny step to create safety when feeling lost?",
    "Offer a visualization to reduce inner stress.",
    "Share a short exercise to relax the nervous system.",
    "Recommend a sensory calming method for panic or restlessness.",
    "Describe a method to self-soothe when tears won’t stop.",
    "What’s one thing someone can control today when life feels chaotic?",
    "How can someone pause and reset in under 2 minutes?"
  ],

  "Emotional Healing": [
    "Help someone name and sit with a difficult emotion safely.",
    "Guide a gentle process for processing grief-related guilt.",
    "How can someone comfort themselves when feeling abandoned?",
    "Offer an emotional release practice using creativity.",
    "Suggest one way to witness pain without pushing it away.",
    "Describe how to journal grief honestly and without judgment.",
    "Give words of validation for someone who feels numb.",
    "Suggest how to reconnect with emotions through music or sound.",
    "Offer a nighttime ritual to release emotional heaviness.",
    "What’s one way to allow grief without fear of drowning in it?"
  ],

  "Resilience": [
    "Remind someone of the strength it takes to keep going in grief.",
    "How can someone track tiny signs of healing during loss?",
    "Suggest a small act of hope to try today.",
    "Describe how to draw on past inner strength now.",
    "What does courage look like for someone grieving?",
    "Give an example of quiet bravery in emotional pain.",
    "Share one tiny habit that builds resilience gently.",
    "What’s one promise someone can make to themselves?",
    "How can someone remember they’re not broken forever?",
    "Encourage someone to honor their effort, not just outcomes."
  ],

  "Social Support": [
    "Give a gentle script to ask for help when grieving.",
    "Describe one way to feel less alone in emotional pain.",
    "Suggest a small act of connection to try today.",
    "What’s a non-verbal way to feel supported by others?",
    "Help someone reach out without needing to explain everything.",
    "Offer comfort for someone afraid of burdening others.",
    "How can someone let love in even while hurting?",
    "Share a way to express needs without shame.",
    "Encourage joining a grief group or support community.",
    "What’s a safe way to reconnect socially after withdrawal?"
  ],

  "Gratitude": [
    "Suggest a gentle gratitude practice for someone grieving.",
    "What’s one small comfort someone can appreciate today?",
    "Offer a way to notice goodness without denying grief.",
    "How can someone honor love that still exists in their life?",
    "Describe a gratitude ritual that doesn’t feel forced.",
    "Share a reflection prompt about what’s still meaningful.",
    "Help someone shift focus gently without toxic positivity.",
    "Encourage gratitude for inner strength or survival.",
    "Suggest giving thanks for one person’s presence today.",
    "Describe a way to blend grief and gratitude honestly."
  ],

  "Sleep Hygiene": [
    "Offer a gentle nighttime routine for those grieving.",
    "Suggest a calming bedtime audio practice.",
    "Describe a journaling idea to reduce mental noise at night.",
    "Give one tip for making sleep feel safe again.",
    "How can someone feel less afraid to lie down in silence?",
    "Suggest a soft way to unwind when sleep feels impossible.",
    "Recommend a sleep posture or pillow tip for comfort.",
    "Share a low-energy bedtime ritual with emotional support.",
    "Help someone build a soothing sensory sleep environment.",
    "Suggest letting go of productivity guilt around poor sleep."
  ],

  "Healthy Eating": [
    "How can someone nourish themselves when appetite is gone?",
    "Suggest a low-effort, comforting food idea.",
    "Offer a reminder to eat slowly and gently.",
    "What’s a simple way to reintroduce regular meals in grief?",
    "Describe a food ritual that offers comfort and memory.",
    "Encourage hydration as part of emotional care.",
    "How can someone cook for one with self-compassion?",
    "Share a tip for asking others to help with food prep.",
    "Suggest a snack idea when full meals feel overwhelming.",
    "Help someone remove guilt or shame from emotional eating."
  ],

  "Religious Support": [
    "Offer a spiritual reflection to honor grief.",
    "Suggest a ritual from any tradition to feel connected beyond loss.",
    "Share a quiet prayer or mantra for emotional strength.",
    "Describe how someone can bring faith into their healing.",
    "What’s a sacred reading or symbol of comfort for this moment?",
    "Encourage lighting a candle or incense in remembrance.",
    "Offer a way to speak to a higher power honestly.",
    "Describe how someone can pray without needing words.",
    "Share a simple act of service as spiritual healing.",
    "Suggest a quiet visit to a spiritual place or altar."
  ],

  // Grief stages
  "Denial Support": [
    "What helps someone gently face painful truths they’re avoiding?",
    "Guide someone in naming what feels too hard to believe right now.",
    "Offer a compassionate explanation of denial as part of grief.",
    "Describe how to stay grounded when nothing feels real.",
    "What’s one safe truth someone can accept today?",
    "Share how denial can protect—but also isolate us.",
    "Suggest a journaling prompt to explore disbelief.",
    "How can someone honor their pain without rushing it?",
    "Help someone sit with unanswered questions without pressure.",
    "Give words to someone who feels emotionally frozen."
  ],

  "Anger Support": [
    "Validate anger in grief and describe healthy release options.",
    "What’s a safe space for someone to express rage or blame?",
    "Offer a physical action to move anger through the body.",
    "Describe a writing practice to unload raw emotions.",
    "Suggest words for someone feeling guilt masked as anger.",
    "How can someone be angry without hurting themselves or others?",
    "What’s one way to ask others to hold space for grief-anger?",
    "Normalize anger at loss, fate, even at loved ones.",
    "Describe a visualization to burn through anger safely.",
    "Encourage allowing anger to rise without shame."
  ],

  "Bargaining Support": [
    "Describe what it’s like to ask “what if” and “if only” in grief.",
    "Offer a reflection prompt to witness bargaining thoughts.",
    "How can someone forgive themselves for things left unsaid?",
    "Guide someone through releasing impossible wishes.",
    "Normalize wanting to rewrite the past in grief.",
    "What does self-compassion look like during bargaining?",
    "Describe how to stay grounded when spiraling into regret.",
    "Share words that validate someone pleading with fate or God.",
    "Encourage journaling a letter to the person lost or to the past.",
    "How can someone witness their bargaining without judgment?"
  ],

  "Depression Support": [
    "Offer a small act someone can do when they feel completely flat.",
    "Give words of comfort to someone lost in grief’s heaviness.",
    "Describe a reason to get out of bed that isn’t forced.",
    "What’s one gentle thing to try when nothing feels meaningful?",
    "Validate emotional numbness without pressure to feel better.",
    "Encourage reaching out without needing to talk.",
    "Describe how to co-exist with pain without fixing it.",
    "Offer an image of hope that doesn’t erase sadness.",
    "What’s one non-shaming way to spend the day?",
    "Remind someone that stillness can also be part of healing."
  ],

  "Acceptance Support": [
    "What does acceptance feel like when it’s quiet and incomplete?",
    "Share an image of slow healing that doesn’t skip the hard parts.",
    "Encourage noticing moments of peace without guilt.",
    "How can someone honor their grief while moving forward?",
    "Describe how acceptance is not forgetting or approving of the loss.",
    "Offer a reflection on living with love and pain side by side.",
    "What’s one change someone has survived that proves growth?",
    "Suggest a ritual to honor both memory and resilience.",
    "Validate healing that looks different from others’ paths.",
    "How can someone carry their loved one into their next chapter?"
  ]
};

class BotService {
  async createScheduledPost(topic) {
    const prompts = PROMPT_TEMPLATES[topic];
    if (!prompts || prompts.length === 0) throw new Error("No prompts for topic: " + topic);

    const prompt = prompts[Math.floor(Math.random() * prompts.length)];
    const promptForBot = prompt + "Give me a short human-written post (2-3 sentences) that supports users helping them gently cope without toxic positivity.`"
    console.log("prompt",prompt)
    const response = await fetch("https://flask-app-275410178944.europe-west2.run.app/ask", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        question: promptForBot,
        session_id: "grief-bot-session", // you can make this static
      }),
    });
  
    if (!response.ok) {
      throw new Error("Failed to fetch chatbot response");
    }
  
    const botData = await response.json();
    const content = botData.response;
    const cleaned = content.replace(/\n{2,}/g, '\n').trim();

  
    const newPost = await postService.createPost(BOT_USER_ID, {
      content: cleaned,
      media: [],
      categories: [topic],
      anonymous: false,
    });
  
    console.log(`📝 Bot auto-posted under "${topic}"`);
    return newPost;
  }
}

export default new BotService();