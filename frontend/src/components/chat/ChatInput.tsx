import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Send, Bot } from 'lucide-react';
import type { ToolItem } from '../../types';
import { DEPT_ICONS_MAP, DEPT_LABELS, DEPT_TEXT } from '../../constants/departmentTheme';

interface ChatInputProps {
  input: string;
  isLoading: boolean;
  isListening: boolean;
  mentionOpen: boolean;
  filteredTools: ToolItem[];
  mentionIndex: number;
  inputRef: React.RefObject<HTMLTextAreaElement | null>;
  mentionRef: React.RefObject<HTMLDivElement | null>;
  onInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onToggleVoice: () => void;
  onSendMessage: () => void;
  onInsertMention: (tool: ToolItem) => void;
  onSetMentionIndex: (idx: number) => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  input,
  isLoading,
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
  return (
    <div className="shrink-0 border-t border-slate-800/50 bg-slate-900/80 backdrop-blur-sm px-4 py-3">
      <div className="max-w-3xl mx-auto">
        {/* @-mention dropdown */}
        <AnimatePresence>
          {mentionOpen && filteredTools.length > 0 && (
            <motion.div
              ref={mentionRef}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.15 }}
              className="mb-2 bg-slate-800 border border-slate-700/70 rounded-xl shadow-2xl shadow-slate-950/60 overflow-hidden max-h-[280px] overflow-y-auto custom-scrollbar"
            >
              <div className="px-3 py-2 border-b border-slate-700/50 flex items-center gap-2">
                <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                  Select a tool
                </span>
                <span className="text-[10px] text-slate-600 ml-auto">
                  ↑↓ navigate · Enter select · Esc close
                </span>
              </div>
              {/* Group by department */}
              {(() => {
                const grouped: Record<string, ToolItem[]> = {};
                filteredTools.forEach((t) => {
                  if (!grouped[t.dept]) grouped[t.dept] = [];
                  grouped[t.dept].push(t);
                });
                let globalIdx = -1;
                return Object.entries(grouped).map(([dept, tools]) => {
                  const DeptIcon = DEPT_ICONS_MAP[dept] || Bot;
                  return (
                    <div key={dept}>
                      <div className="px-3 py-1.5 bg-slate-900/50">
                        <span
                          className={`text-[10px] font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                            DEPT_TEXT[dept] || 'text-slate-400'
                          }`}
                        >
                          <DeptIcon className="w-3.5 h-3.5 shrink-0" />
                          <span>{DEPT_LABELS[dept] || dept}</span>
                        </span>
                      </div>
                      {tools.map((tool) => {
                        globalIdx++;
                        const idx = globalIdx;
                        return (
                          <button
                            key={tool.name}
                            type="button"
                            onClick={() => onInsertMention(tool)}
                            onMouseEnter={() => onSetMentionIndex(idx)}
                            className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors ${
                              idx === mentionIndex
                                ? 'bg-amber-400/10 text-white'
                                : 'text-slate-300 hover:bg-slate-700/50'
                            }`}
                          >
                            <span className="text-sm opacity-50">⚙</span>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-sm font-mono font-medium">{tool.name}</span>
                                {idx === mentionIndex && (
                                  <span className="text-[9px] text-amber-400 bg-amber-400/10 px-1.5 py-0.5 rounded font-medium">
                                    Enter ↵
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] text-slate-500 truncate">{tool.desc}</p>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  );
                });
              })()}
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative flex items-end bg-slate-800/60 border border-slate-700/50 rounded-2xl focus-within:border-amber-400/30 focus-within:ring-2 focus-within:ring-amber-400/10 transition-all shadow-lg shadow-slate-950/50">
          <textarea
            ref={inputRef}
            value={input}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            disabled={isLoading}
            rows={1}
            className="flex-1 p-4 pr-24 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none resize-none disabled:opacity-50 max-h-[150px]"
            placeholder={
              isListening
                ? 'Listening... Speak now...'
                : 'Message the AI agents... (type @ for tools)'
            }
          />
          {/* Voice input button */}
          <button
            type="button"
            onClick={onToggleVoice}
            title={isListening ? 'Stop recording' : 'Voice input'}
            className={`absolute right-12 bottom-2 p-2 rounded-xl transition-all ${
              isListening
                ? 'bg-red-500/20 text-red-400 border border-red-500/40 animate-pulse'
                : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
            }`}
          >
            {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          </button>
          <button
            type="button"
            onClick={onSendMessage}
            disabled={isLoading || !input.trim()}
            className="absolute right-2 bottom-2 p-2 rounded-xl bg-amber-400 text-slate-950 hover:bg-yellow-500 transition-all disabled:opacity-30 disabled:cursor-not-allowed shadow-lg shadow-amber-400/20"
          >
            <Send className="w-4 h-4" strokeWidth={2.5} />
          </button>
        </div>
        <p className="text-[10px] text-slate-600 mt-2 text-center">
          Type <span className="text-slate-400 font-mono">@</span> to browse tools · AI routes queries across departments automatically
        </p>
      </div>
    </div>
  );
};
