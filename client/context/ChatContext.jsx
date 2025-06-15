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

  // Fetch all users and unseen message counts
  const getUsers = async () => {
    try {
      const { data } = await axios.get("/api/messages/users");
      if (data.success) {
        setUsers(data.users);
        setUnseenMessages(data.unseenMessages || {});
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch users");
    }
  };

  // Fetch all groups
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

  // Fetch messages for one-on-one chat with userId, mark unseen as seen
  const getMessages = async (userId) => {
    setSelectedGroup(null);
    try {
      const { data } = await axios.get(`/api/messages/${userId}`);
      if (data.success) {
        // Mark unseen messages from this user as seen locally
        const updatedMessages = data.messages.map((msg) =>
          !msg.seen && msg.senderId === userId ? { ...msg, seen: true } : msg
        );
        setMessages(updatedMessages);

        // Mark unseen messages as seen on server
        const unseen = data.messages.filter(
          (msg) => !msg.seen && msg.senderId === userId
        );

        await Promise.all(
          unseen.map((msg) =>
            axios.put(`/api/messages/mark/${msg._id}`).catch((err) => {
              console.error("Failed to mark seen:", msg._id, err.message);
            })
          )
        );

        // Remove unseen count from sidebar for this user
        setUnseenMessages((prev) => {
          const updated = { ...prev };
          delete updated[userId];
          return updated;
        });
      }
    } catch (error) {
      toast.error(error.message || "Failed to fetch messages");
    }
  };

  // Fetch messages for a group chat by groupId
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

  // Send one-on-one message to selectedUser
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

  // Send message in selected group; socket will handle updating messages
  const sendGroupMessage = async (messageData) => {
    if (!selectedGroup) return;
    try {
      const { data } = await axios.post(
        `/api/groups/group/send/${selectedGroup._id}`,
        messageData
      );
      if (!data.success) {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error(error.message || "Failed to send group message");
    }
  };

  // Subscribe to incoming new messages via socket.io
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
          // Prevent duplicate messages
          if (prev.some((msg) => msg._id === newMessage._id)) return prev;
          return [...prev, newMessage];
        });

        // Mark message as seen on server
        try {
          await axios.put(`/api/messages/mark/${newMessage._id}`);
        } catch {
          // ignore errors here
        }
      } else {
        // Update unseen message count for the user or group
        const key = isGroup ? newMessage.groupId : newMessage.senderId;
        setUnseenMessages((prev) => ({
          ...prev,
          [key]: prev[key] ? prev[key] + 1 : 1,
        }));
      }
    });
  };

  // Unsubscribe socket listener
  const unsubscribefromMessage = () => {
    if (socket) socket.off("newMessage");
  };

  // Manage socket subscription lifecycle
  useEffect(() => {
    subscribeToMessages();
    return () => unsubscribefromMessage();
  }, [socket, selectedUser, selectedGroup]);

  // Delete entire chat with a user
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

  // Clear all messages in a one-on-one chat with userId
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

  // Delete entire group chat by groupId
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

  // Clear all messages in a group chat by groupId
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

  // Toggle pin/unpin chat by chatId (user or group id)
  const togglePinChat = (chatId) => {
    setPinnedChats((prev) =>
      prev.includes(chatId)
        ? prev.filter((id) => id !== chatId)
        : [...prev, chatId]
    );
  };

  // Load pinned chats from localStorage on mount
  useEffect(() => {
    const savedPins = localStorage.getItem("pinnedChats");
    if (savedPins) setPinnedChats(JSON.parse(savedPins));
  }, []);

  // Save pinned chats to localStorage on change
  useEffect(() => {
    localStorage.setItem("pinnedChats", JSON.stringify(pinnedChats));
  }, [pinnedChats]);

  // Rename a group
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
      toast.error(error.message || "Failed to rename group");
    }
  };

  // Add a member to group by userId
  const addMemberToGroup = async (groupId, userId) => {
    try {
      const { data } = await axios.put(`/api/groups/add/${groupId}`, {
        userId,
      });
      if (data.success) {
        toast.success(data.message);
        getGroupMessages(groupId); // Refresh group messages and info
      }
    } catch (error) {
      toast.error(error.message || "Failed to add member");
    }
  };

  // Remove a member from group by userId
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
      toast.error(error.message || "Failed to remove member");
    }
  };

  return (
    <ChatContext.Provider
      value={{
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
        renameGroup,
        addMemberToGroup,
        removeMemberFromGroup,
        socket,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};