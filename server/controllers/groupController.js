import Group from "../models/Group.js";
import User from "../models/User.js";
import mongoose from "mongoose";
import { io } from "../server.js";
import Message from "../models/Message.js";

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

// Add a member to a group
export const addMemberToGroup = async (req, res) => {
  try {
    const { groupId, userIdToAdd } = req.body;
    const requesterId = req.user._id;

    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(userIdToAdd)
    ) {
      return res.status(400).json({ success: false, message: "Invalid IDs" });
    }

    const group = await Group.findById(groupId);
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });

    if (group.createdBy.toString() !== requesterId.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    const userToAdd = await User.findById(userIdToAdd);
    if (!userToAdd)
      return res
        .status(404)
        .json({ success: false, message: "User to add not found" });

    if (group.members.includes(userIdToAdd)) {
      return res
        .status(400)
        .json({ success: false, message: "User already in group" });
    }

    group.members.push(userIdToAdd);
    await group.save();

    res.json({ success: true, group });
  } catch (error) {
    console.error("Add Member Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Remove a member from a group
export const removeMemberFromGroup = async (req, res) => {
  try {
    const { groupId, userIdToRemove } = req.body;
    const requesterId = req.user._id;

    if (
      !mongoose.Types.ObjectId.isValid(groupId) ||
      !mongoose.Types.ObjectId.isValid(userIdToRemove)
    ) {
      return res.status(400).json({ success: false, message: "Invalid IDs" });
    }

    const group = await Group.findById(groupId);
    if (!group)
      return res
        .status(404)
        .json({ success: false, message: "Group not found" });

    if (group.createdBy.toString() !== requesterId.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    group.members = group.members.filter(
      (memberId) => memberId.toString() !== userIdToRemove
    );

    await group.save();

    res.json({ success: true, group });
  } catch (error) {
    console.error("Remove Member Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Rename group
export const renameGroup = async (req, res) => {
  try {
    const { groupId, newName } = req.body;
    const requesterId = req.user._id;

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

    if (group.createdBy.toString() !== requesterId.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    group.name = newName;
    await group.save();

    res.json({ success: true, group });
  } catch (error) {
    console.error("Rename Group Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Delete group
export const deleteGroup = async (req, res) => {
  try {
    const { groupId } = req.params;
    const requesterId = req.user._id;

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

    if (group.createdBy.toString() !== requesterId.toString()) {
      return res
        .status(403)
        .json({ success: false, message: "Not authorized" });
    }

    await Group.findByIdAndDelete(groupId);

    res.json({ success: true, message: "Group deleted successfully" });
  } catch (error) {
    console.error("Delete Group Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send message to group
export const sendGroupMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const { groupId } = req.params;
    const senderId = req.user._id;

    const newMessage = await Message.create({
      senderId,
      groupId,
      isGroup: true,
      text,
      image,
    });

    // Emit newMessage event to all group members (or room)
    io.to(groupId.toString()).emit("newMessage", {
      ...newMessage._doc,
      senderId: req.user, // populate sender details if needed
      isGroup: true,
      groupId,
    });

    res.status(201).json({ success: true, newMessage });
  } catch (error) {
    console.error("Send Group Message Error:", error.message);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get group messages (excluding cleared ones)
export const getGroupMessages = async (req, res) => {
  try {
    const { groupId } = req.params;

    const messages = await Message.find({
      groupId,
      clearedBy: { $ne: req.user._id },
    })
      .populate("senderId", "fullName profilePic")
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
