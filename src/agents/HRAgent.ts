import { BaseAgent } from './BaseAgent';
import type { AgentResponse, DepartmentDetection } from './types';
import { HRPolicyTool } from '../tools/hr/HRPolicyTool';
import { EmployeeDirectoryTool } from '../tools/hr/EmployeeDirectoryTool';
import { OnboardingChecklistTool } from '../tools/hr/OnboardingChecklistTool';
import { PerformanceTrackerTool } from '../tools/hr/PerformanceTrackerTool';
import { LeaveManagementTool } from '../tools/hr/LeaveManagementTool';
import { EmailSenderTool } from '../tools/utils/EmailSenderTool';
import { CSVGeneratorTool } from '../tools/utils/CSVGeneratorTool';
import { ExcelGeneratorTool } from '../tools/utils/ExcelGeneratorTool';
import { PDFGeneratorTool } from '../tools/utils/PDFGeneratorTool';
import { logger } from '../config/logger';

// --- Intent Definitions ---
type IntentHandler = (message: string, context?: Record<string, any>) => Promise<Partial<AgentResponse>>;

interface Intent {
    name: string;
    keywords: string[];
    action?: string; // Map to LLM detected action
    handler: IntentHandler;
}

export class HRAgent extends BaseAgent {
    private intents: Intent[] = [];

    constructor() {
        super(
            'HR',
            'Handles Human Resources inquiries, including questions about company policies, benefits, and leave.'
        );
        this.initializeTools();
        this.initializeIntents();
    }

    private initializeTools(): void {
        this.registerTool(new HRPolicyTool());
        this.registerTool(new EmployeeDirectoryTool());
        this.registerTool(new OnboardingChecklistTool());
        this.registerTool(new PerformanceTrackerTool());
        this.registerTool(new LeaveManagementTool());
        this.registerTool(new EmailSenderTool());
        this.registerTool(new CSVGeneratorTool());
        this.registerTool(new ExcelGeneratorTool());
        this.registerTool(new PDFGeneratorTool());
    }

