import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib/cloudinary.js";
import { io, userSocketMap } from "../server.js";
import { canMessage } from "../lib/roleUtils.js";

// Get all users except the logged-in user
export const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    const userRole = req.user.role;

    let filteredUsers;

    if (userRole === "Admin" || userRole === "Project Coordinator") {
      filteredUsers = await User.find({ _id: { $ne: userId } }).select(
        "-password"
      );
    } else {
      const userIds = new Set();

      if (userRole === "Employee") {
        const employeeUsers = await User.find({
          _id: { $ne: userId },
          role: "Employee",
        });
        employeeUsers.forEach((user) => userIds.add(user._id.toString()));
      }

      const messages = await Message.find({
        $or: [{ senderId: userId }, { receiverId: userId }],
      });

      messages.forEach((msg) => {
        if (
          msg.senderId &&
          msg.senderId.toString &&
          msg.senderId.toString() !== userId.toString()
        ) {
          userIds.add(msg.senderId.toString());
        }
        if (
          msg.receiverId &&
          msg.receiverId.toString &&
          msg.receiverId.toString() !== userId.toString()
        ) {
          userIds.add(msg.receiverId.toString());
        }
      });

      filteredUsers = await User.find({
        _id: { $in: Array.from(userIds) },
      }).select("-password");
    }

    // Calculate unseen messages
    const unseenMessages = {};
    const promises = filteredUsers.map(async (user) => {
      const messages = await Message.find({
        senderId: user._id,
        receiverId: userId,
        seen: false,
      });

      if (messages.length > 0) {
        unseenMessages[user._id.toString()] = messages.length;
      }
    });

    await Promise.all(promises);

    return res.json({ success: true, users: filteredUsers, unseenMessages });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

// Get all messages with selected user
export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
      deletedFor: { $ne: myId },
    })
      .sort({ createdAt: 1 })
      .populate([
        {
          path: "replyTo",
          select: "text image audio duration senderId",
          populate: {
            path: "senderId",
            select: "fullName",
          },
        },
        {
          path: "forwardedFrom",
          select: "text image audio duration document documentName senderId",
          populate: {
            path: "senderId",
            select: "fullName",
          },
        },
      ]);

    await Message.updateMany(
      { senderId: selectedUserId, receiverId: myId, seen: false },
      { seen: true }
    );

    res.json({ success: true, messages });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

