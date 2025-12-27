import { ChatOpenAI } from '@langchain/openai';
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

/**
 * Provides access to LM Studio models for various AI tasks.
 * This service is a wrapper around the LangChain OpenAI client, 
 * configured to use LM Studio's local server.
 */
class LMStudioService {
    private model: ChatOpenAI | null = null;

    constructor() {
        const baseUrl = env.LM_STUDIO_URL;
        const modelName = env.LM_STUDIO_MODEL;

        try {
            this.model = new ChatOpenAI({
                openAIApiKey: 'not-needed',
                modelName: modelName,
                configuration: {
                    baseURL: baseUrl,
                },
                temperature: 0.1, // Lower temperature for more consistent JSON
                maxTokens: 1024,
            });
            logger.info({ baseUrl, modelName }, 'LMStudioService initialized successfully.');
        } catch (error) {
            logger.error({
                error
            }, 'Failed to initialize LMStudioService.');
        }
    }

    /**
     * Checks if the LM Studio service is available and configured.
     */
    isAvailable(): boolean {
        return this.model !== null;
    }

    /**
     * Detects the user's intent from a message, routing it to the correct department.
     */
    async detectIntent(
        message: string,
        agents: { department: string; name: string; description: string; actions: string[] }[]
    ): Promise<z.infer<typeof IntentSchema>> {
        if (!this.isAvailable()) {
            throw new Error('LM Studio service is not available.');
        }

        const agentContext = agents
            .map(a => `- ${a.department.toUpperCase()}: ${a.description}\n  Supported Actions: ${a.actions.join(', ')}`)
            .join('\n');

        const prompt = `
      You are an intelligent router for a multi-agent system. Your task is to analyze the user's message
      and determine the most appropriate department and action to handle the request.

      Available Agents and their responsibilities:
      ${agentContext}

      User message: "${message}"

      Task:
      1. Identify the 'department'.
      2. Identify the 'action' ONLY from the "Supported Actions" list for that department.
      3. Extract any 'parameters' (e.g., employee name, project name, item quantity, dates, IDs). 
         - For employee searches, put the name in "name".
         - For inventory, put the item name in "item" and quantity in "quantity".
      4. Assign a 'confidence' score (0.0 to 1.0).
      5. Provide 'reasoning' for your choice.

      Respond in valid JSON:
      {
        "department": "...",
        "action": "...",
        "parameters": { ... },
        "confidence": 0.0,
        "reasoning": "..."
      }
    `;

        try {
            const response = await this.model!.invoke(prompt);
            const content = response.content.toString();
            const jsonData = this.parseJsonResponse(content);

            // Validate the response against the schema
            const validatedData = IntentSchema.parse(jsonData);
            return validatedData;

        } catch (error) {
            logger.error({
                error,
                message
            }, 'Failed to detect intent with LM Studio.');
            throw new Error('LLM intent detection failed.');
        }
    }

    /**
     * A robust method to parse JSON from a string, which might contain markdown backticks,
     * preamble text, or 'thought' blocks.
     */
    private parseJsonResponse(rawString: string): any {
        logger.debug({ rawString }, 'Parsing LLM response');

        // 1. Try to find the JSON block delimited by triple backticks
        const markdownMatch = rawString.match(/```(?:json)?\s*([\s\S]*?)```/);
        if (markdownMatch && markdownMatch[1]) {
            try {
                return JSON.parse(markdownMatch[1].trim());
            } catch (e) {
                // If backticks failed, fall through to raw parsing
            }
        }

        // 2. Look for the largest section that looks like a JSON object containing "department"
        // This helps skip "thought" blocks or empty {} emitted by some models
        const startChars = [...rawString.matchAll(/\{/g)].map(m => m.index);
        const endChars = [...rawString.matchAll(/\}/g)].map(m => m.index);

        for (let i = 0; i < startChars.length; i++) {
            for (let j = endChars.length - 1; j >= 0; j--) {
                const start = startChars[i];
                const end = endChars[j];

                if (start !== undefined && end !== undefined && start < end) {
                    const potentialJson = rawString.substring(start, end + 1);
                    if (potentialJson.includes('"department"') || potentialJson.includes('department')) {
                        try {
                            return JSON.parse(potentialJson);
                        } catch (e) {
                            // Continue searching
                        }
                    }
                }
            }
        }

        // 3. Fallback to the original simple approach if all else fails
        const jsonStart = rawString.indexOf('{');
        const jsonEnd = rawString.lastIndexOf('}');

        if (jsonStart !== -1 && jsonEnd !== -1) {
            const jsonString = rawString.substring(jsonStart, jsonEnd + 1);
            try {
                return JSON.parse(jsonString);
            } catch (error) {
                logger.error({ jsonString, error }, 'Failed to parse JSON using fallback logic');
            }
        }

        throw new Error('No valid JSON object found in the response.');
    }
}

export const lmStudioService = new LMStudioService();
