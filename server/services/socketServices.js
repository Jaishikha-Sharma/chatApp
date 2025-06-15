
export const userSocketMap = {};
export const handleSocket = (io) =>{

// socket io connection handler
io.on("connection", (socket) => {
  const userId = socket.handshake.query.userId;
  console.log("User connected", userId);

  if (userId) {
    userSocketMap[userId] = socket.id;
  }

  // handle marking a message as seen
  socket.on("markMessageSeen", ({ messageId, senderId }) => {
    // Notify the sender that their message was seen
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

  // on disconnect
  socket.on("disconnect", () => {
    console.log("User disconnected", userId);
    delete userSocketMap[userId];
    io.emit("getOnlineUsers", Object.keys(userSocketMap));
  });
});
}