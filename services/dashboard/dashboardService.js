// services/dashboardService.js
import { Op, fn, col, literal, Sequelize } from 'sequelize';
import User from '../../models/User.js';
import UserActivity from '../../models/UserActivity.js';
import Appointment from '../../models/Appointments.js';
import Chat from '../../models/Chat.js';
import Message from '../../models/Message.js';
import Journal from '../../models/Journal.js';
import Community from '../../models/Community.js';
import Post from '../../models/Post.js';
import UserViolations from '../../models/UserViolations.js';
import AdminActions from '../../models/AdminActions.js';
import Therapist from '../../models/Therapist.js';
import TherapySession from '../../models/TherapySession.js';

class DashboardService {
  /** 1. User Adoption & Activity */
  static async userSummary() {
    const totalUsers = await User.count();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const activeUsers = await User.count({
      where: { last_login: { [Op.gte]: thirtyDaysAgo } }
    });

    // DAU = distinct users logged in today
    const todayStart = new Date();
    todayStart.setHours(0,0,0,0);
    const dau = await UserActivity.count({
      distinct: true,
      col: 'user_id',
      where: { login_time: { [Op.gte]: todayStart } }
    });

    // MAU = distinct users logged in past 30 days
    const mau = await UserActivity.count({
      distinct: true,
      col: 'user_id',
      where: { login_time: { [Op.gte]: thirtyDaysAgo } }
    });

    return { totalUsers, activeUsers, DAU: dau, MAU: mau };
  }

  static async userDetail(userId) {
    // 1) Basic user info
    const user = await User.findByPk(userId, { raw: true });
    if (!user) throw new Error('User not found');

    const signupDate = user.created_at;
    const daysSinceSignup = Math.floor(
      (Date.now() - new Date(signupDate)) / (1000 * 60 * 60 * 24)
    );

    // 2) Activity counts
    const totalLogins = await UserActivity.count({
      where: { user_id: userId }
    });

    // 3) Journals
    const totalJournalEntries = await Journal.countDocuments({
      userId
    });

    // 4) Appointments
    const totalAppointments = await Appointment.count({
      where: { user_id: userId }
    });
    const completedAppointments = await Appointment.count({
      where: { user_id: userId, status: 'completed' }
    });

    // 5) Chats & Messages
    // total 1:1 conversations
    const totalConversations = await Chat.countDocuments({
      isGroup: false,
      participants: userId
    });
    // total messages sent by this user
    const msgCountResult = await Message.aggregate([
      { $unwind: '$messages' },
      { $match: { 'messages.senderId': userId } },
      { $count: 'count' }
    ]);
    const totalMessagesSent = msgCountResult[0]?.count || 0;

    return {
      userId,
      signupDate,
      daysSinceSignup,
      totalLogins,
      totalJournalEntries,
      totalAppointments,
      completedAppointments,
      totalConversations,
      totalMessagesSent
    };
  }

  static async listUsers() {
    return User.findAll({
      attributes: ['id', 'username', 'email'],
      raw: true
    });
  }

  static async retentionCohorts() {
    // Build simple day-based cohorts for the last 7 days
    const cohorts = [];
    for (let i = 7; i >= 1; i--) {
      const cohortDate = new Date();
      cohortDate.setDate(cohortDate.getDate() - i);
      const start = new Date(cohortDate);
      start.setHours(0,0,0,0);
      const end = new Date(cohortDate);
      end.setHours(23,59,59,999);
      // users who signed up on cohortDate
      const signups = await User.count({
        where: { created_at: { [Op.between]: [start, end] } }
      });
      // of those, how many logged in 1 day later
      const nextDay = new Date(cohortDate);
      nextDay.setDate(nextDay.getDate() + 1);
      const nextStart = new Date(nextDay); nextStart.setHours(0,0,0,0);
      const nextEnd = new Date(nextDay); nextEnd.setHours(23,59,59,999);
      const retained = await UserActivity.count({
        distinct: true,
        col: 'user_id',
        where: {
          user_id: {
            [Op.in]: Sequelize.literal(`(
              SELECT id FROM "Users"
              WHERE created_at BETWEEN '${start.toISOString()}' AND '${end.toISOString()}'
            )`)
          },
          login_time: { [Op.between]: [nextStart, nextEnd] }
        }
      });
      cohorts.push({
        date: start.toISOString().slice(0,10),
        retention1d: signups ? Math.round((retained / signups) * 100) : 0
      });
    }
    return cohorts;
  }

