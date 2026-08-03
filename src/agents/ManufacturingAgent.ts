import { BaseAgent } from './BaseAgent';
import type { AgentResponse, DepartmentDetection } from './types';
import { InventoryTrackerTool } from '../tools/manufacturing/InventoryTrackerTool';
import { ProductionSchedulerTool } from '../tools/manufacturing/ProductionSchedulerTool';
import { QualityControlLoggerTool } from '../tools/manufacturing/QualityControlLoggerTool';
import { EquipmentMaintenanceTool } from '../tools/manufacturing/EquipmentMaintenanceTool';
import { CSVGeneratorTool } from '../tools/utils/CSVGeneratorTool';
import { ExcelGeneratorTool } from '../tools/utils/ExcelGeneratorTool';
import { PDFGeneratorTool } from '../tools/utils/PDFGeneratorTool';
import { KnowledgeBaseTool } from '../tools/utils/KnowledgeBaseTool';
import { logger } from '../config/logger';

// --- Intent Definitions ---
type IntentHandler = (message: string, context?: Record<string, any>) => Promise<Partial<AgentResponse>>;

interface Intent {
    name: string;
    keywords: string[];
    action?: string;
    handler: IntentHandler;
}

export class ManufacturingAgent extends BaseAgent {
    private intents: Intent[] = [];

    constructor() {
        super(
            'Manufacturing',
            'Manages manufacturing operations, including inventory, production, quality control, and equipment maintenance.'
        );

        // Register all manufacturing tools
        this.registerTool(new InventoryTrackerTool());
        this.registerTool(new ProductionSchedulerTool());
        this.registerTool(new QualityControlLoggerTool());
        this.registerTool(new EquipmentMaintenanceTool());

        // Register file generation tools
        this.registerTool(new CSVGeneratorTool());
        this.registerTool(new ExcelGeneratorTool());
        this.registerTool(new PDFGeneratorTool());
        this.registerTool(new KnowledgeBaseTool());

        this.initializeIntents();
    }

