// routes/dashboard.js
import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import DashboardController from '../controllers/dashboardController.js';

const router = express.Router();

// ─── 1. User Adoption & Activity ────────────────────────────────────────────────
router.get('/users/summary',        DashboardController.userSummary);
router.get('/users/retention',      DashboardController.retention);
router.get('/users/sessions',       DashboardController.sessions);
router.get(
    '/users/detail/:userId',
    DashboardController.userDetail
  );
  router.get(
    '/users/list',
    DashboardController.userList
  );

// ─── 2. Chatbot & Messaging Insights ─────────────────────────────────────────────
router.get('/chat/overview',        DashboardController.chatOverview);
router.get('/chat/sentiment-shift',   DashboardController.sentimentShift);
router.get('/chat/media-breakdown',   DashboardController.mediaBreakdown);

// ─── 3. Therapeutic Engagement ────────────────────────────────────────────────────
router.get('/therapy/funnel',       DashboardController.appointmentFunnel);
router.get('/therapy/lead-time',    DashboardController.leadTime);
router.get('/therapy/ratings',      DashboardController.therapistRatings);

// ─── 4. Journals & Reflection ─────────────────────────────────────────────────────
router.get('/journal/volume',       DashboardController.journalVolume);
router.get('/journal/sentiment',    DashboardController.journalSentiment);
router.get('/journal/tags',         DashboardController.journalTags);

// ─── 5. Community & Moderation ───────────────────────────────────────────────────
router.get('/community/posts',      DashboardController.communityPosts);
router.get('/moderation/violations',   DashboardController.violations);
router.get('/moderation/actions',   DashboardController.adminActions);

// ─── 6. Well-being Outcomes ───────────────────────────────────────────────────────
router.get('/mood/trends',          DashboardController.moodTrends);
router.get('/mood/correlation',     DashboardController.moodCorrelation);

router.get(
    '/sentiment/lift',
    DashboardController.sentimentLiftAll
  );
  router.get(
    '/sentiment/lift/:userId',
    DashboardController.sentimentLift
  );

export default router;
