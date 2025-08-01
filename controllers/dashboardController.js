// controllers/dashboardController.js
import DashboardService from '../services/dashboard/dashboardService.js';

class DashboardController {
  // 1. User Adoption & Activity
  static async userSummary(req, res) {
    try {
      const data = await DashboardService.userSummary();
      return res.json(data);
    } catch (err) {
      console.error('userSummary error:', err);
      return res.status(500).json({ error: 'Failed to fetch user summary.' });
    }
  }

  static async retention(req, res) {
    try {
      const data = await DashboardService.retentionCohorts();
      return res.json({ cohorts: data });
    } catch (err) {
      console.error('retention error:', err);
      return res.status(500).json({ error: 'Failed to fetch retention cohorts.' });
    }
  }

  static async sessions(req, res) {
    try {
      const data = await DashboardService.loginPatterns();
      return res.json({ byHour: data });
    } catch (err) {
      console.error('sessions error:', err);
      return res.status(500).json({ error: 'Failed to fetch login patterns.' });
    }
  }

  static async userDetail(req, res) {
    try {
      const { userId } = req.params;
      const data = await DashboardService.userDetail(userId);
      return res.json(data);
    } catch (err) {
      console.error('userDetail error:', err);
      return res
        .status(500)
        .json({ error: 'Failed to fetch detailed user metrics.' });
    }
  }

  static async userList(req, res) {
    try {
      const users = await DashboardService.listUsers();
      return res.json(users);
    } catch (err) {
      console.error('userList error:', err);
      return res
        .status(500)
        .json({ error: 'Failed to fetch user list.' });
    }
  }

  // 2. Chatbot & Messaging Insights
  static async chatOverview(req, res) {
    try {
      const data = await DashboardService.chatOverview();
      return res.json(data);
    } catch (err) {
      console.error('chatOverview error:', err);
      return res.status(500).json({ error: 'Failed to fetch chat overview.' });
    }
  }

  static async sentimentShift(req, res) {
    try {
      const data = await DashboardService.sentimentShift();
      return res.json(data);
    } catch (err) {
      console.error('sentimentShift error:', err);
      return res.status(500).json({ error: 'Failed to fetch sentiment shift.' });
    }
  }

  static async mediaBreakdown(req, res) {
    try {
      const data = await DashboardService.mediaTypeDistribution();
      return res.json(data);
    } catch (err) {
      console.error('mediaBreakdown error:', err);
      return res.status(500).json({ error: 'Failed to fetch media breakdown.' });
    }
  }

  // 3. Therapeutic Engagement
  static async appointmentFunnel(req, res) {
    try {
      const data = await DashboardService.appointmentFunnel();
      return res.json(data);
    } catch (err) {
      console.error('appointmentFunnel error:', err);
      return res.status(500).json({ error: 'Failed to fetch appointment funnel.' });
    }
  }

  static async leadTime(req, res) {
    try {
      const data = await DashboardService.avgLeadTime();
      return res.json(data);
    } catch (err) {
      console.error('leadTime error:', err);
      return res.status(500).json({ error: 'Failed to fetch average lead time.' });
    }
  }

  static async therapistRatings(req, res) {
    try {
      const data = await DashboardService.therapistPerformance();
      return res.json(data);
    } catch (err) {
      console.error('therapistRatings error:', err);
      return res.status(500).json({ error: 'Failed to fetch therapist ratings.' });
    }
  }

  // 4. Journals & Reflection
  static async journalVolume(req, res) {
    try {
      const data = await DashboardService.entryCountOverTime();
      return res.json(data);
    } catch (err) {
      console.error('journalVolume error:', err);
      return res.status(500).json({ error: 'Failed to fetch journal volume.' });
    }
  }

  static async journalSentiment(req, res) {
    try {
      const data = await DashboardService.journalSentimentDistribution();
      return res.json(data);
    } catch (err) {
      console.error('journalSentiment error:', err);
      return res.status(500).json({ error: 'Failed to fetch journal sentiment.' });
    }
  }

  static async journalTags(req, res) {
    try {
      const data = await DashboardService.topJournalTags();
      return res.json(data);
    } catch (err) {
      console.error('journalTags error:', err);
      return res.status(500).json({ error: 'Failed to fetch journal tags.' });
    }
  }

  // 5. Community & Moderation
  static async communityPosts(req, res) {
    try {
      const data = await DashboardService.postsByCommunity();
      return res.json(data);
    } catch (err) {
      console.error('communityPosts error:', err);
      return res.status(500).json({ error: 'Failed to fetch community posts.' });
    }
  }

  static async violations(req, res) {
    try {
      const data = await DashboardService.violationStats();
      return res.json(data);
    } catch (err) {
      console.error('violations error:', err);
      return res.status(500).json({ error: 'Failed to fetch violations stats.' });
    }
  }

  static async adminActions(req, res) {
    try {
      const data = await DashboardService.adminActionsByType();
      return res.json(data);
    } catch (err) {
      console.error('adminActions error:', err);
      return res.status(500).json({ error: 'Failed to fetch admin actions.' });
    }
  }

  // 6. Well-being Outcomes
  static async moodTrends(req, res) {
    try {
      const data = await DashboardService.moodOverTime();
      return res.json(data);
    } catch (err) {
      console.error('moodTrends error:', err);
      return res.status(500).json({ error: 'Failed to fetch mood trends.' });
    }
  }

  static async moodCorrelation(req, res) {
    try {
      const data = await DashboardService.correlationWithActivities();
      return res.json(data);
    } catch (err) {
      console.error('moodCorrelation error:', err);
      return res.status(500).json({ error: 'Failed to fetch mood correlation.' });
    }
  }

  static async sentimentLiftAll(req, res) {
    try {
      const result = await DashboardService.sentimentLiftAll();
      return res.json(result);
    } catch (err) {
      console.error('sentimentLiftAll error:', err);
      return res
        .status(500)
        .json({ error: 'Failed to fetch platform sentiment lift.' });
    }
  }

  /** GET /api/dashboard/sentiment/lift/:userId */
  static async sentimentLift(req, res) {
    try {
      const { userId } = req.params;
      const result = await DashboardService.sentimentLift(userId);
      return res.json(result);
    } catch (err) {
      console.error('sentimentLift error:', err);
      return res
        .status(500)
        .json({ error: 'Failed to fetch user sentiment lift.' });
    }
  }
}

export default DashboardController;
