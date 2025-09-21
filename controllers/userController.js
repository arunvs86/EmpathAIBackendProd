import PostService       from "../services/post/postService.js";
import JournalService    from "../services/journal/journalService.js";
import CommunityService  from "../services/community/communityService.js";
// import HabitService      from "../services/habit/habitService.js";
import User from "../models/User.js";
import Therapist from "../models/Therapist.js";
import EmailService from "../services/email/emailService.js";

class UserController {

  async getUsersByIds(req,res){
    try {
      const { ids } = req.query;
      if (!ids) {
        return res.status(400).json({ message: "No user IDs provided." });
      }
  
      // Split the comma-separated list into an array and trim whitespace
      const idArray = ids.split(",").map((id) => id.trim());
  
      // Query PostgreSQL via Sequelize for users with these IDs
      const users = await User.findAll({
        where: {
          id: idArray,
        },
        attributes: ["id", "username","bio","profile_picture"],
      });

  
      return res.status(200).json(users);
    } catch (error) {
      console.error("Error in getUsersByIds:", error);
      return res.status(500).json({ message: "Internal server error." });
    }
  };


  // GET /users/:id/stats
  async getProfileStats(req, res) {
    const userId = req.params.id;
    try {
      const [
        postsCount,
        journalsCount,
        commsCount
        // habitsCount
      ] = await Promise.all([
        PostService.countByUser(userId),
        JournalService.countByUser(userId),
        CommunityService.countByUser(userId)
        // HabitService.countByUser(userId),
      ]);

      console.log("pc", postsCount)
      console.log("jc", journalsCount)
      console.log("cc", commsCount)

      return res.json({
        posts:       postsCount,
        journals:    journalsCount,
        communities: commsCount
        // habits:      habitsCount,
      });
    } catch (err) {
      return res.status(500).json({ error: err.message });
    }
  }

  // GET /users/:id/posts
  async getUserPosts(req, res) {
    try {
      const page  = parseInt(req.query.page)  || 1;
      const limit = parseInt(req.query.limit) || 20;
      const posts = await PostService.getAllPosts(
        { userId: req.params.id },
        { page, limit }
      );
      return res.json(posts);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  // GET /users/:id/journals
  async getUserJournals(req, res) {
    try {
      const journals = await JournalService.getByUser(req.params.id);
      return res.json(journals);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  // GET /users/:id/communities
  async getUserCommunities(req, res) {
    try {
      const comms = await CommunityService.getByUser(req.params.id);
      return res.json(comms);
    } catch (err) {
      return res.status(400).json({ error: err.message });
    }
  }

  async updateProfile(req, res) {
    console.log("updation req user", req.user);
  
    // get the real user ID from the auth middleware
    const id = req.user.id;
  
    const {
      username, bio, profile_picture, dob, gender,
      country, city, faith_support,
      experience_years, license_number,
      languages_spoken, specialization_tags, session_duration, appointment_types,link
    } = req.body;
  
    try {
      // update the base User table
      await User.update(
        { username, bio, profile_picture, dob, gender, country, city, faith_support },
        { where: { id } }
      );
  
      // if a therapist, also update the Therapist table
      if (req.user.role === "therapist") {
        await Therapist.update(
          { experience_years, license_number, languages_spoken,specialization_tags, session_duration, appointment_types, link },
          { where: { user_id: id } }
        );
      }
  
      // now fetch the full, updated record
      const updatedUser = await User.findByPk(id, {
        include: req.user.role === "therapist" ? [Therapist] : []
      });
  
      console.log("updatedUser", updatedUser);
      res.json({ user: updatedUser });
    } catch (err) {
      res.status(400).json({ error: err.message });
    }
  }

  async deleteAccount(req, res) {
    try {
      const idFromToken = req.user.id;
      const idFromParams = req.params.userId;
  
      // Ensure user can only delete their own account
      if (idFromToken !== idFromParams) {
        return res.status(403).json({ error: "Unauthorized to delete this account." });
      }
  
      // Permanently delete the user
      const deletedCount = await User.destroy({ where: { id: idFromParams } });
  
      if (deletedCount === 0) {
        return res.status(404).json({ error: "User not found or already deleted." });
      }
  
      return res.status(200).json({ message: "Account deleted successfully." });
    } catch (err) {
      console.error("Delete account error:", err);
      res.status(500).json({ error: "Failed to delete account." });
    }
  }
  
  async sendContactMessage(req, res) {
    try {
      const { name, email, message, page } = req.body || {};
      if (!name || !email || !message)
        return res.status(400).json({ error: "name, email and message are required" });

      // basic email sanity check
      const ok = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
      if (!ok) return res.status(400).json({ error: "Invalid email" });

      await EmailService.sendContactMessage({ name, email, message, page });
      return res.json({ ok: true });
    } catch (e) {
      console.error("sendContactMessage error:", e);
      return res.status(500).json({ error: "Failed to send message" });
    }
  }
  


  // GET /users/:id/habits
  // async getUserHabits(req, res) {
  //   try {
  //     const habits = await HabitService.getByUser(req.params.id);
  //     return res.json(habits);
  //   } catch (err) {
  //     return res.status(400).json({ error: err.message });
  //   }
  // }
}

export default new UserController();
