// import express from "express";
// import postController from "../controllers/postController.js";
// import authMiddleware from "../middleware/authMiddleware.js"
// const router = express.Router();

// // CREATE
// router.post("/", authMiddleware, postController.createPost);

// // FETCH ALL
// router.get("/", postController.getAllPosts);

// // FETCH BY USER — must go BEFORE /:id
// router.get(
//   "/user/:userId",
//   authMiddleware,
//   postController.getPostsByUser
// );
// router.get("/:id", postController.getPostById);
// router.put("/:id", authMiddleware, postController.updatePost);
// router.delete("/:id", authMiddleware, postController.deletePost);
// router.post("/:id/comment", authMiddleware, postController.addComment);
// router.get("/:id/comments", postController.getComments);
// router.delete("/:postId/comment/:commentId", authMiddleware, postController.deleteComment);
// router.post("/:id/report", authMiddleware, postController.reportPost);
// router.get("/reported", authMiddleware, postController.getReportedPosts);
// router.put("/:id/moderate", authMiddleware, postController.moderatePost);
// router.get("/community/:communityId", postController.getCommunityPosts);

// export default router;

import express from "express";
import postController from "../controllers/postController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// CREATE
router.post("/", authMiddleware, postController.createPost);

// FETCH ALL
router.get("/", postController.getAllPosts);

// FETCH BY USER — must go BEFORE all /:id
router.get("/user/:userId", authMiddleware, postController.getPostsByUser);

// STATIC / ADMIN / REPORT endpoints — before /:id
router.get("/reported", authMiddleware, postController.getReportedPosts);
router.get("/community/:communityId", postController.getCommunityPosts);

// COMMENT ROUTES — more specific than /:id
router.delete(
  "/:postId/comment/:commentId",
  authMiddleware,
  postController.deleteComment
);
router.get("/:id/comments", postController.getComments);
router.post("/:id/comment", authMiddleware, postController.addComment);

// REPORT & MODERATE — also more specific than /:id
router.post("/:id/report", authMiddleware, postController.reportPost);
router.put("/:id/moderate", authMiddleware, postController.moderatePost);

// Finally, the generic CRUD for a single post
router.get("/:id", postController.getPostById);
router.put("/:id", authMiddleware, postController.updatePost);
router.delete("/:id", authMiddleware, postController.deletePost);

// personalized feed
router.get("/personalized/:userId", authMiddleware, postController.getPersonalizedFeed);

router.post("/:postId/bookmark", authMiddleware, postController.toggleBookmark);

router.get("/bookmarked/:userId", authMiddleware, postController.getBookmarkedPosts);

export default router;
