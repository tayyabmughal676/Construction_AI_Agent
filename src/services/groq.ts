import { Groq } from 'groq-sdk';
import { env } from '../config/env';
import { logger } from '../config/logger';
import { z } from 'zod';

// --- Zod Schemas for Validation ---
const IntentSchema = z.object({
    department: z.string(),
    confidence: z.number().min(0).max(1),
    action: z.string(),
    reasoning: z.string(),
    parameters: z.record(z.string(), z.any()).optional(),
});

export type IntentResult = z.infer<typeof IntentSchema>;

/**
 * Service wrapper for Groq AI SDK.
 * Provides intent detection, text completion, and streaming functionality.
 */
export class GroqService {
    private client: Groq | null = null;
    private defaultModel: string;

    constructor() {
        const apiKey = env.GROQ_API_KEY;
        this.defaultModel = env.GROQ_API_MODEL || 'openai/gpt-oss-120b';

        if (!apiKey) {
            logger.warn('GROQ_API_KEY is not set. GroqService will be disabled.');
        } else {
            try {
                this.client = new Groq({ apiKey });
                logger.info({ model: this.defaultModel }, 'GroqService initialized successfully.');
            } catch (error) {
                logger.error({ error }, 'Failed to initialize GroqService.');
            }
        }
    }

    /**
     * Checks if the Groq service is available and configured.
     */
    isAvailable(): boolean {
        return this.client !== null;
    }

    /**
     * Returns the Groq client instance directly.
     */
    getClient(): Groq | null {
        return this.client;
    }

    /**
     * Creates a streaming chat completion with Groq.
     */
    async createChatStream(params: {
        messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
        model?: string;
        temperature?: number;
        maxCompletionTokens?: number;
        topP?: number;
        reasoningEffort?: 'low' | 'medium' | 'high';
    }) {
        if (!this.isAvailable()) {
            throw new Error('GroqService is not available. Please set GROQ_API_KEY in .env');
        }

        const model = params.model || this.defaultModel;

        const chatCompletion = await this.client!.chat.completions.create({
            messages: params.messages,
            model,
            temperature: params.temperature ?? 1,
            max_completion_tokens: params.maxCompletionTokens ?? 2048,
            top_p: params.topP ?? 1,
            stream: true,
            reasoning_effort: params.reasoningEffort ?? 'medium',
            stop: null,
        });

        return chatCompletion;
    }