// Mark message as seen
export const markMessageAsSeen = async (req, res) => {
  try {
    const { id } = req.params;
    await Message.findByIdAndUpdate(id, { seen: true });
    res.json({ success: true });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

// Send message with role-based restriction
export const sendMessage = async (req, res) => {
  try {
    const { text, duration, replyTo, forwardedFrom } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;

    const sender = await User.findById(senderId);
    const receiver = await User.findById(receiverId);

    if (!canMessage(sender, receiver)) {
      return res.status(403).json({
        success: false,
        message:
          "You are not allowed to message this user without admin approval.",
      });
    }

    // ❌ Check for forbidden content
    // ❌ Check for forbidden + abusive content
    const forbiddenPatterns = [
      /\b\d{10,}\b/g,
      /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi,
      /https?:\/\/[^\s]+/gi,
      /(@[a-zA-Z0-9_]+)/gi,
    ];

    // Abusive words list
    const abusiveWords = [
      "madarchod",
      "bhenchod",
      "gandu",
      "chutiya",
      "fuck",
      "bitch",
      "bastard",
      "fuck",
      "asshole",
      "shit"
    ];

    const containsForbiddenInfoOrAbuse = (text) => {
      if (!text) return false;
      if (forbiddenPatterns.some((pattern) => pattern.test(text))) return true;

      const lower = text.toLowerCase();
      if (abusiveWords.some((word) => lower.includes(word))) return true;

      return false;
    };

    if (containsForbiddenInfoOrAbuse(text)) {
      return res.status(400).json({
        success: false,
        message:
          "Message contains forbidden or abusive content (phone numbers, emails, links, or abusive words).",
      });
    }

    // ✅ Uploads
    let imageUrl, audioUrl, documentUrl, documentName;

    if (req.files?.image?.[0]) {
      const uploadRes = await cloudinary.uploader.upload(
        req.files.image[0].path
      );
      imageUrl = uploadRes.secure_url;
    }

    if (req.files?.audio?.[0]) {
      const uploadRes = await cloudinary.uploader.upload(
        req.files.audio[0].path,
        {
          resource_type: "video",
        }
      );
      audioUrl = uploadRes.secure_url;
    }

    if (req.files?.document?.[0]) {
      const uploadRes = await cloudinary.uploader.upload(
        req.files.document[0].path,
        {
          resource_type: "raw",
        }
      );
      documentUrl = uploadRes.secure_url;
      documentName = req.files.document[0].originalname;
    }

    // ✅ ReplyTo validation
    let replyMessage = null;
    if (replyTo) {
      replyMessage = await Message.findById(replyTo);
      if (!replyMessage) {
        return res.status(400).json({
          success: false,
          message: "Invalid replyTo message ID.",
        });
      }
    }

    // ✅ Forwarded message validation
    let forwardMessage = null;
    if (forwardedFrom) {
      forwardMessage = await Message.findById(forwardedFrom);
      if (!forwardMessage) {
        return res.status(400).json({
          success: false,
          message: "Invalid forwardedFrom message ID.",
        });
      }
    }

    // ✅ Create new message
    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl || null,
      audio: audioUrl || null,
      duration: duration || null,
      replyTo: replyTo || null,
      forwardedFrom: forwardedFrom || null,
      document: documentUrl || null,
      documentName: documentName || null,
    });

    // ✅ Populate reply and forwarded content
    await newMessage.populate([
      {
        path: "replyTo",
        select: "text image audio duration senderId",
        populate: { path: "senderId", select: "fullName" },
      },
      {
        path: "forwardedFrom",
        select: "text image audio duration document documentName senderId",
        populate: { path: "senderId", select: "fullName" },
      },
    ]);

    // ✅ Real-time send
    const receiverSocketId = userSocketMap[receiverId];
    if (receiverSocketId) {
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }

    res.json({ success: true, newMessage });
  } catch (error) {
    console.log("❌ sendMessage error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete chat (soft delete)
export const deleteChat = async (req, res) => {
  try {
    const myId = req.user._id;
    const otherUserId = req.params.id;

    await Message.updateMany(
      {
        $or: [
          { senderId: myId, receiverId: otherUserId },
          { senderId: otherUserId, receiverId: myId },
        ],
        deletedFor: { $ne: myId },
      },
      { $push: { deletedFor: myId } }
    );

    res.json({ success: true, message: "Chat deleted for you only." });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Edit message
export const editMessage = async (req, res) => {
  try {
    const messageId = req.params.id;
    const { newText } = req.body;
    const userId = req.user?._id?.toString();

    const message = await Message.findById(messageId);

    if (!message) {
      return res
        .status(404)
        .json({ success: false, message: "Message not found." });
    }

    if (!message.senderId || !message.senderId.toString) {
      console.log("❌ senderId is missing or invalid:", message);
      return res
        .status(400)
        .json({ success: false, message: "Invalid senderId." });
    }

    const senderIdStr = message.senderId.toString();

    if (senderIdStr !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized." });
    }

    message.text = newText;
    message.edited = true;
    await message.save();

    const receiverIdStr = message.receiverId?.toString?.();
    if (receiverIdStr && userSocketMap[receiverIdStr]) {
      io.to(userSocketMap[receiverIdStr]).emit("messageEdited", message);
    }

    return res.json({ success: true, message });
  } catch (error) {
    console.error("🔥 editMessage error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// GET a specific message by ID (for replyTo preview)
export const getReplyMessage = async (req, res) => {
  try {
    const message = await Message.findById(req.params.id).select(
      "text image audio duration"
    );
    if (!message) {
      return res
        .status(404)
        .json({ success: false, message: "Reply message not found." });
    }

    return res.json({ success: true, message });
  } catch (error) {
    console.log("getReplyMessage error:", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
};
// ✅ Get all messages between any 2 users (Admin only)
export const getMessagesBetweenUsers = async (req, res) => {
  try {
    const { user1Id, user2Id } = req.params;

    if (req.user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message: "Access denied. Admins only.",
      });
    }

    const messages = await Message.find({
      isGroup: false,
      $or: [
        { senderId: user1Id, receiverId: user2Id },
        { senderId: user2Id, receiverId: user1Id },
      ],
    })
      .sort({ createdAt: 1 })
      .populate("senderId", "fullName profilePic")
      .populate("receiverId", "fullName profilePic");

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("Admin Message View Error:", error.message);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
