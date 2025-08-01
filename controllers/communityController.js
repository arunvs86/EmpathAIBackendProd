import communityService from "../services/community/communityService.js";

class CommunityController {
    /**
     * Handles Community Creation
     */
    async createCommunity(req, res) {
        try {
            const userId = req.user.id;
            const newCommunity = await communityService.createCommunity(userId, req.body);
            res.status(201).json(newCommunity);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    /**
     * Fetch All Communities
     */
    async getAllCommunities(req, res) {
        try {
            const communities = await communityService.getAllCommunities();
            res.status(200).json(communities);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    /**
     *  Fetch a Single Community by ID
     */
    async getCommunityById(req, res) {
        try {
            const community = await communityService.getCommunityById(req.params.id);
            res.status(200).json(community);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }

    /**
     * Update a Community
     */
    async updateCommunity(req, res) {
        try {
            const userId = req.user.id;
            const updatedCommunity = await communityService.updateCommunity(req.params.id, userId, req.body);
            res.status(200).json(updatedCommunity);
        } catch (error) {
            res.status(403).json({ error: error.message });
        }
    }

    /**
     *  Delete a Community
     */
    async deleteCommunity(req, res) {
        try {
            const userId = req.user.id;
            const isAdmin = req.user.role === "admin";
            const result = await communityService.deleteCommunity(req.params.id, userId, isAdmin);
            res.status(200).json(result);
        } catch (error) {
            res.status(403).json({ error: error.message });
        }
    }

    async joinCommunity(req, res) {
        try {
            const userId = req.user.id;
            const result = await communityService.joinCommunity(userId, req.params.id);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    /**
     *  Request to Join a Private Community
     */
    async requestToJoin(req, res) {
        try {
            const userId = req.user.id;
            const result = await communityService.requestToJoin(userId, req.params.id);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    /**
     * Approve/Reject Join Requests
     */
    async approveJoinRequest(req, res) {
        try {
            const adminId = req.user.id;
            const { userId, action } = req.body; // Action: "approve" or "reject"

            const result = await communityService.approveJoinRequest(req.params.id, adminId, userId, action);
            res.status(200).json(result);
        } catch (error) {
            res.status(403).json({ error: error.message });
        }
    }

    /**
     * Leave a Community
     */
    async leaveCommunity(req, res) {
        try {
            const userId = req.user.id;
            const result = await communityService.leaveCommunity(userId, req.params.id);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async removePost(req, res) {
        try {
            const moderatorId = req.user.id;
            const { communityId, postId } = req.params;

            const result = await communityService.removePost(communityId, postId, moderatorId);
            res.status(200).json(result);
        } catch (error) {
            res.status(403).json({ error: error.message });
        }
    }

    /**
     *  Ban a User from a Community
     */
    async banUser(req, res) {
        try {
            const adminId = req.user.id;
            const { userId } = req.body;

            const result = await communityService.banUser(req.params.id, adminId, userId);
            res.status(200).json(result);
        } catch (error) {
            res.status(403).json({ error: error.message });
        }
    }

    /**
     *  Unban a User from a Community
     */
    async unbanUser(req, res) {
        try {
            const adminId = req.user.id;
            const { userId } = req.body;

            const result = await communityService.unbanUser(req.params.id, adminId, userId);
            res.status(200).json(result);
        } catch (error) {
            res.status(403).json({ error: error.message });
        }
    }

 
async getPendingRequests(req, res) {
    try {
      const communityId = req.params.id;
      const userId      = req.user.id;
      // service will verify mod/creator permissions
      const requests = await communityService.getPendingRequests(communityId, userId);
      res.status(200).json(requests);
    } catch (err) {
      console.error("getPendingRequests error:", err);
      const status = err.message.includes("Unauthorized") ? 403 : 404;
      res.status(status).json({ error: err.message });
    }
  }

  async getCommunityMembers(req, res) {
    try {
        const communityId = req.params.id;
        const members = await communityService.getCommunityMembers(communityId);
        res.status(200).json(members);
    } catch (error) {
        res.status(400).json({ error: error.message });
    }
}

async addMember(req, res) {
    try {
        const moderatorId = req.user.id;
        const communityId = req.params.id;
        const { userId } = req.body;
        const result = await communityService.addMember(communityId, moderatorId, userId);
        res.status(200).json(result);
    } catch (error) {
        res.status(403).json({ error: error.message });
    }
}

async removeMember(req, res) {
    try {
        const moderatorId = req.user.id;
        const communityId = req.params.id;
        const { userId } = req.body;
        const result = await communityService.removeMember(communityId, moderatorId, userId);
        res.status(200).json(result);
    } catch (error) {
        res.status(403).json({ error: error.message });
    }
}

  
}

export default new CommunityController();
