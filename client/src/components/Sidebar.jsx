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
    const isOnline =
      type === "user" && onlineUsers.map(String).includes(String(item._id));

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
        className={`relative flex items-center justify-between px-4 py-2 rounded-xl cursor-pointer transition-all duration-200 ${
          isSelected
            ? "bg-white/25 border border-white/40 shadow-md"
            : "hover:bg-white/10"
        }`}
      >
        <div className="flex items-center gap-3">
          <img
            src={image || assets.avatar_icon}
            alt="icon"
            className="w-[40px] h-[40px] object-cover rounded-full border border-white/40 shadow-sm"
          />
          <div className="flex flex-col leading-5 text-white">
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold">{name}</p>
              {isPinned(item._id) && (
                <Pin className="w-4 h-4 text-yellow-300" />
              )}
            </div>
            <span
              className={`text-[13px] ${
                isOnline ? "text-green-300" : "text-white/70"
              }`}
            >
              {type === "user"
                ? isOnline
                  ? "Online"
                  : "Offline"
                : `${memberCount || 0} members`}
            </span>
          </div>
        </div>

        {unseenMessages[item._id] > 0 && (
          <div className="min-h-[24px] min-w-[24px] px-[6px] flex items-center justify-center rounded-full bg-white text-[#ad46ff] text-xs font-extrabold shadow-lg border-2 border-[#ad46ff]">
            {unseenMessages[item._id]}
          </div>
        )}
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
      className={`h-full p-5 rounded-r-xl overflow-y-auto text-white shadow-xl ${
        selectedUser || selectedGroup ? "max-md:hidden" : ""
      }`}
      style={{ backgroundColor: "oklch(0.48 0.13 255.73)" }}
    >
      {/* Header */}
      <div className="pb-5">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-wide">ChatVerse</h1>
          <div className="relative py-2 group">
            <img
              src={assets.menu_icon}
              alt="Menu"
              className="max-h-5 cursor-pointer"
            />
            <div className="absolute top-full right-0 z-20 w-40 p-3 rounded-lg bg-white text-[black] text-sm hidden group-hover:block space-y-2 shadow-lg">
              <div
                onClick={() => navigate("/profile")}
                className="cursor-pointer hover:text-purple-600 flex items-center gap-2"
              >
                <Pencil className="w-4 h-4" />
                Edit Profile
              </div>
              <div
                onClick={handlePinToggle}
                className="cursor-pointer flex items-center gap-2"
              >
                <Pin className="w-4 h-4" />
                {selectedUser || selectedGroup
                  ? isPinned(selectedUser?._id || selectedGroup?._id)
                    ? "Unpin Chat"
                    : "Pin Chat"
                  : "Pin Chat"}
              </div>
              <hr className="border-gray-200" />
              <div
                onClick={logout}
                className="cursor-pointer hover:text-red-600 flex items-center gap-2"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        <div className="bg-white/30 rounded-full flex items-center gap-2 px-4 py-2 mt-5 shadow-inner">
          <img src={assets.search_icon} className="w-4" />
          <input
            className="flex-1 text-sm bg-transparent outline-none text-white placeholder:text-white/80"
            placeholder="Search users or groups..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>
      </div>

      {/* Users */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-2">
          <h3 className="text-sm font-semibold">Users</h3>
        </div>
        <div className="h-[1px] bg-white/30 mb-3" />
        <div className="flex flex-col gap-2">
          {filteredUsers.map((user) => renderChatItem(user, "user"))}
        </div>
      </div>

      {/* Groups */}
      <div className="mt-8">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-sm font-semibold">Groups</h3>
          <button
            onClick={() => setShowCreateGroupModal(true)}
            className="bg-white text-[black] text-sm font-semibold px-3 py-1 rounded-full shadow hover:bg-gray-100 transition"
          >
            + Create Group
          </button>
        </div>
        <div className="h-[1px] bg-white/30 mb-3" />
        <div className="flex flex-col gap-2">
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
