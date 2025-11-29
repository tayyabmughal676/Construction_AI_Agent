import {AgentRegistry} from './AgentRegistry';
import type {AgentResponse} from './types';
import {logger} from '../config/logger';
import {IntelligentAgentRouter} from './IntelligentAgentRouter';

/**
 * Represents the final detection result, including the method used.
 */
export interface DepartmentDetection {
    department: string;
    confidence: number;
    reason: string;
    method: 'llm' | 'keyword' | 'context';
}

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
    private departmentKeywords: Record<string, string[]> = {
        construction: ['construction', 'project', 'site', 'blueprint', 'material'],
        hr: ['hr', 'employee', 'leave', 'payroll', 'hiring'],
    };

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
        context ?: Record<string, any>
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
                }
            } catch (error) {
                logger.warn({
                    error
                }, 'LLM detection failed. Falling back to keyword matching.');
            }
        }

        // 3. Keyword-based fallback
        return this.detectDepartmentByKeywords(message);
    }


    /**
     * Routes the message to the detected agent and returns its response.
     */
    async route(
        message: string,
        sessionId: string,
        context ?: Record<string, any>
    ): Promise<AgentResponse & {
        detection: DepartmentDetection
    }> {
        const detection = await this.detectDepartment(message, context);
        logger.info({
            detection
        }, 'Routing message');

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

        const response = await agent.processMessage(message, sessionId, context);
        return {
            ...response,
            department: detection.department,
            detection,
        };
    }

    /**
     * Fallback method to detect department using keyword matching.
     */
    private detectDepartmentByKeywords(message: string): DepartmentDetection {
        const messageLower = message.toLowerCase();
        const defaultDepartment = this.config.defaultDepartment || 'construction';

        let bestMatch = {
            department: defaultDepartment,
            score: 0
        };

        for (const [department, keywords] of Object.entries(this.departmentKeywords)) {
            if (!this.registry.hasDepartment(department)) continue;

            const score = keywords.filter(kw => messageLower.includes(kw)).length;
            if (score > bestMatch.score) {
                bestMatch = {
                    department,
                    score
                };
            }
        }

        if (bestMatch.score > 0) {
            return {
                department: bestMatch.department,
                confidence: Math.min(bestMatch.score / 3, 1.0), // Simple confidence
                reason: `Matched ${bestMatch.score} keyword(s).`,
                method: 'keyword',
            };
        }

        return {
            department: defaultDepartment,
            confidence: 0.1,
            reason: 'No specific keywords matched; using default department.',
            method: 'keyword',
        };
    }

    // --- Utility Methods ---
    getStats() {
        return {
            registeredDepartments: this.registry.getDepartments(),
            llmEnabled: this.config.llmEnabled,
            keywordCounts: Object.fromEntries(
                Object.entries(this.departmentKeywords).map(([dept, kw]) => [dept, kw.length])
            ),
        };
    }

    getAllCapabilities() {
        return this.registry.getAllCapabilities();
    }
}
