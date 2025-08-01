import mongoose from "mongoose";

const communitySchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: { type: String },
    type: { type: String, enum: ["public", "private"], required: true }, 
    createdBy: { type: String, required: true }, 
    moderators: [{ type: String }], 
    members: [{ type: String }], 
    pending_requests: [{ type: String }], 
    posts: [{ type: mongoose.Schema.Types.ObjectId, ref: "Post" }], 
    banner_image: { type: String, default: null },
    createdAt: { type: Date, default: Date.now },
    lastEditedAt: { type: Date, default: null },
});

export default mongoose.model("Community", communitySchema);
