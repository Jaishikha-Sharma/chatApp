import React, { useState, useEffect, useContext } from "react";
import { ChatContext } from "../../context/ChatContext";
import { AuthContext } from "../../context/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";

const CreateGroupModal = ({ onClose }) => {
  const { getGroups } = useContext(ChatContext);
  const { authUser } = useContext(AuthContext);

  const [groupName, setGroupName] = useState("");
  const [users, setUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await axios.get("/api/messages/users");
        setUsers(res.data.users.filter((u) => u._id !== authUser._id));
      } catch (err) {
        toast.error("Failed to load users");
      }
    };

    fetchUsers();
  }, [authUser]);

  const handleCheckbox = (id) => {
    setSelectedUsers((prev) =>
      prev.includes(id) ? prev.filter((uid) => uid !== id) : [...prev, id]
    );
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!groupName || selectedUsers.length < 2) {
    return toast.error("Group name & 2+ members required");
  }
  try {
    await axios.post("/api/groups/create", {
      name: groupName,
      members: [...selectedUsers, authUser._id],
    });
    toast.success("Group created");
    getGroups(); // Refresh group list
    onClose();
  } catch (err) {
    toast.error("Error creating group");
  }
};


  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center">
      <div className="bg-[#1e1b32] p-6 rounded-xl w-96 max-h-[90vh] overflow-y-auto text-white">
        <h2 className="text-xl font-bold mb-4">Create New Group</h2>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <input
            type="text"
            placeholder="Group Name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="bg-[#282142] px-3 py-2 rounded outline-none"
          />
          <div className="max-h-40 overflow-y-auto space-y-2">
            {users.map((user) => (
              <label key={user._id} className="flex items-center gap-2">
                <input
                  type="checkbox"
                  onChange={() => handleCheckbox(user._id)}
                  checked={selectedUsers.includes(user._id)}
                />
                {user.fullName}
              </label>
            ))}
          </div>
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 transition py-2 rounded"
          >
            Create Group
          </button>
          <button
            type="button"
            onClick={onClose}
            className="text-sm mt-2 text-gray-400"
          >
            Cancel
          </button>
        </form>
      </div>
    </div>
  );
};

export default CreateGroupModal;
