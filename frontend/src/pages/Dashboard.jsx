// src/pages/Dashboard.jsx
// Now a thin layout wrapper — all chat/workflow state comes from ChatContext.
import React, { useState } from 'react';
import Chat from '../components/Chat';
import Active from '../components/Active';
import CommandLine from '../components/CommandLine';
import { useChatContext } from '../context/ChatContext';
import { Brain } from 'lucide-react';

const Dashboard = () => {
  const [activeTab, setActiveTab] = useState('flow');
  const {
    activeStep,
    workflowStatus,
    liveLogs,
    chatMessages,
    handleChatSend,
    currentSessionId,
  } = useChatContext();

  const baseUrl = import.meta.env.VITE_API_URL || 
    (window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://nexusai-backend-hxwu.onrender.com');

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

            {/* Middle section: Active Workspace Tab Controller */}
            <div className="flex flex-col gap-4">
              <div className="flex justify-between items-center px-2">
                <div className="flex items-center gap-2">
                  <Brain size={18} className="text-indigo-600" />
                  <span className="text-sm font-bold text-slate-700 uppercase tracking-wider">Active Workspace</span>
                </div>
                <div className="flex bg-slate-200/60 p-1 rounded-xl">
                  <button 
                    onClick={() => setActiveTab('flow')} 
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${activeTab === 'flow' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    Swarm Flow
                  </button>
                  <button 
                    onClick={() => setActiveTab('memory')} 
                    disabled={!currentSessionId}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 ${!currentSessionId ? 'opacity-40 cursor-not-allowed text-slate-400' : activeTab === 'memory' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}
                  >
                    3D Memory Graph
                  </button>
                </div>
              </div>

              {activeTab === 'flow' ? (
                <div className="w-full">
                  <Active activeStep={activeStep} />
                </div>
              ) : (
                <div className="w-full min-h-[500px] border border-slate-200 rounded-2xl overflow-hidden bg-slate-950 shadow-md">
                  <iframe 
                    src={`${baseUrl}/api/workflow/${currentSessionId}/visualize`}
                    title="Cognee Memory Graph"
                    className="w-full h-[500px] border-none"
                  />
                </div>
              )}
            </div>

            {/* Bottom section: Log Terminal and Task Breakdown */}
            <div className="w-full mb-8">
              <CommandLine activeStep={activeStep} logs={liveLogs} />
            </div>

    </div>
  );
};

export default Dashboard;