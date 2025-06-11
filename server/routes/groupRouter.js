import express from "express";
import { protectRoute } from "../middleware/auth.js";
import {
  createGroup,
  getMyGroups,
  addMemberToGroup,
  removeMemberFromGroup,
  renameGroup,
  deleteGroup,
  sendGroupMessage,
  getGroupMessages,
  clearGroupMessages
} from "../controllers/groupController.js";

const groupRouter = express.Router();

// GET all groups where current user is a member
groupRouter.get("/", protectRoute, getMyGroups);

// POST create a new group
groupRouter.post("/create", protectRoute, createGroup);

// PUT add a member to group
groupRouter.put("/add/:groupId", protectRoute, addMemberToGroup);

// PUT remove a member from group
groupRouter.put("/remove/:groupId", protectRoute, removeMemberFromGroup);

// PUT rename a group
groupRouter.put("/rename/:groupId", protectRoute, renameGroup);

// DELETE delete a group
groupRouter.delete("/delete/:groupId", protectRoute, deleteGroup);

// Fix: use groupRouter here, not messageRouter
groupRouter.post("/group/send/:groupId", protectRoute, sendGroupMessage);
groupRouter.get("/group/:groupId", protectRoute, getGroupMessages);
groupRouter.delete("/clear-messages/:groupId", protectRoute, clearGroupMessages);

export default groupRouter;
