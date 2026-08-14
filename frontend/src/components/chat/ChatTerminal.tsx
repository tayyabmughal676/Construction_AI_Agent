import React, { useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import type { Message, AgentCapabilities, ToolItem } from '../../types';
import { WelcomeScreen } from './WelcomeScreen';
import { MessageItem } from './MessageItem';
import { ChatInput } from './ChatInput';
import { MessageOutlineNav } from '../MessageOutlineNav';

interface ChatTerminalProps {
  messages: Message[];
  isLoading: boolean;
  capabilities: AgentCapabilities | null;
  input: string;
  isListening: boolean;
  mentionOpen: boolean;
  filteredTools: ToolItem[];
  mentionIndex: number;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  mentionRef: React.RefObject<HTMLDivElement | null>;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onToggleVoice: () => void;
  onSendMessage: (overrideText?: string) => void;
  onInsertMention: (tool: ToolItem) => void;
  onSetMentionIndex: (idx: number) => void;
}

export const ChatTerminal: React.FC<ChatTerminalProps> = ({
  messages,
  isLoading,
  capabilities,
  input,
  isListening,
  mentionOpen,
  filteredTools,
  mentionIndex,
  inputRef,
  mentionRef,
  onInputChange,
  onKeyDown,
  onToggleVoice,
  onSendMessage,
  onInsertMention,
  onSetMentionIndex,
}) => {
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, isLoading]);

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Chat messages area */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        {messages.length === 0 ? (
          <WelcomeScreen
            capabilities={capabilities}
            onSendQuery={(text) => onSendMessage(text)}
          />
        ) : (
          <div className="max-w-3xl mx-auto w-full px-4 py-6 space-y-6">
            {messages.map((msg) => (
              <MessageItem key={msg.id} msg={msg} />
            ))}

            {/* Loading indicator */}
            {isLoading && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex gap-3 items-start rounded-2xl p-4 bg-slate-800/30 border border-slate-700/30"
              >
                <div className="w-8 h-8 rounded-xl bg-slate-700 border border-slate-600 flex items-center justify-center shrink-0">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-slate-500 border-t-amber-400" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-sm font-semibold text-slate-400">Agent</span>
                    <span className="text-[10px] text-slate-600">Routing...</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm text-slate-500">Analyzing query</span>
                    <div className="flex gap-0.5">
                      {[0, 1, 2].map((i) => (
                        <div
                          key={i}
                          className="w-1 h-1 rounded-full bg-amber-400/60 animate-bounce"
                          style={{ animationDelay: `${i * 200}ms` }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Vertical Message Navigation Sidebar */}
            <MessageOutlineNav messages={messages} />

            <div ref={chatEndRef} />
          </div>
        )}
      </div>

      {/* Input area */}
      <ChatInput
        input={input}
        isLoading={isLoading}
        isListening={isListening}
        mentionOpen={mentionOpen}
        filteredTools={filteredTools}
        mentionIndex={mentionIndex}
        inputRef={inputRef}
        mentionRef={mentionRef}
        onInputChange={onInputChange}
        onKeyDown={onKeyDown}
        onToggleVoice={onToggleVoice}
        onSendMessage={() => onSendMessage()}
        onInsertMention={onInsertMention}
        onSetMentionIndex={onSetMentionIndex}
      />
    </div>
  );
};
