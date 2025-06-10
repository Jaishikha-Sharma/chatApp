import Message from "../models/Message.js";
import User from "../models/User.js";
import cloudinary from "../lib//cloudinary.js";
import {io , userSocketMap} from "../server.js";


// get all users except the logged-in user
export const getUsersForSidebar = async (req, res) => {
  try {
    const userId = req.user._id;
    const filteredUsers = await User.find({
      _id: { $ne: userId },
    }).select("-password");

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

// get all msg for selected user
export const getMessages = async (req, res) => {
  try {
    const { id: selectedUserId } = req.params;
    const myId = req.user._id;

    const messages = await Message.find({
      $or: [
        { senderId: myId, receiverId: selectedUserId },
        { senderId: selectedUserId, receiverId: myId },
      ],
      deletedFor: { $ne: myId }  // ⬅️ Exclude messages deleted for current user
    }).sort({ createdAt: 1 });

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

// api to mark msg as seen
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

// send msgs to seleted user
export const sendMessage = async (req, res) => {
  try {
    const { text, image } = req.body;
    const receiverId = req.params.id;
    const senderId = req.user._id;
    let imageUrl;
    if (image) {
      const uploadResponse = await cloudinary.uploader.upload(image);
      imageUrl = uploadResponse.secure_url;
    }

    const newMessage = await Message.create({
      senderId,
      receiverId,
      text,
      image: imageUrl,
    });

    // emit new msg to the receiver socket

    const receiverSocketId = userSocketMap[receiverId];
    if(receiverSocketId){
      io.to(receiverSocketId).emit("newMessage" , newMessage);
    }

    res.json({ success: true, newMessage });
  } catch (error) {
    console.log(error.message);
    return res.json({ success: false, message: error.message });
  }
};

// DELETE chat between logged-in user and selected user
export const deleteChat = async (req, res) => {
  try {
    const myId = req.user._id;
    const otherUserId = req.params.id;

    // Mark messages as deleted for this user
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



