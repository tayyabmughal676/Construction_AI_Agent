import {ChatGoogleGenerativeAI} from '@langchain/google-genai';
import {env} from '../config/env';
import {logger} from '../config/logger';
import {z} from 'zod';

// --- Zod Schemas for Validation ---
const IntentSchema = z.object({
    department: z.string(),
    confidence: z.number().min(0).max(1),
    action: z.string(),
    reasoning: z.string(),
});

/**
 * Provides access to Google's Gemini models for various AI tasks.
 * This service is a wrapper around the LangChain Google Generative AI client.
 */
class GeminiService {
    private model: ChatGoogleGenerativeAI | null = null;

    constructor() {
        if (!env.GOOGLE_API_KEY) {
            logger.warn('GOOGLE_API_KEY is not set. GeminiService will be disabled.');
        } else {
            try {
                this.model = new ChatGoogleGenerativeAI({
                    apiKey: env.GOOGLE_API_KEY,
                    model: 'gemini-pro',
                    temperature: 0.2, // Lower temperature for more predictable, structured output
                    maxOutputTokens: 1024,
                });
                logger.info('GeminiService initialized successfully.');
            } catch (error) {
                logger.error({
                    error
                }, 'Failed to initialize GeminiService.');
            }
        }
    }

    /**
     * Checks if the Gemini service is available and configured.
     */
    isAvailable(): boolean {
        return this.model !== null;
    }

    /**
     * Detects the user's intent from a message, routing it to the correct department.
     */
    async detectIntent(message: string, availableDepartments: string[]): Promise<z.infer<typeof IntentSchema>> {
        if (!this.isAvailable()) {
            throw new Error('Gemini service is not available.');
        }

        const prompt = `
      You are an intelligent router for a multi-agent system. Your task is to analyze the user's message
      and determine the most appropriate department to handle the request.

      Available departments: ${availableDepartments.join(', ')}

      User message: "${message}"

      Respond in a valid JSON format with the following structure:
      {
        "department": "one of the available departments",
        "action": "a brief, verb-noun description of the user's intent (e.g., 'CREATE_PROJECT', 'QUERY_POLICY')",
        "confidence": a float between 0.0 and 1.0,
        "reasoning": "a brief explanation for your choice"
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
            }, 'Failed to detect intent with Gemini.');
            throw new Error('LLM intent detection failed.');
        }
    }


    /**
     * A robust method to parse JSON from a string, which might contain markdown backticks.
     */
    private parseJsonResponse(rawString: string): any {
        logger.debug(`Raw LLM response: ${rawString}`);

        // Find the start and end of the JSON block
        const jsonStart = rawString.indexOf('{');
        const jsonEnd = rawString.lastIndexOf('}');

        if (jsonStart === -1 || jsonEnd === -1) {
            throw new Error('No JSON object found in the response.');
        }

        const jsonString = rawString.substring(jsonStart, jsonEnd + 1);

        try {
            return JSON.parse(jsonString);
        } catch (error) {
            logger.error({
                jsonString,
                error
            }, 'Failed to parse JSON from LLM response.');
            throw new Error('Invalid JSON format in LLM response.');
        }
    }
}

export const geminiService = new GeminiService();
