import React from 'react';
import { Message } from '../types';
import { Hash } from 'lucide-react';

interface MessageOutlineNavProps {
  messages: Message[];
}

export const MessageOutlineNav: React.FC<MessageOutlineNavProps> = ({ messages }) => {
  if (messages.length < 2) return null;

  return (
    <div className="fixed right-3 top-24 bottom-28 hidden lg:flex flex-col items-center justify-center z-30 pointer-events-auto">
      <div className="bg-slate-900/90 backdrop-blur-md border border-slate-800/80 rounded-full px-2 py-3.5 flex flex-col items-center gap-1.5 shadow-2xl transition-all max-h-[70vh] overflow-y-auto custom-scrollbar">
        {messages.map((msg, idx) => {
          const isUser = msg.from === 'user';
          const dept = msg.department?.toUpperCase();
          const tickColor = isUser
            ? 'bg-amber-400'
            : dept === 'HR'
            ? 'bg-purple-400'
            : dept === 'CONSTRUCTION'
            ? 'bg-amber-500'
            : dept === 'MANUFACTURING'
            ? 'bg-blue-400'
            : dept === 'SYSTEM'
            ? 'bg-emerald-400'
            : 'bg-slate-400';

          const previewText = (isUser ? 'You: ' : `${msg.department || 'Agent'}: `) + msg.text.substring(0, 45);

          return (
            <div key={msg.id} className="relative group flex items-center justify-center">
              <button
                onClick={() => {
                  const el = document.getElementById(`chat-msg-${msg.id}`);
                  if (el) {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                  }
                }}
                className={`w-3.5 h-1 rounded-full transition-all duration-200 ${tickColor} opacity-40 group-hover:opacity-100 group-hover:w-6 group-hover:h-1.5`}
                title={previewText}
              />
              {/* Hover Tooltip Preview */}
              <div className="absolute right-8 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap bg-slate-900/95 border border-slate-700/80 text-slate-200 text-xs px-2.5 py-1.5 rounded-lg shadow-xl flex items-center gap-2">
                <span className="text-[10px] text-slate-500 font-mono flex items-center gap-0.5">
                  <Hash className="w-2.5 h-2.5" />
                  {idx + 1}
                </span>
                <span className="font-medium truncate max-w-[220px]">{previewText}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
