import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    groupId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Group",
    },
    isGroup: {
      type: Boolean,
      default: false,
    },
    text: {
      type: String,
    },
    image: {
      type: String,
    },
    seen: {
      type: Boolean,
      default: false,
    },
    deletedFor: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    clearedBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    edited: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

// Custom validation: Must have either receiverId or groupId
messageSchema.pre("save", function (next) {
  if (!this.receiverId && !this.groupId) {
    return next(new Error("Either receiverId or groupId is required"));
  }
  if (this.receiverId && this.groupId) {
    return next(new Error("Message can't have both receiverId and groupId"));
  }
  next();
});

const Message = mongoose.model("Message", messageSchema);
export default Message;
