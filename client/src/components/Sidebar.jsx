import React, { useContext, useEffect, useState } from "react";
import assets from "../assets/assets";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext.jsx";
import { ChatContext } from "../../context/ChatContext.jsx"; // ✅ Fix case

const Sidebar = () => {
  const {
    getUsers,
    users,
    selectedUser,
    setSelectedUser,
    unseenMessages,
    setUnseenMessages,
  } = useContext(ChatContext); // ✅ Fix case (was `chatContext`)

  const { logout, onlineUsers } = useContext(AuthContext);
  const [input, setInput] = useState("");

  const navigate = useNavigate();

  // ✅ Fixed typo: toLowerCase() and includes()
  const filteredUsers = input
    ? users.filter((user) =>
        user.fullName.toLowerCase().includes(input.toLowerCase())
      )
    : users;

  useEffect(() => {
    getUsers();
  }, [onlineUsers]);

  return (
    <div
      className={`bg-[#8185B2]/10 h-full p-5 rounded-r-xl overflow-y-auto text-white ${
        selectedUser ? "max-md:hidden" : ""
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
            placeholder="Search User..."
            className="bg-transparent border-none outline-none text-sm text-white placeholder:text-gray-300 flex-1"
          />
        </div>
      </div>

      {/* User List */}
      <div className="flex flex-col gap-1">
        {filteredUsers.map((user, index) => (
          <div
            onClick={() => {
              setSelectedUser(user);
              setUnseenMessages((prev) => ({ ...prev, [user._id]: 0 }));
            }}
            key={user._id}
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
  );
};

export default Sidebar;
