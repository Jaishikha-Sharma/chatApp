import express from "express";
import "dotenv/config";
import cors from "cors";
import http from "http";
import { connectDB } from "./lib/db.js";
import userRouter from "./routes/userRoutes.js";
import messageRouter from "./routes/messageRoutes.js";
import groupRouter from "./routes/groupRouter.js";
import { Server } from "socket.io";

const app = express();
const server = http.createServer(app);

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

  // on disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected", userId);
    delete userSocketMap[userId];
    io.emit("get online users again", Object.keys(userSocketMap));
  });
});

// middlewares
app.use(express.json({ limit: "4mb" }));
app.use(cors());

// routes
app.use("/api/status", (req, res) => res.send("Server is live!"));
app.use("/api/auth", userRouter);
app.use("/api/messages", messageRouter);
app.use("/api/groups", groupRouter);

// connect to mongodb
await connectDB();

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log("Server is running on PORT : " + PORT));
