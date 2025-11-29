import {BaseAgent} from './BaseAgent';
import type {AgentResponse} from './types';
import {InventoryTrackerTool} from '../tools/manufacturing/InventoryTrackerTool';
import {ProductionSchedulerTool} from '../tools/manufacturing/ProductionSchedulerTool';
import {QualityControlLoggerTool} from '../tools/manufacturing/QualityControlLoggerTool';
import {EquipmentMaintenanceTool} from '../tools/manufacturing/EquipmentMaintenanceTool';
import {CSVGeneratorTool} from '../tools/utils/CSVGeneratorTool';
import {ExcelGeneratorTool} from '../tools/utils/ExcelGeneratorTool';
import {PDFGeneratorTool} from '../tools/utils/PDFGeneratorTool';
import {logger} from '../config/logger';

export class ManufacturingAgent extends BaseAgent {
    constructor() {
        super('Manufacturing');

        // Register all manufacturing tools
        this.registerTool(new InventoryTrackerTool());
        this.registerTool(new ProductionSchedulerTool());
        this.registerTool(new QualityControlLoggerTool());
        this.registerTool(new EquipmentMaintenanceTool());

        // Register file generation tools
        this.registerTool(new CSVGeneratorTool());
        this.registerTool(new ExcelGeneratorTool());
        this.registerTool(new PDFGeneratorTool());
    }

