import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { uploadMedia } from "../middleware/upload.js"; // ✅ FIXED import
import {
  getMessages,
  getUsersForSidebar,
  markMessageAsSeen,
  sendMessage,
  deleteChat,
  editMessage,
  getReplyMessage,
  getMessagesBetweenUsers,
} from "../controllers/messageController.js";

const messageRouter = express.Router();

// Fetch users for sidebar
messageRouter.get("/users", protectRoute, getUsersForSidebar);

// Admin route for messages between two users — place BEFORE generic '/:id' route
messageRouter.get(
  "/admin/:user1Id/:user2Id",
  protectRoute,
  getMessagesBetweenUsers
);

// Generic route to get messages by id
messageRouter.get("/:id", protectRoute, getMessages);

// Mark message as seen
messageRouter.put("/mark/:id", protectRoute, markMessageAsSeen);

// Send message with optional media upload
messageRouter.post(
  "/send/:id",
  protectRoute,
  uploadMedia.fields([
    { name: "audio", maxCount: 1 },
    { name: "image", maxCount: 1 },
    { name: "document", maxCount: 1 },
  ]),
  sendMessage
);

// Delete chat by id
messageRouter.delete("/delete/:id", protectRoute, deleteChat);

// Edit message by id
messageRouter.put("/edit/:id", protectRoute, editMessage);

// Get reply message by id
messageRouter.get("/reply/:id", protectRoute, getReplyMessage);

export default messageRouter;
