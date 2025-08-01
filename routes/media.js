// routes/media.js
import express from "express";
import { upload } from "../config/cloudinary.js";
import authMiddleware from "../middleware/authMiddleware.js";
import fs from "fs";
import { fileURLToPath } from "url";
import OpenAI from "openai";
import * as chatService from "../services/chat/chatService.js";
import axios from 'axios';
import os from "os";
import path from "path";

const router = express.Router();

// POST /media/upload
// - authMiddleware ensures only logged-in users can upload
// - upload.array("media", 5) accepts up to 5 files in the "media" field
router.post(
  "/upload",
  upload.array("media", 5),
  (req, res) => {
    // req.files is an array; each file has .path = the Cloudinary URL
    const files = req.files.map((f) => ({
      url: f.path,
      resource_type: f.resource_type,
    }));
    res.status(200).json(files);
  }
);

router.post(
  "/voice",
  authMiddleware,
  upload.single("voice"),
  async (req, res) => {
    try {
      // ——— these four lines are in the outer handler ———
      const { chatId } = req.body;
      const senderId = req.user.id;
      const fileUrl = req.file.path;             // Cloudinary URL
      const io = req.app.get("io");

      // 1) Create & emit the bare voice message
      const messageDoc = await chatService.sendMessage({
        chatId,
        senderId,
        content: fileUrl,
        media: [],
        messageType: "voice",
      });
      const newMsg = messageDoc.messages.at(-1);
      io.to(chatId).emit("newMessage", { message: newMsg });

      // 2) Respond immediately
      res.status(200).json({ message: newMsg });

      // ——— now capture what the IIFE needs ———
      const thisChatId = chatId;
      const thisMessageId = newMsg._id;
      const thisFileUrl = fileUrl;
      const thisIo = io;

      // 3) In the background, use those captured constants
      (async () => {
        try {
          const openai = new OpenAI({ apiKey: process.env.WHISPER_API_KEY });

          // Download into a Buffer
          const downloadRes = await axios.get(thisFileUrl, {
            responseType: "arraybuffer",
          });
          const audioBuffer = Buffer.from(downloadRes.data);
          
          // 2) Write it out to a real temp file
          const tmpDir = os.tmpdir();
          const tmpPath = path.join(tmpDir, `voice-${thisMessageId}.webm`);
          await fs.promises.writeFile(tmpPath, audioBuffer);
          
          // 3) Create a ReadStream from that file
          const fileStream = fs.createReadStream(tmpPath);
          
          // 4) Call Whisper with the ReadStream
          const transcription = await openai.audio.transcriptions.create({
            model: "whisper-1",
            file: fileStream,
            response_format: "text",
          });
          
          // 5) Clean up the temp file
          await fs.promises.unlink(tmpPath);

          console.log(transcription)

          // Patch the transcript
          await chatService.patchMessageTranscript({
            chatId: thisChatId,
            messageId: thisMessageId,
            transcript: transcription.text,
          });

          // Emit when ready
          thisIo.to(thisChatId).emit("transcriptionReady", {
            messageId: thisMessageId,
            transcript: transcription.text,
          });
        } catch (err) {
          console.error("Whisper transcription error:", err.stack || err);
        }
      })();
    } catch (err) {
      console.error("Voice upload error:", err.stack || err);
      res.status(500).json({ error: "Voice upload failed." });
    }
  }
);

export default router;
