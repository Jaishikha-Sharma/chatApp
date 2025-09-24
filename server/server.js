import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";

import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import groupRouter from "./routes/groupRouter.js";
import { Server } from "socket.io";
import User from "./models/User.js";

const app = express();
const server = http.createServer(app);

// required to get __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// initialize socket.io server
export const io = new Server(server, {
  cors: { origin: "*" },
});

// store online users
export const userSocketMap = {};

// socket io connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User connected", userId);

  if (userId) {
    userSocketMap[userId] = socket.id;
  }

  // handle marking a message as seen
  socket.on("markMessageSeen", ({ messageId, senderId }) => {
    if (senderId && userSocketMap[senderId]) {
      const senderSocketId = userSocketMap[senderId];
      io.to(senderSocketId).emit("messageSeenUpdate", { messageId });
    }
  });

  // emit online users list
  io.emit("getOnlineUsers", Object.keys(userSocketMap));

  // join group room
  socket.on("joinGroup", (groupId) => {
    socket.join(groupId);
    console.log(`User ${userId} joined group ${groupId}`);
  });

  // handle group message
  socket.on("sendGroupMessage", (newMessage) => {
    const groupId = newMessage.groupId;
    if (groupId) {
      io.to(groupId).emit("newMessage", newMessage);
    }
  });

  // disconnect logic
  socket.on("disconnect", async () => {
    console.log("User disconnected", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));

    if (userId) {
      try {
        await User.findByIdAndUpdate(userId, { lastSeen: new Date() });
      } catch (err) {
        console.error("Error updating lastSeen:", err.message);
      }
    }
  });
});

// middlewares
app.use(express.json({ limit: "4mb" }));
app.use(cors());

// ✅ serve the /uploads folder publicly
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// routes
app.use("/api/status", (req, res) => res.send("Server is live!"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);
app.use("/api/groups", groupRouter);

// connect to mongodb
await connectDB();

// start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("Server is running on PORT : " + PORT));