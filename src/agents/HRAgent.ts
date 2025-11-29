import {BaseAgent} from './BaseAgent';
import type {AgentResponse} from './types';
import {HRPolicyTool} from '../tools/hr/HRPolicyTool';
import {logger} from '../config/logger';

// --- Intent Definitions ---
type IntentHandler = (message: string, context?: Record<string, any>) => Promise<Partial<AgentResponse>>;

interface Intent {
    name: string;
    keywords: string[];
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
    }

    /**
     * Defines the mapping from keywords to agent actions.
     */
    private initializeIntents(): void {
        this.intents = [{
            name: 'Ask HR Policy',
            keywords: ['policy', 'leave', 'benefits', 'conduct', 'handbook', '401k', 'vacation', 'sick day'],
            handler: this.handlePolicyQuestion,
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
        context?: Record<string, any>
    ): Promise<AgentResponse> {
        logger.info({
            message,
            sessionId
        }, 'Processing HR agent message');
        const lowerMessage = message.toLowerCase();

        try {
            const intent = this.intents.find(i => i.keywords.some(kw => lowerMessage.includes(kw)));

            let response: Partial<AgentResponse>;
            if (intent) {
                logger.info(`Matched HR intent: ${intent.name}`);
                response = await intent.handler.call(this, message, context);
            } else {
                response = this.handleDefault();
            }

            return {
                sessionId,
                ...response,
            } as AgentResponse;

        } catch (error) {
            logger.error({
                error
            }, 'Error processing HR agent message');
            return {
                message: `❌ An unexpected error occurred in the HR department: ${error instanceof Error ? error.message : 'Unknown error'}`,
                sessionId,
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
