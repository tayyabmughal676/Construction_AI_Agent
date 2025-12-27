import { BaseAgent } from './BaseAgent';
import type { AgentResponse, DepartmentDetection } from './types';
import { ProjectTrackerTool } from '../tools/construction/ProjectTrackerTool';
import { MaterialCostCalculatorTool } from '../tools/construction/MaterialCostCalculatorTool';
import { TimelineEstimatorTool } from '../tools/construction/TimelineEstimatorTool';
import { SafetyChecklistTool } from '../tools/construction/SafetyChecklistTool';
import { CSVGeneratorTool } from '../tools/utils/CSVGeneratorTool';
import { ExcelGeneratorTool } from '../tools/utils/ExcelGeneratorTool';
import { PDFGeneratorTool } from '../tools/utils/PDFGeneratorTool';
import { logger } from '../config/logger';

// Type definitions for our intent-based routing
type IntentHandler = (
    message: string,
    context?: Record<string, any>
) => Promise<Partial<AgentResponse>>;

interface Intent {
    name: string;
    keywords: string[];
    action?: string;
    handler: IntentHandler;
}

export class ConstructionAgent extends BaseAgent {
    private intents: Intent[] = [];

    constructor() {
        super(
            'Construction',
            'Manages construction projects, including tracking, cost estimation, and timeline planning.'
        );
        this.initializeTools();
        this.initializeIntents();
    }

    private initializeTools(): void {
        this.registerTool(new ProjectTrackerTool());
        this.registerTool(new MaterialCostCalculatorTool());
        this.registerTool(new TimelineEstimatorTool());
        this.registerTool(new SafetyChecklistTool());
        this.registerTool(new CSVGeneratorTool());
        this.registerTool(new ExcelGeneratorTool());
        this.registerTool(new PDFGeneratorTool());
    }

    /**
     * Defines the mapping from keywords and actions to agent actions.
     */
    private initializeIntents(): void {
        this.intents = [
            // Project Tracking
            {
                name: 'Create Project',
                action: 'CREATE_PROJECT',
                keywords: ['create project', 'new project'],
                handler: this.handleCreateProject,
            },
            {
                name: 'List Projects',
                action: 'LIST_PROJECTS',
                keywords: ['list project', 'show project', 'view all projects'],
                handler: this.handleListProjects,
            },
            // Cost & Timeline
            {
                name: 'Calculate Material Cost',
                action: 'CALCULATE_COST',
                keywords: ['material cost', 'calculate cost'],
                handler: this.handleCalculateMaterialCost,
            },
            {
                name: 'Estimate Timeline',
                action: 'ESTIMATE_TIMELINE',
                keywords: ['timeline', 'schedule', 'estimate duration'],
                handler: this.handleEstimateTimeline,
            },
            // Safety
            {
                name: 'Generate Safety Checklist',
                action: 'GENERATE_CHECKLIST',
                keywords: ['safety', 'checklist'],
                handler: this.handleGenerateSafetyChecklist,
            },
            // Exporting
            {
                name: 'Export to CSV',
                action: 'EXPORT_CSV',
                keywords: ['export csv', 'download csv'],
                handler: (msg, ctx) => this.handleExport('csv', ctx),
            },
            {
                name: 'Export to Excel',
                action: 'EXPORT_EXCEL',
                keywords: ['export excel', 'download excel', 'export xlsx'],
                handler: (msg, ctx) => this.handleExport('excel', ctx),
            },
            {
                name: 'Export to PDF',
                action: 'EXPORT_PDF',
                keywords: ['export pdf', 'download pdf'],
                handler: (msg, ctx) => this.handleExport('pdf', ctx),
            },
            // Meta
            {
                name: 'Help',
                keywords: ['help', 'what can you do', 'capabilities'],
                handler: this.handleHelp,
            },
        ];
    }

    /**
     * Processes the user's message by finding and executing the first matching intent.
     */
    async processMessage(
        message: string,
        sessionId: string,
        context?: Record<string, any>,
        detection?: DepartmentDetection
    ): Promise<AgentResponse> {
        logger.info({ message, sessionId, detection }, 'Processing construction agent message');
        const lowerMessage = message.toLowerCase();

        try {
            // 1. Try to match by LLM action first
            let intent = detection?.action ? this.intents.find(i => i.action === detection.action) : null;

            // 2. Fallback to keyword matching
            if (!intent) {
                intent = this.intents.find(i =>
                    i.keywords.some(kw => lowerMessage.includes(kw))
                );
            }

            let response: Partial<AgentResponse>;

            if (intent) {
                logger.info(`Matched Construction intent: ${intent.name} (via ${detection?.action ? 'action' : 'keyword'})`);
                response = await intent.handler.call(this, message, context);
            } else {
                response = this.handleDefault();
            }

            return {
                sessionId,
                department: 'construction',
                ...response,
            } as AgentResponse;

        } catch (error) {
            logger.error({ error }, 'Error processing construction agent message');
            return {
                message: `❌ An unexpected error occurred: ${error instanceof Error ? error.message : 'Unknown error'} `,
                sessionId,
                department: 'construction',
            };
        }
    }

