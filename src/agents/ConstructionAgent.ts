import { BaseAgent } from './BaseAgent';
import type { AgentResponse } from './types';
import { ProjectTrackerTool } from '../tools/construction/ProjectTrackerTool';
import { MaterialCostCalculatorTool } from '../tools/construction/MaterialCostCalculatorTool';
import { TimelineEstimatorTool } from '../tools/construction/TimelineEstimatorTool';
import { SafetyChecklistTool } from '../tools/construction/SafetyChecklistTool';
import { logger } from '../config/logger';

export class ConstructionAgent extends BaseAgent {
    constructor() {
        super('Construction');
        this.initializeTools();
    }

    private initializeTools(): void {
        this.registerTool(new ProjectTrackerTool());
        this.registerTool(new MaterialCostCalculatorTool());
        this.registerTool(new TimelineEstimatorTool());
        this.registerTool(new SafetyChecklistTool());
    }

    async processMessage(
        message: string,
        sessionId: string,
        context?: Record<string, any>
    ): Promise<AgentResponse> {
        logger.info({ message, sessionId }, 'Processing construction agent message');

        const lowerMessage = message.toLowerCase();

        // Simple intent detection (we'll enhance this with LLM in Phase 4)
        try {
            // Project tracking
            if (lowerMessage.includes('create project') || lowerMessage.includes('new project')) {
                const result = await this.executeTool('project_tracker', {
                    action: 'create',
                    name: context?.projectName || 'New Construction Project',
                    description: context?.description,
                    budget: context?.budget,
                });

                return {
                    message: result.success
                        ? `✅ ${result.data.message}`
                        : `❌ Error: ${result.error}`,
                    toolsUsed: ['project_tracker'],
                    data: result.data,
                    sessionId,
                };
            }

            if (lowerMessage.includes('list project') || lowerMessage.includes('show project')) {
                const result = await this.executeTool('project_tracker', { action: 'list' });

                return {
                    message: result.success
                        ? `📋 Found ${result.data.count} project(s)`
                        : `❌ Error: ${result.error}`,
                    toolsUsed: ['project_tracker'],
                    data: result.data,
                    sessionId,
                };
            }

            // Material costs
            if (lowerMessage.includes('material cost') || lowerMessage.includes('calculate cost')) {
                const materials = context?.materials || [
                    { material: 'concrete', quantity: 10, unit: 'cubic yards' },
                    { material: 'steel', quantity: 2, unit: 'tons' },
                ];

                const result = await this.executeTool('material_cost_calculator', { materials });

                return {
                    message: result.success
                        ? `💰 Total cost: $${result.data.grandTotal.toFixed(2)}`
                        : `❌ Error: ${result.error}`,
                    toolsUsed: ['material_cost_calculator'],
                    data: result.data,
                    sessionId,
                };
            }

            // Timeline estimation
            if (lowerMessage.includes('timeline') || lowerMessage.includes('schedule')) {
                const tasks = context?.tasks || [
                    { name: 'Site preparation', duration: 5 },
                    { name: 'Foundation', duration: 10 },
                    { name: 'Framing', duration: 15 },
                    { name: 'Electrical & Plumbing', duration: 10 },
                    { name: 'Finishing', duration: 12 },
                ];

                const result = await this.executeTool('timeline_estimator', {
                    projectName: context?.projectName || 'Construction Project',
                    tasks,
                    startDate: context?.startDate,
                });

                return {
                    message: result.success
                        ? `📅 Project duration: ${result.data.totalDuration} days (${result.data.startDate} to ${result.data.estimatedEndDate})`
                        : `❌ Error: ${result.error}`,
                    toolsUsed: ['timeline_estimator'],
                    data: result.data,
                    sessionId,
                };
            }

            // Safety checklist
            if (lowerMessage.includes('safety') || lowerMessage.includes('checklist')) {
                const result = await this.executeTool('safety_checklist_generator', {
                    projectType: context?.projectType || 'General Construction',
                    phase: context?.phase,
                });

                return {
                    message: result.success
                        ? `✅ Safety checklist generated with ${result.data.totalItems} items`
                        : `❌ Error: ${result.error}`,
                    toolsUsed: ['safety_checklist_generator'],
                    data: result.data,
                    sessionId,
                };
            }

            // Help/capabilities
            if (lowerMessage.includes('help') || lowerMessage.includes('what can you do')) {
                return {
                    message: this.getCapabilities(),
                    sessionId,
                };
            }

            // Default response
            return {
                message: `I'm the Construction Agent. I can help with:\n` +
                    `• Project tracking (create, list projects)\n` +
                    `• Material cost calculations\n` +
                    `• Timeline estimation\n` +
                    `• Safety checklists\n\n` +
                    `Try asking: "create a new project", "calculate material costs", "generate timeline", or "safety checklist"`,
                sessionId,
            };

        } catch (error) {
            logger.error({ error }, 'Error processing construction agent message');
            return {
                message: `❌ Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                sessionId,
            };
        }
    }
}
