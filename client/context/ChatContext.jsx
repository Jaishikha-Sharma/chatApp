import { createContext, useContext, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext.jsx";
import toast from "react-hot-toast";

export const ChatContext = createContext();

export const ChatProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [unseenMessages, setUnseenMessages] = useState({});
  const [pinnedChats, setPinnedChats] = useState([]);

  const { socket, axios } = useContext(AuthContext);

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

  const getGroups = async () => {
    try {
      const { data } = await axios.get("/api/groups");
      if (data.success) {
        setGroups(data.groups);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch groups");
    }
  };

  const getMessages = async (userId) => {
    setSelectedGroup(null);
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch messages");
    }
  };

  const getGroupMessages = async (groupId) => {
    setSelectedUser(null);
    try {
      const { data } = await axios.get(`/api/groups/group/${groupId}`);
      if (data.success) {
        setMessages(data.messages);
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch group messages");
    }
  };

  const sendMessage = async (messageData) => {
    if (!selectedUser) return;
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

  const sendGroupMessage = async (messageData) => {
    if (!selectedGroup) return;
    try {
      const { data } = await axios.post(
        `/api/groups/group/send/${selectedGroup._id}`,
        messageData
      );

      // ❌ Don't add message here, because socket will handle it
      if (!data.success) {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to send group message");
    }
  };

  const subscribeToMessages = () => {
    if (!socket) return;

    socket.on("newMessage", async (newMessage) => {
      const isGroup = newMessage.isGroup;
      const isActive =
        (isGroup && selectedGroup?._id === newMessage.groupId) ||
        (!isGroup && selectedUser?._id === newMessage.senderId);

      if (isActive) {
        newMessage.seen = true;

        setMessages((prev) => {
          if (prev.some((msg) => msg._id === newMessage._id)) return prev;
          return [...prev, newMessage];
        });

        await axios.put(`/api/messages/mark/${newMessage._id}`);
      } else {
        const key = isGroup ? newMessage.groupId : newMessage.senderId;
        setUnseenMessages((prev) => ({
          ...prev,
          [key]: prev[key] ? prev[key] + 1 : 1,
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
  }, [socket, selectedUser, selectedGroup]);

  const deleteChat = async (userId) => {
    try {
      const { data } = await axios.delete(`/api/messages/delete/${userId}`);
      if (data.success) {
        toast.success(data.message);
        setMessages([]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete chat");
    }
  };

  const clearChat = async (userId) => {
    try {
      const { data } = await axios.delete(`/api/messages/clear/${userId}`);
      if (data.success) {
        toast.success(data.message);
        setMessages([]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to clear chat");
    }
  };

  const deleteGroupChat = async (groupId) => {
    try {
      const { data } = await axios.delete(`/api/groups/delete/${groupId}`);
      if (data.success) {
        toast.success(data.message);
        setMessages([]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to delete group chat");
    }
  };

  const clearGroupChat = async (groupId) => {
    try {
      const { data } = await axios.delete(
        `/api/groups/clear-messages/${groupId}`
      );
      if (data.success) {
        toast.success(data.message);
        setMessages([]);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to clear group chat");
    }
  };

  const togglePinChat = (chatId) => {
    setPinnedChats((prev) =>
      prev.includes(chatId)
        ? prev.filter((id) => id !== chatId)
        : [...prev, chatId]
    );
  };
  useEffect(() => {
    const savedPins = localStorage.getItem("pinnedChats");
    if (savedPins) setPinnedChats(JSON.parse(savedPins));
  }, []);

  useEffect(() => {
    localStorage.setItem("pinnedChats", JSON.stringify(pinnedChats));
  }, [pinnedChats]);

  const value = {
    users,
    groups,
    messages,
    unseenMessages,
    selectedUser,
    pinnedChats,
    togglePinChat,
    selectedGroup,
    setSelectedUser,
    setSelectedGroup,
    getUsers,
    getGroups,
    getMessages,
    getGroupMessages,
    setUnseenMessages,
    sendMessage,
    sendGroupMessage,
    deleteChat,
    deleteGroupChat,
    clearGroupChat,
    clearChat,
    socket,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};
