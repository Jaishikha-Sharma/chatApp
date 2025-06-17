import React, { useContext, useEffect, useRef, useState } from "react";
import { formatMessageTime } from "../lib/utils.js";
import { ChatContext } from "../../context/ChatContext.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import toast from "react-hot-toast";
import { Trash2, X, Image, Mic } from "lucide-react";
import assets from "../assets/assets";
import VoiceRecorder from "../pages/VoiceRecorder.jsx";

const ChatContainer = () => {
  const {
    messages,
    selectedUser,
    setSelectedUser,
    sendMessage,
    getMessages,
    deleteChat,
  } = useContext(ChatContext);

  const { authUser, onlineUsers } = useContext(AuthContext);

  const [input, setInput] = useState("");
  const [showProfile, setShowProfile] = useState(false);
  const [showRecorder, setShowRecorder] = useState(false);

  const scrollEnd = useRef();

  const getUserStatus = (user) => {
    if (onlineUsers.includes(user._id)) return "Active";
    const lastSeen = new Date(user.updatedAt);
    const now = new Date();
    const diff = Math.floor((now - lastSeen) / 60000);
    if (diff < 10) return "Away";
    if (diff < 60) return `Last seen: ${diff} min ago`;
    if (diff < 1440) return `Last seen: ${Math.floor(diff / 60)} hr ago`;
    return `Last seen: ${Math.floor(diff / 1440)} day(s) ago`;
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (input.trim() === "") return;
    await sendMessage({ text: input.trim() });
    setInput("");
  };

  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select a valid image file!");
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      await sendMessage({ image: reader.result });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const handleRecordingComplete = async (file, audioURL, duration) => {
    const reader = new FileReader();
    reader.onloadend = async () => {
      try {
        await sendMessage({ audio: reader.result, duration });
        toast.success("Voice note sent!");
      } catch (err) {
        toast.error("Failed to send voice note");
      }
    };
    reader.readAsDataURL(file);
    setShowRecorder(false);
  };

  const handleDeleteChat = async () => {
    const confirm = window.confirm("Are you sure you want to delete this chat?");
    if (confirm) {
      await deleteChat(selectedUser._id);
      setSelectedUser(null);
    }
  };

  const formatDuration = (duration) => {
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  useEffect(() => {
    if (selectedUser) getMessages(selectedUser._id);
  }, [selectedUser]);

  useEffect(() => {
    if (scrollEnd.current && messages) {
      scrollEnd.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  return selectedUser ? (
    <div className="h-full overflow-hidden relative bg-gray-100">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 py-3 px-4 border-b border-gray-300 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <img
            src={selectedUser.profilePic || assets.avatar_icon}
            alt="User avatar"
            className="w-8 h-8 rounded-full"
          />
          <div className="flex flex-col cursor-pointer" onClick={() => setShowProfile(!showProfile)}>
            <p className="text-lg text-black font-semibold">{selectedUser.fullName}</p>
            <span className={`text-xs font-medium ${onlineUsers.includes(selectedUser._id) ? "text-green-500" : "text-gray-500"}`}>
              {getUserStatus(selectedUser)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-black">
          <Trash2 size={18} onClick={handleDeleteChat} className="cursor-pointer hover:text-red-500" title="Delete Chat" />
          <X size={20} onClick={() => setSelectedUser(null)} className="cursor-pointer hover:text-red-500" title="Close Chat" />
        </div>

        {showProfile && (
          <div className="absolute top-14 left-4 bg-white text-black rounded-lg p-4 shadow-md z-50 w-60">
            <h3 className="font-bold text-lg mb-2 border-b border-gray-300 pb-1">User Info</h3>
            <div className="flex items-center gap-2 mb-2">
              <img
                src={selectedUser.profilePic || assets.avatar_icon}
                alt="User avatar"
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-medium">{selectedUser.fullName}</p>
                <p className="text-sm text-gray-600">{getUserStatus(selectedUser)}</p>
              </div>
            </div>
            {selectedUser.email && (
              <p className="text-sm text-gray-700">📧 {selectedUser.email}</p>
            )}
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex flex-col h-[calc(100%-120px)] overflow-y-scroll p-4 space-y-3">
        {messages.map((msg) => {
          const isSentByMe = msg.senderId === authUser._id;
          const hasContent = msg.text || msg.image || msg.audio;
          if (!hasContent) return null;

          return (
            <div key={msg._id} className={`flex flex-col ${isSentByMe ? "items-end" : "items-start"}`}>
              <div
                className={`max-w-[75%] p-3 text-sm rounded-xl break-words ${
                  msg.image || msg.audio
                    ? "bg-transparent p-0"
                    : isSentByMe
                    ? "bg-purple-500 text-white"
                    : "bg-white text-black border border-gray-200"
                } shadow-md`}
              >
                {msg.image && (
                  <img src={msg.image} alt="Chat image" className="max-w-[250px] rounded-xl shadow" />
                )}
                {msg.text && <span>{msg.text}</span>}
                {msg.audio && (
                  <div>
                    <audio controls className="mt-1 max-w-[250px]">
                      <source src={msg.audio} type="audio/webm" />
                      Your browser does not support the audio element.
                    </audio>
                    {msg.duration && (
                      <p className="text-xs text-gray-500 mt-1">
                        Duration: {formatDuration(msg.duration)}
                      </p>
                    )}
                  </div>
                )}
              </div>
              <div className="text-xs mt-1 text-gray-500 flex items-center gap-1">
                {formatMessageTime(msg.createdAt)}
                {isSentByMe && (
                  <span
                    className={`ml-1 ${msg.seen ? "text-purple-500" : "text-gray-400"}`}
                    title={msg.seen ? "Seen" : "Delivered"}
                  >
                    ✔
                  </span>
                )}
              </div>
            </div>
          );
        })}
        <div ref={scrollEnd}></div>
      </div>

      {/* Input Box */}
      <div className="absolute bottom-0 left-0 right-0 flex items-center gap-3 p-4 bg-white border-t border-gray-200">
        <div className="flex-1 flex items-center bg-gray-100 px-3 rounded-full">
          <input
            onChange={(e) => setInput(e.target.value)}
            value={input}
            onKeyDown={(e) => (e.key === "Enter" ? handleSendMessage(e) : null)}
            type="text"
            placeholder="Send a message..."
            className="flex-1 text-sm p-3 border-none rounded-lg outline-none bg-transparent text-black placeholder-gray-500"
          />
          {/* Image Upload */}
          <input type="file" id="image" onChange={handleSendImage} accept="image/*" hidden />
          <label htmlFor="image">
            <Image className="w-5 h-5 mr-3 cursor-pointer text-black" />
          </label>

          {/* Mic Icon */}
          <Mic className="w-5 h-5 mr-2 cursor-pointer text-black" onClick={() => setShowRecorder(!showRecorder)} />
        </div>

        <img
          src={assets.send_button}
          alt="Send"
          className="w-7 cursor-pointer"
          onClick={handleSendMessage}
        />
      </div>

      {/* Voice Recorder (Popup) */}
      {showRecorder && (
        <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 z-50">
          <VoiceRecorder onRecordingComplete={handleRecordingComplete} />
        </div>
      )}
    </div>
  ) : (
    <div className="flex flex-col items-center justify-center gap-2 text-gray-500 bg-white max-md:hidden">
      <img src={assets.logo_icon} alt="Logo" className="max-w-16" />
      <p className="text-lg font-medium text-black">Chat anytime, anywhere</p>
    </div>
  );
};

export default ChatContainer;
