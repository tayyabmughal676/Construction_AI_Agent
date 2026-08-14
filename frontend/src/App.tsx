import { useState, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';

// Types & Hooks
export type { View, Message, Thread, Detection, AuthView, ToolItem, AgentCapabilities } from './types';
import type { View, Message, ApprovalModalData } from './types';
import { useAuth } from './hooks/useAuth';
import { useChatThreads } from './hooks/useChatThreads';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useMentionTools } from './hooks/useMentionTools';
import { useToast } from './components/Toast';
import { ApiService } from './services/api';

// Presentation Components
import { AuthScreen } from './components/auth/AuthScreen';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { ChatTerminal } from './components/chat/ChatTerminal';
import { ApprovalModal } from './components/ApprovalModal';
import { DeleteModal } from './components/DeleteModal';

// Department Hubs
import HR from './components/HR';
import Construction from './components/Construction';
import Manufacturing from './components/Manufacturing';
import Workflow from './components/Workflow';

export default function App() {
  const { showToast } = useToast();

  // Navigation & Engine state
  const [currentView, setCurrentView] = useState<View>('chat');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [engineMode, setEngineMode] = useState<'v1' | 'v2'>('v2');
  const [isLoading, setIsLoading] = useState(false);
  const [input, setInput] = useState('');
  const [approvalModal, setApprovalModal] = useState<ApprovalModalData | null>(null);

  // Domain Hooks
  const auth = useAuth();
  const threads = useChatThreads();

  const handleTranscript = useCallback((text: string) => {
    setInput((prev) => (prev ? `${prev} ${text}` : text));
  }, []);

  const speech = useSpeechRecognition(handleTranscript);
  const mention = useMentionTools(auth.capabilities, input, setInput);

  // Send message handler (v1 REST vs v2 LangGraph Swarm)
  const handleSendMessage = useCallback(
    async (overrideText?: string) => {
      const text = overrideText || input.trim();
      if (!text) return;

      const userMessage: Message = {
        id: Date.now().toString(),
        text,
        from: 'user',
        timestamp: new Date(),
      };

      const updatedMsgs = [...threads.messages, userMessage];
      threads.updateCurrentThreadMessages(updatedMsgs);
      setInput('');
      if (mention.inputRef.current) mention.inputRef.current.style.height = 'auto';
      setIsLoading(true);

      try {
        if (engineMode === 'v2') {
          // v2.x LangGraph Autonomous Swarm
          showToast('Dispatching query to LangGraph Swarm Engine...', 'info', 'v2.x Swarm Graph');
          const data = await ApiService.sendV2SwarmChat(text, auth.token);

          if (data.requiresApproval || data.status === 'paused') {
            setApprovalModal({
              sessionId: data.sessionId,
              amount: data.totalPurchaseCost || 0,
              description: data.finalResponse || 'High-value purchase order requires human review.',
            });
            showToast(
              'Purchase order exceeds $10,000 threshold. Human review required.',
              'warning',
              'Interrupt Triggered'
            );
          }

          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: data.finalResponse || data.message || 'Swarm execution complete.',
            from: 'bot',
            department: data.departments?.[0] || 'SYSTEM',
            toolsUsed: data.executionTrace?.map((t: any) => t.step),
            timestamp: new Date(),
          };
          threads.updateCurrentThreadMessages([...updatedMsgs, botMessage]);
        } else {
          // v1.x Direct REST Agent Dispatch
          const data = await ApiService.sendV1Chat(text, auth.token);
          const botMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: data.message,
            from: 'bot',
            department: data.department,
            toolsUsed: data.toolsUsed,
            detection: data.detection,
            timestamp: new Date(),
            data: data.data,
          };
          threads.updateCurrentThreadMessages([...updatedMsgs, botMessage]);
        }
      } catch {
        threads.updateCurrentThreadMessages([
          ...updatedMsgs,
          {
            id: (Date.now() + 1).toString(),
            text: 'Error communicating with AI agent.',
            from: 'bot',
            timestamp: new Date(),
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    },
    [input, threads, mention.inputRef, engineMode, auth.token, showToast]
  );

  // Approve high-value PO interrupt
  const handleApproveSwarm = useCallback(async () => {
    if (!approvalModal) return;
    try {
      showToast('Approving high-value purchase order...', 'info', 'Human Approval Sent');
      const { ok, data } = await ApiService.approveSwarmExecution(approvalModal.sessionId, auth.token);
      if (ok && data.success) {
        showToast('Swarm execution approved and completed!', 'success', 'StateGraph Resumed');
        setApprovalModal(null);

        const botMessage: Message = {
          id: Date.now().toString(),
          text: data.finalResponse || 'Swarm execution resumed and finished successfully.',
          from: 'bot',
          department: 'SYSTEM',
          timestamp: new Date(),
        };
        threads.updateCurrentThreadMessages([...threads.messages, botMessage]);
      } else {
        showToast(data.error || 'Failed to approve swarm execution.', 'error');
      }
    } catch {
      showToast('Error sending approval to server.', 'error');
    }
  }, [approvalModal, auth.token, showToast, threads]);

  // Handle Enter key for submit and @ keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (mention.mentionOpen && mention.filteredTools.length > 0) {
        if (e.key === 'ArrowDown') {
          e.preventDefault();
          mention.setMentionIndex((prev) => (prev + 1) % mention.filteredTools.length);
          return;
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault();
          mention.setMentionIndex((prev) => (prev - 1 + mention.filteredTools.length) % mention.filteredTools.length);
          return;
        }
        if (e.key === 'Enter' || e.key === 'Tab') {
          e.preventDefault();
          mention.insertMention(mention.filteredTools[mention.mentionIndex]);
          return;
        }
        if (e.key === 'Escape') {
          e.preventDefault();
          mention.setMentionOpen(false);
          return;
        }
      }

      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        handleSendMessage();
      }
    },
    [mention, handleSendMessage]
  );

  // If unauthenticated, render Auth Screen
  if (!auth.isLoggedIn) {
    return (
      <AuthScreen
        authView={auth.authView}
        setAuthView={auth.setAuthView}
        loginForm={auth.loginForm as any}
        setLoginForm={auth.setLoginForm as any}
        signupForm={auth.signupForm as any}
        setSignupForm={auth.setSignupForm as any}
        isAuthenticating={auth.isAuthenticating}
        onSubmit={auth.handleAuthSubmit}
      />
    );
  }

  return (
    <div className="h-screen flex bg-slate-900 overflow-hidden">
      {/* Collapsible Sidebar */}
      <AnimatePresence mode="wait">
        {sidebarOpen && (
          <Sidebar
            currentView={currentView}
            setCurrentView={setCurrentView}
            sortedThreads={threads.sortedThreads}
            activeThreadId={threads.activeThreadId}
            onSwitchThread={threads.switchThread}
            onCreateNewThread={threads.createNewThread}
            onTogglePinThread={threads.togglePinThread}
            onRequestDeleteThread={threads.requestDeleteThread}
            onLogout={auth.logout}
          />
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 h-full">
        <Header
          sidebarOpen={sidebarOpen}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          currentView={currentView}
          engineMode={engineMode}
          onSetEngineMode={(mode) => {
            setEngineMode(mode);
            showToast(
              mode === 'v2' ? 'Switched engine to v2.x LangGraph Swarm' : 'Switched engine to v1.x Standard REST',
              mode === 'v2' ? 'success' : 'info'
            );
          }}
        />

        {currentView === 'chat' ? (
          <ChatTerminal
            messages={threads.messages}
            isLoading={isLoading}
            capabilities={auth.capabilities}
            input={input}
            isListening={speech.isListening}
            mentionOpen={mention.mentionOpen}
            filteredTools={mention.filteredTools}
            mentionIndex={mention.mentionIndex}
            inputRef={mention.inputRef}
            mentionRef={mention.mentionRef}
            onInputChange={mention.handleInputChange}
            onKeyDown={handleKeyDown}
            onToggleVoice={speech.toggleVoiceInput}
            onSendMessage={handleSendMessage}
            onInsertMention={mention.insertMention}
            onSetMentionIndex={mention.setMentionIndex}
          />
        ) : (
          <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            <AnimatePresence mode="wait">
              {currentView === 'hr' && auth.token && (
                <motion.div key="hr" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <HR token={auth.token} />
                </motion.div>
              )}
              {currentView === 'construction' && auth.token && (
                <motion.div key="construction" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Construction token={auth.token} />
                </motion.div>
              )}
              {currentView === 'manufacturing' && auth.token && (
                <motion.div key="manufacturing" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Manufacturing token={auth.token} />
                </motion.div>
              )}
              {currentView === 'workflow' && (
                <motion.div key="workflow" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                  <Workflow token={auth.token || ''} />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Human Approval Interrupt Modal (PO > $10,000) */}
      <ApprovalModal
        modalData={approvalModal}
        onReject={() => {
          setApprovalModal(null);
          showToast('Purchase order rejected by user.', 'warning');
        }}
        onApprove={handleApproveSwarm}
      />

      {/* Delete Conversation Confirmation Modal */}
      <DeleteModal
        thread={threads.deleteModalThread}
        onClose={() => threads.setDeleteModalThread(null)}
        onConfirm={threads.confirmDeleteThread}
      />
    </div>
  );
}
