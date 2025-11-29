import type {BaseTool, ToolResult} from '../../agents/types';
import {mongodb} from '../../db/mongodb';
import {z} from 'zod';
import {Validator} from '../../utils/validators';

const EmployeeSchema = z.object({
    firstName: z.string(),
    lastName: z.string(),
    email: z.string().email(),
    phone: z.string().optional(),
    department: z.string(),
    position: z.string(),
    employeeId: z.string().optional(),
    startDate: z.string().optional(),
    salary: z.number().optional(),
    manager: z.string().optional(),
    status: z.enum(['active', 'inactive', 'on_leave']).optional().default('active'),
});

export class EmployeeDirectoryTool implements BaseTool {
    name = 'employee_directory';
    description = 'Manage employee records - create, read, update, delete, and search employees';

    async execute(params: any): Promise<ToolResult> {
        try {
            const {action, employeeId, ...data} = params;

            const db = mongodb.getDb();
            const employees = db.collection('employees');

            switch (action) {
                case 'create': {
                    const validated = EmployeeSchema.parse(data);

                    // Validate email
                    const emailValidation = Validator.email.validate(validated.email);
                    if (!emailValidation.valid) {
                        return {
                            success: false,
                            error: `Invalid email: ${emailValidation.error}`,
                        };
                    }

                    // Validate phone if provided - be lenient with formats
                    if (validated.phone) {
                        // Try to validate, but don't fail if format is non-standard
                        // Just ensure it has some digits
                        const digitsOnly = validated.phone.replace(/[^0-9]/g, '');
                        if (digitsOnly.length < 7 || digitsOnly.length > 15) {
                            return {
                                success: false,
                                error: `Invalid phone: must contain 7-15 digits`,
                            };
                        }
                    }

                    // Check for duplicate email
                    const existingEmail = await employees.findOne({
                        email: Validator.email.normalize(validated.email)
                    });
                    if (existingEmail) {
                        return {
                            success: false,
                            error: 'An employee with this email already exists',
                        };
                    }

                    // Generate employee ID if not provided
                    const empId = validated.employeeId || `EMP${Date.now().toString().slice(-6)}`;

                    const result = await employees.insertOne({
                        ...validated,
                        email: Validator.email.normalize(validated.email),
                        phone: validated.phone || undefined,
                        employeeId: empId,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });

                    return {
                        success: true,
                        data: {
                            id: result.insertedId,
                            employeeId: empId,
                            message: `Employee ${validated.firstName} ${validated.lastName} created successfully`,
                        },
                    };
                }

                case 'list': {
                    const {department, status, limit = 50} = data;
                    const filter: any = {};

                    if (department) filter.department = department;
                    if (status) filter.status = status;

                    const allEmployees = await employees
                        .find(filter)
                        .limit(limit)
                        .toArray();

                    return {
                        success: true,
                        data: {
                            employees: allEmployees,
                            count: allEmployees.length,
                            filter,
                        },
                    };
                }

                case 'get': {
                    if (!employeeId) {
                        return {success: false, error: 'employeeId is required'};
                    }

                    const employee = await employees.findOne({employeeId});

                    if (!employee) {
                        return {
                            success: false,
                            error: `Employee with ID ${employeeId} not found`,
                        };
                    }

                    return {
                        success: true,
                        data: employee,
                    };
                }

                case 'update': {
                    if (!employeeId) {
                        return {success: false, error: 'employeeId is required'};
                    }

                    const result = await employees.updateOne(
                        {employeeId},
                        {$set: {...data, updatedAt: new Date()}}
                    );

                    if (result.matchedCount === 0) {
                        return {
                            success: false,
                            error: `Employee with ID ${employeeId} not found`,
                        };
                    }

                    return {
                        success: true,
                        data: {
                            modified: result.modifiedCount,
                            message: `Employee ${employeeId} updated successfully`,
                        },
                    };
                }

                case 'delete': {
                    if (!employeeId) {
                        return {success: false, error: 'employeeId is required'};
                    }

                    // Soft delete - mark as inactive
                    const result = await employees.updateOne(
                        {employeeId},
                        {$set: {status: 'inactive', updatedAt: new Date()}}
                    );

                    if (result.matchedCount === 0) {
                        return {
                            success: false,
                            error: `Employee with ID ${employeeId} not found`,
                        };
                    }

                    return {
                        success: true,
                        data: {
                            message: `Employee ${employeeId} deactivated successfully`,
                        },
                    };
                }

                case 'search': {
                    const {query} = data;
                    if (!query) {
                        return {success: false, error: 'search query is required'};
                    }

                    const searchResults = await employees
                        .find({
                            $or: [
                                {firstName: {$regex: query, $options: 'i'}},
                                {lastName: {$regex: query, $options: 'i'}},
                                {email: {$regex: query, $options: 'i'}},
                                {employeeId: {$regex: query, $options: 'i'}},
                                {department: {$regex: query, $options: 'i'}},
                                {position: {$regex: query, $options: 'i'}},
                            ],
                        })
                        .limit(20)
                        .toArray();

                    return {
                        success: true,
                        data: {
                            query,
                            results: searchResults,
                            count: searchResults.length,
                        },
                    };
                }

                default:
                    return {
                        success: false,
                        error: `Unknown action: ${action}. Use: create, list, get, update, delete, search`,
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
