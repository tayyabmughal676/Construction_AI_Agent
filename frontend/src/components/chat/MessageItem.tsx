import React from 'react';
import { motion } from 'framer-motion';
import { User, Building2, Users, Factory, Cpu, Bot, Wrench } from 'lucide-react';
import type { Message } from '../../types';
import { DEPT_COLOR_MAP, DEPT_ACCENT } from '../../constants/departmentTheme';
import { FileDownloadCard } from './FileDownloadCard';

interface MessageItemProps {
  msg: Message;
}

export const MessageItem: React.FC<MessageItemProps> = ({ msg }) => {
  const formatTimestamp = (ts: any) => {
    if (!ts) return '';
    try {
      const d = typeof ts === 'string' || typeof ts === 'number' ? new Date(ts) : ts;
      return d instanceof Date && !isNaN(d.getTime())
        ? d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        : '';
    } catch {
      return '';
    }
  };

  if (msg.from === 'user') {
    return (
      <motion.div
        id={`chat-msg-${msg.id}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex gap-3 items-start"
      >
        <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center shrink-0 mt-0.5 text-amber-400">
          <User className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-white">You</span>
            {msg.timestamp && (
              <span className="text-[10px] text-slate-600">{formatTimestamp(msg.timestamp)}</span>
            )}
          </div>
          <p className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">{msg.text}</p>
        </div>
      </motion.div>
    );
  }

  const dept = msg.department?.toUpperCase();
  const IconComp =
    dept === 'HR'
      ? Users
      : dept === 'CONSTRUCTION'
      ? Building2
      : dept === 'MANUFACTURING'
      ? Factory
      : dept === 'SYSTEM'
      ? Cpu
      : Bot;

  return (
    <motion.div
      id={`chat-msg-${msg.id}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className={`flex gap-3 items-start rounded-2xl p-4 bg-gradient-to-r ${
        DEPT_COLOR_MAP[dept || ''] || 'from-slate-800/50 to-slate-800/20 border-slate-700/50'
      } border`}
    >
      <div
        className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 mt-0.5 ${
          dept === 'HR'
            ? 'bg-purple-500/20 border border-purple-500/30 text-purple-400'
            : dept === 'CONSTRUCTION'
            ? 'bg-amber-500/20 border border-amber-500/30 text-amber-400'
            : dept === 'MANUFACTURING'
            ? 'bg-blue-500/20 border border-blue-500/30 text-blue-400'
            : dept === 'SYSTEM'
            ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400'
            : 'bg-slate-700 border border-slate-600 text-slate-300'
        }`}
      >
        <IconComp className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        {/* Agent header with detection badges */}
        <div className="flex items-center gap-2 mb-2 flex-wrap">
          <span className={`text-sm font-semibold ${DEPT_ACCENT[dept || ''] || 'text-white'}`}>
            {msg.department || 'Agent'}
          </span>
          {msg.timestamp && (
            <span className="text-[10px] text-slate-600">{formatTimestamp(msg.timestamp)}</span>
          )}
          {msg.detection?.action && (
            <span className="px-1.5 py-0.5 rounded text-[10px] font-mono bg-white/5 text-slate-400 border border-white/5">
              {msg.detection.action}
            </span>
          )}
          {msg.detection?.confidence != null && (
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                msg.detection.confidence >= 0.9
                  ? 'text-green-400 bg-green-500/10'
                  : msg.detection.confidence >= 0.7
                  ? 'text-yellow-400 bg-yellow-500/10'
                  : 'text-red-400 bg-red-500/10'
              }`}
            >
              {(msg.detection.confidence * 100).toFixed(0)}%
            </span>
          )}
          {msg.detection?.method && (
            <span className="text-[10px] text-slate-600 italic">via {msg.detection.method}</span>
          )}
        </div>

        {/* Message body with Markdown styling */}
        <div className="text-sm text-slate-200 leading-relaxed whitespace-pre-line">
          {msg.text.split('\n').map((line, i) => {
            const parts = line.split(/(\*\*[^*]+\*\*)/g);
            const rendered = parts.map((part, j) => {
              if (part.startsWith('**') && part.endsWith('**')) {
                return (
                  <strong key={j} className="font-semibold text-white">
                    {part.slice(2, -2)}
                  </strong>
                );
              }
              return <span key={j}>{part}</span>;
            });
            const isBullet = /^[\s]*[•\-✓✅❌🔧⚡🏗️🏭👥📋📊📄🏖️📈]/.test(line);
            return (
              <span key={i} className={isBullet ? 'block pl-2 py-0.5' : ''}>
                {rendered}
                {i < msg.text.split('\n').length - 1 && !isBullet && <br />}
              </span>
            );
          })}
        </div>

        {/* Extracted parameters */}
        {msg.detection?.parameters && Object.keys(msg.detection.parameters).length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {Object.entries(msg.detection.parameters).map(([key, value]) => (
              <span
                key={key}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-slate-900/60 text-slate-400 font-mono border border-slate-700/50"
              >
                <span className="text-slate-500">{key}:</span>
                <span className="text-slate-300">{String(value)}</span>
              </span>
            ))}
          </div>
        )}

        {/* File Download Card */}
        <FileDownloadCard data={msg.data} messageText={msg.text} />

        {/* Tools used */}
        {msg.toolsUsed && msg.toolsUsed.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            <span className="text-[10px] text-slate-600 uppercase tracking-wider font-medium">Tools</span>
            {msg.toolsUsed.map((tool) => (
              <span
                key={tool}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono"
              >
                <Wrench className="w-3 h-3 text-amber-400/70" />
                <span>{tool}</span>
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
};
