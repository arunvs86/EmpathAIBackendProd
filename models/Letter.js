// models/Letter.js
import mongoose from "mongoose";

const letterSchema = new mongoose.Schema({
  userId:   { type: String, required: true },
  text:     { type: String, required: true },
  media:    [{ type: String }],            
  createdAt:{ type: Date, default: Date.now },
  updatedAt:{ type: Date, default: null }
});

export default mongoose.model("Letter", letterSchema);
