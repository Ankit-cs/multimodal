// src/pages/Dashboard.jsx
// Now a thin layout wrapper — all chat/workflow state comes from ChatContext.
import React from 'react';
import Chat from '../components/Chat';
import Active from '../components/Active';
import CommandLine from '../components/CommandLine';
import { useChatContext } from '../context/ChatContext';

const Dashboard = () => {
  const {
    activeStep,
    workflowStatus,
    liveLogs,
    chatMessages,
    handleChatSend,
  } = useChatContext();

  return (
    <div className="w-full max-w-[1200px] mx-auto flex flex-col gap-10 p-4 md:p-8">

            {/* Top section: Nexus Chat */}
            <div className="flex flex-col min-h-[500px] max-h-[800px]">
              <Chat
                messages={chatMessages}
                onSend={handleChatSend}
                status={workflowStatus}
              />
            </div>

            {/* Middle section: Active Nexus (Graph) */}
            <div className="w-full">
              <Active activeStep={activeStep} />
            </div>

            {/* Bottom section: Log Terminal and Task Breakdown */}
            <div className="w-full mb-8">
              <CommandLine activeStep={activeStep} logs={liveLogs} />
            </div>

    </div>
  );
};

export default Dashboard;