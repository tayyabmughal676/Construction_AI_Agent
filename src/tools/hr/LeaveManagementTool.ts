import type {BaseTool, ToolResult} from '../../agents/types';
import {mongodb} from '../../db/mongodb';
import {z} from 'zod';

const LeaveRequestSchema = z.object({
    employeeId: z.string(),
    leaveType: z.enum(['vacation', 'sick', 'personal', 'unpaid', 'parental']),
    startDate: z.string(),
    endDate: z.string(),
    reason: z.string().optional(),
    status: z.enum(['pending', 'approved', 'rejected']).optional().default('pending'),
});

export class LeaveManagementTool implements BaseTool {
    name = 'leave_management';
    description = 'Manage employee leave requests - submit, approve, reject, and track leave balances';

    // Default annual leave balances (in days)
    private readonly DEFAULT_BALANCES = {
        vacation: 20,
        sick: 10,
        personal: 5,
        unpaid: 0, // unlimited
        parental: 90,
    };

    async execute(params: any): Promise<ToolResult> {
        try {
            const {action, leaveId, employeeId, ...data} = params;

            const db = mongodb.getDb();
            const leaveRequests = db.collection('leave_requests');
            const leaveBalances = db.collection('leave_balances');

            switch (action) {
                case 'request': {
                    const validated = LeaveRequestSchema.parse({employeeId, ...data});

                    // Calculate days requested
                    const start = new Date(validated.startDate);
                    const end = new Date(validated.endDate);
                    const daysRequested = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;

                    // Check balance (except for unpaid leave)
                    if (validated.leaveType !== 'unpaid') {
                        const balance = await leaveBalances.findOne({employeeId});
                        const available = balance?.[validated.leaveType] ?? this.DEFAULT_BALANCES[validated.leaveType];

                        if (daysRequested > available) {
                            return {
                                success: false,
                                error: `Insufficient ${validated.leaveType} leave balance. Available: ${available} days, Requested: ${daysRequested} days`,
                            };
                        }
                    }

                    const result = await leaveRequests.insertOne({
                        ...validated,
                        daysRequested,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });

                    return {
                        success: true,
                        data: {
                            leaveId: result.insertedId,
                            daysRequested,
                            status: validated.status,
                            message: `Leave request submitted for ${daysRequested} day(s)`,
                        },
                    };
                }

                case 'approve': {
                    if (!leaveId) {
                        return {success: false, error: 'leaveId is required'};
                    }

                    const leave = await leaveRequests.findOne({_id: leaveId});
                    if (!leave) {
                        return {success: false, error: 'Leave request not found'};
                    }

                    // Update leave request status
                    await leaveRequests.updateOne(
                        {_id: leaveId},
                        {$set: {status: 'approved', approvedAt: new Date(), updatedAt: new Date()}}
                    );

                    // Deduct from balance (except unpaid)
                    if (leave.leaveType !== 'unpaid') {
                        await leaveBalances.updateOne(
                            {employeeId: leave.employeeId},
                            {
                                $inc: {[leave.leaveType]: -leave.daysRequested},
                                $setOnInsert: {employeeId: leave.employeeId, ...this.DEFAULT_BALANCES},
                            },
                            {upsert: true}
                        );
                    }

                    return {
                        success: true,
                        data: {
                            message: `Leave request approved for ${leave.daysRequested} day(s)`,
                            leaveType: leave.leaveType,
                            daysDeducted: leave.daysRequested,
                        },
                    };
                }

                case 'reject': {
                    if (!leaveId) {
                        return {success: false, error: 'leaveId is required'};
                    }

                    const {rejectionReason} = data;

                    const result = await leaveRequests.updateOne(
                        {_id: leaveId},
                        {
                            $set: {
                                status: 'rejected',
                                rejectionReason,
                                rejectedAt: new Date(),
                                updatedAt: new Date(),
                            },
                        }
                    );

                    if (result.matchedCount === 0) {
                        return {success: false, error: 'Leave request not found'};
                    }

                    return {
                        success: true,
                        data: {message: 'Leave request rejected'},
                    };
                }

                case 'list': {
                    const {status, leaveType, limit = 50} = data;
                    const filter: any = {};

                    if (employeeId) filter.employeeId = employeeId;
                    if (status) filter.status = status;
                    if (leaveType) filter.leaveType = leaveType;

                    const requests = await leaveRequests
                        .find(filter)
                        .sort({createdAt: -1})
                        .limit(limit)
                        .toArray();

                    return {
                        success: true,
                        data: {
                            requests,
                            count: requests.length,
                            filter,
                        },
                    };
                }

                case 'balance': {
                    if (!employeeId) {
                        return {success: false, error: 'employeeId is required'};
                    }

                    let balance = await leaveBalances.findOne({employeeId});

                    if (!balance) {
                        // Initialize with defaults
                        const newBalance = {employeeId, ...this.DEFAULT_BALANCES};
                        await leaveBalances.insertOne(newBalance);
                        balance = newBalance as any;
                    }

                    return {
                        success: true,
                        data: {
                            employeeId,
                            balances: {
                                vacation: (balance as any).vacation ?? this.DEFAULT_BALANCES.vacation,
                                sick: (balance as any).sick ?? this.DEFAULT_BALANCES.sick,
                                personal: (balance as any).personal ?? this.DEFAULT_BALANCES.personal,
                                unpaid: 'unlimited',
                                parental: (balance as any).parental ?? this.DEFAULT_BALANCES.parental,
                            },
                        },
                    };
                }

                case 'reset': {
                    if (!employeeId) {
                        return {success: false, error: 'employeeId is required'};
                    }

                    await leaveBalances.updateOne(
                        {employeeId},
                        {$set: {...this.DEFAULT_BALANCES, updatedAt: new Date()}},
                        {upsert: true}
                    );

                    return {
                        success: true,
                        data: {
                            message: 'Leave balances reset to defaults',
                            balances: this.DEFAULT_BALANCES,
                        },
                    };
                }

                default:
                    return {
                        success: false,
                        error: `Unknown action: ${action}. Use: request, approve, reject, list, balance, reset`,
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
