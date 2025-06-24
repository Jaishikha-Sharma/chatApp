import Group from "../models/Group.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { io } from "../server.js";
import Message from "../models/Message.js";
import cloudinary from "../lib/cloudinary.js";

// Create a group
export const createGroup = async (req, res) => {
  try {
    const { name, members, groupImage } = req.body;
    const createdBy = req.user._id;

    if (!name || !members || members.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "Missing required fields" });
    }

    const uniqueMembers = [...new Set([...members, createdBy.toString()])];

    const newGroup = await Group.create({
      name,
      members: uniqueMembers,
      createdBy,
      groupImage,
    });

    res.status(201).json({ success: true, group: newGroup });
  } catch (error) {
    console.error("Create Group Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all groups where current user is a member
export const getMyGroups = async (req, res) => {
  try {
    const userId = req.user._id;

    const groups = await Group.find({ members: userId })
      .populate("members", "fullName email profilePic")
      .populate("createdBy", "fullName email");

    res.json({ success: true, groups });
  } catch (error) {
    console.error("Get Groups Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add a member to a group (Only Admin or Project Coordinator)
export const addMemberToGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    if (!["Admin", "Project Coordinator"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to add members",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid group ID or user ID" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    if (group.members.includes(userId)) {
      return res.status(400).json({
        success: false,
        message: "User is already a member of this group",
      });
    }

    group.members.push(userId);
    await group.save();

    res.status(200).json({
      success: true,
      message: "Member added successfully",
    });
  } catch (error) {
    console.error("Add member error:", error);
    res.status(500).json({ success: false, message: "Failed to add member" });
  }
};

// Remove a member from a group (Only Admin or Project Coordinator)
export const removeMemberFromGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const { userId } = req.body;

    if (!["Admin", "Project Coordinator"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You are not authorized to remove members",
      });
    }

    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(userId)
    ) {
      return res.status(400).json({ success: false, message: "Invalid IDs" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    group.members = group.members.filter(
      (memberId) => memberId.toString() !== userId
    );

    await group.save();

    res.json({ success: true, group });
  } catch (error) {
    console.error("Remove Member Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Rename group (Only Admin or Project Coordinator)
export const renameGroup = async (req, res) => {
  try {
    const { name } = req.body;
    const { groupId } = req.params;

    if (!name) {
      return res.status(400).json({
        success: false,
        message: "New group name is required",
      });
    }

    if (!["Admin", "Project Coordinator"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only Admin or Project Coordinator can rename groups",
      });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({
        success: false,
        message: "Group not found",
      });
    }

    group.name = name;
    await group.save();

    res.status(200).json({
      success: true,
      message: "Group renamed successfully",
      group,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || "Server error",
    });
  }
};

// Delete group (Only Admin)
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;

    if (!["Admin"].includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "Only Admin can delete groups",
      });
    }

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Group ID" });
    }

    const group = await Group.findById(groupId);
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });

    await Group.findByIdAndDelete(groupId);

    res.json({ success: true, message: "Group deleted successfully" });
  } catch (error) {
    console.error("Delete Group Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

export const sendGroupMessage = async (req, res) => {
  try {
    const { text, duration, documentName, replyTo, forwardedFrom } = req.body; // ⬅️ added forwardedFrom
    const { groupId } = req.params;
    const senderId = req.user._id;

    const group = await Group.findById(groupId);
    if (!group) {
      return res.status(404).json({ success: false, message: "Group not found" });
    }

    if (!group.members.some((member) => member.toString() === senderId.toString())) {
      return res.status(403).json({
        success: false,
        message: "You are not a member of this group and cannot send messages.",
      });
    }

    const containsForbiddenInfo = (text) => {
      if (!text) return false;
      const forbiddenPatterns = [
        /\b\d{10,}\b/g,
        /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z]+)/gi,
        /https?:\/\/[^\s]+/gi,
        /(@[a-zA-Z0-9_]+)/gi,
        /\b(?:at\s+)?gmail(?:\s+dot\s+)?com\b/gi,
        /\b(?:at\s+)?yahoo(?:\s+dot\s+)?com\b/gi,
        /\b(?:[nN]ine|[eE]ight|[sS]even|[sS]ix|[fF]ive|[fF]our|[tT]hree|[tT]wo|[oO]ne|[zZ]ero)\b/gi,
        /\b(?:dotcom|dotnet|dotorg)\b/gi,
        /\b(?:upi|paytm|phonepe|gpay|google pay|amazon pay|payment|account number|bank)\b/gi,
      ];
      return forbiddenPatterns.some((pattern) => pattern.test(text));
    };

    if (containsForbiddenInfo(text)) {
      return res.status(400).json({
        success: false,
        message:
          "Message contains forbidden content such as phone numbers, emails, social media handles, or payment details.",
      });
    }

    let imageUrl, audioUrl, documentUrl;

    if (req.files?.image?.[0]) {
      const uploadRes = await cloudinary.uploader.upload(req.files.image[0].path);
      imageUrl = uploadRes.secure_url;
    }

    if (req.files?.audio?.[0]) {
      const uploadRes = await cloudinary.uploader.upload(req.files.audio[0].path, {
        resource_type: "video",
      });
      audioUrl = uploadRes.secure_url;
    }

    if (req.files?.document?.[0]) {
      const uploadRes = await cloudinary.uploader.upload(req.files.document[0].path, {
        resource_type: "raw",
        type: "upload",
        use_filename: true,
        unique_filename: false,
      });
      documentUrl = uploadRes.secure_url;
    }

    // ✅ Handle replyTo
    let replyMessage = null;
    if (replyTo) {
      replyMessage = await Message.findById(replyTo);
      if (!replyMessage) {
        return res.status(400).json({ success: false, message: "Invalid replyTo message ID." });
      }
    }

    // ✅ Handle forwardedFrom
    let forwardMessage = null;
    if (forwardedFrom) {
      forwardMessage = await Message.findById(forwardedFrom);
      if (!forwardMessage) {
        return res.status(400).json({ success: false, message: "Invalid forwardedFrom message ID." });
      }
    }

    const newMessage = await Message.create({
      senderId,
      groupId,
      isGroup: true,
      text,
      image: imageUrl,
      audio: audioUrl,
      duration: duration || null,
      document: documentUrl,
      documentName: documentName || null,
      replyTo: replyTo || null,
      forwardedFrom: forwardedFrom || null, // ⬅️ new
    });

    const fullMessage = await Message.findById(newMessage._id)
      .populate("senderId", "fullName profilePic")
      .populate([
        {
          path: "replyTo",
          select: "text image audio duration senderId",
          populate: { path: "senderId", select: "fullName" },
        },
        {
          path: "forwardedFrom",
          select: "text image audio document documentName duration senderId",
          populate: { path: "senderId", select: "fullName" },
        },
      ]);

    io.to(groupId.toString()).emit("newMessage", {
      ...fullMessage._doc,
      isGroup: true,
      groupId,
    });

    res.status(201).json({ success: true, message: fullMessage });
  } catch (error) {
    console.error("Send Group Message Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get group messages
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    const messages = await Message.find({
      groupId,
      clearedBy: { $ne: req.user._id },
    })
      .populate("senderId", "fullName profilePic")
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
          select: "text image audio document documentName duration senderId",
          populate: {
            path: "senderId",
            select: "fullName",
          },
        },
      ])
      .sort({ createdAt: 1 });

    res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("Get Group Messages Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Clear group messages for current user
export const clearGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;
    const requesterId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid Group ID" });
    }

    const group = await Group.findById(groupId);
    if (!group) {
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });
    }

    const result = await Message.updateMany(
      { groupId, clearedBy: { $ne: requesterId } },
      { $addToSet: { clearedBy: requesterId } }
    );

    res.json({
      success: true,
      message: "Group messages cleared for user",
      modifiedCount: result.modifiedCount,
    });
  } catch (error) {
    console.error("Clear Group Messages Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};
