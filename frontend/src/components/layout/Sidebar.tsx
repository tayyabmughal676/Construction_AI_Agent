import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, LogOut, Plus, Pin, Trash2 } from 'lucide-react';
import { NAV_ITEMS } from '../../constants/departmentTheme';
import type { Thread, View } from '../../types';

interface SidebarProps {
  currentView: View;
  setCurrentView: (v: View) => void;
  sortedThreads: Thread[];
  activeThreadId: string;
  onSwitchThread: (id: string) => void;
  onCreateNewThread: () => void;
  onTogglePinThread: (id: string, e: React.MouseEvent) => void;
  onRequestDeleteThread: (thread: Thread, e: React.MouseEvent) => void;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  setCurrentView,
  sortedThreads,
  activeThreadId,
  onSwitchThread,
  onCreateNewThread,
  onTogglePinThread,
  onRequestDeleteThread,
  onLogout,
}) => {
  return (
    <motion.aside
      initial={{ width: 0, opacity: 0 }}
      animate={{ width: 260, opacity: 1 }}
      exit={{ width: 0, opacity: 0 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="h-full bg-slate-950/80 border-r border-slate-800 flex flex-col overflow-hidden"
    >
      {/* Sidebar header */}
      <div className="p-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-amber-400">
            <Terminal className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <h1 className="text-sm font-bold text-white truncate">Construction AI</h1>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider">Multi-Agent Platform</p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 p-3 space-y-4 overflow-y-auto custom-scrollbar">
        <div className="space-y-1">
          {NAV_ITEMS.map(({ key, label, icon: IconComponent, desc }) => (
            <button
              key={key}
              onClick={() => setCurrentView(key)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all group ${
                currentView === key
                  ? 'bg-slate-800 text-white shadow-lg shadow-slate-900/50'
                  : 'text-slate-400 hover:bg-slate-800/50 hover:text-white'
              }`}
            >
              <IconComponent
                className={`w-5 h-5 transition-transform ${
                  currentView === key
                    ? 'scale-110 text-amber-400'
                    : 'group-hover:scale-110 text-slate-400'
                }`}
              />
              <div className="min-w-0">
                <div className="text-sm font-medium truncate">{label}</div>
                <div className="text-[10px] text-slate-500 truncate">{desc}</div>
              </div>
              {currentView === key && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>
          ))}
        </div>

        {/* Chat Threads Section */}
        {currentView === 'chat' && (
          <div className="pt-3 border-t border-slate-800/80">
            <div className="flex items-center justify-between px-2 mb-2">
              <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
                Conversations
              </span>
              <button
                onClick={onCreateNewThread}
                className="px-2 py-1 rounded-md text-slate-400 hover:text-amber-400 hover:bg-slate-800 transition-all text-xs flex items-center gap-1 font-medium border border-slate-800 hover:border-amber-400/30"
                title="New Conversation"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>
            <div className="space-y-1 max-h-48 overflow-y-auto custom-scrollbar">
              {sortedThreads.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onSwitchThread(t.id)}
                  className={`group w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs cursor-pointer transition-all ${
                    activeThreadId === t.id
                      ? 'bg-amber-400/15 text-white font-medium border border-amber-400/20'
                      : 'text-slate-400 hover:bg-slate-800/40 hover:text-slate-200'
                  }`}
                >
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 pr-1">
                    {t.isPinned && (
                      <Pin className="w-3.5 h-3.5 text-amber-400 shrink-0 fill-amber-400/20" />
                    )}
                    <span className="truncate">{t.title}</span>
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                    <button
                      onClick={(e) => onTogglePinThread(t.id, e)}
                      className={`p-1 rounded transition-all text-xs ${
                        t.isPinned
                          ? 'text-amber-400 hover:text-yellow-400'
                          : 'text-slate-500 hover:text-slate-200'
                      }`}
                      title={t.isPinned ? 'Unpin Conversation' : 'Pin Conversation to Top'}
                    >
                      <Pin
                        className={`w-3.5 h-3.5 ${
                          t.isPinned ? 'fill-amber-400/20' : ''
                        }`}
                      />
                    </button>
                    <button
                      onClick={(e) => onRequestDeleteThread(t, e)}
                      className="text-slate-500 hover:text-red-400 p-1 rounded transition-all text-xs"
                      title="Delete Conversation"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </nav>

      {/* Sidebar footer */}
      <div className="p-3 border-t border-slate-800">
        <button
          onClick={onLogout}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all font-medium"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </button>
      </div>
    </motion.aside>
  );
};
