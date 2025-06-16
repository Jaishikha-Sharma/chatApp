
import React, { useContext, useEffect, useRef, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { ChatContext } from "../../context/ChatContext.jsx";
import { AuthContext } from "../../context/AuthContext.jsx";
import CreateGroupModal from "../components/CreateGroupModal.jsx";
import assets from "../assets/assets";
import { LogOut, Pencil, Pin, ChevronDown, ChevronRight } from "lucide-react";

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

  const { logout, onlineUsers, authUser } = useContext(AuthContext);
  const [input, setInput] = useState("");
  const [activeFilter, setActiveFilter] = useState("All");
  const [showCreateGroupModal, setShowCreateGroupModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showGroups, setShowGroups] = useState(true);
  const menuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    getUsers();
    getGroups();
  }, [onlineUsers]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

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
        className={`relative flex items-center justify-between px-4 py-2 cursor-pointer transition-all duration-200 border-b ${
          isSelected
            ? "bg-white/25 border-white/40 shadow-md"
            : "hover:bg-white/10 border-white/20"
        }`}
      >
        <div className="flex items-center gap-3">
          <img
            src={image || assets.avatar_icon}
            alt="icon"
            className="w-[40px] h-[40px] object-cover rounded-full border border-white/40 shadow-sm"
          />
          <div className="flex flex-col leading-5 text-white w-full">
            <div className="flex items-center gap-2">
              <p className="text-base font-semibold">{name}</p>
              {isPinned(item._id) && (
                <Pin className="w-4 h-4 text-yellow-300 hidden md:block" />
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

        <div className="md:hidden ml-2">
          <Pin
            onClick={(e) => {
              e.stopPropagation();
              togglePinChat(item._id);
            }}
            className={`w-4 h-4 transition-transform cursor-pointer ${
              isPinned(item._id) ? "text-yellow-300" : "text-white/30"
            } hover:scale-110`}
          />
        </div>
      </div>
    );
  };

  const sortedUsers = [...users]
    .sort((a, b) => (unseenMessages[b._id] || 0) - (unseenMessages[a._id] || 0)) // new msgs top
    .sort((a, b) => isPinned(b._id) - isPinned(a._id)); // pinned top

  const sortedGroups = [...groups]
    .sort((a, b) => (unseenMessages[b._id] || 0) - (unseenMessages[a._id] || 0))
    .sort((a, b) => isPinned(b._id) - isPinned(a._id));

  let filteredUsers = sortedUsers;

  if (input) {
    filteredUsers = filteredUsers.filter((user) =>
      user.fullName.toLowerCase().includes(input.toLowerCase())
    );
  }

  if (activeFilter === "Online") {
    filteredUsers = filteredUsers.filter((user) =>
      onlineUsers.map(String).includes(String(user._id))
    );
  }

  if (activeFilter === "Unread") {
    filteredUsers = filteredUsers.filter(
      (user) => unseenMessages[user._id] > 0
    );
  }

  const filteredGroups = input
    ? sortedGroups.filter((group) =>
        group.name.toLowerCase().includes(input.toLowerCase())
      )
    : sortedGroups;

  return (
    <div
      className={`h-full p-5 overflow-hidden text-white shadow-xl ${
        selectedUser || selectedGroup ? "max-md:hidden" : ""
      }`}
      style={{ backgroundColor: "oklch(0.48 0.13 255.73)" }}
    >
      {/* Header */}
      <div className="pb-5">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold tracking-wide">ChatVerse</h1>
          <div className="relative py-2" ref={menuRef}>
            <img
              src={assets.menu_icon}
              alt="Menu"
              className="max-h-5 cursor-pointer"
              onClick={() => setShowMenu((prev) => !prev)}
            />
            <div
              className={`absolute top-full right-0 z-20 w-44 p-3 rounded-xl bg-white text-black text-sm space-y-2 shadow-xl transition-all duration-200 ${
                showMenu
                  ? "opacity-100 scale-100"
                  : "opacity-0 scale-95 pointer-events-none"
              }`}
            >
              <div
                onClick={() => {
                  navigate("/profile");
                  setShowMenu(false);
                }}
                className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-md transition-all duration-200 hover:bg-purple-100 hover:text-purple-600 hover:scale-[1.02]"
              >
                <Pencil className="w-4 h-4" />
                Edit Profile
              </div>
              <div
                onClick={() => {
                  handlePinToggle();
                  setShowMenu(false);
                }}
                className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-md transition-all duration-200 hover:bg-purple-100 hover:text-purple-600 hover:scale-[1.02]"
              >
                <Pin className="w-4 h-4" />
                {selectedUser || selectedGroup
                  ? isPinned(selectedUser?._id || selectedGroup?._id)
                    ? "Unpin Chat"
                    : "Pin Chat"
                  : "Pin Chat"}
              </div>
              <hr className="border-gray-200 my-1" />
              <div
                onClick={() => {
                  logout();
                  setShowMenu(false);
                }}
                className="cursor-pointer flex items-center gap-2 px-2 py-2 rounded-md transition-all duration-200 hover:bg-red-100 hover:text-red-600 hover:scale-[1.02]"
              >
                <LogOut className="w-4 h-4" />
                Log Out
              </div>
            </div>
          </div>
        </div>

        {authUser?.role === "Admin" && (
          <Link
            to="/approve-chat"
            className="block text-center text-sm font-semibold bg-purple-200 hover:bg-purple-300 text-purple-800 py-2 px-4 rounded-full transition-all duration-200 mb-4"
          >
            🛡 Approve Chats
          </Link>
        )}

        {/* Search Input */}
        <div className="bg-white/30 rounded-full flex items-center gap-2 px-4 py-2 mt-1 shadow-inner">
          <img src={assets.search_icon} className="w-4" />
          <input
            className="flex-1 text-sm bg-transparent outline-none text-white placeholder:text-white/80"
            placeholder="Search users or groups..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
          />
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-3 mt-3">
          {["All", "Online", "Unread"].map((filter) => (
            <button
              key={filter}
              onClick={() => setActiveFilter(filter)}
              className={`text-sm font-medium px-3 py-1 rounded-full shadow transition-all duration-200 ${
                activeFilter === filter
                  ? "bg-white text-purple-600"
                  : "bg-white/80 text-gray-700 hover:bg-white"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>

      {/* Groups Toggle Section */}
      <div className="mt-1 mb-4">
        <div
          onClick={() => setShowGroups(!showGroups)}
          className="flex justify-between items-center cursor-pointer px-1 py-2 text-sm font-semibold"
        >
          <span>Groups</span>
          {showGroups ? (
            <ChevronDown className="w-4 h-4" />
          ) : (
            <ChevronRight className="w-4 h-4" />
          )}
        </div>
        {showGroups && (
          <>
            <div className="flex justify-end mb-2">
              <button
                onClick={() => setShowCreateGroupModal(true)}
                className="bg-white text-black text-xs font-medium px-3 py-1 rounded-full shadow hover:bg-gray-100"
              >
                + Create Group
              </button>
            </div>
            <div className="flex flex-col">
              {filteredGroups.map((group) => renderChatItem(group, "group"))}
            </div>
          </>
        )}
      </div>

      {/* Scrollable User List */}
      <div
        className="overflow-y-auto pr-1 custom-scrollbar"
        style={{ maxHeight: "calc(100vh - 370px)" }}
      >
        <div className="mb-2 text-sm font-semibold">Users</div>
        <div className="h-[1px] bg-white/30 mb-3" />
        {filteredUsers.map((user) => renderChatItem(user, "user"))}
      </div>

      {showCreateGroupModal && (
        <CreateGroupModal onClose={() => setShowCreateGroupModal(false)} />
      )}
    </div>
  );
};

export default Sidebar;