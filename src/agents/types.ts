import { z } from 'zod';

// Tool definition schema
export const ToolSchema = z.object({
    name: z.string(),
    description: z.string(),
    parameters: z.record(z.string(), z.unknown()),
});

// Tool execution result
export interface ToolResult {
    success: boolean;
    data?: any;
    error?: string;
}

// Base tool interface
export interface BaseTool {
    name: string;
    description: string;
    execute(params: any): Promise<ToolResult>;
}

// Agent message
export interface AgentMessage {
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
}

// Agent session
export interface AgentSession {
    sessionId: string;
    userId: string;
    department: string; // Changed to string to support dynamic departments
    messages: AgentMessage[];
    context: Record<string, any>;
    createdAt: Date;
    updatedAt: Date;
}


// Agent response
export interface AgentResponse {
    message: string;
    toolsUsed?: string[];
    data?: any;
    sessionId: string;
}
