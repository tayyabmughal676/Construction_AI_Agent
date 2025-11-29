/**
 * Workflow System Types
 * Defines interfaces for multi-step workflow execution
 */

/**
 * Workflow execution state
 */
export interface WorkflowState {
    workflowId: string;
    sessionId: string;
    currentStep: number;
    totalSteps: number;
    status: 'pending' | 'running' | 'completed' | 'failed';
    data: Record<string, any>;
    results: any[];
    errors: string[];
    startedAt: Date;
    completedAt?: Date;
}

/**
 * Individual workflow step
 */
export interface WorkflowStep {
    name: string;
    description: string;
    agent?: string; // Which agent to use
    tool?: string; // Which tool to execute
    action: (state: WorkflowState) => Promise<StepResult>;
    condition?: (state: WorkflowState) => boolean; // Optional conditional execution
    onError?: (error: Error, state: WorkflowState) => Promise<void>; // Error handler
}

/**
 * Step execution result
 */
export interface StepResult {
    success: boolean;
    data?: any;
    error?: string;
    message?: string;
}

/**
 * Complete workflow definition
 */
export interface Workflow {
    id: string;
    name: string;
    description: string;
    steps: WorkflowStep[];
    keywords: string[]; // For workflow detection
    requiredContext?: string[]; // Required context fields
}

/**
 * Workflow execution result
 */
export interface WorkflowResult {
    workflowId: string;
    workflowName: string;
    sessionId: string;
    success: boolean;
    status: 'completed' | 'failed' | 'partial';
    message: string;
    results: any[];
    errors: string[];
    executionTime: number;
    stepsCompleted: number;
    totalSteps: number;
}

/**
 * Workflow execution options
 */
export interface WorkflowOptions {
    sessionId: string;
    context?: Record<string, any>;
    continueOnError?: boolean; // Continue even if a step fails
    timeout?: number; // Max execution time in ms
}
