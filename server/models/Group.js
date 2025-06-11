import mongoose from "mongoose";

const groupSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    groupImage: { type: String },
  },
  { timestamps: true }
);

const Group = mongoose.model("Group", groupSchema);
export default Group;
