import postService from "../services/post/postService.js";
import Post from "../models/Post.js";
import User from "../models/User.js";

class PostController {
    /*
     * Handles Post Creation
     */
    async createPost(req, res) {
        try {
            const userId = req.user.id;
            const newPost = await postService.createPost(userId, req.body, req.app);
            res.status(201).json(newPost);
        } catch (error) {
            console.log("Logging error here", error)
            res.status(400).json({ error: error.message});
        }
    }

    /**
     *  Fetch All Posts (General & Community)
     */
    async getAllPosts(req, res) {
        try {
            const { page = 1, limit = 100 } = req.query;
            const posts = await postService.getAllPosts({}, { page: parseInt(page), limit: parseInt(limit) });
            res.status(200).json(posts);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    /**
     * Fetch Posts from a Specific Community
     */
    async getCommunityPosts(req, res) {
        try {
            const { page = 1, limit = 10 } = req.query;
            const posts = await postService.getCommunityPosts(req.params.communityId, { page: parseInt(page), limit: parseInt(limit) });
            res.status(200).json(posts);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    /**
     * Fetch a Single Post by ID
     */
    async getPostById(req, res) {
        try {
            const post = await postService.getPostById(req.params.id);
            res.status(200).json(post);
        } catch (error) {
            res.status(404).json({ error: error.message });
        }
    }

    /**
     *  Update a Post
     */
    async updatePost(req, res) {
        try {
            const userId = req.user.id;
            const updatedPost = await postService.updatePost(req.params.id, userId, req.body);
            res.status(200).json(updatedPost);
        } catch (error) {
            res.status(403).json({ error: error.message });
        }
    }

    /**
     * Delete a Post
     */
    async deletePost(req, res) {
        try {
            const userId = req.user.id;
            const isAdmin = req.user.role === "admin";
            const result = await postService.deletePost(req.params.id, userId, isAdmin);
            res.status(200).json(result);
        } catch (error) {
            res.status(403).json({ error: error.message });
        }
    }

    async addComment(req, res) {
        try {
            const userId = req.user.id;
            const { text } = req.body;
            const result = await postService.addComment(req.params.id, userId, text);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    
    async getComments(req, res) {
        try {
            const comments = await postService.getComments(req.params.id);
            res.status(200).json(comments);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async deleteComment(req, res) {
        try {
            const userId = req.user.id;
            const isAdmin = req.user.role === "admin";
            const { postId, commentId } = req.params;

            const result = await postService.deleteComment(postId, commentId, userId, isAdmin);
            res.status(200).json(result);
        } catch (error) {
            res.status(403).json({ error: error.message });
        }
    }

    async reportPost(req, res) {
        try {
            const userId = req.user.id;
            const { reason, description } = req.body;
            const result = await postService.reportPost(req.params.id, userId, reason, description);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async getReportedPosts(req, res) {
        try {
            if (req.user.role !== "admin") {
                return res.status(403).json({ error: "Unauthorized: Admins only." });
            }
            const posts = await postService.getReportedPosts();
            res.status(200).json(posts);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    
    async moderatePost(req, res) {
        try {
            if (req.user.role !== "admin") {
                return res.status(403).json({ error: "Unauthorized: Admins only." });
            }
            const { action } = req.body; 
            const result = await postService.moderatePost(req.params.id, action);
            res.status(200).json(result);
        } catch (error) {
            res.status(400).json({ error: error.message });
        }
    }

    async getPostsByUser(req, res) {
        try {
          const { userId } = req.params;
          const page  = parseInt(req.query.page,  10) || 1;
          const limit = parseInt(req.query.limit, 10) || 20;
    
          const posts = await postService.getPostsByUser(userId, { page, limit });
          return res.status(200).json(posts);
        } catch (err) {
          return res.status(400).json({ error: err.message });
        }
      }

    async getPersonalizedFeed(req,res){
        try {
            const posts = await postService.getPersonalizedFeed(req.params.userId);
            res.json(posts);
          } catch (err) {
            res.status(500).json({ error: err.message });
          }
    }

    async toggleBookmark(req, res) {
        try {
          const userId = req.user.id;
          const postId = req.params.postId;
      
          const post = await Post.findById(postId);
          if (!post) return res.status(404).json({ error: "Post not found" });
      
          const alreadySaved = post.savedBy.includes(userId);
      
          if (alreadySaved) {
            post.savedBy = post.savedBy.filter(id => id !== userId);
          } else {
            post.savedBy.push(userId);
          }
      
          await post.save();
          res.status(200).json({ message: alreadySaved ? "Post unsaved" : "Post saved" });
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      }

      async getBookmarkedPosts(req, res) {
        try {
          const userId = req.params.userId;
          const posts = await postService.getBookmarkedPosts(userId);
          res.status(200).json(posts);
        } catch (error) {
          res.status(500).json({ error: error.message });
        }
      }      
    
}

export default new PostController();
