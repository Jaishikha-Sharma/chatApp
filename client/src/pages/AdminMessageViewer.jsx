import React, { useEffect, useState } from "react";
import axios from "axios";
import { Loader } from "lucide-react";

const AdminMessageViewer = () => {
  const [users, setUsers] = useState([]);
  const [user1, setUser1] = useState("");
  const [user2, setUser2] = useState("");
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await axios.get("/api/messages/users");
        if (data.success) {
          setUsers(data.users);
          setError("");
        } else {
          setError(data.message || "Failed to load users.");
        }
      } catch (err) {
        setError("Failed to fetch users. " + err.message);
      }
    };
    fetchUsers();
  }, []);

  const viewMessages = async () => {
    if (!user1 || !user2 || user1 === user2) {
      setError("Please select two different users.");
      setMessages([]);
      return;
    }
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/messages/admin/${user1}/${user2}`);
      if (data.success) {
        setMessages(data.messages);
      } else {
        setMessages([]);
        setError(data.message || "Failed to load messages.");
      }
    } catch (err) {
      setError("Error fetching messages: " + err.message);
      setMessages([]);
    } finally {
      setLoading(false);
    }
  };

  // Helper to check if current message sender is user1 or user2, for styling
  const isSenderUser1 = (msg) => msg.senderId._id === user1;

  return (
    <div className="p-6 max-w-4xl mx-auto bg-gray-50 rounded-lg shadow-md">
      <h2 className="text-3xl font-bold mb-6 text-center">Admin Chat Viewer</h2>

      <div className="flex flex-col sm:flex-row gap-4 mb-6 justify-center">
        <select
          value={user1}
          onChange={(e) => setUser1(e.target.value)}
          className="p-3 border rounded w-full sm:w-1/3"
        >
          <option value="">Select User 1</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.fullName} ({user.role})
            </option>
          ))}
        </select>

        <select
          value={user2}
          onChange={(e) => setUser2(e.target.value)}
          className="p-3 border rounded w-full sm:w-1/3"
        >
          <option value="">Select User 2</option>
          {users.map((user) => (
            <option key={user._id} value={user._id}>
              {user.fullName} ({user.role})
            </option>
          ))}
        </select>

        <button
          onClick={viewMessages}
          className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 w-full sm:w-auto"
        >
          View Chat
        </button>
      </div>

      {error && (
        <p className="text-center text-red-600 mb-4 font-medium">{error}</p>
      )}

      {loading ? (
        <div className="flex justify-center py-6">
          <Loader className="animate-spin text-blue-600" size={48} />
        </div>
      ) : (
        <div className="max-h-[600px] overflow-y-auto p-4 bg-white rounded shadow">
          {messages.length === 0 ? (
            <p className="text-center text-gray-500">No messages found.</p>
          ) : (
            <div className="flex flex-col gap-4">
              {messages.map((msg) => {
                const senderIsUser1 = isSenderUser1(msg);
                return (
                  <div
                    key={msg._id}
                    className={`max-w-[70%] p-4 rounded-lg shadow-sm
                      ${
                        senderIsUser1
                          ? "self-start bg-blue-100 text-blue-900"
                          : "self-end bg-green-100 text-green-900"
                      }
                    `}
                  >
                    <p className="font-semibold mb-1 text-sm">
                      {msg.senderId.fullName} → {msg.receiverId.fullName}
                    </p>
                    {msg.text && (
                      <p className="whitespace-pre-wrap text-base">{msg.text}</p>
                    )}
                    {msg.image && (
                      <img
                        src={msg.image}
                        alt="attached"
                        className="w-40 mt-3 rounded border border-gray-300"
                      />
                    )}
                    {msg.audio && (
                      <audio controls className="mt-3 w-full max-w-xs rounded">
                        <source src={msg.audio} type="audio/mp4" />
                        Your browser does not support the audio element.
                      </audio>
                    )}
                    {msg.document && (
                      <a
                        href={msg.document}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 underline block mt-3 font-medium"
                      >
                        📎 {msg.documentName || "Document"}
                      </a>
                    )}
                    <p className="text-gray-400 text-xs mt-2 text-right italic">
                      {new Date(msg.createdAt).toLocaleString()}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminMessageViewer;
