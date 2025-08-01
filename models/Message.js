import mongoose from "mongoose";

const messagesSchema = new mongoose.Schema({
  chatId: { type: mongoose.Schema.Types.ObjectId, ref: "Chat", required: true },
  messages: [
    {
      senderId: { type: String, required: true },
      encryptedContent: {
        iv: { type: String, required: false },      // optional for legacy messages
        content: { type: String, required: false },
      },
      content: { type: String, required: false },
      media: [{ type: String }],
      messageType: {
        type: String,
        enum: ["text", "image", "video", "voice"],
        default: "text",
      },
      status: {
        type: String,
        enum: ["sent", "delivered", "read"],
        default: "sent",
      },
      createdAt: { type: Date, default: Date.now },
    },
  ],
});

export default mongoose.model("Message", messagesSchema);
