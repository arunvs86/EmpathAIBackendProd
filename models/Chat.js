import mongoose from "mongoose";

const chatSchema = new mongoose.Schema({
  participants: [{ type: String, required: true }], // PostgreSQL User IDs
  isGroup: { type: Boolean, default: false },
  groupId: { type: mongoose.Schema.Types.ObjectId, ref: "Community", required: false },
  lastMessage: { type: String, default: "" },
  createdAt: { type: Date, default: Date.now },
  lastMessageAt: { type: Date, default: Date.now },
});

export default mongoose.model("Chat", chatSchema);
