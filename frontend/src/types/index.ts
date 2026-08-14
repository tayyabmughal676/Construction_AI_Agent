export interface Detection {
  department?: string;
  confidence?: number;
  action?: string;
  parameters?: Record<string, any>;
  method?: string;
}

export interface Message {
  id: string;
  text: string;
  from: 'user' | 'bot';
  department?: string;
  toolsUsed?: string[];
  detection?: Detection;
  timestamp?: Date;
  data?: any;
}

export interface Thread {
  id: string;
  title: string;
  updatedAt: number;
  messages: Message[];
  isPinned?: boolean;
}

export type View = 'chat' | 'hr' | 'construction' | 'manufacturing' | 'workflow';

export type AuthView = 'login' | 'signup';

export interface AgentCapabilities {
  registered_departments: string[];
  capabilities: Record<string, string>;
}

export interface ToolItem {
  name: string;
  desc: string;
  dept: string;
}

export interface ApprovalModalData {
  sessionId: string;
  amount: number;
  description: string;
}
