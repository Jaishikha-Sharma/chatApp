import React, { useContext } from "react";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import GroupChatContainer from "../components/GroupChatContainer";
import { ChatContext } from "../../context/ChatContext";

const HomePage = () => {
  const { selectedUser, selectedGroup } = useContext(ChatContext);

  return (
    <div className="border w-full h-screen">
      <div
        className={`backdrop-blur-xl border-2 border-gray-600  overflow-hidden h-full grid grid-cols-1 relative md:grid-cols-[1fr_2fr]`}
      >
        <Sidebar />

        {/* Show ChatContainer if user selected, GroupChatContainer if group selected */}
        {selectedUser ? (
          <ChatContainer />
        ) : selectedGroup ? (
          <GroupChatContainer />
        ) : (
          <div className="flex items-center justify-center text-gray-400 text-xl">
            Select a user or group to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