  static async loginPatterns() {
    const rows = await UserActivity.findAll({
      attributes: [
        [fn('DATE_PART', 'hour', col('login_time')), 'hour'],
        [fn('COUNT', '*'), 'logins']
      ],
      group: ['hour'],
      order: [[literal('hour'), 'ASC']]
    });
    // Normalize to all 24 hours
    const result = Array.from({ length: 24 }, (_, h) => ({ hour: h, logins: 0 }));
    rows.forEach(r => {
      const h = Number(r.get('hour'));
      result[h].logins = Number(r.get('logins'));
    });
    return result;
  }

  /** 2. Chatbot & Messaging Insights */
  static async chatOverview() {
    // Count only individual (non-group) conversations
    const totalConvs = await Chat.countDocuments({ isGroup: false });

    // Sum the total number of messages across all chats
    const docs = await Message.find({}, 'messages').lean();
    const totalMsgs = docs.reduce((sum, doc) => sum + (doc.messages?.length || 0), 0);

    const avgMsgsPerConv = totalConvs
      ? Number((totalMsgs / totalConvs).toFixed(1))
      : 0;

    return {
      totalConvs,
      avgMsgsPerConv,
      avgBotLatencyMs: 0, // placeholder until we record latencies
    };
  }

  static async sentimentShift() {
    // Real NLP not implemented yet
    return { before: null, after: null };
  }

  static async mediaTypeDistribution() {
    // Unwind the `messages` array, group by messageType
    const results = await Message.aggregate([
      { $unwind: '$messages' },
      { $group: { _id: '$messages.messageType', count: { $sum: 1 } } }
    ]);

    // Ensure all four types appear, even if zero
    const out = { text: 0, image: 0, voice: 0, video: 0 };
    results.forEach(r => {
      if (out.hasOwnProperty(r._id)) out[r._id] = r.count;
    });

    return out;
  }

  /** 3. Therapeutic Engagement */
  static async appointmentFunnel() {
    const statuses = ['pending','confirmed','completed','cancelled','no_show'];
    const counts = {};
    await Promise.all(statuses.map(async s => {
      counts[s] = await Appointment.count({ where: { status: s } });
    }));
    return counts;
  }

  static async avgLeadTime() {
    // Fetch all completed appointments with just the two timestamps
    const rows = await Appointment.findAll({
      where: { status: 'completed' },
      attributes: ['scheduled_at', 'created_at'],
      raw: true,
    });

    if (!rows.length) {
      return { avgDaysBetweenRequestAndSchedule: 0 };
    }

    // Sum up (scheduled_at – created_at) in milliseconds
    const totalMs = rows.reduce((sum, { scheduled_at, created_at }) => {
      const diff = new Date(scheduled_at) - new Date(created_at);
      return sum + diff;
    }, 0);

    // Compute average, convert ms → days
    const avgMs = totalMs / rows.length;
    const avgDays = avgMs / (1000 * 60 * 60 * 24);

    return {
      avgDaysBetweenRequestAndSchedule: Number(avgDays.toFixed(1))
    };
  }

  static async therapistPerformance() {
    const rows = await TherapySession.findAll({
      attributes: [
        'therapist_id',
        [fn('COUNT', '*'), 'sessions'],
        [fn('AVG', col('therapist_rating')), 'avgRating']
      ],
      where: { therapist_rating: { [Op.ne]: null } },
      group: ['therapist_id'],
      order: [[literal('sessions'), 'DESC']]
    });
    return rows.map(r => ({
      therapistId: r.therapist_id,
      sessions: Number(r.get('sessions')),
      avgRating: Number(parseFloat(r.get('avgRating')).toFixed(1))
    }));
  }

  /** 4. Journals & Reflection */
  static async entryCountOverTime() {
    // Aggregate the Journal collection by day
    const rows = await Journal.aggregate([
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id': 1 } }
    ]);

    // Map to the { date, count } shape
    return rows.map(r => ({
      date: r._id,
      count: r.count
    }));
  }

  static async journalSentimentDistribution() {
    // Group by 'mood' field in the Journal collection
    const rows = await Journal.aggregate([
      {
        $group: {
          _id: '$mood',
          count: { $sum: 1 }
        }
      }
    ]);

    // Ensure all four moods appear
    const moods = ['😃','😔','😡','😌'];
    return moods.map(m => {
      const found = rows.find(r => r._id === m);
      return { mood: m, count: found ? found.count : 0 };
    });
  }

