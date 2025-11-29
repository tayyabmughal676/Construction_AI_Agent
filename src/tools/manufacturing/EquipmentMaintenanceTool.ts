import type {BaseTool, ToolResult} from '../../agents/types';
import {mongodb} from '../../db/mongodb';
import {z} from 'zod';

const MaintenanceRecordSchema = z.object({
    equipmentId: z.string(),
    maintenanceType: z.enum(['preventive', 'corrective', 'predictive', 'emergency']),
    description: z.string(),
    technicianId: z.string(),
    scheduledDate: z.string().optional(),
    completedDate: z.string().optional(),
    status: z.enum(['scheduled', 'in_progress', 'completed', 'cancelled']).default('scheduled'),
    cost: z.number().min(0).optional(),
    downtime: z.number().min(0).optional(), // in hours
    partsReplaced: z.array(z.string()).optional(),
    notes: z.string().optional(),
});

const EquipmentSchema = z.object({
    equipmentId: z.string(),
    name: z.string(),
    type: z.string(),
    manufacturer: z.string().optional(),
    model: z.string().optional(),
    serialNumber: z.string().optional(),
    installationDate: z.string().optional(),
    location: z.string().optional(),
    status: z.enum(['operational', 'maintenance', 'down', 'retired']).optional().default('operational'),
});

export class EquipmentMaintenanceTool implements BaseTool {
    name = 'equipment_maintenance';
    description = 'Track equipment maintenance schedules, downtime, repairs, and maintenance history';

