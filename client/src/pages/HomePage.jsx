import React, { useContext } from "react";
import Sidebar from "../components/Sidebar";
import ChatContainer from "../components/ChatContainer";
import { ChatContext } from "../../context/ChatContext";

const HomePage = () => {
  const { selectedUser } = useContext(ChatContext);

  return (
    <div className="border w-full h-screen">
      <div
        className={`backdrop-blur-xl border-2 border-gray-600 rounded-2xl overflow-hidden h-full grid grid-cols-1 relative ${
          selectedUser ? "md:grid-cols-[1fr_2fr]" : "md:grid-cols-[1fr_2fr]" // Can be same or just 1 column if nothing is selected
        }`}
      >
        <Sidebar />
        <ChatContainer />
      </div>
    </div>
  );
};

export default HomePage;
