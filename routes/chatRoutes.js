import express from "express";
import { createGroupChat,getGroupChatsForCommunity,createChat, getUserChats, sendMessage, getMessages } from "../controllers/chatController.js";
import authMiddleware from "../middleware/authMiddleware.js";

const router = express.Router();

// All chat endpoints are protected.
router.post("/create", authMiddleware, createChat);
router.get("/myChats", authMiddleware, getUserChats);
router.post("/message", authMiddleware, sendMessage);
router.get("/messages/:chatId", authMiddleware, getMessages);
router.post("/group", createGroupChat);
router.get("/group/:communityId", getGroupChatsForCommunity);


export default router;