    /**
     * Defines the mapping from keywords and actions to agent actions.
     */
    private initializeIntents(): void {
        this.intents = [
            {
                name: 'Ask HR Policy',
                action: 'QUERY_POLICY',
                keywords: ['policy', 'leave policy', 'benefits', 'conduct', 'handbook', '401k', 'vacation policy', 'sick day'],
                handler: this.handlePolicyQuestion,
            },
            {
                name: 'Search Employee',
                action: 'SEARCH_EMPLOYEE',
                keywords: ['search employee', 'find employee', 'lookup employee', 'employee info', 'who is', 'employee_directory', 'employee directory'],
                handler: this.handleSearchEmployee,
            },
            {
                name: 'Onboard Employee',
                action: 'ONBOARD_EMPLOYEE',
                keywords: ['onboard', 'register a new employee', 'register employee', 'new hire', 'hire', 'add employee', 'create employee'],
                handler: this.handleOnboardEmployee,
            },
            {
                name: 'Manage Leave',
                action: 'MANAGE_LEAVE',
                keywords: ['leave request', 'apply for leave', 'request leave', 'leave balance', 'time off', 'vacation request'],
                handler: this.handleLeaveManagement,
            },
            {
                name: 'Track Performance',
                action: 'TRACK_PERFORMANCE',
                keywords: ['performance', 'performance review', 'goals', 'employee evaluation', 'feedback'],
                handler: this.handlePerformanceTracking,
            },
            {
                name: 'Export HR CSV',
                action: 'EXPORT_CSV',
                keywords: ['export csv', 'download csv', 'csv_generator', 'csv generator'],
                handler: (msg, ctx) => this.handleExport('csv', ctx),
            },
            {
                name: 'Export HR Excel',
                action: 'EXPORT_EXCEL',
                keywords: ['export excel', 'download excel', 'export xlsx', 'excel_generator', 'excel generator'],
                handler: (msg, ctx) => this.handleExport('excel', ctx),
            },
            {
                name: 'Export HR PDF',
                action: 'EXPORT_PDF',
                keywords: ['export pdf', 'download pdf', 'pdf_generator', 'pdf generator'],
                handler: (msg, ctx) => this.handleExport('pdf', ctx),
            },
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
        logger.info({
            message,
            sessionId,
            detection
        }, 'Processing HR agent message');

        const lowerMessage = message.toLowerCase();

        try {
            // 1. Try to match by LLM action first
            let intent = detection?.action ? this.intents.find(i => i.action === detection.action) : null;

            // 2. Fallback to keyword matching
            if (!intent) {
                intent = this.intents.find(i => i.keywords.some(kw => lowerMessage.includes(kw)));
            }

            let response: Partial<AgentResponse>;
            if (intent) {
                logger.info(`Matched HR intent: ${intent.name} (via ${detection?.action ? 'action' : 'keyword'})`);
                response = await intent.handler.call(this, message, context);
            } else {
                response = this.handleDefault();
            }

            return {
                sessionId,
                department: 'hr',
                ...response,
            } as AgentResponse;

        } catch (error) {
            logger.error({
                error
            }, 'Error processing HR agent message');
            return {
                message: `❌ An unexpected error occurred in the HR department: ${error instanceof Error ? error.message : 'Unknown error'}`,
                sessionId,
                department: 'hr',
            };
        }
    }

    // --- Intent Handlers ---

    private async handlePolicyQuestion(message: string, context: any): Promise<Partial<AgentResponse>> {
        const result = await this.executeTool('hr_policy_tool', {
            query: message
        });

        if (!result.success) {
            return {
                message: `❌ Error retrieving policy information: ${result.error}`
            };
        }

        const {
            foundPolicies
        } = result.data;
        if (!foundPolicies || foundPolicies.length === 0) {
            return {
                message: "I couldn't find any specific policies related to your question. Could you be more specific?",
                data: result.data,
            };
        }

        const formattedResponse = foundPolicies
            .map((policy: any) => `*${policy.title}*: ${policy.content}`)
            .join('\n\n');

        return {
            message: `Here is the information I found:\n\n${formattedResponse}`,
            toolsUsed: ['hr_policy_tool'],
            data: result.data,
        };
    }

    private async handleSearchEmployee(message: string, context: any): Promise<Partial<AgentResponse>> {
        // Prioritize extracted name from LLM detection, fallback to full message
        let query = context?.name || message;
        // Strip leading @ symbols if user sent @employee_directory or similar
        query = query.replace(/^@/, '').trim();

        logger.info({ query, message, context }, 'Starting HR employee search');

        // Clean up common command prefixes if we are using the full message
        let finalQuery = query;
        if (!context?.name) {
            const prefixes = [
                'employee_directory',
                'employee directory',
                'search for employee',
                'search employee',
                'search for',
                'search',
                'find employee',
                'find',
                'look up employee',
                'look up',
                'who is',
                'show employee',
                'show me',
                'list employee',
            ];

            for (const prefix of prefixes) {
                const regex = new RegExp(`^${prefix}`, 'i');
                if (regex.test(finalQuery)) {
                    finalQuery = finalQuery.replace(regex, '').trim();
                    break;
                }
            }
        }

        // If query was bare tool mention or empty, list all employees
        if (!finalQuery || finalQuery.toLowerCase() === 'employee_directory' || finalQuery.toLowerCase() === 'employee directory' || finalQuery.length < 2) {
            const listResult = await this.executeTool('employee_directory', {
                action: 'list',
                limit: 20
            });
            if (!listResult.success || !listResult.data.employees?.length) {
                return { message: 'No employees found in the directory.' };
            }
            const formatted = listResult.data.employees.map((emp: any) =>
                `👤 **${emp.firstName} ${emp.lastName}**\n` +
                `   ID: ${emp.employeeId} · Dept: ${emp.department} · ${emp.position}`
            ).join('\n\n');
            return {
                message: `📋 Employee Directory (${listResult.data.employees.length} employees):\n\n${formatted}`,
                toolsUsed: ['employee_directory'],
                data: listResult.data
            };
        }

        logger.info({ finalQuery }, 'Final search query');

        // Split multi-word queries: "John Doe" → search "John" OR "Doe"
        const words = finalQuery.split(/\s+/).filter((w: string) => w.length >= 2);
        const searchQueries = words.length > 1
            ? words.flatMap((word: string) => [
                { firstName: { $regex: word, $options: 'i' } },
                { lastName: { $regex: word, $options: 'i' } },
              ])
            : [
                { firstName: { $regex: finalQuery, $options: 'i' } },
                { lastName: { $regex: finalQuery, $options: 'i' } },
                { email: { $regex: finalQuery, $options: 'i' } },
                { employeeId: { $regex: finalQuery, $options: 'i' } },
                { department: { $regex: finalQuery, $options: 'i' } },
                { position: { $regex: finalQuery, $options: 'i' } },
              ];

        const result = await this.executeTool('employee_directory', {
            action: 'search',
            query: finalQuery,
            searchQueries,
        });

        if (!result.success) {
            return {
                message: `❌ Error searching employee directory: ${result.error}`
            };
        }

        const { results } = result.data;
        if (!results || results.length === 0) {
            return {
                message: `I couldn't find any employees matching "${finalQuery}".`
            };
        }

        const formatted = results.map((emp: any) =>
            `👤 **${emp.firstName} ${emp.lastName}**\n` +
            `   ID: ${emp.employeeId}\n` +
            `   Dept: ${emp.department}\n` +
            `   Role: ${emp.position}\n` +
            `   Email: ${emp.email}`
        ).join('\n\n');

        return {
            message: `🔍 Found ${results.length} result(s):\n\n${formatted}`,
            toolsUsed: ['employee_directory'],
            data: result.data
        };
    }

    private async handleOnboardEmployee(message: string, context: any): Promise<Partial<AgentResponse>> {
        const role = context?.position || context?.role || 'default';
        const employeeId = context?.employeeId || `EMP-${Math.floor(1000 + Math.random() * 9000)}`;

        const checklistResult = await this.executeTool('onboarding_checklist', {
            employeeId,
            role,
            department: context?.department || 'Operations'
        });

        if (!checklistResult.success) {
            return {
                message: `❌ Error generating onboarding checklist: ${checklistResult.error}`
            };
        }

        return {
            message: `👤 **New Employee Onboarding Initiated!**\n` +
                `   Employee ID: ${employeeId}\n` +
                `   Role: ${role}\n` +
                `   Checklist Generated: ${checklistResult.data.totalItems} tasks created.`,
            toolsUsed: ['onboarding_checklist', 'employee_directory'],
            data: checklistResult.data
        };
    }

    private async handleLeaveManagement(message: string, context: any): Promise<Partial<AgentResponse>> {
        const hasRequestDetails = !!(context?.days || context?.duration_days || context?.leaveType || context?.leave_type);
        const action = hasRequestDetails ? 'request' : 'balance';
        const employeeId = context?.employee_id || context?.employeeId || 'EMP001';
        let leaveType = String(context?.leave_type || context?.leaveType || 'vacation').toLowerCase();
        if (leaveType === 'annual' || leaveType === 'pto') leaveType = 'vacation';
        if (!['vacation', 'sick', 'personal', 'unpaid', 'parental'].includes(leaveType)) {
            leaveType = 'vacation';
        }
        const days = Number(context?.days || context?.duration_days || 1);
        const startDate = context?.startDate || new Date().toISOString().split('T')[0];
        
        const start = new Date(startDate);
        const end = new Date(start);
        end.setDate(end.getDate() + Math.max(0, days - 1));
        const endDate = end.toISOString().split('T')[0];

        const toolParams = action === 'request'
            ? { action: 'request', employeeId, leaveType, startDate, endDate, reason: message }
            : { action: 'balance', employeeId };

        const result = await this.executeTool('leave_management', toolParams);

        if (!result.success) {
            return {
                message: `❌ Leave management action failed: ${result.error}`
            };
        }

        return {
            message: `🏖️ **Leave Action Completed (${action})**:\n` +
                (action === 'request'
                    ? `   Leave request submitted for ${days} day(s) (${leaveType}). Status: Pending approval.`
                    : `   Vacation: ${result.data.balances?.vacation || 20} days | Sick: ${result.data.balances?.sick || 10} days`),
            toolsUsed: ['leave_management'],
            data: result.data
        };
    }

    private async handlePerformanceTracking(message: string, context: any): Promise<Partial<AgentResponse>> {
        const employeeId = context?.employee_id || context?.employeeId || 'EMP001';
        const result = await this.executeTool('performance_tracker', {
            action: 'summary',
            employeeId
        });

        if (!result.success) {
            return {
                message: `❌ Error fetching performance records: ${result.error}`
            };
        }

        return {
            message: `📈 **Performance Review Record**:\n${JSON.stringify(result.data, null, 2)}`,
            toolsUsed: ['performance_tracker'],
            data: result.data
        };
    }

    private async handleExport(format: 'csv' | 'excel' | 'pdf', context: any): Promise<Partial<AgentResponse>> {
        const directoryResult = await this.executeTool('employee_directory', {
            action: 'list',
            limit: 100
        });

        if (!directoryResult.success || !directoryResult.data.employees?.length) {
            return {
                message: '❌ No employee data available to export.'
            };
        }

        const employees = directoryResult.data.employees;

        let exportResult;
        switch (format) {
            case 'csv':
                exportResult = await this.executeTool('csv_generator', {
                    filename: context?.filename || 'employees_export',
                    data: employees,
                });
                return {
                    message: `📊 CSV exported: ${exportResult.data.filename}`,
                    toolsUsed: ['employee_directory', 'csv_generator'],
                    data: { ...exportResult.data, downloadUrl: `/api/files/csv/${exportResult.data.filename}` },
                };
            case 'excel':
                exportResult = await this.executeTool('excel_generator', {
                    filename: context?.filename || 'employees_export',
                    sheets: [{
                        name: 'Employees',
                        data: employees
                    }],
                });
                return {
                    message: `📊 Excel file exported: ${exportResult.data.filename}`,
                    toolsUsed: ['employee_directory', 'excel_generator'],
                    data: { ...exportResult.data, downloadUrl: `/api/files/excel/${exportResult.data.filename}` },
                };
            case 'pdf':
                exportResult = await this.executeTool('pdf_generator', {
                    title: 'Workforce Directory Report',
                    filename: context?.filename || 'employees_report',
                    content: [{
                        type: 'heading',
                        text: 'Employee Directory',
                        level: 1
                    }, {
                        type: 'table',
                        data: employees
                    }],
                });
                return {
                    message: `📄 PDF generated: ${exportResult.data.filename}`,
                    toolsUsed: ['employee_directory', 'pdf_generator'],
                    data: { ...exportResult.data, downloadUrl: `/api/files/pdfs/${exportResult.data.filename}` },
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
            message: "I am the HR Agent. I can answer questions about company policies regarding leave, benefits, and our code of conduct. How can I help you?",
        };
    }
}
