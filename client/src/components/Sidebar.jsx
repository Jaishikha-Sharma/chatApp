import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChatContext } from "../../context/ChatContext.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import CreateGroupModal from "../components/CreateGroupModal.jsx";
import assets from "../assets/assets";
import { LogOut, Pencil, Pin } from "lucide-react";

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
    pinnedChats,
    togglePinChat,
  } = useContext(ChatContext);

  const { logout, onlineUsers } = useContext(AuthContext);
  const [input, setInput] = useState("");
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    getUsers();
    getGroups();
  }, [onlineUsers]);

  const isPinned = (id) => pinnedChats.includes(id);

  const handlePinToggle = () => {
    const currentChat = selectedUser?._id || selectedGroup?._id;
    if (currentChat) {
      togglePinChat(currentChat);
    }
  };

  const renderChatItem = (item, type = "user") => {
    const isSelected =
      type === "user"
        ? selectedUser?._id === item._id
        : selectedGroup?._id === item._id;

    const name = type === "user" ? item.fullName : item.name;
    const image = type === "user" ? item.profilePic : assets.group_icon;
    const memberCount = item?.members?.length;

    return (
      <div
        key={item._id}
        onClick={() => {
          if (type === "user") {
            setSelectedUser(item);
            setSelectedGroup(null);
          } else {
            setSelectedGroup(item);
            setSelectedUser(null);
          }
        }}
        className={`relative flex items-center justify-between px-4 py-2.5 rounded-lg cursor-pointer transition-all duration-200 min-h-[60px] ${
          isSelected ? "bg-[#282142]/70" : "hover:bg-[#282142]/30"
        }`}
      >
        <div className="flex items-center gap-3">
          <img
            src={image || assets.avatar_icon}
            alt="icon"
            className="w-[35px] h-[35px] object-cover rounded-full"
          />
          <div className="flex flex-col leading-5">
            <p className="text-sm font-medium">{name}</p>
            <span className="text-xs text-gray-400">
              {type === "user"
                ? onlineUsers.includes(item._id)
                  ? "Online"
                  : "Offline"
                : `${memberCount || 0} members`}
            </span>
          </div>
        </div>

        {/* Right Side Icons */}
        <div className="flex items-center gap-2">
          {isPinned(item._id) && (
            <Pin className="w-4 h-4 text-red-400 shrink-0" />
          )}
          {unseenMessages[item._id] > 0 && (
            <div className="h-5 w-5 flex items-center justify-center rounded-full bg-violet-600 text-white text-[10px] font-bold shadow-md">
              {unseenMessages[item._id]}
            </div>
          )}
        </div>
      </div>
    );
  };

  const sortedUsers = [...users].sort(
    (a, b) => isPinned(b._id) - isPinned(a._id)
  );

  const sortedGroups = [...groups].sort(
    (a, b) => isPinned(b._id) - isPinned(a._id)
  );

  const filteredUsers = input
    ? sortedUsers.filter((user) =>
        user.fullName.toLowerCase().includes(input.toLowerCase())
      )
    : sortedUsers;

  const filteredGroups = input
    ? sortedGroups.filter((group) =>
        group.name.toLowerCase().includes(input.toLowerCase())
      )
    : sortedGroups;

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
            <div className="absolute top-full right-0 z-20 w-40 p-3 rounded-md bg-[#282142] border border-gray-600 text-sm text-white hidden group-hover:block space-y-2">
              <div
                onClick={() => navigate("/profile")}
                className="cursor-pointer hover:text-purple-400 flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                Edit Profile
              </div>
              <div
                onClick={handlePinToggle}
                className="cursor-pointer hover:text-yellow-400 flex items-center gap-2"
              >
                <Pin className="w-4 h-4" />
                {selectedUser || selectedGroup
                  ? isPinned(selectedUser?._id || selectedGroup?._id)
                    ? "Unpin Chat"
                    : "Pin Chat"
                  : "Pin Chat"}
              </div>
              <hr className="border-gray-500" />
              <div
                onClick={logout}
                className="cursor-pointer hover:text-red-400 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
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
          {filteredUsers.map((user) => renderChatItem(user, "user"))}
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
          {filteredGroups.map((group) => renderChatItem(group, "group"))}
        </div>
      </div>

      {showCreateGroupModal && (
        <CreateGroupModal onClose={() => setShowCreateGroupModal(false)} />
      )}
    </div>
  );
};

export default Sidebar;
