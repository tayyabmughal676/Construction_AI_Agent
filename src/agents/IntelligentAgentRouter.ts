import { logger } from '../config/logger';
import { lmStudioService } from '../services/lmstudio';
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
     * to handle the message.
     *
     * @param message The user's input message.
     * @returns A promise that resolves to an intent detection result.
     * @throws An error if the LLM service is unavailable or fails.
     */
    static async detectIntent(message: string): Promise<IntentDetectionResult> {
        if (!lmStudioService.isAvailable()) {
            throw new Error('LM Studio service is not available.');
        }

        logger.info('Using LM Studio to detect intent...');
        const registry = AgentRegistry.getInstance();
        const agentSummaries = registry.getAgentSummaries();

        if (agentSummaries.length === 0) {
            throw new Error('No agents are registered.');
        }

        const detection = await lmStudioService.detectIntent(message, agentSummaries);
        logger.info({
            detection
        }, 'LM Studio intent detection result');

        return detection;
    }
}
