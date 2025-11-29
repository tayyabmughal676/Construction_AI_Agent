import type {Workflow} from './types';
import {predefinedWorkflows} from './predefined';
import {logger} from '../config/logger';

/**
 * Workflow Registry
 * Manages and detects available workflows
 */
export class WorkflowRegistry {
    private static workflows: Map<string, Workflow> = new Map();

    /**
     * Initialize registry with predefined workflows
     */
    static initialize(): void {
        logger.info('Initializing workflow registry');

        for (const workflow of predefinedWorkflows) {
            this.register(workflow);
        }

        logger.info({
            count: this.workflows.size,
            workflows: Array.from(this.workflows.keys()),
        }, 'Workflow registry initialized');
    }

    /**
     * Register a workflow
     */
    static register(workflow: Workflow): void {
        this.workflows.set(workflow.id, workflow);
        logger.info({
            workflowId: workflow.id,
            workflowName: workflow.name,
        }, 'Registered workflow');
    }

    /**
     * Get workflow by ID
     */
    static getWorkflow(id: string): Workflow | undefined {
        return this.workflows.get(id);
    }

    /**
     * Get all workflows
     */
    static getAllWorkflows(): Workflow[] {
        return Array.from(this.workflows.values());
    }

    /**
     * Detect workflow from message
     */
    static detectWorkflow(message: string): Workflow | null {
        const messageLower = message.toLowerCase();

        for (const workflow of this.workflows.values()) {
            // Check if message contains any workflow keywords
            const matches = workflow.keywords.filter(keyword =>
                messageLower.includes(keyword.toLowerCase())
            );

            if (matches.length > 0) {
                logger.info({
                    message,
                    workflowId: workflow.id,
                    workflowName: workflow.name,
                    matchedKeywords: matches,
                }, 'Detected workflow');

                return workflow;
            }
        }

        return null;
    }

    /**
     * Validate workflow context
     */
    static validateContext(
        workflow: Workflow,
        context: Record<string, any>
    ): { valid: boolean; missing?: string[] } {
        if (!workflow.requiredContext || workflow.requiredContext.length === 0) {
            return {valid: true};
        }

        const missing = workflow.requiredContext.filter(
            field => !context[field] || context[field] === ''
        );

        if (missing.length > 0) {
            return {valid: false, missing};
        }

        return {valid: true};
    }

    /**
     * Get workflow statistics
     */
    static getStats(): {
        totalWorkflows: number;
        workflows: Array<{ id: string; name: string; steps: number }>;
    } {
        const workflows = Array.from(this.workflows.values()).map(w => ({
            id: w.id,
            name: w.name,
            steps: w.steps.length,
        }));

        return {
            totalWorkflows: this.workflows.size,
            workflows,
        };
    }
}
