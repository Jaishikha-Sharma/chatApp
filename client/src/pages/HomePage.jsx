import React, { useContext } from "react";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import GroupChatContainer from "../components/GroupChatContainer";
import { ChatContext } from "../../context/ChatContext";

const HomePage = () => {
  const { selectedUser, selectedGroup } = useContext(ChatContext);

  return (
    <div className="w-full h-screen">
      <div className="backdrop-blur-xl border-2 border-gray-600 overflow-hidden h-full grid grid-cols-1 md:grid-cols-[1fr_2fr]">
        <Sidebar />

        {/* Show ChatContainer if user selected, GroupChatContainer if group selected */}
        {selectedUser ? (
          <ChatContainer />
        ) : selectedGroup ? (
          <GroupChatContainer />
        ) : (
          <div className="flex flex-col items-center justify-center text-center p-6 space-y-3 animate-fade-in h-full">
            <div className="text-3xl md:text-5xl animate-bounce">💬</div>
            <p className="text-sm md:text-base text-gray-500">
              Select a <span className="text-blue-400 font-medium">user</span> or a{" "}
              <span className="text-green-400 font-medium">group</span> to start chatting.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;
