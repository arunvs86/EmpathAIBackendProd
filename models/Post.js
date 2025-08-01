import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
    userId: { type: String, required: true }, 
    content: { type: String, required: false }, 
    media: [{ type: String }], 
    categories: [{ type: String }], 
    anonymous: { type: Boolean, default: false },
    status: { type: String, enum: ["live", "flagged", "removed"], default: "live" },
    communityId: { type: mongoose.Schema.Types.ObjectId, ref: "Community", required: false, default: null },
    comments: [
        {
            userId: { type: String }, 
            text: String,
            createdAt: { type: Date, default: Date.now },
        },
    ],
    helpful_feedback: [{ userId: { type: String }, feedback: String }],
    savedBy: [{ type: String }],  // Array of User IDs (UUIDs from Postgres)
    reported_by: [{ type: String }], 
    createdAt: { type: Date, default: Date.now },
    lastEditedAt: { type: Date, default: null },
});

export default mongoose.model("Post", postSchema);