    async execute(params: any): Promise<ToolResult> {
        try {
            const {action, equipmentId, maintenanceId, ...data} = params;

            const db = mongodb.getDb();
            const equipment = db.collection('equipment');
            const maintenance = db.collection('maintenance_records');

            switch (action) {
                case 'register_equipment': {
                    const validated = EquipmentSchema.parse({equipmentId, ...data});

                    const existing = await equipment.findOne({equipmentId: validated.equipmentId});
                    if (existing) {
                        return {
                            success: false,
                            error: `Equipment with ID ${validated.equipmentId} already exists`,
                        };
                    }

                    const result = await equipment.insertOne({
                        ...validated,
                        totalDowntime: 0,
                        maintenanceCount: 0,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });

                    return {
                        success: true,
                        data: {
                            id: result.insertedId,
                            equipmentId: validated.equipmentId,
                            message: `Equipment "${validated.name}" registered successfully`,
                        },
                    };
                }

                case 'schedule_maintenance': {
                    const validated = MaintenanceRecordSchema.parse({equipmentId, ...data});

                    const equip = await equipment.findOne({equipmentId});
                    if (!equip) {
                        return {success: false, error: `Equipment ${equipmentId} not found`};
                    }

                    const result = await maintenance.insertOne({
                        ...validated,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });

                    return {
                        success: true,
                        data: {
                            maintenanceId: result.insertedId,
                            equipmentId,
                            maintenanceType: validated.maintenanceType,
                            scheduledDate: validated.scheduledDate,
                            message: `${validated.maintenanceType} maintenance scheduled`,
                        },
                    };
                }

                case 'start_maintenance': {
                    if (!maintenanceId) {
                        return {success: false, error: 'maintenanceId is required'};
                    }

                    const record = await maintenance.findOne({_id: maintenanceId});
                    if (!record) {
                        return {success: false, error: 'Maintenance record not found'};
                    }

                    // Update maintenance record
                    await maintenance.updateOne(
                        {_id: maintenanceId},
                        {
                            $set: {
                                status: 'in_progress',
                                actualStartDate: new Date(),
                                updatedAt: new Date(),
                            }
                        }
                    );

                    // Update equipment status
                    await equipment.updateOne(
                        {equipmentId: record.equipmentId},
                        {$set: {status: 'maintenance', updatedAt: new Date()}}
                    );

                    return {
                        success: true,
                        data: {
                            maintenanceId,
                            equipmentId: record.equipmentId,
                            status: 'in_progress',
                            message: 'Maintenance started',
                        },
                    };
                }

                case 'complete_maintenance': {
                    if (!maintenanceId) {
                        return {success: false, error: 'maintenanceId is required'};
                    }

                    const {cost, downtime, partsReplaced, notes} = data;

                    const record = await maintenance.findOne({_id: maintenanceId});
                    if (!record) {
                        return {success: false, error: 'Maintenance record not found'};
                    }

                    // Update maintenance record
                    await maintenance.updateOne(
                        {_id: maintenanceId},
                        {
                            $set: {
                                status: 'completed',
                                completedDate: new Date().toISOString(),
                                cost,
                                downtime,
                                partsReplaced,
                                completionNotes: notes,
                                updatedAt: new Date(),
                            }
                        }
                    );

                    // Update equipment
                    await equipment.updateOne(
                        {equipmentId: record.equipmentId},
                        {
                            $set: {status: 'operational', updatedAt: new Date()},
                            $inc: {
                                totalDowntime: downtime || 0,
                                maintenanceCount: 1,
                            }
                        }
                    );

                    return {
                        success: true,
                        data: {
                            maintenanceId,
                            equipmentId: record.equipmentId,
                            status: 'completed',
                            downtime: downtime || 0,
                            cost: cost || 0,
                            message: 'Maintenance completed successfully',
                        },
                    };
                }

                case 'list_maintenance': {
                    const {status, maintenanceType, limit = 50} = data;
                    const filter: any = {};

                    if (equipmentId) filter.equipmentId = equipmentId;
                    if (status) filter.status = status;
                    if (maintenanceType) filter.maintenanceType = maintenanceType;

                    const records = await maintenance
                        .find(filter)
                        .sort({scheduledDate: -1})
                        .limit(limit)
                        .toArray();

                    const summary = {
                        total: records.length,
                        scheduled: records.filter(r => r.status === 'scheduled').length,
                        inProgress: records.filter(r => r.status === 'in_progress').length,
                        completed: records.filter(r => r.status === 'completed').length,
                    };

                    return {
                        success: true,
                        data: {
                            records,
                            summary,
                        },
                    };
                }

                case 'equipment_status': {
                    if (!equipmentId) {
                        return {success: false, error: 'equipmentId is required'};
                    }

                    const equip = await equipment.findOne({equipmentId});
                    if (!equip) {
                        return {success: false, error: `Equipment ${equipmentId} not found`};
                    }

                    // Get recent maintenance
                    const recentMaintenance = await maintenance
                        .find({equipmentId})
                        .sort({completedDate: -1})
                        .limit(5)
                        .toArray();

                    // Get upcoming maintenance
                    const upcomingMaintenance = await maintenance
                        .find({
                            equipmentId,
                            status: 'scheduled',
                        })
                        .sort({scheduledDate: 1})
                        .toArray();

                    return {
                        success: true,
                        data: {
                            equipmentId: equip.equipmentId,
                            name: equip.name,
                            status: equip.status,
                            location: equip.location,
                            totalDowntime: equip.totalDowntime || 0,
                            maintenanceCount: equip.maintenanceCount || 0,
                            recentMaintenance,
                            upcomingMaintenance,
                        },
                    };
                }

                case 'downtime_report': {
                    const {startDate, endDate} = data;

                    const filter: any = {
                        status: 'completed',
                    };

                    if (startDate || endDate) {
                        filter.completedDate = {};
                        if (startDate) filter.completedDate.$gte = startDate;
                        if (endDate) filter.completedDate.$lte = endDate;
                    }

                    const completedMaintenance = await maintenance.find(filter).toArray();

                    const totalDowntime = completedMaintenance.reduce(
                        (sum, record) => sum + (record.downtime || 0),
                        0
                    );

                    const totalCost = completedMaintenance.reduce(
                        (sum, record) => sum + (record.cost || 0),
                        0
                    );

                    // Group by equipment
                    const byEquipment: Record<string, { downtime: number; count: number; cost: number }> = {};
                    completedMaintenance.forEach(record => {
                        if (!byEquipment[record.equipmentId]) {
                            byEquipment[record.equipmentId] = {downtime: 0, count: 0, cost: 0};
                        }
                        const equipData = byEquipment[record.equipmentId];
                        if (equipData) {
                            equipData.downtime += record.downtime || 0;
                            equipData.count += 1;
                            equipData.cost += record.cost || 0;
                        }
                    });

                    // Find equipment with most downtime
                    const topDowntime = Object.entries(byEquipment)
                        .sort(([, a], [, b]) => b.downtime - a.downtime)
                        .slice(0, 5)
                        .map(([equipmentId, stats]) => ({equipmentId, ...stats}));

                    return {
                        success: true,
                        data: {
                            period: {
                                startDate: startDate || 'all time',
                                endDate: endDate || 'now',
                            },
                            totalMaintenance: completedMaintenance.length,
                            totalDowntime: Math.round(totalDowntime * 10) / 10,
                            totalCost: Math.round(totalCost * 100) / 100,
                            averageDowntime: completedMaintenance.length > 0
                                ? Math.round((totalDowntime / completedMaintenance.length) * 10) / 10
                                : 0,
                            topDowntime,
                        },
                    };
                }

                case 'list_equipment': {
                    const {status, type, limit = 50} = data;
                    const filter: any = {};

                    if (status) filter.status = status;
                    if (type) filter.type = type;

                    const allEquipment = await equipment
                        .find(filter)
                        .limit(limit)
                        .toArray();

                    const summary = {
                        total: allEquipment.length,
                        operational: allEquipment.filter(e => e.status === 'operational').length,
                        maintenance: allEquipment.filter(e => e.status === 'maintenance').length,
                        down: allEquipment.filter(e => e.status === 'down').length,
                        retired: allEquipment.filter(e => e.status === 'retired').length,
                    };

                    return {
                        success: true,
                        data: {
                            equipment: allEquipment,
                            summary,
                        },
                    };
                }

                default:
                    return {
                        success: false,
                        error: `Unknown action: ${action}. Use: register_equipment, schedule_maintenance, start_maintenance, complete_maintenance, list_maintenance, equipment_status, downtime_report, list_equipment`,
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
