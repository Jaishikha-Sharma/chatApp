import mongoose from "mongoose";

const chatSessionSchema = new mongoose.Schema({
  user1: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  user2: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  sessionStart: { type: Date, default: Date.now },
  sessionEnd: { type: Date },
  isLocked: { type: Boolean, default: false },
});

export default mongoose.model("ChatSession", chatSessionSchema);
