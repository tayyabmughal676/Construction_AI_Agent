import React from 'react';
import { motion } from 'framer-motion';
import { Terminal, Bot, Wrench } from 'lucide-react';
import type { AgentCapabilities } from '../../types';
import {
  DEPT_ICONS_MAP,
  DEPT_LABELS,
  DEPT_BG,
  DEPT_BORDER_COLOR,
  DEPT_TEXT,
  SUGGESTION_CHIPS,
} from '../../constants/departmentTheme';

interface WelcomeScreenProps {
  capabilities: AgentCapabilities | null;
  onSendQuery: (text: string) => void;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ capabilities, onSendQuery }) => {
  return (
    <div className="h-full flex flex-col items-center justify-center px-4 py-8 overflow-y-auto custom-scrollbar">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center max-w-3xl w-full"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-amber-500/20 to-amber-600/5 border border-amber-500/20 mb-4">
          <Terminal className="w-8 h-8 text-amber-400" />
        </div>
        <h2 className="text-2xl font-bold text-white mb-1">Unified Intelligence Terminal</h2>
        <p className="text-slate-400 mb-6 text-sm">
          Your queries are intelligently routed to the right department.
        </p>

        {/* Agent Capability Cards */}
        {capabilities && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6 text-left">
            {capabilities.registered_departments.map((dept, index) => {
              const cap = capabilities.capabilities[dept] || '';
              const DeptIconComponent = DEPT_ICONS_MAP[dept] || Bot;
              const toolLines = cap.split('\n').filter((l: string) => l.trim().startsWith('- '));
              const tools = toolLines
                .map((l: string) => {
                  const match = l.match(/- ([^:]+): (.+)/);
                  return match ? { name: match[1].trim(), desc: match[2].trim() } : null;
                })
                .filter(Boolean)
                .slice(0, 5);

              return (
                <motion.div
                  key={dept}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className={`bg-gradient-to-b ${
                    DEPT_BG[dept] || 'from-slate-800/50 to-transparent'
                  } border ${DEPT_BORDER_COLOR[dept] || 'border-slate-700/50'} rounded-xl p-4 transition-all`}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <DeptIconComponent className={`w-5 h-5 ${DEPT_TEXT[dept] || 'text-white'}`} />
                    <span className={`text-sm font-bold ${DEPT_TEXT[dept] || 'text-white'}`}>
                      {DEPT_LABELS[dept] || dept}
                    </span>
                    <span className="ml-auto text-[10px] text-slate-500 bg-slate-800/80 px-1.5 py-0.5 rounded">
                      {tools.length} tools
                    </span>
                  </div>
                  <div className="space-y-1.5">
                    {tools.map((tool: any) => (
                      <div key={tool.name} className="flex items-start gap-1.5">
                        <Wrench className="w-3 h-3 text-slate-500 mt-0.5 shrink-0" />
                        <div className="min-w-0">
                          <span className="text-[11px] text-slate-300 font-mono">{tool.name}</span>
                          <p className="text-[10px] text-slate-500 leading-tight truncate">{tool.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Quick Action Chips */}
        <div className="mb-2">
          <p className="text-[10px] text-slate-600 uppercase tracking-wider font-medium mb-2">
            Quick Actions
          </p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-w-xl mx-auto">
            {SUGGESTION_CHIPS.map((chip) => {
              const ChipIconComponent = chip.icon;
              return (
                <button
                  key={chip.text}
                  type="button"
                  onClick={() => onSendQuery(chip.text)}
                  className="flex items-center gap-2 px-3 py-2.5 bg-slate-800/60 hover:bg-slate-700/60 border border-slate-700/50 hover:border-slate-600 rounded-xl text-left transition-all group"
                >
                  <ChipIconComponent className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-xs text-slate-300 group-hover:text-white transition-colors leading-tight">
                    {chip.text}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </motion.div>
    </div>
  );
};
