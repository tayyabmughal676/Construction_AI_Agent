import { BaseAgent } from './BaseAgent';
import type { AgentResponse, DepartmentDetection } from './types';
import { HRPolicyTool } from '../tools/hr/HRPolicyTool';
import { EmployeeDirectoryTool } from '../tools/hr/EmployeeDirectoryTool';
import { OnboardingChecklistTool } from '../tools/hr/OnboardingChecklistTool';
import { PerformanceTrackerTool } from '../tools/hr/PerformanceTrackerTool';
import { LeaveManagementTool } from '../tools/hr/LeaveManagementTool';
import { EmailSenderTool } from '../tools/utils/EmailSenderTool';
import { logger } from '../config/logger';

// --- Intent Definitions ---
type IntentHandler = (message: string, context?: Record<string, any>) => Promise<Partial<AgentResponse>>;

interface Intent {
    name: string;
    keywords: string[];
    action?: string; // Map to LLM detected action
    handler: IntentHandler;
}

export class HRAgent extends BaseAgent {
    private intents: Intent[] = [];

    constructor() {
        super(
            'HR',
            'Handles Human Resources inquiries, including questions about company policies, benefits, and leave.'
        );
        this.initializeTools();
        this.initializeIntents();
    }

    private initializeTools(): void {
        this.registerTool(new HRPolicyTool());
        this.registerTool(new EmployeeDirectoryTool());
        this.registerTool(new OnboardingChecklistTool());
        this.registerTool(new PerformanceTrackerTool());
        this.registerTool(new LeaveManagementTool());
        this.registerTool(new EmailSenderTool());
    }

    /**
     * Defines the mapping from keywords and actions to agent actions.
     */
    private initializeIntents(): void {
        this.intents = [{
            name: 'Ask HR Policy',
            action: 'QUERY_POLICY',
            keywords: ['policy', 'leave', 'benefits', 'conduct', 'handbook', '401k', 'vacation', 'sick day'],
            handler: this.handlePolicyQuestion,
        }, {
            name: 'Search Employee',
            action: 'SEARCH_EMPLOYEE',
            keywords: ['search', 'find', 'lookup', 'directory', 'who is', 'employee info'],
            handler: this.handleSearchEmployee,
        }, {
            name: 'Help',
            keywords: ['help', 'what can you do', 'capabilities'],
            handler: this.handleHelp,
        },];
    }

    /**
     * Processes the user's message by finding and executing the first matching intent.
     */
    async processMessage(
        message: string,
        sessionId: string,
        context?: Record<string, any>,
        detection?: DepartmentDetection
    ): Promise<AgentResponse> {
        logger.info({
            message,
            sessionId,
            detection
        }, 'Processing HR agent message');

        const lowerMessage = message.toLowerCase();

        try {
            // 1. Try to match by LLM action first
            let intent = detection?.action ? this.intents.find(i => i.action === detection.action) : null;

            // 2. Fallback to keyword matching
            if (!intent) {
                intent = this.intents.find(i => i.keywords.some(kw => lowerMessage.includes(kw)));
            }

            let response: Partial<AgentResponse>;
            if (intent) {
                logger.info(`Matched HR intent: ${intent.name} (via ${detection?.action ? 'action' : 'keyword'})`);
                response = await intent.handler.call(this, message, context);
            } else {
                response = this.handleDefault();
            }

            return {
                sessionId,
                department: 'hr',
                ...response,
            } as AgentResponse;

        } catch (error) {
            logger.error({
                error
            }, 'Error processing HR agent message');
            return {
                message: `❌ An unexpected error occurred in the HR department: ${error instanceof Error ? error.message : 'Unknown error'}`,
                sessionId,
                department: 'hr',
            };
        }
    }

    // --- Intent Handlers ---

    private async handlePolicyQuestion(message: string, context: any): Promise<Partial<AgentResponse>> {
        const result = await this.executeTool('hr_policy_tool', {
            query: message
        });

        if (!result.success) {
            return {
                message: `❌ Error retrieving policy information: ${result.error}`
            };
        }

        const {
            foundPolicies
        } = result.data;
        if (!foundPolicies || foundPolicies.length === 0) {
            return {
                message: "I couldn't find any specific policies related to your question. Could you be more specific?",
                data: result.data,
            };
        }

        const formattedResponse = foundPolicies
            .map((policy: any) => `*${policy.title}*: ${policy.content}`)
            .join('\n\n');

        return {
            message: `Here is the information I found:\n\n${formattedResponse}`,
            toolsUsed: ['hr_policy_tool'],
            data: result.data,
        };
    }

    private async handleSearchEmployee(message: string, context: any): Promise<Partial<AgentResponse>> {
        // Prioritize extracted name from LLM detection, fallback to full message
        let query = context?.name || message;

        logger.info({ query, message, context }, 'Starting HR employee search');

        // Clean up common command prefixes if we are using the full message
        let finalQuery = query;
        if (!context?.name) {
            const prefixes = [
                'search for employee',
                'search for',
                'search',
                'find employee',
                'find',
                'look up employee',
                'look up',
                'who is'
            ];

            for (const prefix of prefixes) {
                const regex = new RegExp(`^${prefix}`, 'i');
                if (regex.test(finalQuery)) {
                    finalQuery = finalQuery.replace(regex, '').trim();
                    break;
                }
            }
        }

        logger.info({ finalQuery }, 'Final search query');

        const result = await this.executeTool('employee_directory', {
            action: 'search',
            query: finalQuery
        });

        if (!result.success) {
            return {
                message: `❌ Error searching employee directory: ${result.error}`
            };
        }

        const { results } = result.data;
        if (!results || results.length === 0) {
            return {
                message: `I couldn't find any employees matching "${query}".`
            };
        }

        const formatted = results.map((emp: any) =>
            `👤 **${emp.firstName} ${emp.lastName}**\n` +
            `   ID: ${emp.employeeId}\n` +
            `   Dept: ${emp.department}\n` +
            `   Role: ${emp.position}\n` +
            `   Email: ${emp.email}`
        ).join('\n\n');

        return {
            message: `🔍 Found ${results.length} result(s):\n\n${formatted}`,
            toolsUsed: ['employee_directory'],
            data: result.data
        };
    }

    /**
     * Returns a list of supported action IDs for LLM routing.
     */
    getSupportedActions(): string[] {
        return this.intents
            .map(i => i.action)
            .filter((a): a is string => !!a);
    }

    private handleHelp(): Promise<Partial<AgentResponse>> {
        return Promise.resolve({
            message: this.getCapabilities()
        });
    }

    private handleDefault(): Partial<AgentResponse> {
        return {
            message: "I am the HR Agent. I can answer questions about company policies regarding leave, benefits, and our code of conduct. How can I help you?",
        };
    }
}