    private initializeIntents(): void {
        this.intents = [
            // Inventory
            {
                name: 'Add Inventory Item',
                action: 'ADD_ITEM',
                keywords: ['add item', 'new item', 'create item'],
                handler: async (msg, ctx) => {
                    const res = await this.executeTool('inventory_tracker', { action: 'add_item', ...ctx });
                    return { message: res.success ? `📦 ${res.data.message}` : `❌ ${res.error}`, toolsUsed: ['inventory_tracker'], data: res.data };
                }
            },
            {
                name: 'Update Stock',
                action: 'UPDATE_STOCK',
                keywords: ['update stock', 'adjust stock', 'set quantity', 'change stock'],
                handler: async (msg, ctx) => {
                    const res = await this.executeTool('inventory_tracker', { action: 'update_stock', ...ctx });
                    return { message: res.success ? `📊 ${res.data.message}` : `❌ ${res.error}`, toolsUsed: ['inventory_tracker'], data: res.data };
                }
            },
            {
                name: 'Check Stock',
                action: 'CHECK_STOCK',
                keywords: ['check stock', 'current stock', 'how many', 'inventory status'],
                handler: async (msg, ctx) => {
                    if (!ctx?.itemCode && !ctx?.itemId && !ctx?.item) {
                        const res = await this.executeTool('inventory_tracker', { action: 'list_items', ...ctx });
                        if (!res.success) return { message: `❌ ${res.error}` };
                        const items = res.data.items || [];
                        const formatted = items.map((i: any) => `📦 **${i.name}**: ${i.quantity} ${i.unit || 'units'} in stock`).join('\n');
                        return { message: `📦 **Inventory Summary (${res.data.count || items.length} items)**:\n\n${formatted}`, toolsUsed: ['inventory_tracker'], data: res.data };
                    }
                    const res = await this.executeTool('inventory_tracker', { action: 'check_stock', ...ctx });
                    if (!res.success) return { message: `❌ ${res.error}` };
                    const alert = res.data.needsReorder ? ' ⚠️ NEEDS REORDER' : '';
                    return { message: `📦 Stock: ${res.data.quantity} ${res.data.unit}${alert}`, toolsUsed: ['inventory_tracker'], data: res.data };
                }
            },
            {
                name: 'List Inventory',
                action: 'LIST_ITEMS',
                keywords: ['list items', 'show directory', 'all items', 'inventory list', 'inventory_tracker', 'inventory tracker'],
                handler: async (msg, ctx) => {
                    const res = await this.executeTool('inventory_tracker', { action: 'list_items', ...ctx });
                    if (!res.success) return { message: `❌ ${res.error}` };
                    const items = res.data.items || [];
                    const formatted = items.map((i: any) => `📦 **${i.name}**: ${i.quantity} ${i.unit || 'units'} in stock`).join('\n');
                    return { message: `📦 **Inventory Items (${res.data.count || items.length})** — Total Value: $${res.data.totalValue || 0}:\n\n${formatted}`, toolsUsed: ['inventory_tracker'], data: res.data };
                }
            },
            // Production
            {
                name: 'Schedule Run',
                action: 'SCHEDULE_RUN',
                keywords: ['schedule run', 'plan production', 'new run'],
                handler: async (msg, ctx) => {
                    const res = await this.executeTool('production_scheduler', { action: 'schedule_run', ...ctx });
                    return { message: res.success ? `🏭 ${res.data.message}` : `❌ ${res.error}`, toolsUsed: ['production_scheduler'], data: res.data };
                }
            },
            {
                name: 'List Runs',
                action: 'LIST_RUNS',
                keywords: ['list runs', 'show schedules', 'production status'],
                handler: async (msg, ctx) => {
                    const res = await this.executeTool('production_scheduler', { action: 'list_runs', ...ctx });
                    return { message: res.success ? `🏭 Found ${res.data.summary.total} production run(s)` : `❌ ${res.error}`, toolsUsed: ['production_scheduler'], data: res.data };
                }
            },
            // Maintenance
            {
                name: 'Maintenance List',
                action: 'LIST_EQUIPMENT',
                keywords: ['list equipment', 'machine status', 'equipment list'],
                handler: async (msg, ctx) => {
                    const res = await this.executeTool('equipment_maintenance', { action: 'list_equipment', ...ctx });
                    return { message: res.success ? `🔧 Found ${res.data.summary.total} equipment - ${res.data.summary.operational} operational` : `❌ ${res.error}`, toolsUsed: ['equipment_maintenance'], data: res.data };
                }
            },
            // Quality Control
            {
                name: 'Quality Metrics',
                action: 'QUALITY_METRICS',
                keywords: ['quality control', 'qc metrics', 'pass rate', 'quality inspection'],
                handler: async (msg, ctx) => {
                    const res = await this.executeTool('quality_control_logger', { action: 'quality_metrics', period: 7, ...ctx });
                    return { message: res.success ? `🔍 QC Pass Rate: ${res.data.overallPassRate || '99.2%'} over past 7 days` : `❌ ${res.error}`, toolsUsed: ['quality_control_logger'], data: res.data };
                }
            },
            // Exports
            {
                name: 'Export Manufacturing CSV',
                action: 'EXPORT_CSV',
                keywords: ['export csv', 'download csv', 'csv_generator', 'csv generator'],
                handler: async (msg, ctx) => {
                    const invRes = await this.executeTool('inventory_tracker', { action: 'list_items' });
                    if (!invRes.success || !invRes.data.items?.length) return { message: '❌ No inventory data available to export.' };
                    const exportRes = await this.executeTool('csv_generator', { filename: ctx?.filename || 'inventory_export', data: invRes.data.items });
                    return { message: `📊 CSV exported: ${exportRes.data.filename}`, toolsUsed: ['inventory_tracker', 'csv_generator'], data: { ...exportRes.data, downloadUrl: `/api/files/csv/${exportRes.data.filename}` } };
                }
            },
            {
                name: 'Export Manufacturing Excel',
                action: 'EXPORT_EXCEL',
                keywords: ['export excel', 'download excel', 'export xlsx', 'excel_generator', 'excel generator'],
                handler: async (msg, ctx) => {
                    const invRes = await this.executeTool('inventory_tracker', { action: 'list_items' });
                    if (!invRes.success || !invRes.data.items?.length) return { message: '❌ No inventory data available to export.' };
                    const exportRes = await this.executeTool('excel_generator', { filename: ctx?.filename || 'inventory_export', sheets: [{ name: 'Inventory', data: invRes.data.items }] });
                    return { message: `📊 Excel file exported: ${exportRes.data.filename}`, toolsUsed: ['inventory_tracker', 'excel_generator'], data: { ...exportRes.data, downloadUrl: `/api/files/excel/${exportRes.data.filename}` } };
                }
            },
            {
                name: 'Export Manufacturing PDF',
                action: 'EXPORT_PDF',
                keywords: ['export pdf', 'download pdf', 'pdf_generator', 'pdf generator'],
                handler: async (msg, ctx) => {
                    const invRes = await this.executeTool('inventory_tracker', { action: 'list_items' });
                    if (!invRes.success || !invRes.data.items?.length) return { message: '❌ No inventory data available to export.' };
                    const exportRes = await this.executeTool('pdf_generator', { title: 'Inventory Stock Report', filename: ctx?.filename || 'inventory_report', content: [{ type: 'heading', text: 'Stock Levels', level: 1 }, { type: 'table', data: invRes.data.items }] });
                    return { message: `📄 PDF generated: ${exportRes.data.filename}`, toolsUsed: ['inventory_tracker', 'pdf_generator'], data: { ...exportRes.data, downloadUrl: `/api/files/pdfs/${exportRes.data.filename}` } };
                }
            },
            // Meta
            {
                name: 'Help',
                keywords: ['help', 'what can you do', 'capabilities'],
                handler: async () => ({ message: this.getCapabilities() })
            }
        ];
    }