    /**
     * Creates a standard non-streaming completion request.
     */
    async createCompletion(params: {
        messages: Array<{ role: 'user' | 'assistant' | 'system'; content: string }>;
        model?: string;
        temperature?: number;
        maxTokens?: number;
    }) {
        if (!this.isAvailable()) {
            throw new Error('GroqService is not available. Please set GROQ_API_KEY in .env');
        }

        const maxRetries = 3;
        let lastError: any = null;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            try {
                const response = await this.client!.chat.completions.create({
                    messages: params.messages,
                    model: params.model || this.defaultModel,
                    temperature: params.temperature ?? 0.2,
                    max_completion_tokens: params.maxTokens ?? 2048,
                });

                return response.choices[0]?.message?.content || '';
            } catch (error: any) {
                lastError = error;
                const isRateLimit = error?.status === 429 ||
                                    error?.message?.includes('429') ||
                                    error?.message?.includes('rate limit') ||
                                    error?.message?.includes('quota');

                if (isRateLimit && attempt < maxRetries - 1) {
                    const delayMs = 1000 * Math.pow(2, attempt);
                    logger.warn(`Groq rate limit hit (429). Retrying in ${delayMs}ms (attempt ${attempt + 1}/${maxRetries})...`);
                    await new Promise(r => setTimeout(r, delayMs));
                    continue;
                }
                throw error;
            }
        }
        throw lastError;
    }

    /**
     * Detects the user's intent from a message, routing it to the correct department.
     */
    async detectIntent(
        message: string,
        agents: { department: string; name: string; description: string; actions: string[] }[]
    ): Promise<IntentResult> {
        if (!this.isAvailable()) {
            throw new Error('Groq service is not available.');
        }

        const agentContext = agents
            .map(a => `- ${a.department.toUpperCase()}: ${a.description}\n  Supported Actions: ${a.actions.join(', ')}`)
            .join('\n');

        const systemPrompt = `
You are an intelligent router for a multi-agent system. Your task is to analyze the user's message and determine the most appropriate department and action to handle the request.

Available Agents and their responsibilities:
${agentContext}

Task:
1. Identify the 'department'.
2. Identify the 'action' ONLY from the "Supported Actions" list for that department.
3. Extract any 'parameters' (e.g., employee name, project name, item quantity, dates, IDs).
   - For employee searches, put the name in "name".
   - For inventory, put the item name in "item" and quantity in "quantity".
4. Assign a 'confidence' score (0.0 to 1.0).
5. Provide 'reasoning' for your choice.

Respond strictly in valid JSON format matching this schema:
{
  "department": "...",
  "action": "...",
  "parameters": { ... },
  "confidence": 0.95,
  "reasoning": "..."
}
`;

        try {
            const rawResponse = await this.createCompletion({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                temperature: 0.1,
                maxTokens: 1024,
            });

            const jsonData = this.parseJsonResponse(rawResponse);
            return IntentSchema.parse(jsonData);
        } catch (error) {
            logger.error({ error, message }, 'Failed to detect intent with Groq.');
            throw new Error('Groq intent detection failed.');
        }
    }

    /**
     * Decomposes a multi-step request into a sequence of department tasks.
     */
    async decomposeTasks(
        message: string,
        agents: { department: string; name: string; description: string; actions: string[] }[]
    ): Promise<IntentResult[]> {
        if (!this.isAvailable()) {
            throw new Error('Groq service is not available.');
        }

        const agentContext = agents
            .map(a => `- ${a.department.toUpperCase()}: ${a.description}\n  Actions: ${a.actions.join(', ')}`)
            .join('\n');

        const systemPrompt = `
You are a task decomposer for an enterprise multi-agent AI system.
Analyze the user's request and break it down into a sequence of specific tasks for our departments.

Available Agents:
${agentContext}

Task:
Break the user message into 1 or more sequential steps.
Each step must have a 'department', a valid 'action' from that department's list, and 'parameters'.

Example Output:
[
  { "department": "hr", "action": "SEARCH_EMPLOYEE", "parameters": { "name": "John" }, "confidence": 1.0, "reasoning": "..." },
  { "department": "construction", "action": "LIST_PROJECTS", "parameters": {}, "confidence": 0.95, "reasoning": "..." }
]

Respond ONLY with a valid JSON array matching the schema above.
`;

        try {
            const rawResponse = await this.createCompletion({
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                temperature: 0.1,
                maxTokens: 1024,
            });

            const jsonStart = rawResponse.indexOf('[');
            const jsonEnd = rawResponse.lastIndexOf(']');
            if (jsonStart !== -1 && jsonEnd !== -1) {
                const jsonString = rawResponse.substring(jsonStart, jsonEnd + 1);
                const tasks = JSON.parse(jsonString);
                if (Array.isArray(tasks) && tasks.length > 0) {
                    return tasks.map(t => IntentSchema.parse(t));
                }
            }

            // Single intent fallback
            const single = await this.detectIntent(message, agents);
            return [single];
        } catch (error) {
            logger.warn({ error }, 'Groq decomposeTasks failed, attempting single intent fallback');
            const single = await this.detectIntent(message, agents);
            return [single];
        }
    }

    /**
     * Parses JSON safely from raw string output.
     */
    private parseJsonResponse(rawString: string): any {
        const jsonStart = rawString.indexOf('{');
        const jsonEnd = rawString.lastIndexOf('}');

        if (jsonStart === -1 || jsonEnd === -1) {
            throw new Error('No JSON object found in LLM response.');
        }

        const jsonString = rawString.substring(jsonStart, jsonEnd + 1);
        return JSON.parse(jsonString);
    }
}

export const groqService = new GroqService();
