import type {BaseTool, ToolResult} from '../../agents/types';
import {mongodb} from '../../db/mongodb';
import {z} from 'zod';

const QualityInspectionSchema = z.object({
    productCode: z.string(),
    batchNumber: z.string(),
    inspectionType: z.enum(['incoming', 'in_process', 'final', 'random']),
    inspectorId: z.string(),
    sampleSize: z.number().min(1),
    passedCount: z.number().min(0),
    failedCount: z.number().min(0),
    defectTypes: z.array(z.string()).optional(),
    severity: z.enum(['minor', 'major', 'critical']).optional(),
    notes: z.string().optional(),
    actionTaken: z.string().optional(),
});

export class QualityControlLoggerTool implements BaseTool {
    name = 'quality_control_logger';
    description = 'Log quality inspections, track defects, and monitor quality metrics';

    async execute(params: any): Promise<ToolResult> {
        try {
            const {action, inspectionId, ...data} = params;

            const db = mongodb.getDb();
            const inspections = db.collection('quality_inspections');
            const defects = db.collection('quality_defects');

            switch (action) {
                case 'log_inspection': {
                    const validated = QualityInspectionSchema.parse(data);

                    const passRate = validated.sampleSize > 0
                        ? Math.round((validated.passedCount / validated.sampleSize) * 100)
                        : 0;

                    const status = passRate >= 95 ? 'passed' : passRate >= 80 ? 'conditional' : 'failed';

                    const result = await inspections.insertOne({
                        ...validated,
                        passRate,
                        status,
                        timestamp: new Date(),
                    });

                    // Log individual defects if any
                    if (validated.failedCount > 0 && validated.defectTypes && validated.defectTypes.length > 0) {
                        const defectDocs = validated.defectTypes.map(type => ({
                            inspectionId: result.insertedId,
                            productCode: validated.productCode,
                            batchNumber: validated.batchNumber,
                            defectType: type,
                            severity: validated.severity || 'minor',
                            timestamp: new Date(),
                        }));

                        await defects.insertMany(defectDocs);
                    }

                    return {
                        success: true,
                        data: {
                            inspectionId: result.insertedId,
                            productCode: validated.productCode,
                            batchNumber: validated.batchNumber,
                            passRate: `${passRate}%`,
                            status,
                            message: `Inspection logged: ${validated.passedCount}/${validated.sampleSize} passed (${passRate}%)`,
                        },
                    };
                }

                case 'list_inspections': {
                    const {productCode, batchNumber, status, inspectionType, limit = 50} = data;
                    const filter: any = {};

                    if (productCode) filter.productCode = productCode;
                    if (batchNumber) filter.batchNumber = batchNumber;
                    if (status) filter.status = status;
                    if (inspectionType) filter.inspectionType = inspectionType;

                    const allInspections = await inspections
                        .find(filter)
                        .sort({timestamp: -1})
                        .limit(limit)
                        .toArray();

                    const avgPassRate = allInspections.length > 0
                        ? Math.round(
                            allInspections.reduce((sum, i) => sum + i.passRate, 0) / allInspections.length
                        )
                        : 0;

                    const summary = {
                        total: allInspections.length,
                        passed: allInspections.filter(i => i.status === 'passed').length,
                        conditional: allInspections.filter(i => i.status === 'conditional').length,
                        failed: allInspections.filter(i => i.status === 'failed').length,
                        averagePassRate: `${avgPassRate}%`,
                    };

                    return {
                        success: true,
                        data: {
                            inspections: allInspections,
                            summary,
                        },
                    };
                }

                case 'get_inspection': {
                    if (!inspectionId) {
                        return {success: false, error: 'inspectionId is required'};
                    }

                    const inspection = await inspections.findOne({_id: inspectionId});

                    if (!inspection) {
                        return {success: false, error: 'Inspection not found'};
                    }

                    // Get associated defects
                    const relatedDefects = await defects
                        .find({inspectionId})
                        .toArray();

                    return {
                        success: true,
                        data: {
                            ...inspection,
                            defects: relatedDefects,
                        },
                    };
                }

                case 'defect_analysis': {
                    const {productCode, startDate, endDate, severity} = data;
                    const filter: any = {};

                    if (productCode) filter.productCode = productCode;
                    if (severity) filter.severity = severity;
                    if (startDate || endDate) {
                        filter.timestamp = {};
                        if (startDate) filter.timestamp.$gte = new Date(startDate);
                        if (endDate) filter.timestamp.$lte = new Date(endDate);
                    }

                    const allDefects = await defects.find(filter).toArray();

                    // Group by defect type
                    const defectsByType: Record<string, number> = {};
                    const defectsBySeverity: Record<string, number> = {
                        minor: 0,
                        major: 0,
                        critical: 0,
                    };

                    allDefects.forEach(defect => {
                        defectsByType[defect.defectType] = (defectsByType[defect.defectType] || 0) + 1;
                        defectsBySeverity[defect.severity] = (defectsBySeverity[defect.severity] || 0) + 1;
                    });

                    // Find top defects
                    const topDefects = Object.entries(defectsByType)
                        .sort(([, a], [, b]) => b - a)
                        .slice(0, 5)
                        .map(([type, count]) => ({type, count}));

                    return {
                        success: true,
                        data: {
                            totalDefects: allDefects.length,
                            defectsByType,
                            defectsBySeverity,
                            topDefects,
                            period: {
                                startDate: startDate || 'all time',
                                endDate: endDate || 'now',
                            },
                        },
                    };
                }

                case 'quality_metrics': {
                    const {productCode, period = 30} = data;

                    const startDate = new Date();
                    startDate.setDate(startDate.getDate() - period);

                    const filter: any = {
                        timestamp: {$gte: startDate},
                    };

                    if (productCode) filter.productCode = productCode;

                    const recentInspections = await inspections.find(filter).toArray();

                    if (recentInspections.length === 0) {
                        return {
                            success: true,
                            data: {
                                message: 'No inspections found in the specified period',
                                period: `Last ${period} days`,
                            },
                        };
                    }

                    const avgPassRate = Math.round(
                        recentInspections.reduce((sum, i) => sum + i.passRate, 0) / recentInspections.length
                    );

                    const totalSamples = recentInspections.reduce((sum, i) => sum + i.sampleSize, 0);
                    const totalPassed = recentInspections.reduce((sum, i) => sum + i.passedCount, 0);
                    const totalFailed = recentInspections.reduce((sum, i) => sum + i.failedCount, 0);

                    const overallPassRate = totalSamples > 0
                        ? Math.round((totalPassed / totalSamples) * 100)
                        : 0;

                    return {
                        success: true,
                        data: {
                            period: `Last ${period} days`,
                            productCode: productCode || 'all products',
                            totalInspections: recentInspections.length,
                            totalSamples,
                            totalPassed,
                            totalFailed,
                            overallPassRate: `${overallPassRate}%`,
                            averagePassRate: `${avgPassRate}%`,
                            passedInspections: recentInspections.filter(i => i.status === 'passed').length,
                            failedInspections: recentInspections.filter(i => i.status === 'failed').length,
                        },
                    };
                }

                case 'batch_quality': {
                    const {batchNumber} = data;

                    if (!batchNumber) {
                        return {success: false, error: 'batchNumber is required'};
                    }

                    const batchInspections = await inspections
                        .find({batchNumber})
                        .sort({timestamp: 1})
                        .toArray();

                    if (batchInspections.length === 0) {
                        return {
                            success: false,
                            error: `No inspections found for batch ${batchNumber}`,
                        };
                    }

                    const avgPassRate = Math.round(
                        batchInspections.reduce((sum, i) => sum + i.passRate, 0) / batchInspections.length
                    );

                    const batchStatus = batchInspections.every(i => i.status === 'passed')
                        ? 'approved'
                        : batchInspections.some(i => i.status === 'failed')
                            ? 'rejected'
                            : 'conditional';

                    return {
                        success: true,
                        data: {
                            batchNumber,
                            totalInspections: batchInspections.length,
                            averagePassRate: `${avgPassRate}%`,
                            batchStatus,
                            inspections: batchInspections,
                        },
                    };
                }

                default:
                    return {
                        success: false,
                        error: `Unknown action: ${action}. Use: log_inspection, list_inspections, get_inspection, defect_analysis, quality_metrics, batch_quality`,
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
