import React, { useContext, useEffect, useRef, useState } from "react";
import { formatMessageTime } from "../lib/utils.js";
import { ChatContext } from "../../context/ChatContext.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import toast from "react-hot-toast";
import { Trash2, X, Image, Mic, FileText } from "lucide-react";
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
    replyToMessage,
    setReplyToMessage,
    setForwardedMessage,
    forwardedMessage,
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
  const getDayLabel = (dateString) => {
    const today = new Date();
    const date = new Date(dateString);
    const diffTime = today.setHours(0, 0, 0, 0) - date.setHours(0, 0, 0, 0);
    const diffDays = diffTime / (1000 * 60 * 60 * 24);

    if (diffDays === 0) return "Today";
    if (diffDays === 86400000) return "Yesterday";
    return date.toLocaleDateString(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
    });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();

    await sendMessage({
      text: input.trim() || null,
      replyTo: replyToMessage?._id || null,
      forwardedMessage, // ✅ yaha directly state se bhej rahe ho
    });

    setInput("");
    setReplyToMessage(null);
    setForwardedMessage(null);
  };

  const handleSendImage = async (e) => {
    const file = e.target.files[0];
    if (!file || !file.type.startsWith("image/")) {
      toast.error("Please select a valid image file!");
      return;
    }
    try {
      await sendMessage({ image: file });
    } catch {
      toast.error("Failed to send image!");
    }
    e.target.value = "";
  };

  const handleRecordingComplete = async (file) => {
    try {
      await sendMessage({ audio: file });
      toast.success("Voice note sent!");
    } catch {
      toast.error("Failed to send voice note");
    }
    setShowRecorder(false);
  };

  const handleDeleteChat = async () => {
    if (window.confirm("Are you sure you want to delete this chat?")) {
      await deleteChat(selectedUser._id);
      setSelectedUser(null);
    }
  };

  const formatDuration = (duration) => {
    const mins = Math.floor(duration / 60);
    const secs = Math.floor(duration % 60);
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleSendDocument = async (e) => {
    const file = e.target.files[0];
    if (
      !file ||
      ![
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ].includes(file.type)
    ) {
      toast.error("Only PDF or DOC files allowed");
      return;
    }
    try {
      await sendMessage({ document: file });
    } catch {
      toast.error("Failed to send document");
    }
    e.target.value = "";
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
    <div className="h-full overflow-hidden relative bg-[radial-gradient(circle_at_10%_20%,#dbeafe_6%,transparent_0),radial-gradient(circle_at_90%_80%,#dbeafe_6%,transparent_0)] bg-[size:40px_40px] bg-blue-50">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 py-3 px-4 border-b border-gray-300 bg-white/80 backdrop-blur-sm">
        <div className="flex items-center gap-3">
          <img
            src={selectedUser.profilePic || assets.avatar_icon}
            alt="User avatar"
            className="w-8 h-8 rounded-full"
          />
          <div
            className="flex flex-col cursor-pointer"
            onClick={() => setShowProfile(!showProfile)}
          >
            <p className="text-lg text-black font-semibold">
              {selectedUser.fullName}
            </p>
            <span
              className={`text-xs font-medium ${
                onlineUsers.includes(selectedUser._id)
                  ? "text-green-500"
                  : "text-gray-500"
              }`}
            >
              {getUserStatus(selectedUser)}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-black">
          <Trash2
            size={18}
            onClick={handleDeleteChat}
            className="cursor-pointer hover:text-red-500"
            title="Delete Chat"
          />
          <X
            size={20}
            onClick={() => setSelectedUser(null)}
            className="cursor-pointer hover:text-red-500"
            title="Close Chat"
          />
        </div>
        {showProfile && (
          <div className="absolute top-14 left-4 bg-white text-black rounded-lg p-4 shadow-md z-50 w-60">
            <h3 className="font-bold text-lg mb-2 border-b border-gray-300 pb-1">
              User Info
            </h3>
            <div className="flex items-center gap-2 mb-2">
              <img
                src={selectedUser.profilePic || assets.avatar_icon}
                alt="User avatar"
                className="w-10 h-10 rounded-full"
              />
              <div>
                <p className="font-medium">{selectedUser.fullName}</p>
                <p className="text-sm text-gray-600">
                  {getUserStatus(selectedUser)}
                </p>
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
        {(() => {
          let lastDate = null; // track last message's date

          return messages.map((msg) => {
            const isSentByMe = msg.senderId === authUser._id;
            const hasContent =
              msg.text || msg.image || msg.audio || msg.document;
            if (!hasContent) return null;

            const msgDate = new Date(msg.createdAt).toDateString();
            const showDateSeparator = lastDate !== msgDate;
            lastDate = msgDate;

            return (
              <React.Fragment key={msg._id}>
                {/* Date separator */}
                {showDateSeparator && (
                  <div className="text-center my-4">
                    <span className="inline-block bg-gray-300 text-gray-800 text-xs px-3 py-1 rounded-full shadow-sm">
                      {getDayLabel(msg.createdAt)}
                    </span>
                  </div>
                )}

                {/* Your existing message item */}
                <div
                  className={`flex flex-col ${
                    isSentByMe ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] text-sm rounded-xl break-words shadow-md ${
                      msg.image || msg.audio
                        ? "bg-transparent p-0"
                        : isSentByMe
                        ? "bg-purple-500 text-white p-3"
                        : "bg-white text-black border border-gray-200 p-3"
                    }`}
                  >
                    {/* ... rest of your message rendering code ... */}
                    {msg.replyTo && (
                      <div
                        className={`text-xs px-2 py-1 mb-2 border-l-4 ${
                          isSentByMe ? "border-white" : "border-purple-500"
                        } bg-gray-100 rounded`}
                      >
                        <p className="font-semibold text-gray-700 mb-1">
                          {msg.replyTo.sender?.fullName || "Replied message"}
                        </p>
                        {msg.replyTo.text && (
                          <p className="text-gray-600 truncate">
                            {msg.replyTo.text}
                          </p>
                        )}
                        {msg.replyTo.image && (
                          <img
                            src={msg.replyTo.image}
                            alt="Reply image"
                            className="w-20 h-20 rounded"
                          />
                        )}
                      </div>
                    )}
                    {msg.forwardedFrom && (
                      <div
                        className={`text-xs px-2 py-1 mb-2 border-l-4 ${
                          isSentByMe ? "border-white" : "border-purple-500"
                        } bg-gray-100 rounded`}
                      >
                        <p className="font-semibold text-gray-700 mb-1">
                          Forwarded from:{" "}
                          {msg.forwardedFrom.senderId?.fullName || "Unknown"}
                        </p>

                        {msg.forwardedFrom.text && (
                          <p className="text-gray-600 truncate">
                            {msg.forwardedFrom.text}
                          </p>
                        )}

                        {msg.forwardedFrom.image && (
                          <img
                            src={msg.forwardedFrom.image}
                            alt="Forwarded image"
                            className="w-20 h-20 rounded mt-1"
                          />
                        )}
                      </div>
                    )}

                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="Chat image"
                        className="max-w-[250px] rounded-xl shadow"
                      />
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
                    {msg.document && (
                      <a
                        href={msg.document}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 text-sm text-white-600 underline"
                      >
                        {msg.documentName || "View Document"}
                      </a>
                    )}
                  </div>
                  <div className="text-xs mt-1 text-gray-500 flex items-center gap-1">
                    {formatMessageTime(msg.createdAt)}
                    {isSentByMe && (
                      <span
                        className={`ml-1 ${
                          msg.seen ? "text-purple-500" : "text-gray-400"
                        }`}
                        title={msg.seen ? "Seen" : "Delivered"}
                      >
                        ✔
                      </span>
                    )}
                  </div>

                  <button
                    className={`text-xs ${
                      isSentByMe ? "text-purple-600" : "text-blue-600"
                    } hover:underline mt-1 ml-1`}
                    onClick={() => setReplyToMessage(msg)}
                  >
                    Reply
                  </button>
                  <button
                    className={`text-xs ${
                      isSentByMe ? "text-purple-600" : "text-blue-600"
                    } hover:underline mt-1 ml-1`}
                    onClick={() => setForwardedMessage(msg)}
                  >
                    Forward
                  </button>
                </div>
              </React.Fragment>
            );
          });
        })()}
        <div ref={scrollEnd}></div>
      </div>

      {/* ✅ Reply Preview */}
      {replyToMessage && (
        <div className="absolute bottom-20 left-4 right-4 bg-purple-100 border-l-4 border-purple-500 p-3 rounded-md shadow flex justify-between items-start">
          <div className="text-sm">
            <p className="font-semibold text-purple-800">
              {replyToMessage.sender?.fullName || "Replied message"}
            </p>
            {replyToMessage.text && (
              <p className="text-gray-700">{replyToMessage.text}</p>
            )}
            {replyToMessage.image && (
              <img
                src={replyToMessage.image}
                alt="Reply preview"
                className="w-16 h-16 rounded mt-1"
              />
            )}
          </div>
          <X
            size={16}
            className="text-purple-700 cursor-pointer ml-3"
            onClick={() => setReplyToMessage(null)}
          />
        </div>
      )}
      {forwardedMessage && (
        <div className="absolute bottom-32 left-4 right-4 bg-white border border-blue-400 rounded-lg shadow-md p-3 flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-semibold text-blue-700 mb-1">
              Forwarding message from{" "}
              {forwardedMessage.sender?.fullName || "Unknown"}
            </p>
            {forwardedMessage.text && (
              <p className="text-gray-800 text-sm">{forwardedMessage.text}</p>
            )}
            {forwardedMessage.image && (
              <img
                src={forwardedMessage.image}
                alt="Forward preview"
                className="w-20 h-20 rounded mt-2 object-cover"
              />
            )}
          </div>
          <X
            size={18}
            className="text-blue-600 hover:text-red-500 cursor-pointer ml-3"
            onClick={() => setForwardedMessage(null)}
          />
        </div>
      )}

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
          <input
            type="file"
            id="image"
            onChange={handleSendImage}
            accept="image/*"
            hidden
          />
          <label htmlFor="image">
            <Image className="w-5 h-5 mr-3 cursor-pointer text-black" />
          </label>
          <Mic
            className="w-5 h-5 mr-2 cursor-pointer text-black"
            onClick={() => setShowRecorder(!showRecorder)}
          />
        </div>
        <input
          type="file"
          id="document"
          accept=".pdf,.doc,.docx"
          hidden
          onChange={handleSendDocument}
        />
        <label htmlFor="document">
          <FileText
            className="w-5 h-5 mr-2 cursor-pointer text-black hover:text-blue-600"
            title="Attach Document"
          />
        </label>

        <img
          src={assets.send_button}
          alt="Send"
          className="w-7 cursor-pointer"
          onClick={handleSendMessage}
        />
      </div>

      {/* Voice Recorder */}
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
