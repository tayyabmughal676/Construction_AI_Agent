import { logger } from '../config/logger';
import { lmStudioService } from '../services/lmstudio';
import { groqService } from '../services/groq';
import { AgentRegistry } from './AgentRegistry';

/**
 * Represents the result of an LLM-based intent detection.
 */
export interface IntentDetectionResult {
    department: string;
    confidence: number;
    reasoning: string;
    action?: string; // e.g., 'CREATE_PROJECT'
    parameters?: Record<string, any>; // Extracted entities (e.g., name, id)
}

/**
 * IntelligentAgentRouter uses a Large Language Model (LLM) to determine the
 * most appropriate agent for a given user message.
 */
export class IntelligentAgentRouter {

    /**
     * Detects the user's intent using an LLM, determining the best department
     * to handle the message. Primary provider: Groq, Fallback: LM Studio.
     *
     * @param message The user's input message.
     * @returns A promise that resolves to an intent detection result.
     * @throws An error if no LLM service is available or fails.
     */
    static async detectIntent(message: string): Promise<IntentDetectionResult> {
        const registry = AgentRegistry.getInstance();
        const agentSummaries = registry.getAgentSummaries();

        if (agentSummaries.length === 0) {
            throw new Error('No agents are registered.');
        }

        // 1. Try Groq AI service if available
        if (groqService.isAvailable()) {
            try {
                logger.info('Using Groq AI to detect intent...');
                const detection = await groqService.detectIntent(message, agentSummaries);
                logger.info({ detection }, 'Groq intent detection result');
                return detection;
            } catch (error) {
                logger.warn({ error }, 'Groq intent detection failed; attempting LM Studio fallback...');
            }
        }

        // 2. Try LM Studio service if available
        if (lmStudioService.isAvailable()) {
            logger.info('Using LM Studio to detect intent...');
            const detection = await lmStudioService.detectIntent(message, agentSummaries);
            logger.info({ detection }, 'LM Studio intent detection result');
            return detection;
        }

        throw new Error('No LLM service (Groq or LM Studio) is available.');
    }
}
