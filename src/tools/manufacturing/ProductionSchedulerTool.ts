import type {BaseTool, ToolResult} from '../../agents/types';
import {mongodb} from '../../db/mongodb';
import {z} from 'zod';

const ProductionRunSchema = z.object({
    productCode: z.string(),
    productName: z.string(),
    quantity: z.number().min(1),
    scheduledStart: z.string(),
    scheduledEnd: z.string(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).default('medium'),
    status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled', 'on_hold']).default('scheduled'),
    assignedLine: z.string().optional(),
    notes: z.string().optional(),
});

export class ProductionSchedulerTool implements BaseTool {
    name = 'production_scheduler';
    description = 'Schedule production runs, manage capacity, and track production status';

    async execute(params: any): Promise<ToolResult> {
        try {
            const {action, runId, ...data} = params;

            const db = mongodb.getDb();
            const productionRuns = db.collection('production_runs');
            const productionLines = db.collection('production_lines');

            switch (action) {
                case 'schedule_run': {
                    const validated = ProductionRunSchema.parse(data);

                    // Check for scheduling conflicts
                    const conflicts = await productionRuns.find({
                        assignedLine: validated.assignedLine,
                        status: {$in: ['scheduled', 'in_progress']},
                        $or: [
                            {
                                scheduledStart: {$lte: validated.scheduledEnd},
                                scheduledEnd: {$gte: validated.scheduledStart}
                            }
                        ]
                    }).toArray();

                    if (conflicts.length > 0 && validated.assignedLine) {
                        return {
                            success: false,
                            error: `Scheduling conflict detected on line ${validated.assignedLine}`,
                            data: {conflicts},
                        };
                    }

                    const result = await productionRuns.insertOne({
                        ...validated,
                        actualStart: null,
                        actualEnd: null,
                        producedQuantity: 0,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });

                    return {
                        success: true,
                        data: {
                            runId: result.insertedId,
                            productCode: validated.productCode,
                            quantity: validated.quantity,
                            scheduledStart: validated.scheduledStart,
                            message: `Production run scheduled for ${validated.productName}`,
                        },
                    };
                }

                case 'start_run': {
                    if (!runId) {
                        return {success: false, error: 'runId is required'};
                    }

                    const result = await productionRuns.updateOne(
                        {_id: runId, status: 'scheduled'},
                        {
                            $set: {
                                status: 'in_progress',
                                actualStart: new Date(),
                                updatedAt: new Date(),
                            }
                        }
                    );

                    if (result.matchedCount === 0) {
                        return {
                            success: false,
                            error: 'Production run not found or already started',
                        };
                    }

                    return {
                        success: true,
                        data: {
                            runId,
                            status: 'in_progress',
                            message: 'Production run started',
                        },
                    };
                }

                case 'complete_run': {
                    if (!runId) {
                        return {success: false, error: 'runId is required'};
                    }

                    const {producedQuantity, notes} = data;

                    const run = await productionRuns.findOne({_id: runId});
                    if (!run) {
                        return {success: false, error: 'Production run not found'};
                    }

                    const result = await productionRuns.updateOne(
                        {_id: runId},
                        {
                            $set: {
                                status: 'completed',
                                actualEnd: new Date(),
                                producedQuantity: producedQuantity || run.quantity,
                                completionNotes: notes,
                                updatedAt: new Date(),
                            }
                        }
                    );

                    const efficiency = producedQuantity
                        ? Math.round((producedQuantity / run.quantity) * 100)
                        : 100;

                    return {
                        success: true,
                        data: {
                            runId,
                            status: 'completed',
                            plannedQuantity: run.quantity,
                            producedQuantity: producedQuantity || run.quantity,
                            efficiency: `${efficiency}%`,
                            message: 'Production run completed',
                        },
                    };
                }

                case 'update_run': {
                    if (!runId) {
                        return {success: false, error: 'runId is required'};
                    }

                    const result = await productionRuns.updateOne(
                        {_id: runId},
                        {$set: {...data, updatedAt: new Date()}}
                    );

                    if (result.matchedCount === 0) {
                        return {success: false, error: 'Production run not found'};
                    }

                    return {
                        success: true,
                        data: {
                            modified: result.modifiedCount,
                            message: 'Production run updated',
                        },
                    };
                }

                case 'list_runs': {
                    const {status, priority, assignedLine, limit = 50} = data;
                    const filter: any = {};

                    if (status) filter.status = status;
                    if (priority) filter.priority = priority;
                    if (assignedLine) filter.assignedLine = assignedLine;

                    const runs = await productionRuns
                        .find(filter)
                        .sort({scheduledStart: 1})
                        .limit(limit)
                        .toArray();

                    const summary = {
                        total: runs.length,
                        scheduled: runs.filter(r => r.status === 'scheduled').length,
                        inProgress: runs.filter(r => r.status === 'in_progress').length,
                        completed: runs.filter(r => r.status === 'completed').length,
                        cancelled: runs.filter(r => r.status === 'cancelled').length,
                    };

                    return {
                        success: true,
                        data: {
                            runs,
                            summary,
                        },
                    };
                }

                case 'capacity_check': {
                    const {startDate, endDate, productionLine} = data;

                    if (!startDate || !endDate) {
                        return {
                            success: false,
                            error: 'startDate and endDate are required',
                        };
                    }

                    const filter: any = {
                        status: {$in: ['scheduled', 'in_progress']},
                        scheduledStart: {$lte: endDate},
                        scheduledEnd: {$gte: startDate},
                    };

                    if (productionLine) {
                        filter.assignedLine = productionLine;
                    }

                    const scheduledRuns = await productionRuns.find(filter).toArray();

                    // Calculate utilization
                    const totalHours = scheduledRuns.reduce((sum, run) => {
                        const start = new Date(run.scheduledStart);
                        const end = new Date(run.scheduledEnd);
                        const hours = (end.getTime() - start.getTime()) / (1000 * 60 * 60);
                        return sum + hours;
                    }, 0);

                    const periodStart = new Date(startDate);
                    const periodEnd = new Date(endDate);
                    const periodHours = (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60);
                    const utilization = periodHours > 0 ? Math.round((totalHours / periodHours) * 100) : 0;

                    return {
                        success: true,
                        data: {
                            startDate,
                            endDate,
                            productionLine: productionLine || 'all',
                            scheduledRuns: scheduledRuns.length,
                            totalScheduledHours: Math.round(totalHours * 10) / 10,
                            periodHours: Math.round(periodHours * 10) / 10,
                            utilization: `${utilization}%`,
                            availableCapacity: utilization < 100,
                        },
                    };
                }

                case 'get_run': {
                    if (!runId) {
                        return {success: false, error: 'runId is required'};
                    }

                    const run = await productionRuns.findOne({_id: runId});

                    if (!run) {
                        return {success: false, error: 'Production run not found'};
                    }

                    return {
                        success: true,
                        data: run,
                    };
                }

                case 'cancel_run': {
                    if (!runId) {
                        return {success: false, error: 'runId is required'};
                    }

                    const {reason} = data;

                    const result = await productionRuns.updateOne(
                        {_id: runId, status: {$in: ['scheduled', 'on_hold']}},
                        {
                            $set: {
                                status: 'cancelled',
                                cancellationReason: reason,
                                updatedAt: new Date(),
                            }
                        }
                    );

                    if (result.matchedCount === 0) {
                        return {
                            success: false,
                            error: 'Production run not found or cannot be cancelled',
                        };
                    }

                    return {
                        success: true,
                        data: {
                            runId,
                            status: 'cancelled',
                            message: 'Production run cancelled',
                        },
                    };
                }

                default:
                    return {
                        success: false,
                        error: `Unknown action: ${action}. Use: schedule_run, start_run, complete_run, update_run, list_runs, capacity_check, get_run, cancel_run`,
                    };
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}
