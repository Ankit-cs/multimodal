// frontend/src/context/ChatContext.jsx
// Holds all Nexus chat state above the router so it survives page navigation.
// The Dashboard becomes a thin consumer of this shared state.
import React, { createContext, useContext, useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { startWorkflow, approveWorkflow, getMcpConfigs, getWorkflowDetail } from '../lib/api';
import { useAuth } from './AuthContext';

const ChatContext = createContext(null);

export function ChatProvider({ children }) {
  const { token } = useAuth();
  const navigate = useNavigate();

  const [activeStep, setActiveStep] = useState(-1);
  const [workflowStatus, setWorkflowStatus] = useState('IDLE');
  const [currentSessionId, setCurrentSessionId] = useState(null);

  // Terminal logs (from SSE)
  const [liveLogs, setLiveLogs] = useState([]);
  const allLogsRef = useRef([]);

  // Chat conversation UI state
  const [chatMessages, setChatMessages] = useState([]);

  // Track EventSource so we can close it on reset / session load
  const eventSourceRef = useRef(null);

  const agentMap = { Planner: 0, Researcher: 1, Executor: 2, Reviewer: 3, Finalizer: 4 };

  // ── Output Extraction ──────────────────────────────────────────────────────

  const extractText = (raw) => {
    if (!raw && raw !== 0) return '';
    if (typeof raw === 'string') return raw;
    if (Array.isArray(raw))
      return raw.map((c) => (typeof c === 'string' ? c : c?.text || c?.content || c?.output || '')).join('\n');
    if (typeof raw === 'object')
      return raw.text || raw.content || raw.output || JSON.stringify(raw, null, 2);
    return String(raw);
  };

  const extractBestOutput = (extraLogs = []) => {
    const allLogs = [...allLogsRef.current, ...extraLogs];

    const finalizerMsgs = allLogs.filter((l) => typeof l.agent === 'string' && l.agent.toLowerCase() === 'finalizer');
    if (finalizerMsgs.length > 0) {
      let text = extractText(finalizerMsgs[finalizerMsgs.length - 1].content);
      return text.replace(/COMPLETE_WORKFLOW/g, '').trim();
    }

    const executorMsgs = allLogs.filter((l) => typeof l.agent === 'string' && l.agent.toLowerCase() === 'executor');
    if (executorMsgs.length > 0) {
      let text = extractText(executorMsgs[executorMsgs.length - 1].content);
      return text.replace(/STATUS:\s*PENDING_APPROVAL/gi, '').replace(/COMPLETE_WORKFLOW/g, '').trim();
    }

    for (let i = allLogs.length - 1; i >= 0; i--) {
      let text = extractText(allLogs[i].content);
      if (text.trim()) {
        return text.replace(/STATUS:\s*PENDING_APPROVAL/gi, '').replace(/COMPLETE_WORKFLOW/g, '').trim();
      }
    }
    return '';
  };

  // ── SSE stream ────────────────────────────────────────────────────────────

  const openStream = useCallback((sessionId) => {
    // Close any existing stream first
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    const startIdx = allLogsRef.current.length;
    const baseUrl = import.meta.env.VITE_API_URL || 
      (window.location.hostname === 'localhost' ? 'http://localhost:8000' : 'https://nexusai-backend-hxwu.onrender.com');
    const url = `${baseUrl}/api/workflow/${sessionId}/stream?start=${startIdx}`;
    const eventSource = new EventSource(url);
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      let streamData;
      try { streamData = JSON.parse(event.data); } catch { return; }

      const newLogs = streamData.new_logs || [];
      const status = streamData.status;

      if (newLogs.length > 0) {
        allLogsRef.current = [...allLogsRef.current, ...newLogs];
        setLiveLogs([...allLogsRef.current]);

        const latestLog = newLogs[newLogs.length - 1];
        if (agentMap[latestLog.agent] !== undefined) {
          setActiveStep(agentMap[latestLog.agent]);
        }
      }

      setWorkflowStatus(status);

      if (status === 'PAUSED_FOR_HITL') {
        eventSource.close();
        eventSourceRef.current = null;
        setActiveStep(5);
        const output = extractBestOutput(newLogs) || 'The Reviewer has finished processing your request. Please review the results above.';
        setChatMessages(prev => [...prev, { role: 'system', content: output, isHitlPrompt: true }]);
        return;
      }

      if (status === 'COMPLETED') {
        eventSource.close();
        eventSourceRef.current = null;
        setActiveStep(5);
        const output = extractBestOutput(newLogs);
        const messagesToAdd = [{ role: 'system', content: '✨ Nexus task completed successfully.', isHitlPrompt: false }];
        if (output) {
          messagesToAdd.push({ role: 'system', content: output, isHitlPrompt: false });
        }
        setChatMessages(prev => [...prev, ...messagesToAdd]);
        return;
      }

      if (status === 'FAILED') {
        eventSource.close();
        eventSourceRef.current = null;
        setChatMessages(prev => [...prev, { role: 'system', content: 'Workflow failed. Check terminal for details.', isHitlPrompt: false }]);
        return;
      }
    };

    eventSource.onerror = () => {
      console.error('[SSE] Stream connection lost.');
      eventSource.close();
      eventSourceRef.current = null;
      setWorkflowStatus('FAILED');
    };
  }, []);

  // ── Action Handlers ─────────────────────────────────────────────────────────

  const handleChatSend = useCallback(async (inputText) => {
    if (!inputText.trim()) return;

    // If waiting for HITL approval, this input is the decision
    if (workflowStatus === 'PAUSED_FOR_HITL') {
      const text = inputText.trim();
      setChatMessages(prev => [...prev, { role: 'user', content: text }]);

      const isApproval = text.toLowerCase() === 'approve';
      setWorkflowStatus('ACTIVE');

      try {
        await approveWorkflow(currentSessionId, isApproval, text);
        setActiveStep(0);
        openStream(currentSessionId);
      } catch (err) {
        console.error('Approve failed:', err);
        setWorkflowStatus('FAILED');
      }
      return;
    }

    // Otherwise, brand new Nexus request
    allLogsRef.current = [];
    setLiveLogs([]);
    setChatMessages([{ role: 'user', content: inputText.trim() }]);
    setActiveStep(0);
    setWorkflowStatus('ACTIVE');

    try {
      const mcpConfigs = await getMcpConfigs();
      const activeMcpIds = mcpConfigs.filter(c => c.is_active).map(c => c.id);
      const data = await startWorkflow(token, inputText.trim(), activeMcpIds);
      setCurrentSessionId(data.session_id);
      openStream(data.session_id);
    } catch (error) {
      console.error('Failed to start workflow:', error);
      setWorkflowStatus('FAILED');
      setChatMessages(prev => [...prev, { role: 'system', content: 'Failed to start workflow. Check server connection.' }]);
    }
  }, [token, workflowStatus, currentSessionId, openStream]);

  // ── Reset chat (New Convergence) ──────────────────────────────────────────

  const resetChat = useCallback(() => {
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }
    allLogsRef.current = [];
    setLiveLogs([]);
    setChatMessages([]);
    setActiveStep(-1);
    setWorkflowStatus('IDLE');
    setCurrentSessionId(null);
  }, []);

  // ── Load a past session into the Chat ────────────────────────────────────────

  const loadSession = useCallback(async (sessionId) => {
    if (!token) return;

    // Close any existing stream
    if (eventSourceRef.current) {
      eventSourceRef.current.close();
      eventSourceRef.current = null;
    }

    try {
      const state = await getWorkflowDetail(token, sessionId);
      const history = state.chat_history || [];

      // Convert internal chat_history format into UI message format
      const uiMessages = history.map((msg) => {
        const isUser = (msg.agent || '').toLowerCase() === 'user';
        return {
          role: isUser ? 'user' : 'system',
          content: typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content),
          isHitlPrompt: false,
        };
      });

      setCurrentSessionId(sessionId);
      setChatMessages(uiMessages);
      allLogsRef.current = history;
      setLiveLogs(history);
      setWorkflowStatus(state.status || 'COMPLETED');

      // Set active step based on status
      if (state.status === 'COMPLETED' || state.status === 'PAUSED_FOR_HITL') {
        setActiveStep(5);
      } else {
        setActiveStep(-1);
      }

      // If the session is still running, reconnect the stream
      if (state.status === 'ACTIVE') {
        openStream(sessionId);
      }

      // If paused for HITL, mark the last system message appropriately
      if (state.status === 'PAUSED_FOR_HITL' && uiMessages.length > 0) {
        const lastIdx = uiMessages.length - 1;
        if (uiMessages[lastIdx].role === 'system') {
          uiMessages[lastIdx].isHitlPrompt = true;
          setChatMessages([...uiMessages]);
        }
      }

      // Navigate to dashboard to show the loaded conversation
      navigate('/dashboard');
    } catch (error) {
      console.error('Failed to load session:', error);
    }
  }, [token, openStream, navigate]);

  const value = {
    activeStep,
    workflowStatus,
    currentSessionId,
    liveLogs,
    chatMessages,
    handleChatSend,
    resetChat,
    loadSession,
  };

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChatContext() {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChatContext must be used inside a <ChatProvider>');
  return ctx;
}