    // --- Intent Handlers ---

    private async handleCreateProject(message: string, context: any): Promise<Partial<AgentResponse>> {
        const result = await this.executeTool('project_tracker', {
            action: 'create',
            name: context?.projectName || 'New Construction Project',
            description: context?.description,
            budget: context?.budget,
        });
        return {
            message: result.success ? `✅ ${result.data.message} ` : `❌ Error: ${result.error} `,
            toolsUsed: ['project_tracker'],
            data: result.data,
        };
    }

    private async handleListProjects(message: string, context: any): Promise<Partial<AgentResponse>> {
        const result = await this.executeTool('project_tracker', {
            action: 'list'
        });
        return {
            message: result.success ? `📋 Found ${result.data.count} project(s).` : `❌ Error: ${result.error} `,
            toolsUsed: ['project_tracker'],
            data: result.data,
        };
    }

    private async handleCalculateMaterialCost(message: string, context: any): Promise<Partial<AgentResponse>> {
        const materials = context?.materials || [{
            material: 'concrete',
            quantity: 10,
            unit: 'cubic yards'
        }, {
            material: 'steel',
            quantity: 2,
            unit: 'tons'
        },];
        const result = await this.executeTool('material_cost_calculator', {
            materials
        });
        return {
            message: result.success ? `💰 Total material cost: $${result.data.grandTotal.toFixed(2)} ` : `❌ Error: ${result.error} `,
            toolsUsed: ['material_cost_calculator'],
            data: result.data,
        };
    }

    private async handleEstimateTimeline(message: string, context: any): Promise<Partial<AgentResponse>> {
        const tasks = context?.tasks || [{
            name: 'Site preparation',
            duration: 5
        }, {
            name: 'Foundation',
            duration: 10
        }, {
            name: 'Framing',
            duration: 15
        },];
        const result = await this.executeTool('timeline_estimator', {
            projectName: context?.projectName || 'Construction Project',
            tasks,
            startDate: context?.startDate,
        });
        return {
            message: result.success ? `📅 Project '${result.data.projectName}' will take ${result.data.totalDuration} days.` : `❌ Error: ${result.error} `,
            toolsUsed: ['timeline_estimator'],
            data: result.data,
        };
    }

    private async handleGenerateSafetyChecklist(message: string, context: any): Promise<Partial<AgentResponse>> {
        const result = await this.executeTool('safety_checklist_generator', {
            projectType: context?.projectType || 'General Construction',
            phase: context?.phase,
        });
        return {
            message: result.success ? `✅ Safety checklist generated with ${result.data.totalItems} items.` : `❌ Error: ${result.error} `,
            toolsUsed: ['safety_checklist_generator'],
            data: result.data,
        };
    }

    private async handleExport(format: 'csv' | 'excel' | 'pdf', context: any): Promise<Partial<AgentResponse>> {
        const projectsResult = await this.executeTool('project_tracker', {
            action: 'list'
        });
        if (!projectsResult.success || !projectsResult.data.projects?.length) {
            return {
                message: '❌ No project data available to export.'
            };
        }
        const projects = projectsResult.data.projects;

        let exportResult;
        switch (format) {
            case 'csv':
                exportResult = await this.executeTool('csv_generator', {
                    filename: context?.filename || 'projects_export',
                    data: projects,
                });
                return {
                    message: `📊 CSV exported: ${exportResult.data.filename} `,
                    toolsUsed: ['project_tracker', 'csv_generator'],
                    data: exportResult.data,
                };
            case 'excel':
                exportResult = await this.executeTool('excel_generator', {
                    filename: context?.filename || 'projects_export',
                    sheets: [{
                        name: 'Projects',
                        data: projects
                    }],
                });
                return {
                    message: `📊 Excel file exported: ${exportResult.data.filename} `,
                    toolsUsed: ['project_tracker', 'excel_generator'],
                    data: exportResult.data,
                };
            case 'pdf':
                exportResult = await this.executeTool('pdf_generator', {
                    title: 'Construction Projects Report',
                    filename: context?.filename || 'projects_report',
                    content: [{
                        type: 'heading',
                        text: 'Construction Projects',
                        level: 1
                    }, {
                        type: 'table',
                        data: projects
                    },],
                });
                return {
                    message: `📄 PDF generated: ${exportResult.data.filename} `,
                    toolsUsed: ['project_tracker', 'pdf_generator'],
                    data: exportResult.data,
                };
        }
    }

    /**
     * Returns a list of supported action IDs for LLM routing.
     */
    getSupportedActions(): string[] {
        return this.intents
            .map(i => i.action)
            .filter((a): a is string => !!a);
    }

    private handleHelp(): Promise<Partial<AgentResponse>> {
        return Promise.resolve({
            message: this.getCapabilities()
        });
    }

    private handleDefault(): Partial<AgentResponse> {
        return {
            message: `I can help with construction tasks.Try asking me to: \n` +
                `• "Create a new project"\n` +
                `• "Show all projects"\n` +
                `• "Calculate material costs"\n` +
                `• "Estimate a project timeline"\n` +
                `• "Export projects to CSV"`,
        };
    }
}