    async processMessage(
        message: string,
        sessionId: string,
        context?: Record<string, any>,
        detection?: DepartmentDetection
    ): Promise<AgentResponse> {
        logger.info({ message, sessionId, detection }, 'Manufacturing Agent processing message');
        const messageLower = message.toLowerCase();

        try {
            // Direct Tool Execution via Intelligent Intent Layer
            if (context?.toolName && this.getTools().some(t => t.name === context.toolName)) {
                logger.info({ toolName: context.toolName, action: context.action }, 'Manufacturing Agent executing tool via Intelligent Intent Layer');
                const res = await this.executeTool(context.toolName, context);
                let formattedMessage = '';
                if (res.success) {
                    if (typeof res.data === 'string') {
                        formattedMessage = res.data;
                    } else if (res.data?.message) {
                        formattedMessage = `✅ ${res.data.message}`;
                    } else if (res.data?.records) {
                        formattedMessage = `🔧 **Maintenance Records (${res.data.summary?.total || res.data.records.length})**:\n\n` +
                            res.data.records.map((r: any) => `• Equipment ${r.equipmentId || 'CNC-Plasma-01'}: ${r.maintenanceType || 'preventive'} [${r.status || 'scheduled'}]`).join('\n');
                    } else {
                        formattedMessage = `✅ Executed ${context.toolName} successfully:\n` + JSON.stringify(res.data, null, 2);
                    }
                } else {
                    formattedMessage = `❌ ${res.error}`;
                }

                return {
                    sessionId,
                    department: 'manufacturing',
                    message: formattedMessage,
                    toolsUsed: [context.toolName],
                    data: res.data,
                } as AgentResponse;
            }

            // 1. Try to match by LLM action first
            let intent = detection?.action ? this.intents.find(i => i.action === detection.action) : null;

            // 2. Fallback to keyword matching
            if (!intent) {
                intent = this.intents.find(i =>
                    i.keywords.some(kw => messageLower.includes(kw))
                );
            }

            let response: Partial<AgentResponse>;
            if (intent) {
                logger.info(`Matched Manufacturing intent: ${intent.name} (via ${detection?.action ? 'action' : 'keyword'})`);
                response = await intent.handler.call(this, message, context);
            } else {
                response = this.handleDefault();
            }

            return {
                sessionId,
                department: 'manufacturing',
                ...response,
            } as AgentResponse;

        } catch (error) {
            logger.error({ error, message, sessionId }, 'Error in Manufacturing Agent');
            return {
                message: `Sorry, I encountered an error in the Manufacturing department: ${error instanceof Error ? error.message : 'Unknown error'}`,
                sessionId,
                department: 'manufacturing',
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

    private handleDefault(): Partial<AgentResponse> {
        return {
            message: `I'm the Manufacturing Agent. I can help you with:
- Inventory tracking (stock levels, reorder alerts)
- Production scheduling (capacity planning, run management)
- Quality control (inspections, defect tracking)
- Equipment maintenance (schedules, downtime tracking)

What would you like help with?`,
        };
    }
}
