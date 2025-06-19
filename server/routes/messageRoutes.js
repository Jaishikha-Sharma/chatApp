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
} from "../controllers/messageController.js";

const messageRouter = express.Router();

messageRouter.get("/users", protectRoute, getUsersForSidebar);
messageRouter.get("/:id", protectRoute, getMessages);
messageRouter.put("/mark/:id", protectRoute, markMessageAsSeen);

// ✅ Allow sending image/audio in one-to-one chat
messageRouter.post(
  "/send/:id",
  protectRoute,
  uploadMedia.fields([
    { name: "audio", maxCount: 1 },
    { name: "image", maxCount: 1 },
  ]),
  sendMessage
);

messageRouter.delete("/delete/:id", protectRoute, deleteChat);
messageRouter.put("/edit/:id", protectRoute, editMessage);
messageRouter.get("/reply/:id", protectRoute, getReplyMessage);

export default messageRouter;
