import React from 'react';
import { Menu, Zap, GitBranch, Terminal } from 'lucide-react';
import { NAV_ITEMS } from '../../constants/departmentTheme';
import type { View } from '../../types';

interface HeaderProps {
  sidebarOpen: boolean;
  onToggleSidebar: () => void;
  currentView: View;
  engineMode: 'v1' | 'v2';
  onSetEngineMode: (mode: 'v1' | 'v2') => void;
}

export const Header: React.FC<HeaderProps> = ({
  sidebarOpen,
  onToggleSidebar,
  currentView,
  engineMode,
  onSetEngineMode,
}) => {
  const currentItem = NAV_ITEMS.find((n) => n.key === currentView);
  const CurrentIcon = currentItem?.icon || Terminal;

  return (
    <header className="h-14 flex items-center px-4 border-b border-slate-800/50 bg-slate-900/80 backdrop-blur-sm shrink-0">
      <button
        onClick={onToggleSidebar}
        className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-all mr-3"
        title={sidebarOpen ? 'Collapse sidebar' : 'Expand sidebar'}
      >
        <Menu className="w-4 h-4" />
      </button>

      <div className="flex items-center gap-2">
        <CurrentIcon className="w-5 h-5 text-amber-400" />
        <h2 className="text-sm font-semibold text-white">{currentItem?.label}</h2>
      </div>

      <div className="ml-auto flex items-center gap-3">
        {/* Engine Mode Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => onSetEngineMode('v1')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              engineMode === 'v1'
                ? 'bg-slate-800 text-amber-400 shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="v1.x Standard Direct REST Engine"
          >
            <Zap className="w-3.5 h-3.5" />
            <span>v1.x REST</span>
          </button>
          <button
            onClick={() => onSetEngineMode('v2')}
            className={`px-2.5 py-1 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              engineMode === 'v2'
                ? 'bg-amber-400 text-slate-950 font-bold shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title="v2.x Autonomous Multi-Agent Swarm Graph"
          >
            <GitBranch className="w-3.5 h-3.5" />
            <span>v2.x Swarm Graph</span>
          </button>
        </div>

        {/* Live System Heartbeat Badge */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 shadow-sm shadow-emerald-500/10">
          <div className="relative flex h-2.5 w-2.5 items-center justify-center">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
          </div>
          <span className="text-[11px] text-emerald-400 font-semibold tracking-wide uppercase">System Live</span>
        </div>
      </div>
    </header>
  );
};
