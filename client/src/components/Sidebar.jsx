import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChatContext } from "../../context/ChatContext.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import CreateGroupModal from "../components/CreateGroupModal.jsx";
import assets from "../assets/assets";

const Sidebar = () => {
  const {
    getUsers,
    getGroups,
    users,
    groups,
    selectedUser,
    selectedGroup,
    setSelectedUser,
    setSelectedGroup,
    unseenMessages,
  } = useContext(ChatContext);

  const { logout, onlineUsers } = useContext(AuthContext);
  const [input, setInput] = useState("");
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const navigate = useNavigate();

  const filteredUsers = input
    ? users.filter((user) =>
        user.fullName.toLowerCase().includes(input.toLowerCase())
      )
    : users;

  const filteredGroups = input
    ? groups.filter((group) =>
        group.name.toLowerCase().includes(input.toLowerCase())
      )
    : groups;

  useEffect(() => {
    getUsers();
    getGroups();
  }, [onlineUsers]);

  const handleUserClick = (user) => {
    setSelectedUser(user);
    setSelectedGroup(null);
  };

  const handleGroupClick = (group) => {
    setSelectedGroup(group);
    setSelectedUser(null);
  };

  return (
    <div
      className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-auto text-white ${
        selectedUser || selectedGroup ? "max-md:hidden" : ""
      }`}
    >
      {/* Header */}
      <div className="pb-5">
        <div className="flex justify-between items-center">
          <img src={assets.logo} alt="Logo" className="max-w-36" />
          <div className="relative py-2 group">
            <img
              src={assets.menu_icon}
              alt="Menu"
              className="max-h-5 cursor-pointer"
            />
            <div className="absolute top-full right-0 z-20 w-36 p-4 rounded-md bg-[#282142] border border-gray-600 text-sm text-white hidden group-hover:block">
              <p
                onClick={() => navigate("/profile")}
                className="cursor-pointer hover:text-purple-400"
              >
                Edit Profile
              </p>
              <hr className="my-2 border-t border-gray-500" />
              <p onClick={logout} className="cursor-pointer hover:text-red-400">
                LogOut
              </p>
            </div>
          </div>
        </div>

        {/* Search Box */}
        <div className="bg-[#282142] rounded-full flex items-center gap-2 py-2.5 px-4 mt-5">
          <img src={assets.search_icon} alt="Search" className="w-4" />
          <input
            onChange={(e) => setInput(e.target.value)}
            value={input}
            type="text"
            placeholder="Search users or groups..."
            className="bg-transparent border-none outline-none text-sm text-white placeholder:text-gray-300 flex-1"
          />
        </div>
      </div>

      {/* Users */}
      <div className="mt-4">
        <h3 className="text-sm text-gray-400 mb-2">Users</h3>
        <div className="flex flex-col gap-1">
          {filteredUsers.map((user) => (
            <div
              key={user._id}
              onClick={() => handleUserClick(user)}
              className={`relative flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-200 min-h-[60px] ${
                selectedUser?._id === user._id
                  ? "bg-[#282142]/70"
                  : "hover:bg-[#282142]/30"
              }`}
            >
              <img
                src={user?.profilePic || assets.avatar_icon}
                alt="Profile"
                className="w-[35px] h-[35px] object-cover rounded-full"
              />
              <div className="flex flex-col leading-5">
                <p className="text-sm font-medium">{user?.fullName}</p>
                <span
                  className={`text-xs ${
                    onlineUsers.includes(user._id)
                      ? "text-green-400"
                      : "text-gray-400"
                  }`}
                >
                  {onlineUsers.includes(user._id) ? "Online" : "Offline"}
                </span>
              </div>

              {/* Notification Badge */}
              {unseenMessages[user._id] > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full bg-violet-600 text-white text-[10px] font-bold shadow-md">
                  {unseenMessages[user._id]}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Groups */}
      <div className="mt-6">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm text-gray-400">Groups</h3>
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="text-purple-500 text-sm font-semibold hover:underline"
          >
            + Create Group
          </button>
        </div>
        <div className="flex flex-col gap-1">
          {filteredGroups.map((group) => (
            <div
              key={group._id}
              onClick={() => handleGroupClick(group)}
              className={`relative flex items-center gap-3 px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-200 min-h-[60px] ${
                selectedGroup?._id === group._id
                  ? "bg-[#282142]/70"
                  : "hover:bg-[#282142]/30"
              }`}
            >
              <img
                src={assets.group_icon || assets.avatar_icon}
                alt="Group icon"
                className="w-[35px] h-[35px] object-cover rounded-full"
              />
              <div className="flex flex-col leading-5">
                <p className="text-sm font-medium">{group?.name}</p>
                <span className="text-xs text-gray-400">
                  {group?.members?.length || 0} members
                </span>
              </div>

              {/* Notification Badge */}
              {unseenMessages[group._id] > 0 && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 flex items-center justify-center rounded-full bg-violet-600 text-white text-[10px] font-bold shadow-md">
                  {unseenMessages[group._id]}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Create Group Modal */}
      {showCreateGroupModal && (
        <CreateGroupModal onClose={() => setShowCreateGroupModal(false)} />
      )}
    </div>
  );
};

export default Sidebar;
