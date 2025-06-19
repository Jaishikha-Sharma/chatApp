import { useContext, useEffect, useState } from "react";
import { AuthContext } from "../../context/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";

const ApproveChat = () => {
  const { authUser } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [user1, setUser1] = useState("");
  const [user2, setUser2] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("/api/auth/all");
        setUsers(res.data.users);
      } catch (err) {
        console.error("❌ Error fetching users:", err.response?.data?.message || err.message);
      }
    };

    if (authUser?.role === "Admin") {
      fetchUsers();
    }
  }, [authUser]);

  const handleApprove = async () => {
    if (!user1 || !user2) return alert("❗ Please select both users");

    try {
      const res = await axios.post("/api/auth/approve-chat", {
        userIdToApprove: user1,
        targetUserId: user2,
      });

      if (res.data.success) {
        alert("✅ Chat approved successfully!");
      } else {
        alert("❌ Approval failed: " + res.data.message);
      }
    } catch (err) {
      alert("⚠️ Server error: " + err.response?.data?.message || err.message);
    }
  };

  if (!authUser || authUser.role !== "Admin") {
    return <p className="p-4 text-red-500">⛔ Only Admin can approve chats.</p>;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center px-4">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        <h2 className="text-2xl font-bold text-center text-blue-800 mb-6">
          Approve Chat Between Users
        </h2>

        <div className="space-y-4">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Select User 1</label>
            <select
              className="w-full p-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              value={user1}
              onChange={(e) => setUser1(e.target.value)}
            >
              <option value="">Select User</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.fullName} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block mb-1 font-medium text-gray-700">Select User 2</label>
            <select
              className="w-full p-2 border border-blue-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
              value={user2}
              onChange={(e) => setUser2(e.target.value)}
            >
              <option value="">Select User</option>
              {users.map((u) => (
                <option key={u._id} value={u._id}>
                  {u.fullName} ({u.role})
                </option>
              ))}
            </select>
          </div>

          <button
            className="w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded-lg font-semibold transition duration-200"
            onClick={handleApprove}
          >
            Approve Chat
          </button>
        </div>
      </div>
    </div>
  );
};

export default ApproveChat;
