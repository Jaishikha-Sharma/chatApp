import { createContext, useContext, useEffect, useMemo, useState } from "react";
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
  const [replyToMessage, setReplyToMessage] = useState(null);
  const [forwardedMessage, setForwardedMessage] = useState(null);

  const { socket, axios } = useContext(AuthContext);

  const forbiddenPatterns = [
    /\b\d{10,15}\b/,
    /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/,
    /@\w+/,
    /(https?:\/\/[^\s]+)/,
    /(paytm|gpay|phonepe|paypal|upi|paynow|pay\.com)/i,
  ];

  const containsForbiddenInfo = (text) => {
    if (!text) return false;
    const normalized = text.toLowerCase().replace(/\s|[-_.]/g, "");
    return forbiddenPatterns.some(
      (pattern) => pattern.test(text) || pattern.test(normalized)
    );
  };

  // Fetching
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages || {});
      }
    } catch (error) {
      toast.error(error?.message || "Failed to fetch users");
    }
  };

  const getGroups = async () => {
    try {
      const { data } = await axios.get("/api/groups");
      if (data.success) {
        setGroups(data.groups);
      }
    } catch (error) {
      toast.error(error?.message || "Failed to fetch groups");
    }
  };

 const getMessages = async (userId) => {
  setSelectedGroup(null);
  try {
    const { data } = await axios.get(`/api/messages/${userId}`);
    if (data.success) {
      const updatedMessages = await Promise.all(
        data.messages.map(async (msg) => {
          const newMsg = { ...msg };

          if (newMsg.replyTo && typeof newMsg.replyTo === "string") {
            try {
              const { data } = await axios.get(`/api/messages/reply/${newMsg.replyTo}`);
              if (data.success) newMsg.replyTo = data.message;
            } catch {}
          }

          if (newMsg.forwardedFrom && typeof newMsg.forwardedFrom === "string") {
            try {
              const { data } = await axios.get(`/api/messages/reply/${newMsg.forwardedFrom}`);
              if (data.success) newMsg.forwardedFrom = data.message;
            } catch {}
          }

          if (!newMsg.seen && newMsg.senderId === userId) {
            newMsg.seen = true;
            await axios.put(`/api/messages/mark/${newMsg._id}`).catch(() => {});
          }

          return newMsg;
        })
      );

      setMessages(updatedMessages);

      setUnseenMessages((prev) => {
        const updated = { ...prev };
        delete updated[userId];
        return updated;
      });
    }
  } catch (error) {
    toast.error(error?.message || "Failed to fetch messages");
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
      toast.error(error?.message || "Failed to fetch group messages");
    }
  };

  // Sending
  const sendMessage = async ({ text, audio, image, document , forwardedMessage  }) => {
    if (!selectedUser) return;

    if (text && containsForbiddenInfo(text)) {
      toast.error("Message contains restricted info.");
      return;
    }

    try {
      const formData = new FormData();

      if (text) formData.append("text", text);
      if (audio) formData.append("audio", audio);
      if (image) formData.append("image", image);

      // ✅ Document support
      if (document) {
        formData.append("document", document);
        formData.append("documentName", document.name);
      }

      // ✅ Reply support
      if (replyToMessage?._id) {
        formData.append("replyTo", replyToMessage._id);
      }

      // ✅ Forward support
      if (forwardedMessage?._id) {
        formData.append("forwardedFrom", forwardedMessage._id);
      }

      const { data } = await axios.post(
        `/api/messages/send/${selectedUser._id}`,
        formData
      );

      if (data.success) {
        setMessages((prev) => [...prev, data.newMessage]);
        setReplyToMessage(null);
        setForwardedMessage(null);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error?.message || "Message send failed");
    }
  };

  const sendGroupMessage = async ({ text, audio, image, document , forwardedMessage  }) => {
    if (!selectedGroup) return;

    if (text && containsForbiddenInfo(text)) {
      toast.error("Group message contains restricted info.");
      return;
    }

    try {
      const formData = new FormData();

      if (text) formData.append("text", text);
      if (audio) formData.append("audio", audio);
      if (image) formData.append("image", image);

      // ✅ Document support
      if (document) {
        formData.append("document", document);
        formData.append("documentName", document.name);
      }

      // ✅ Reply support
      if (replyToMessage?._id) {
        formData.append("replyTo", replyToMessage._id);
      }

      // ✅ Forward support
      if (forwardedMessage?._id) {
        formData.append("forwardedFrom", forwardedMessage._id);
      }

      const { data } = await axios.post(
        `/api/groups/group/send/${selectedGroup._id}`,
        formData
      );

      if (data.success) {
        // Normally socket will handle message addition
        setReplyToMessage(null);
        setForwardedMessage(null);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(
        error?.response?.data?.message || "Failed to send group message"
      );
    }
  };

  // Realtime
 const subscribeToMessages = () => {
  if (!socket) return;

  socket.on("newMessage", async (newMessage) => {
    const isGroup = newMessage.isGroup;
    const isActive =
      (isGroup && selectedGroup?._id === newMessage.groupId) ||
      (!isGroup && selectedUser?._id === newMessage.senderId);

    // ✅ Populate replyTo message if it's just an ID
    if (newMessage.replyTo && typeof newMessage.replyTo === "string") {
      try {
        const { data } = await axios.get(`/api/messages/reply/${newMessage.replyTo}`);
        if (data.success) {
          newMessage.replyTo = data.message;
        }
      } catch (error) {
        console.error("Failed to populate replyTo:", error.message);
      }
    }

    // ✅ Populate forwardedFrom message if it's just an ID
    if (newMessage.forwardedFrom && typeof newMessage.forwardedFrom === "string") {
      try {
        const { data } = await axios.get(`/api/messages/reply/${newMessage.forwardedFrom}`);
        if (data.success) {
          newMessage.forwardedFrom = data.message;
        }
      } catch (error) {
        console.error("Failed to populate forwardedFrom:", error.message);
      }
    }

    if (isActive) {
      newMessage.seen = true;
      setMessages((prev) =>
        prev.some((msg) => msg._id === newMessage._id)
          ? prev
          : [...prev, newMessage]
      );
      try {
        await axios.put(`/api/messages/mark/${newMessage._id}`);
      } catch {}
    } else {
      const key = isGroup ? newMessage.groupId : newMessage.senderId;
      setUnseenMessages((prev) => ({
        ...prev,
        [key]: (prev[key] || 0) + 1,
      }));
    }
  });
};


  const unsubscribeFromMessages = () => {
    if (socket?.off) socket.off("newMessage");
  };

  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribeFromMessages();
  }, [socket, selectedUser, selectedGroup]);

  // Delete & Clear
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
      toast.error(error?.message || "Failed to delete chat");
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
      toast.error(error?.message || "Failed to clear chat");
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
      toast.error(error?.message || "Failed to delete group chat");
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
      toast.error(error?.message || "Failed to clear group chat");
    }
  };

  // Group Management
  const renameGroup = async (groupId, newName) => {
    try {
      const { data } = await axios.put(`/api/groups/rename/${groupId}`, {
        name: newName,
      });
      if (data.success) {
        toast.success(data.message);
        setGroups((prev) =>
          prev.map((g) => (g._id === groupId ? { ...g, name: newName } : g))
        );
        setSelectedGroup((prev) => (prev ? { ...prev, name: newName } : null));
      }
    } catch (error) {
      toast.error(error?.message || "Failed to rename group");
    }
  };

  const addMemberToGroup = async (groupId, userId) => {
    try {
      const { data } = await axios.put(`/api/groups/add/${groupId}`, {
        userId,
      });
      if (data.success) {
        toast.success(data.message);
        getGroupMessages(groupId);
      }
    } catch (error) {
      toast.error(error?.message || "Failed to add member");
    }
  };

  const removeMemberFromGroup = async (groupId, userId) => {
    try {
      const { data } = await axios.put(`/api/groups/remove/${groupId}`, {
        userId,
      });
      if (data.success) {
        toast.success(data.message);
        setSelectedGroup((prev) =>
          prev
            ? { ...prev, members: prev.members.filter((m) => m._id !== userId) }
            : null
        );
      }
    } catch (error) {
      toast.error(error?.message || "Failed to remove member");
    }
  };

  // Pins
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

  const contextValue = useMemo(
    () => ({
      users,
      groups,
      messages,
      unseenMessages,
      selectedUser,
      selectedGroup,
      pinnedChats,
      togglePinChat,
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
      clearChat,
      deleteGroupChat,
      clearGroupChat,
      renameGroup,
      addMemberToGroup,
      removeMemberFromGroup,
      replyToMessage,
      setReplyToMessage,
      setForwardedMessage,
      forwardedMessage, 
      socket,
    }),
    [
      users,
      groups,
      messages,
      unseenMessages,
      selectedUser,
      selectedGroup,
      pinnedChats,
      replyToMessage,
      setReplyToMessage,
      forwardedMessage,
      socket,
    ]
  );

  return (
    <ChatContext.Provider value={contextValue}>{children}</ChatContext.Provider>
  );
};