  static async topJournalTags() {
    // Aggregate the Journal collection's `tags` array
    const results = await Journal.aggregate([
      { $unwind: '$tags' },
      { $group: { _id: '$tags', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);

    // Map to { tag, count }
    return results.map(r => ({
      tag: r._id,
      count: r.count
    }));
  }

  /** 5. Community & Moderation */
   static async postsByCommunity() {
     // 1) Group posts by communityId, count posts + comments
       const rows = await Post.aggregate([
         {
           $group: {
           _id: '$communityId',
             postCount: { $sum: 1 },
             commentCount: { $sum: { $size: '$comments' } }
         }
         },
         // 2) Lookup community name from Community collection
         {
           $lookup: {
             from: 'communities',
           localField: '_id',
             foreignField: '_id',
             as: 'community'
           }
         },
         {
           $unwind: {
             path: '$community',
             preserveNullAndEmptyArrays: true
           }
         },
         // 3) Project the fields we need
         {
           $project: {
             communityId: '$_id',
             communityName: '$community.name',
             postCount: 1,
             commentCount: 1
           }
         }
       ]);
    
       // 4) Ensure a valid name even if no community doc found
       return rows.map(r => ({
         communityId: r.communityId ? r.communityId.toString() : 'Unassigned',
         communityName: r.communityName || 'Unassigned',
         postCount: r.postCount,
         commentCount: r.commentCount
       }));
    }

  static async violationStats() {
    const total = await UserViolations.count();
    const resolved = await UserViolations.count({ where: { resolved: true } });
    const major = await UserViolations.count({ where: { severity: 'major' } });
    const minor = total - major;
    return { totalReported: total, totalResolved: resolved, majorCount: major, minorCount: minor };
  }

  static async adminActionsByType() {
    const rows = await AdminActions.findAll({
      attributes: ['action_type', [fn('COUNT', '*'), 'count']],
      group: ['action_type']
    });
    const out = {};
    rows.forEach(r => { out[r.action_type] = Number(r.get('count')); });
    return out;
  }

  /** 6. Well-being Outcomes */
  static async moodOverTime() {
    // Requires storing mood logs; placeholder:
    return [];
  }

  static async correlationWithActivities() {
    // Placeholder for advanced analytics:
    return { journalingCorr: null, therapyCorr: null };
  }

  static async sentimentLift(userId) {
    const N = 5;

    // 1) Find the user's first completed appointment
    const appointment = await Appointment.findOne({
      where: { user_id: userId, status: 'completed' },
      order: [['scheduled_at', 'ASC']],
    });
    if (!appointment) {
      return { beforeAvg: null, afterAvg: null, lift: null };
    }
    const cutoff = appointment.scheduled_at;

    // 2) Fetch N entries before cutoff
    const before = await JournalEntry.findAll({
      where: {
        user_id: userId,
        created_at: { [Op.lt]: cutoff },
      },
      order: [['created_at', 'DESC']],
      limit: N,
    });

    // 3) Fetch N entries after cutoff
    const after = await JournalEntry.findAll({
      where: {
        user_id: userId,
        created_at: { [Op.gt]: cutoff },
      },
      order: [['created_at', 'ASC']],
      limit: N,
    });

    // 4) Map sentiment to numeric: positive=1, neutral=0, negative=-1
    const mapSent = s =>
      s === 'positive' ? 1 : s === 'negative' ? -1 : 0;

    const avg = arr =>
      arr.length
        ? arr.reduce((sum, e) => sum + mapSent(e.sentiment), 0) / arr.length
        : null;

    const beforeAvg = avg(before);
    const afterAvg = avg(after);
    const lift =
      beforeAvg != null && afterAvg != null
        ? Number((afterAvg - beforeAvg).toFixed(2))
        : null;

    return { beforeAvg, afterAvg, lift };
  }

  /**
   * Compute the platform-wide average sentiment lift:
   * run sentimentLift() for each user and average the non-null lifts.
   */
  static async sentimentLiftAll() {
    const users = await User.findAll({ attributes: ['id'], raw: true });
    const lifts = [];

    for (const { id } of users) {
      const { lift } = await this.sentimentLift(id);
      if (lift != null) lifts.push(lift);
    }

    const avgLift =
      lifts.length > 0
        ? Number((lifts.reduce((a, b) => a + b, 0) / lifts.length).toFixed(2))
        : null;

    return { avgLift };
  }
  
}

export default DashboardService;
