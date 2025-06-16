import express from "express";
import { protectRoute } from "../middleware/auth.js";
import { uploadAudio } from "../middleware/upload.js";
import {
  getMessages,
  getUsersForSidebar,
  markMessageAsSeen,
  sendMessage,
  deleteChat,
  editMessage
} from "../controllers/messageController.js";

const messageRouter = express.Router();

messageRouter.get("/users", protectRoute, getUsersForSidebar);
messageRouter.get("/:id", protectRoute, getMessages);
messageRouter.put("/mark/:id", protectRoute, markMessageAsSeen);
messageRouter.post("/send/:id", protectRoute, uploadAudio.single("audio"), sendMessage);
messageRouter.delete("/delete/:id", protectRoute, deleteChat);
messageRouter.put("/edit/:id", protectRoute, editMessage);

export default messageRouter;