    async processMessage(
        message: string,
        sessionId: string,
        context?: Record<string, any>
    ): Promise<AgentResponse> {
        logger.info({message, sessionId, context}, 'Manufacturing Agent processing message');

        const messageLower = message.toLowerCase();

        try {
            // Inventory intents
            if (
                messageLower.includes('inventory') ||
                messageLower.includes('stock') ||
                messageLower.includes('warehouse') ||
                messageLower.includes('parts') ||
                messageLower.includes('supplier')
            ) {
                if (messageLower.includes('add') || messageLower.includes('new item')) {
                    const result = await this.executeTool('inventory_tracker', {
                        action: 'add_item',
                        ...context,
                    });

                    if (result.success) {
                        return {
                            message: `📦 ${result.data.message}`,
                            toolsUsed: ['inventory_tracker'],
                            data: result.data,
                            sessionId,
                        };
                    } else {
                        return {
                            message: `❌ ${result.error}`,
                            toolsUsed: ['inventory_tracker'],
                            sessionId,
                        };
                    }
                } else if (messageLower.includes('update') || messageLower.includes('adjust')) {
                    const result = await this.executeTool('inventory_tracker', {
                        action: 'update_stock',
                        ...context,
                    });

                    if (result.success) {
                        return {
                            message: `📊 ${result.data.message}`,
                            toolsUsed: ['inventory_tracker'],
                            data: result.data,
                            sessionId,
                        };
                    } else {
                        return {
                            message: `❌ ${result.error}`,
                            toolsUsed: ['inventory_tracker'],
                            sessionId,
                        };
                    }
                } else if (messageLower.includes('check') || messageLower.includes('status')) {
                    const result = await this.executeTool('inventory_tracker', {
                        action: 'check_stock',
                        ...context,
                    });

                    if (result.success) {
                        const needsReorder = result.data.needsReorder ? ' ⚠️ NEEDS REORDER' : '';
                        return {
                            message: `📦 Stock: ${result.data.quantity} ${result.data.unit}${needsReorder}`,
                            toolsUsed: ['inventory_tracker'],
                            data: result.data,
                            sessionId,
                        };
                    }
                } else if (messageLower.includes('reorder') || messageLower.includes('alert')) {
                    const result = await this.executeTool('inventory_tracker', {
                        action: 'reorder_alert',
                        ...context,
                    });

                    if (result.success) {
                        return {
                            message: `⚠️ ${result.data.message}`,
                            toolsUsed: ['inventory_tracker'],
                            data: result.data,
                            sessionId,
                        };
                    }
                } else if (messageLower.includes('list') || messageLower.includes('all')) {
                    const result = await this.executeTool('inventory_tracker', {
                        action: 'list_items',
                        ...context,
                    });

                    if (result.success) {
                        return {
                            message: `📦 Found ${result.data.count} item(s) - Total value: $${result.data.totalValue}`,
                            toolsUsed: ['inventory_tracker'],
                            data: result.data,
                            sessionId,
                        };
                    }
                }
            }

            // Production scheduling intents
            if (
                messageLower.includes('production') ||
                messageLower.includes('schedule') ||
                messageLower.includes('manufacturing') ||
                messageLower.includes('capacity')
            ) {
                if (messageLower.includes('schedule') && !messageLower.includes('list')) {
                    const result = await this.executeTool('production_scheduler', {
                        action: 'schedule_run',
                        ...context,
                    });

                    if (result.success) {
                        return {
                            message: `🏭 ${result.data.message}`,
                            toolsUsed: ['production_scheduler'],
                            data: result.data,
                            sessionId,
                        };
                    } else {
                        return {
                            message: `❌ ${result.error}`,
                            toolsUsed: ['production_scheduler'],
                            sessionId,
                        };
                    }
                } else if (messageLower.includes('start')) {
                    const result = await this.executeTool('production_scheduler', {
                        action: 'start_run',
                        ...context,
                    });

                    if (result.success) {
                        return {
                            message: `▶️ ${result.data.message}`,
                            toolsUsed: ['production_scheduler'],
                            data: result.data,
                            sessionId,
                        };
                    }
                } else if (messageLower.includes('complete') || messageLower.includes('finish')) {
                    const result = await this.executeTool('production_scheduler', {
                        action: 'complete_run',
                        ...context,
                    });

                    if (result.success) {
                        return {
                            message: `✅ ${result.data.message} - Efficiency: ${result.data.efficiency}`,
                            toolsUsed: ['production_scheduler'],
                            data: result.data,
                            sessionId,
                        };
                    }
                } else if (messageLower.includes('capacity')) {
                    const result = await this.executeTool('production_scheduler', {
                        action: 'capacity_check',
                        ...context,
                    });

                    if (result.success) {
                        return {
                            message: `📊 Capacity utilization: ${result.data.utilization}`,
                            toolsUsed: ['production_scheduler'],
                            data: result.data,
                            sessionId,
                        };
                    }
                } else if (messageLower.includes('list')) {
                    const result = await this.executeTool('production_scheduler', {
                        action: 'list_runs',
                        ...context,
                    });

                    if (result.success) {
                        return {
                            message: `🏭 Found ${result.data.summary.total} production run(s)`,
                            toolsUsed: ['production_scheduler'],
                            data: result.data,
                            sessionId,
                        };
                    }
                }
            }

            // Quality control intents
            if (
                messageLower.includes('quality') ||
                messageLower.includes('inspection') ||
                messageLower.includes('defect') ||
                messageLower.includes('batch')
            ) {
                if (messageLower.includes('log') || messageLower.includes('record') || messageLower.includes('inspection')) {
                    const result = await this.executeTool('quality_control_logger', {
                        action: 'log_inspection',
                        ...context,
                    });

                    if (result.success) {
                        return {
                            message: `✅ ${result.data.message}`,
                            toolsUsed: ['quality_control_logger'],
                            data: result.data,
                            sessionId,
                        };
                    } else {
                        return {
                            message: `❌ ${result.error}`,
                            toolsUsed: ['quality_control_logger'],
                            sessionId,
                        };
                    }
                } else if (messageLower.includes('defect') && messageLower.includes('analysis')) {
                    const result = await this.executeTool('quality_control_logger', {
                        action: 'defect_analysis',
                        ...context,
                    });

                    if (result.success) {
                        return {
                            message: `📊 Defect analysis: ${result.data.totalDefects} total defects`,
                            toolsUsed: ['quality_control_logger'],
                            data: result.data,
                            sessionId,
                        };
                    }
                } else if (messageLower.includes('metrics')) {
                    const result = await this.executeTool('quality_control_logger', {
                        action: 'quality_metrics',
                        ...context,
                    });

                    if (result.success) {
                        return {
                            message: `📈 Quality metrics: ${result.data.overallPassRate} pass rate`,
                            toolsUsed: ['quality_control_logger'],
                            data: result.data,
                            sessionId,
                        };
                    }
                } else if (messageLower.includes('batch')) {
                    const result = await this.executeTool('quality_control_logger', {
                        action: 'batch_quality',
                        ...context,
                    });

                    if (result.success) {
                        return {
                            message: `📦 Batch ${result.data.batchNumber}: ${result.data.batchStatus} (${result.data.averagePassRate})`,
                            toolsUsed: ['quality_control_logger'],
                            data: result.data,
                            sessionId,
                        };
                    }
                } else if (messageLower.includes('list')) {
                    const result = await this.executeTool('quality_control_logger', {
                        action: 'list_inspections',
                        ...context,
                    });

                    if (result.success) {
                        return {
                            message: `📋 Found ${result.data.summary.total} inspection(s) - Avg pass rate: ${result.data.summary.averagePassRate}`,
                            toolsUsed: ['quality_control_logger'],
                            data: result.data,
                            sessionId,
                        };
                    }
                }
            }

            // Equipment maintenance intents
            if (
                messageLower.includes('equipment') ||
                messageLower.includes('maintenance') ||
                messageLower.includes('machine') ||
                messageLower.includes('downtime')
            ) {
                if (messageLower.includes('register') || messageLower.includes('add equipment')) {
                    const result = await this.executeTool('equipment_maintenance', {
                        action: 'register_equipment',
                        ...context,
                    });

                    if (result.success) {
                        return {
                            message: `🔧 ${result.data.message}`,
                            toolsUsed: ['equipment_maintenance'],
                            data: result.data,
                            sessionId,
                        };
                    } else {
                        return {
                            message: `❌ ${result.error}`,
                            toolsUsed: ['equipment_maintenance'],
                            sessionId,
                        };
                    }
                } else if (messageLower.includes('schedule') && messageLower.includes('maintenance')) {
                    const result = await this.executeTool('equipment_maintenance', {
                        action: 'schedule_maintenance',
                        ...context,
                    });

                    if (result.success) {
                        return {
                            message: `📅 ${result.data.message}`,
                            toolsUsed: ['equipment_maintenance'],
                            data: result.data,
                            sessionId,
                        };
                    }
                } else if (messageLower.includes('status')) {
                    const result = await this.executeTool('equipment_maintenance', {
                        action: 'equipment_status',
                        ...context,
                    });

                    if (result.success) {
                        return {
                            message: `🔧 ${result.data.name}: ${result.data.status} - ${result.data.totalDowntime}h downtime`,
                            toolsUsed: ['equipment_maintenance'],
                            data: result.data,
                            sessionId,
                        };
                    }
                } else if (messageLower.includes('downtime') && messageLower.includes('report')) {
                    const result = await this.executeTool('equipment_maintenance', {
                        action: 'downtime_report',
                        ...context,
                    });

                    if (result.success) {
                        return {
                            message: `📊 Total downtime: ${result.data.totalDowntime}h - Cost: $${result.data.totalCost}`,
                            toolsUsed: ['equipment_maintenance'],
                            data: result.data,
                            sessionId,
                        };
                    }
                } else if (messageLower.includes('list')) {
                    const result = await this.executeTool('equipment_maintenance', {
                        action: 'list_equipment',
                        ...context,
                    });

                    if (result.success) {
                        return {
                            message: `🔧 Found ${result.data.summary.total} equipment - ${result.data.summary.operational} operational`,
                            toolsUsed: ['equipment_maintenance'],
                            data: result.data,
                            sessionId,
                        };
                    }
                }
            }

            // Export intents
            if (messageLower.includes('export') || messageLower.includes('download')) {
                let data: any[] = [];
                let dataType = 'inventory';

                // Determine what to export
                if (messageLower.includes('inventory') || messageLower.includes('stock')) {
                    const result = await this.executeTool('inventory_tracker', {action: 'list_items', ...context});
                    if (result.success) data = result.data.items;
                    dataType = 'inventory';
                } else if (messageLower.includes('production')) {
                    const result = await this.executeTool('production_scheduler', {action: 'list_runs', ...context});
                    if (result.success) data = result.data.runs;
                    dataType = 'production';
                } else if (messageLower.includes('quality') || messageLower.includes('inspection')) {
                    const result = await this.executeTool('quality_control_logger', {action: 'list_inspections', ...context});
                    if (result.success) data = result.data.inspections;
                    dataType = 'quality';
                } else if (messageLower.includes('equipment')) {
                    const result = await this.executeTool('equipment_maintenance', {action: 'list_equipment', ...context});
                    if (result.success) data = result.data.equipment;
                    dataType = 'equipment';
                }

                if (data.length === 0) {
                    return {message: '❌ No data available to export', sessionId};
                }

                // Export based on format
                if (messageLower.includes('csv')) {
                    const result = await this.executeTool('csv_generator', {
                        filename: context?.filename || `${dataType}_export`,
                        data,
                    });
                    if (result.success) {
                        return {
                            message: `📊 CSV exported: ${result.data.filename} (${result.data.rows} rows)`,
                            toolsUsed: ['csv_generator'],
                            data: result.data,
                            sessionId,
                        };
                    }
                } else if (messageLower.includes('excel') || messageLower.includes('xlsx')) {
                    const result = await this.executeTool('excel_generator', {
                        filename: context?.filename || `${dataType}_export`,
                        sheets: [{name: dataType.charAt(0).toUpperCase() + dataType.slice(1), data}],
                    });
                    if (result.success) {
                        return {
                            message: `📊 Excel exported: ${result.data.filename} (${result.data.totalRows} rows)`,
                            toolsUsed: ['excel_generator'],
                            data: result.data,
                            sessionId,
                        };
                    }
                } else if (messageLower.includes('pdf')) {
                    const result = await this.executeTool('pdf_generator', {
                        title: `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Report`,
                        filename: context?.filename || `${dataType}_report`,
                        content: [
                            {
                                type: 'heading' as const,
                                text: `${dataType.charAt(0).toUpperCase() + dataType.slice(1)} Report`,
                                level: 1
                            },
                            {type: 'paragraph' as const, text: `Total Records: ${data.length}`},
                            {type: 'table' as const, data},
                        ],
                    });
                    if (result.success) {
                        return {
                            message: `📄 PDF generated: ${result.data.filename} (${result.data.pages} pages)`,
                            toolsUsed: ['pdf_generator'],
                            data: result.data,
                            sessionId,
                        };
                    }
                }
            }

            // Help/Capabilities
            if (messageLower.includes('help') || messageLower.includes('what can you do')) {
                return {
                    message: this.getCapabilities(),
                    sessionId,
                };
            }

            // Default response
            return {
                message: `I'm the Manufacturing Agent. I can help you with:
- Inventory tracking (stock levels, reorder alerts)
- Production scheduling (capacity planning, run management)
- Quality control (inspections, defect tracking)
- Equipment maintenance (schedules, downtime tracking)

What would you like help with?`,
                sessionId,
            };
        } catch (error) {
            logger.error({error, message, sessionId}, 'Error in Manufacturing Agent');
            return {
                message: `Sorry, I encountered an error: ${error instanceof Error ? error.message : 'Unknown error'}`,
                sessionId,
            };
        }
    }
}
