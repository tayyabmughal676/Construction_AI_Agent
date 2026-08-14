import React from 'react';
import { 
  Building2, Users, Factory, Terminal, GitBranch, Boxes, ShieldCheck, 
  Calendar, DollarSign, Bot, Cpu 
} from 'lucide-react';
import type { View } from '../types';

export const DEPT_ICONS_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  construction: Building2,
  hr: Users,
  manufacturing: Factory,
  system: Cpu,
  bot: Bot,
};

export const DEPT_LABELS: Record<string, string> = {
  construction: 'Construction',
  hr: 'HR',
  manufacturing: 'Manufacturing',
  system: 'System / Orchestrator',
};

export const DEPT_BORDER_COLOR: Record<string, string> = {
  construction: 'border-amber-500/30 hover:border-amber-500/50',
  hr: 'border-purple-500/30 hover:border-purple-500/50',
  manufacturing: 'border-blue-500/30 hover:border-blue-500/50',
  system: 'border-emerald-500/30 hover:border-emerald-500/50',
};

export const DEPT_BG: Record<string, string> = {
  construction: 'from-amber-500/10 to-transparent',
  hr: 'from-purple-500/10 to-transparent',
  manufacturing: 'from-blue-500/10 to-transparent',
  system: 'from-emerald-500/10 to-transparent',
};

export const DEPT_TEXT: Record<string, string> = {
  construction: 'text-amber-400',
  hr: 'text-purple-400',
  manufacturing: 'text-blue-400',
  system: 'text-emerald-400',
};

export const NAV_ITEMS: { key: View; label: string; icon: React.ComponentType<{ className?: string }>; desc: string }[] = [
  { key: 'chat', label: 'Intelligence Terminal', icon: Terminal, desc: 'Multi-agent AI chat' },
  { key: 'hr', label: 'HR Hub', icon: Users, desc: 'Workforce directory' },
  { key: 'construction', label: 'Site Terminal', icon: Building2, desc: 'Project management' },
  { key: 'manufacturing', label: 'Fabrication Node', icon: Factory, desc: 'Inventory & production' },
  { key: 'workflow', label: 'Workflow Center', icon: GitBranch, desc: 'LangGraph orchestration' },
];

export const SUGGESTION_CHIPS = [
  { text: 'Show all projects', icon: Building2 },
  { text: 'Register a new employee', icon: Users },
  { text: 'Check inventory levels', icon: Boxes },
  { text: 'Generate safety checklist', icon: ShieldCheck },
  { text: 'Request leave for EMP001', icon: Calendar },
  { text: 'Calculate material costs for steel', icon: DollarSign },
];

export const DEPT_COLOR_MAP: Record<string, string> = {
  HR: 'from-purple-500/20 to-purple-600/5 border-purple-500/30',
  CONSTRUCTION: 'from-amber-500/20 to-amber-600/5 border-amber-500/30',
  MANUFACTURING: 'from-blue-500/20 to-blue-600/5 border-blue-500/30',
  SYSTEM: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/30',
};

export const DEPT_ACCENT: Record<string, string> = {
  HR: 'text-purple-400',
  CONSTRUCTION: 'text-amber-400',
  MANUFACTURING: 'text-blue-400',
  SYSTEM: 'text-emerald-400',
};
