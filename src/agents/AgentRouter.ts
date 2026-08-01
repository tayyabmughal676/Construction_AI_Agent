import { AgentRegistry } from './AgentRegistry';
import type { AgentResponse, DepartmentDetection } from './types';
import { logger } from '../config/logger';
import { IntelligentAgentRouter } from './IntelligentAgentRouter';

/**
 * Configuration for the AgentRouter.
 */
export interface RouterConfig {
    defaultDepartment?: string;
    llmEnabled?: boolean; // Feature flag for LLM routing
}

/**
 * AgentRouter is responsible for routing user messages to the appropriate agent.
 * It uses a hybrid approach:
 * 1. LLM-based intent detection (if enabled).
 * 2. Keyword-based detection as a fallback.
 * 3. Explicit context-based routing.
 */
export class AgentRouter {
    private registry: AgentRegistry;
    private config: RouterConfig;

    constructor(config: RouterConfig = {}) {
        this.registry = AgentRegistry.getInstance();
        this.config = {
            defaultDepartment: 'construction',
            llmEnabled: true, // Enable LLM by default
            ...config,
        };
    }

    /**
     * Detects the most appropriate department for a message.
     */
    async detectDepartment(
        message: string,
        context?: Record<string, any>
    ): Promise<DepartmentDetection> {
        // 1. Explicit routing from context
        if (context?.department) {
            const dept = String(context.department).toLowerCase();
            if (this.registry.hasDepartment(dept)) {
                return {
                    department: dept,
                    confidence: 1.0,
                    reason: 'Explicit department specified in context.',
                    method: 'context',
                };
            }
        }

        // 2. LLM-based detection (if enabled)
        if (this.config.llmEnabled) {
            try {
                const llmResult = await IntelligentAgentRouter.detectIntent(message);
                if (this.registry.hasDepartment(llmResult.department)) {
                    return {
                        ...llmResult,
                        reason: llmResult.reasoning,
                        method: 'llm',
                    };
                } else {
                    logger.warn({
                        received: llmResult.department,
                        available: this.registry.getDepartments()
                    }, 'LLM returned a department that is not registered.');
                }
            } catch (error) {
                logger.error({
                    error: error instanceof Error ? { message: error.message, stack: error.stack } : error,
                    message
                }, 'Intelligent intent detection failed.');
            }
        }

        // 3. Keyword-based fallback
        return this.detectDepartmentByKeywords(message);
    }


    /**
     * Routes the message to the detected agent and returns its response.
     * Low-confidence matches receive a unified multi-agent welcome.
     */
    async route(
        message: string,
        sessionId: string,
        context?: Record<string, any>
    ): Promise<AgentResponse & {
        detection: DepartmentDetection
    }> {
        const detection = await this.detectDepartment(message, context);
        logger.info({
            detection
        }, 'Routing message');

        // If confidence is very low (generic greeting, vague message),
        // return a unified welcome listing ALL departments (unless it's an explicit export action).
        if (detection.confidence < 0.4 && !detection.action?.startsWith('EXPORT_')) {
            const summaries = this.registry.getAgentSummaries();
            const sections = summaries.map(agent => {
                const icon = agent.department === 'construction' ? '🏗️' :
                             agent.department === 'manufacturing' ? '🏭' :
                             agent.department === 'hr' ? '👥' : '🤖';
                const actions = agent.actions
                    .filter(a => !['EXPORT_CSV', 'EXPORT_EXCEL', 'EXPORT_PDF'].includes(a))
                    .slice(0, 5)
                    .map(a => a.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()))
                    .join(', ');
                return `${icon} **${agent.name}** — ${actions}`;
            });

            return {
                message: `Hello! I'm the Construction AI multi-agent system. I can help with:\n\n` +
                    sections.join('\n\n') +
                    `\n\nJust describe what you need and I'll route you to the right agent automatically!`,
                sessionId,
                department: 'system',
                toolsUsed: [],
                detection: {
                    ...detection,
                    department: 'system',
                    reason: 'Generic greeting — showing unified capabilities.',
                },
            };
        }

        const agent = this.registry.getAgent(detection.department);
        if (!agent) {
            const errorMsg = `No agent found for department: '${detection.department}'.`;
            logger.error(errorMsg);
            return {
                message: `Sorry, I can't find an agent for the '${detection.department}' department.`,
                sessionId,
                department: 'unknown',
                detection: {
                    ...detection,
                    reason: errorMsg
                },
            };
        }

        // Merge LLM-extracted parameters into context
        const mergedContext = {
            ...context,
            ...(detection.parameters || {})
        };

        const response = await agent.processMessage(message, sessionId, mergedContext, detection);
        return {
            ...response,
            department: detection.department,
            detection,
        };
    }

    /**
     * Fallback method to detect department using agent summaries and descriptions.
     * This replaces the hardcoded keyword lists.
     */
    private detectDepartmentByKeywords(message: string): DepartmentDetection {
        const messageLower = message.toLowerCase();
        const summaries = this.registry.getAgentSummaries();
        const defaultDepartment = this.config.defaultDepartment || 'construction';

        let bestMatch = {
            department: defaultDepartment,
            score: 0,
            reason: 'No specific matches found; using default.'
        };

        for (const agent of summaries) {
            let score = 0;
            const dept = agent.department.toLowerCase();
            const desc = agent.description.toLowerCase();

            // 1. Direct department name match (highest weight)
            if (messageLower.includes(dept)) score += 10;

            // 2. Specialized terminology match from description
            const terms = desc.split(/[\s,.]+/).filter(t => t.length > 3);
            for (const term of terms) {
                if (messageLower.includes(term)) score += 2;
            }

            if (score > bestMatch.score) {
                bestMatch = {
                    department: dept,
                    score,
                    reason: `Matched specialized terminology for the ${agent.name} department.`
                };
            }
        }

        const confidence = Math.min(bestMatch.score / 15, 1.0);

        return {
            department: bestMatch.department,
            confidence: confidence > 0 ? confidence : 0.1,
            reason: bestMatch.score > 0 ? bestMatch.reason : 'No agents identified; defaulting to Construction.',
            method: 'keyword',
        };
    }

    // --- Utility Methods ---
    getStats() {
        return {
            registeredDepartments: this.registry.getDepartments(),
            llmEnabled: this.config.llmEnabled,
            agentSummaries: this.registry.getAgentSummaries().length,
        };
    }

    getAllCapabilities() {
        return this.registry.getAllCapabilities();
    }
}
