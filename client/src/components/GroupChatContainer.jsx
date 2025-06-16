import React, { useContext, useEffect, useRef, useState } from "react";
import assets from "../assets/assets";
import { formatMessageTime } from "../lib/utils.js";
import { ChatContext } from "../../context/ChatContext.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import toast from "react-hot-toast";
import { X, MoreVertical, Image } from "lucide-react";

const GroupChatContainer = () => {
  const {
    messages,
    selectedGroup,
    setSelectedGroup,
    sendGroupMessage,
    getGroupMessages,
    deleteGroupChat,
    clearGroupChat,
    renameGroup,
    addMemberToGroup,
    removeMemberFromGroup,
    users,
  } = useContext(ChatContext);

  const { authUser, socket } = useContext(AuthContext);
  const [input, setInput] = useState("");
  const scrollEnd = useRef();
  const [showGroupInfo, setShowGroupInfo] = useState(false);
  const [showOptions, setShowOptions] = useState(false);
  const [newGroupName, setNewGroupName] = useState("");

  // For mention functionality:
  const [mentionSuggestions, setMentionSuggestions] = useState([]);
  const [showMentionList, setShowMentionList] = useState(false);
  const [mentionQuery, setMentionQuery] = useState("");
  const [mentionStartPos, setMentionStartPos] = useState(null);
  const inputRef = useRef(null);

  useEffect(() => {
    if (selectedGroup) {
      getGroupMessages(selectedGroup._id);
      if (socket) socket.emit("joinGroup", selectedGroup._id);
    }
  }, [selectedGroup]);

  useEffect(() => {
    setTimeout(() => {
      scrollEnd.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages]);

  // Handle input change to detect @ mentions
  const handleInputChange = (e) => {
    const val = e.target.value;
    const cursorPos = e.target.selectionStart;
    setInput(val);

    // Find if there's a @ before the cursor, and no space after it yet
    const textBeforeCursor = val.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (
      atIndex !== -1 &&
      (atIndex === 0 || /\s/.test(textBeforeCursor[atIndex - 1])) // '@' is at start or preceded by space
    ) {
      const query = textBeforeCursor.slice(atIndex + 1);
      // Show mention list if query is alphanumeric (allow letters, numbers, underscore)
      if (/^[\w]{0,20}$/.test(query)) {
        setMentionQuery(query);
        setMentionStartPos(atIndex);
        // Filter users in selectedGroup matching the query (case insensitive)
        const matchedUsers = selectedGroup.members.filter((m) =>
          m.fullName.toLowerCase().includes(query.toLowerCase())
        );
        setMentionSuggestions(matchedUsers);
        setShowMentionList(matchedUsers.length > 0);
      } else {
        setShowMentionList(false);
        setMentionSuggestions([]);
        setMentionStartPos(null);
      }
    } else {
      setShowMentionList(false);
      setMentionSuggestions([]);
      setMentionStartPos(null);
    }
  };

  // Insert mention in the input when clicked or selected from list
  const insertMention = (user) => {
    if (mentionStartPos === null) return;

    const beforeMention = input.slice(0, mentionStartPos);
    const afterMention = input.slice(inputRef.current.selectionStart);

    const mentionText = `@${user.fullName}`;

    const newInput = beforeMention + mentionText + " " + afterMention;
    setInput(newInput);

    // Move cursor after inserted mention plus a space
    setTimeout(() => {
      const pos = beforeMention.length + mentionText.length + 1;
      inputRef.current.focus();
      inputRef.current.setSelectionRange(pos, pos);
    }, 0);

    setShowMentionList(false);
    setMentionSuggestions([]);
    setMentionStartPos(null);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;
    await sendGroupMessage({ text: input.trim() });
    setInput("");
    setShowMentionList(false);
    setMentionSuggestions([]);
    setMentionStartPos(null);
  };

  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select a valid image file!");
      return;
    }

    const reader = new FileReader();
    reader.onload = async () => {
      await sendGroupMessage({ image: reader.result });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleDeleteChat = async () => {
    if (
      selectedGroup &&
      window.confirm("Are you sure you want to delete this group chat?")
    ) {
      await deleteGroupChat(selectedGroup._id);
      setSelectedGroup(null);
    }
  };

  const handleClearGroupChat = async () => {
    if (
      selectedGroup &&
      window.confirm(
        "Are you sure you want to clear all messages in this group?"
      )
    ) {
      await clearGroupChat(selectedGroup._id);
    }
  };

  const handleRename = async () => {
    if (newGroupName.trim()) {
      await renameGroup(selectedGroup._id, newGroupName.trim());
      setNewGroupName("");
    }
  };

  if (!selectedGroup)
    return (
      <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white/10 max-md:hidden">
        <img src={assets.logo_icon} alt="Logo" className="max-w-16" />
        <p className="text-lg font-medium text-white">Select a group to chat</p>
      </div>
    );

  return (
    <div className="h-full overflow-scroll relative backdrop-blur-lg">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 py-3 px-4 border-b border-stone-500 relative bg-white">
        <div className="flex items-center gap-3">
          <img
            src={assets.group_icon || assets.avatar_icon}
            alt="Group icon"
            className="w-8 rounded-full"
          />
          <p
            className="text-lg text-black flex items-center gap-2 cursor-pointer"
            onClick={() => setShowGroupInfo(!showGroupInfo)}
          >
            {selectedGroup.name}
          </p>
        </div>

        <div className="relative flex items-center gap-3 text-black">
          <div className="relative">
            <MoreVertical
              size={20}
              onClick={() => setShowOptions((prev) => !prev)}
              className="cursor-pointer hover:text-gray-600"
              title="Group Options"
            />
            {showOptions && (
              <div className="absolute top-7 right-0 z-10 bg-white text-sm text-black rounded shadow-md w-44">
                <button
                  onClick={() => {
                    setShowOptions(false);
                    handleClearGroupChat();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-yellow-100"
                >
                  Clear Group Chat
                </button>
                <button
                  onClick={() => {
                    setShowOptions(false);
                    handleDeleteChat();
                  }}
                  className="w-full text-left px-4 py-2 hover:bg-red-100 text-red-600"
                >
                  Delete Group
                </button>
              </div>
            )}
          </div>
          <X
            size={20}
            onClick={() => setSelectedGroup(null)}
            className="cursor-pointer hover:text-red-500"
            title="Close Chat"
          />
        </div>

        {showGroupInfo && (
          <div className="absolute top-14 left-4 bg-white/90 text-black rounded-2xl shadow-2xl p-5 z-50 w-72 max-h-[450px] overflow-y-auto backdrop-blur-sm border border-gray-200">
            <h3 className="font-semibold text-xl mb-3 border-b pb-2 border-gray-300">
              👥 Group Info
            </h3>

            <div className="mb-3">
              <input
                type="text"
                placeholder="Rename group..."
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
              />
              <button
                onClick={handleRename}
                className="w-full mt-2 bg-blue-500 hover:bg-blue-600 text-white py-2 text-sm rounded-lg transition duration-150"
              >
                Rename Group
              </button>
            </div>

            <p className="text-sm mb-2 text-gray-600">
              <strong>{selectedGroup.members.length}</strong> members
            </p>

            <select
              className="w-full mb-3 px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400"
              onChange={(e) => {
                if (e.target.value)
                  addMemberToGroup(selectedGroup._id, e.target.value);
                e.target.selectedIndex = 0;
              }}
            >
              <option value="">Add Member</option>
              {users
                .filter(
                  (u) => !selectedGroup.members.some((m) => m._id === u._id)
                )
                .map((u) => (
                  <option key={u._id} value={u._id}>
                    {u.fullName}
                  </option>
                ))}
            </select>

            <ul className="space-y-2">
              {selectedGroup.members.map((m) => (
                <li
                  key={m._id}
                  className="flex justify-between items-center px-3 py-2 bg-gray-100 rounded-lg text-sm"
                >
                  <span>{m.fullName}</span>
                  {m._id !== authUser._id && (
                    <button
                      onClick={() =>
                        removeMemberFromGroup(selectedGroup._id, m._id)
                      }
                      className="text-red-500 text-xs hover:underline"
                    >
                      Remove
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Soft Banner */}
      <div className="px-4 py-2 bg-yellow-50 border border-yellow-300 text-yellow-800 text-sm flex items-center gap-2">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className="h-5 w-5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M13 16h-1v-4h-1m1-4h.01M12 17a5 5 0 100-10 5 5 0 000 10z"
          />
        </svg>
        <span>
          You are not allowed to share personal contact or discuss payments.
        </span>
      </div>

      {/* Messages */}
      <div className="flex flex-col h-[calc(100%-168px)] overflow-y-scroll p-3 pb-6">
        {messages.map((msg) => {
          if (!msg || !msg.senderId) return null;
          const senderId = msg.senderId._id || msg.senderId;
          const isOwn = senderId === authUser._id;
          const senderPic = msg.senderId?.profilePic || assets.avatar_icon;

          return (
            <div
              key={msg._id}
              className={`flex items-end mb-4 gap-2 ${
                isOwn ? "justify-end" : "justify-start"
              }`}
            >
              {!isOwn && (
                <img
                  src={senderPic}
                  alt="avatar"
                  className="w-7 h-7 rounded-full"
                />
              )}
              <div>
                {msg.image ? (
                  <img
                    src={msg.image}
                    alt="chat image"
                    className="max-w-[230px] border border-gray-700 rounded-lg overflow-hidden"
                  />
                ) : (
                  <p
                    className={`p-3 max-w-[250px] text-sm font-medium rounded-2xl break-words ${
                      isOwn
                        ? "bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-bl-none shadow-md"
                        : "bg-gray-100 text-black rounded-br-none"
                    }`}
                  >
                    {msg.text}
                  </p>
                )}
                <p
                  className={`text-[11px] mt-1 text-gray-400 ${
                    isOwn ? "text-right" : "text-left"
                  }`}
                >
                  {formatMessageTime(msg.createdAt)}
                </p>
              </div>
              {isOwn && (
                <img
                  src={authUser.profilePic || assets.avatar_icon}
                  alt="avatar"
                  className="w-7 h-7 rounded-full"
                />
              )}
            </div>
          );
        })}
        <div ref={scrollEnd}></div>
      </div>

      {/* Input */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-3 bg-white">
        <div className="flex-1 flex flex-col relative">
          <input
            ref={inputRef}
            value={input}
            onChange={handleInputChange}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !showMentionList) {
                handleSendMessage(e);
              }
              // Keyboard navigation for mention list
              if (showMentionList) {
                // We'll skip complex keyboard navigation here for brevity,
                // but you can enhance this later
              }
            }}
            placeholder="Send a message"
            className="flex-1 text-sm p-3 border-none rounded-lg outline-none text-black placeholder-gray-500 bg-gray-100"
          />
          {showMentionList && (
            <ul className="absolute bottom-full mb-1 max-h-40 w-full overflow-y-auto bg-white border border-gray-300 rounded-md shadow-lg z-50">
              {mentionSuggestions.map((user) => (
                <li
                  key={user._id}
                  onClick={() => insertMention(user)}
                  className="px-3 py-2 cursor-pointer hover:bg-blue-100"
                >
                  {user.fullName}
                </li>
              ))}
            </ul>
          )}
        </div>
        <input
          type="file"
          id="group-image"
          onChange={handleSendImage}
          accept="image/*"
          hidden
        />
        <label htmlFor="group-image" className="mr-2 cursor-pointer">
          <Image className="w-5 h-5 mr-2 cursor-pointer text-black" />
        </label>
        <img
          src={assets.send_button}
          alt="Send"
          onClick={handleSendMessage}
          className="w-7 cursor-pointer"
        />
      </div>
    </div>
  );
};

export default GroupChatContainer;