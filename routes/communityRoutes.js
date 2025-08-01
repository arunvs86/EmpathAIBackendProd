import express from "express";
import communityController from "../controllers/communityController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();


router.post("/", authMiddleware, communityController.createCommunity);
router.get("/", communityController.getAllCommunities);
router.get("/:id", communityController.getCommunityById);
router.put("/:id", authMiddleware, communityController.updateCommunity);
router.delete("/:id", authMiddleware, communityController.deleteCommunity);
router.post("/:id/join", authMiddleware, communityController.joinCommunity);
router.post("/:id/request", authMiddleware, communityController.requestToJoin);
router.post("/:id/approve", authMiddleware, communityController.approveJoinRequest);
router.post("/:id/leave", authMiddleware, communityController.leaveCommunity);
router.delete("/:communityId/posts/:postId", authMiddleware, communityController.removePost);
router.post("/:id/ban", authMiddleware, communityController.banUser);
router.post("/:id/unban", authMiddleware, communityController.unbanUser);
// GET /communities/:id/requests
router.get(
    "/:id/requests",
    authMiddleware,
    communityController.getPendingRequests
  );
router.get("/:id/members", authMiddleware, communityController.getCommunityMembers);
router.post("/:id/add-member", authMiddleware, communityController.addMember);
router.post("/:id/remove-member", authMiddleware, communityController.removeMember);

  

export default router;
