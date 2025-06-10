import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext.jsx";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});

  const { socket, axios } = useContext(AuthContext);

  // Fetch all users for sidebar
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch users");
    }
  };

  // Fetch messages for selected user
  const getMessages = async (userId) => {
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch messages");
    }
  };

  // Send message
  const sendMessage = async (messageData) => {
    try {
      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        messageData
      );
      if (data.success) {
        setMessages((prev) => [...prev, data.newMessage]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Message send failed");
    }
  };

  const subscribeToMessages = () => {
    if (!socket) return;

    socket.on("newMessage", async (newMessage) => {
      if (selectedUser && newMessage.senderId === selectedUser._id) {
        newMessage.seen = true;
        setMessages((prevMessages) => [...prevMessages, newMessage]);

        // Mark message as seen
        await axios.put(`/api/messages/mark/${newMessage._id}`);
      } else {
        setUnseenMessages((prevUnseenMessages) => ({
          ...prevUnseenMessages,
          [newMessage.senderId]: prevUnseenMessages[newMessage.senderId]
            ? prevUnseenMessages[newMessage.senderId] + 1
            : 1,
        }));
      }
    });
  };

  const unsubscribefromMessage = () => {
    if (socket) socket.off("newMessage");
  };

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribefromMessage();
  }, [socket, selectedUser]);

  // Delete all messages from DB for the selected user
const deleteChat = async (userId) => {
  try {
    const { data } = await axios.delete(`/api/messages/delete/${userId}`);
    if (data.success) {
      toast.success(data.message);
      setMessages([]); // Clear messages from UI
    } else {
      toast.error(data.message);
    }
  } catch (error) {
    toast.error(error.message || "Failed to delete chat");
  }
};

// Clear chat (frontend-only or mock for one-side clear)
const clearChat = async (userId) => {
  try {
    const { data } = await axios.delete(`/api/messages/clear/${userId}`);
    if (data.success) {
      toast.success(data.message);
      setMessages([]); // Clear UI
    } else {
      toast.error(data.message);
    }
  } catch (error) {
    toast.error(error.message || "Failed to clear chat");
  }
};


  const value = {
    messages,
    users,
    selectedUser,
    unseenMessages,
    setSelectedUser,
    getUsers,
    getMessages,
    sendMessage,
    subscribeToMessages,
    clearChat,
    deleteChat,
    socket,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
