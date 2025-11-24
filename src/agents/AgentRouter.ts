import { AgentRegistry } from './AgentRegistry';
import type { AgentResponse } from './types';
import { logger } from '../config/logger';

/**
 * Department detection result
 */
export interface DepartmentDetection {
    department: string;
    confidence: number;
    reason: string;
}

/**
 * Router configuration
 */
export interface RouterConfig {
    defaultDepartment?: string;
    fallbackEnabled?: boolean;
}

/**
 * AgentRouter - Routes user messages to the appropriate department agent
 * Uses keyword matching and context analysis for department detection
 */
export class AgentRouter {
    private registry: AgentRegistry;
    private config: RouterConfig;

    // Department keywords for intent detection
    private departmentKeywords: Record<string, string[]> = {
        construction: [
            'construction', 'building', 'project', 'contractor', 'site',
            'foundation', 'framing', 'concrete', 'steel', 'material',
            'timeline', 'schedule', 'safety', 'checklist', 'excavation',
            'blueprint', 'permit', 'inspection', 'renovation', 'demolition'
        ],
        manufacturing: [
            'manufacturing', 'production', 'inventory', 'stock', 'warehouse',
            'assembly', 'quality', 'defect', 'equipment', 'maintenance',
            'factory', 'plant', 'machine', 'batch', 'yield', 'capacity',
            'downtime', 'throughput', 'supplier', 'parts'
        ],
        hr: [
            'hr', 'human resources', 'employee', 'staff', 'personnel',
            'hiring', 'recruitment', 'onboarding', 'leave', 'vacation',
            'performance', 'review', 'salary', 'payroll', 'benefits',
            'training', 'termination', 'resignation', 'attendance', 'team'
        ]
    };

    constructor(config: RouterConfig = {}) {
        this.registry = AgentRegistry.getInstance();
        this.config = {
            defaultDepartment: 'construction',
            fallbackEnabled: true,
            ...config
        };
    }

    /**
     * Detect which department should handle the message
     */
    detectDepartment(
        message: string,
        context?: Record<string, any>
    ): DepartmentDetection {
        const messageLower = message.toLowerCase();
        const scores: Record<string, number> = {};

        // Check context for explicit department
        if (context?.department) {
            const dept = context.department.toLowerCase();
            if (this.registry.hasDepartment(dept)) {
                return {
                    department: dept,
                    confidence: 1.0,
                    reason: 'Explicit department specified in context'
                };
            }
        }

        // Score each department based on keyword matches
        for (const [department, keywords] of Object.entries(this.departmentKeywords)) {
            if (!this.registry.hasDepartment(department)) {
                continue; // Skip if agent not registered
            }

            let score = 0;
            const matchedKeywords: string[] = [];

            for (const keyword of keywords) {
                if (messageLower.includes(keyword)) {
                    score += 1;
                    matchedKeywords.push(keyword);
                }
            }

            scores[department] = score;

            logger.debug({
                department,
                score,
                matchedKeywords
            }, 'Department scoring');
        }

        // Find department with highest score
        const sortedDepartments = Object.entries(scores)
            .sort(([, a], [, b]) => b - a);

        if (sortedDepartments.length > 0 && sortedDepartments[0] && sortedDepartments[0][1] > 0) {
            const [department, score] = sortedDepartments[0];
            const totalKeywords = this.departmentKeywords[department]?.length || 1;
            const confidence = Math.min(score / 5, 1.0); // Cap at 1.0

            return {
                department,
                confidence,
                reason: `Matched ${score} keyword(s) related to ${department}`
            };
        }

        // No clear match - use default or first available
        const defaultDept = this.config.defaultDepartment ||
            this.registry.getDepartments()[0] ||
            'construction';

        return {
            department: defaultDept,
            confidence: 0.1,
            reason: 'No specific department detected, using default'
        };
    }

    /**
     * Route a message to the appropriate agent
     */
    async route(
        message: string,
        sessionId: string,
        context?: Record<string, any>
    ): Promise<AgentResponse & { department: string; detection: DepartmentDetection }> {
        try {
            // Detect department
            const detection = this.detectDepartment(message, context);

            logger.info({
                message: message.substring(0, 100),
                detection
            }, 'Routing message');

            // Get the appropriate agent
            const agent = this.registry.getAgent(detection.department);

            if (!agent) {
                throw new Error(`No agent found for department: ${detection.department}`);
            }

            // Process message with the selected agent
            const response = await agent.processMessage(message, sessionId, context);

            return {
                ...response,
                department: detection.department,
                detection
            };

        } catch (error) {
            logger.error({ error, message, sessionId }, 'Error routing message');

            return {
                message: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                sessionId,
                department: 'unknown',
                detection: {
                    department: 'unknown',
                    confidence: 0,
                    reason: 'Error occurred during routing'
                }
            };
        }
    }

    /**
     * Get routing statistics
     */
    getStats(): {
        registeredDepartments: string[];
        totalAgents: number;
        keywordCounts: Record<string, number>;
    } {
        const keywordCounts: Record<string, number> = {};

        for (const [dept, keywords] of Object.entries(this.departmentKeywords)) {
            keywordCounts[dept] = keywords.length;
        }

        return {
            registeredDepartments: this.registry.getDepartments(),
            totalAgents: this.registry.getDepartments().length,
            keywordCounts
        };
    }

    /**
     * Add custom keywords for a department
     */
    addKeywords(department: string, keywords: string[]): void {
        if (!this.departmentKeywords[department]) {
            this.departmentKeywords[department] = [];
        }
        this.departmentKeywords[department].push(...keywords);
        logger.info({ department, count: keywords.length }, 'Added custom keywords');
    }

    /**
     * Get all capabilities across all departments
     */
    getAllCapabilities(): Record<string, string> {
        return this.registry.getAllCapabilities();
    }
}
