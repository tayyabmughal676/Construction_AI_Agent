import type {StepResult, Workflow, WorkflowState} from './types';
import {AgentRegistry} from '../agents/AgentRegistry';
import {logger} from '../config/logger';

/**
 * Predefined Workflows
 * Ready-to-use workflows for common tasks
 */

/**
 * Employee Onboarding Workflow
 * Automates the complete employee onboarding process
 */
export const employeeOnboardingWorkflow: Workflow = {
    id: 'employee_onboarding',
    name: 'Employee Onboarding',
    description: 'Complete employee onboarding: create record, checklist, goals, and send welcome email',
    keywords: ['hire', 'onboard', 'new employee', 'recruit'],
    requiredContext: ['firstName', 'lastName', 'position', 'department'],

    steps: [
        {
            name: 'Create Employee Record',
            description: 'Create employee in HR system',
            agent: 'hr',
            tool: 'employee_directory',
            action: async (state: WorkflowState): Promise<StepResult> => {
                try {
                    const registry = AgentRegistry.getInstance();
                    const hrAgent = registry.getAgent('hr');

                    if (!hrAgent) {
                        return {success: false, error: 'HR Agent not found'};
                    }

                    const result = await hrAgent.executeTool('employee_directory', {
                        action: 'create',
                        firstName: state.data.firstName,
                        lastName: state.data.lastName,
                        email: state.data.email || `${state.data.firstName.toLowerCase()}.${state.data.lastName.toLowerCase()}@company.com`,
                        phone: state.data.phone || '555-123-4567',
                        department: state.data.department,
                        position: state.data.position,
                        startDate: state.data.startDate || new Date().toISOString().split('T')[0],
                        salary: state.data.salary || 75000,
                    });

                    if (result.success) {
                        // Store employee ID for next steps
                        // Handle different response structures
                        const employeeId = result.data.employee?.employeeId || result.data.employeeId;
                        state.data.employeeId = employeeId;
                        return {
                            success: true,
                            data: result.data,
                            message: `Created employee: ${employeeId}`,
                        };
                    }

                    return {success: false, error: result.error};
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    };
                }
            },
        },

        {
            name: 'Generate Onboarding Checklist',
            description: 'Create role-based onboarding checklist',
            agent: 'hr',
            tool: 'onboarding_checklist',
            action: async (state: WorkflowState): Promise<StepResult> => {
                try {
                    const registry = AgentRegistry.getInstance();
                    const hrAgent = registry.getAgent('hr');

                    if (!hrAgent) {
                        return {success: false, error: 'HR Agent not found'};
                    }

                    const result = await hrAgent.executeTool('onboarding_checklist', {
                        action: 'generate',
                        employeeId: state.data.employeeId,
                        role: state.data.position,
                        department: state.data.department,
                    });

                    if (result.success) {
                        state.data.checklistId = result.data.checklistId;
                        state.data.totalTasks = result.data.totalTasks;
                        return {
                            success: true,
                            data: result.data,
                            message: `Generated checklist with ${result.data.totalTasks} tasks`,
                        };
                    }

                    return {success: false, error: result.error};
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    };
                }
            },
        },

        {
            name: 'Set Performance Goals',
            description: 'Create initial performance goals',
            agent: 'hr',
            tool: 'performance_tracker',
            action: async (state: WorkflowState): Promise<StepResult> => {
                try {
                    const registry = AgentRegistry.getInstance();
                    const hrAgent = registry.getAgent('hr');

                    if (!hrAgent) {
                        return {success: false, error: 'HR Agent not found'};
                    }

                    // Create 30-day and 90-day goals
                    const goals = [
                        {
                            title: 'Complete onboarding checklist',
                            description: 'Finish all onboarding tasks',
                            category: 'onboarding',
                            priority: 'high',
                            dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        },
                        {
                            title: '90-day performance review',
                            description: 'Complete first performance review',
                            category: 'performance',
                            priority: 'medium',
                            dueDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
                        },
                    ];

                    const results = [];
                    for (const goal of goals) {
                        const result = await hrAgent.executeTool('performance_tracker', {
                            action: 'create_goal',
                            employeeId: state.data.employeeId,
                            ...goal,
                        });

                        if (result.success) {
                            results.push(result.data);
                        }
                    }

                    state.data.goalsCreated = results.length;

                    return {
                        success: true,
                        data: results,
                        message: `Created ${results.length} performance goals`,
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    };
                }
            },
        },

        {
            name: 'Send Welcome Email',
            description: 'Send welcome email with onboarding information',
            agent: 'hr',
            tool: 'email_sender',
            condition: (state: WorkflowState) => {
                // Only send email if we have employee email
                return !!state.data.email;
            },
            action: async (state: WorkflowState): Promise<StepResult> => {
                try {
                    const registry = AgentRegistry.getInstance();
                    const hrAgent = registry.getAgent('hr');

                    if (!hrAgent) {
                        return {success: false, error: 'HR Agent not found'};
                    }

                    const result = await hrAgent.executeTool('email_sender', {
                        to: state.data.email,
                        subject: `Welcome to the team, ${state.data.firstName}!`,
                        body: `
Hi ${state.data.firstName},

Welcome to ${state.data.department}! We're excited to have you join us as ${state.data.position}.

Your onboarding checklist has ${state.data.totalTasks} tasks to complete.
We've also set up your initial performance goals.

Employee ID: ${state.data.employeeId}
Start Date: ${state.data.startDate}

Looking forward to working with you!

Best regards,
HR Team
                        `.trim(),
                    });

                    if (result.success) {
                        return {
                            success: true,
                            data: result.data,
                            message: 'Welcome email sent',
                        };
                    }

                    // Email not configured is OK - don't fail the workflow
                    if (result.error?.includes('not configured')) {
                        logger.warn('Email not configured, skipping welcome email');
                        return {
                            success: true,
                            message: 'Email not configured (skipped)',
                        };
                    }

                    return {success: false, error: result.error};
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    };
                }
            },
        },
    ],
};

/**
 * Project Kickoff Workflow
 * Automates the complete project initialization process
 */
export const projectKickoffWorkflow: Workflow = {
    id: 'project_kickoff',
    name: 'Project Kickoff',
    description: 'Complete project setup: create project, calculate costs, estimate timeline, generate safety checklist, and export PDF',
    keywords: ['new project', 'start project', 'kickoff', 'project setup', 'begin project'],
    requiredContext: ['projectName', 'location', 'type'],

    steps: [
        {
            name: 'Create Project Record',
            description: 'Create project in construction system',
            agent: 'construction',
            tool: 'project_tracker',
            action: async (state: WorkflowState): Promise<StepResult> => {
                try {
                    const registry = AgentRegistry.getInstance();
                    const constructionAgent = registry.getAgent('construction');

                    if (!constructionAgent) {
                        return {success: false, error: 'Construction Agent not found'};
                    }

                    const result = await constructionAgent.executeTool('project_tracker', {
                        action: 'create',
                        name: state.data.projectName,
                        location: state.data.location,
                        type: state.data.type,
                        status: 'planning',
                        budget: state.data.budget || 500000,
                        startDate: state.data.startDate || new Date().toISOString().split('T')[0],
                    });

                    if (result.success) {
                        state.data.projectId = result.data.projectId;
                        return {
                            success: true,
                            data: result.data,
                            message: `Created project: ${result.data.projectId}`,
                        };
                    }

                    return {success: false, error: result.error};
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    };
                }
            },
        },

        {
            name: 'Calculate Material Costs',
            description: 'Estimate material costs for project',
            agent: 'construction',
            tool: 'material_cost_calculator',
            action: async (state: WorkflowState): Promise<StepResult> => {
                try {
                    const registry = AgentRegistry.getInstance();
                    const constructionAgent = registry.getAgent('construction');

                    if (!constructionAgent) {
                        return {success: false, error: 'Construction Agent not found'};
                    }

                    // Default materials based on project type
                    const materials = state.data.materials || [
                        {name: 'Concrete', quantity: 100, unit: 'cubic yards'},
                        {name: 'Steel', quantity: 50, unit: 'tons'},
                        {name: 'Lumber', quantity: 200, unit: 'board feet'},
                    ];

                    const result = await constructionAgent.executeTool('material_cost_calculator', {
                        action: 'calculate',
                        projectId: state.data.projectId,
                        materials,
                    });

                    if (result.success) {
                        state.data.totalCost = result.data.totalCost;
                        state.data.materialBreakdown = result.data.breakdown;
                        return {
                            success: true,
                            data: result.data,
                            message: `Estimated material cost: $${result.data.totalCost.toLocaleString()}`,
                        };
                    }

                    return {success: false, error: result.error};
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    };
                }
            },
        },

        {
            name: 'Estimate Project Timeline',
            description: 'Generate project timeline and milestones',
            agent: 'construction',
            tool: 'timeline_estimator',
            action: async (state: WorkflowState): Promise<StepResult> => {
                try {
                    const registry = AgentRegistry.getInstance();
                    const constructionAgent = registry.getAgent('construction');

                    if (!constructionAgent) {
                        return {success: false, error: 'Construction Agent not found'};
                    }

                    const result = await constructionAgent.executeTool('timeline_estimator', {
                        action: 'estimate',
                        projectId: state.data.projectId,
                        projectType: state.data.type,
                        complexity: state.data.complexity || 'medium',
                    });

                    if (result.success) {
                        state.data.estimatedDuration = result.data.estimatedDuration;
                        state.data.milestones = result.data.milestones;
                        return {
                            success: true,
                            data: result.data,
                            message: `Estimated duration: ${result.data.estimatedDuration} days`,
                        };
                    }

                    return {success: false, error: result.error};
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    };
                }
            },
        },

        {
            name: 'Generate Safety Checklist',
            description: 'Create project-specific safety checklist',
            agent: 'construction',
            tool: 'safety_checklist_generator',
            action: async (state: WorkflowState): Promise<StepResult> => {
                try {
                    const registry = AgentRegistry.getInstance();
                    const constructionAgent = registry.getAgent('construction');

                    if (!constructionAgent) {
                        return {success: false, error: 'Construction Agent not found'};
                    }

                    const result = await constructionAgent.executeTool('safety_checklist_generator', {
                        action: 'generate',
                        projectId: state.data.projectId,
                        projectType: state.data.type,
                        location: state.data.location,
                    });

                    if (result.success) {
                        state.data.safetyItems = result.data.totalItems;
                        return {
                            success: true,
                            data: result.data,
                            message: `Generated safety checklist with ${result.data.totalItems} items`,
                        };
                    }

                    return {success: false, error: result.error};
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    };
                }
            },
        },

        {
            name: 'Export Project Plan',
            description: 'Generate comprehensive PDF report',
            agent: 'construction',
            tool: 'pdf_generator',
            action: async (state: WorkflowState): Promise<StepResult> => {
                try {
                    const registry = AgentRegistry.getInstance();
                    const constructionAgent = registry.getAgent('construction');

                    if (!constructionAgent) {
                        return {success: false, error: 'Construction Agent not found'};
                    }

                    const content = `
PROJECT KICKOFF REPORT
=====================

Project: ${state.data.projectName}
ID: ${state.data.projectId}
Location: ${state.data.location}
Type: ${state.data.type}

COST ESTIMATE
-------------
Total Material Cost: $${state.data.totalCost?.toLocaleString() || 'N/A'}

TIMELINE
--------
Estimated Duration: ${state.data.estimatedDuration || 'N/A'} days
Milestones: ${state.data.milestones?.length || 0}

SAFETY
------
Safety Checklist Items: ${state.data.safetyItems || 'N/A'}

Generated: ${new Date().toISOString()}
                    `.trim();

                    const result = await constructionAgent.executeTool('pdf_generator', {
                        content,
                        filename: `project_kickoff_${state.data.projectId}.pdf`,
                    });

                    if (result.success) {
                        return {
                            success: true,
                            data: result.data,
                            message: `Project plan exported to PDF`,
                        };
                    }

                    return {success: false, error: result.error};
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    };
                }
            },
        },
    ],
};

/**
 * Inventory Restock Workflow
 * Automates inventory analysis and reorder process
 */
export const inventoryRestockWorkflow: Workflow = {
    id: 'inventory_restock',
    name: 'Inventory Restock',
    description: 'Analyze inventory levels, identify low stock, calculate reorder quantities, and generate procurement report',
    keywords: ['restock', 'reorder', 'inventory low', 'stock check', 'replenish'],
    requiredContext: [],

    steps: [
        {
            name: 'Check Inventory Levels',
            description: 'Analyze current inventory status',
            agent: 'manufacturing',
            tool: 'inventory_tracker',
            action: async (state: WorkflowState): Promise<StepResult> => {
                try {
                    const registry = AgentRegistry.getInstance();
                    const manufacturingAgent = registry.getAgent('manufacturing');

                    if (!manufacturingAgent) {
                        return {success: false, error: 'Manufacturing Agent not found'};
                    }

                    const result = await manufacturingAgent.executeTool('inventory_tracker', {
                        action: 'list',
                    });

                    if (result.success) {
                        state.data.allInventory = result.data.inventory;
                        state.data.totalItems = result.data.count;
                        return {
                            success: true,
                            data: result.data,
                            message: `Checked ${result.data.count} inventory items`,
                        };
                    }

                    return {success: false, error: result.error};
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    };
                }
            },
        },

        {
            name: 'Identify Low Stock Items',
            description: 'Find items below reorder threshold',
            agent: 'manufacturing',
            tool: 'inventory_tracker',
            action: async (state: WorkflowState): Promise<StepResult> => {
                try {
                    // Analyze inventory to find low stock items
                    const lowStockItems = state.data.allInventory.filter((item: any) => {
                        const threshold = item.reorderPoint || 50;
                        return item.quantity <= threshold;
                    });

                    state.data.lowStockItems = lowStockItems;
                    state.data.lowStockCount = lowStockItems.length;

                    return {
                        success: true,
                        data: {lowStockItems, count: lowStockItems.length},
                        message: `Found ${lowStockItems.length} items below reorder threshold`,
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    };
                }
            },
        },

        {
            name: 'Calculate Reorder Quantities',
            description: 'Determine optimal reorder amounts',
            agent: 'manufacturing',
            tool: 'inventory_tracker',
            action: async (state: WorkflowState): Promise<StepResult> => {
                try {
                    const reorderList = state.data.lowStockItems.map((item: any) => {
                        const currentQty = item.quantity || 0;
                        const reorderPoint = item.reorderPoint || 50;
                        const maxStock = item.maxStock || 200;
                        const reorderQty = Math.max(maxStock - currentQty, reorderPoint);

                        return {
                            itemId: item.itemId,
                            name: item.name,
                            currentQuantity: currentQty,
                            reorderQuantity: reorderQty,
                            estimatedCost: (item.unitCost || 10) * reorderQty,
                            supplier: item.supplier || 'Default Supplier',
                        };
                    });

                    const totalCost = reorderList.reduce((sum: number, item: any) => sum + item.estimatedCost, 0);

                    state.data.reorderList = reorderList;
                    state.data.totalReorderCost = totalCost;

                    return {
                        success: true,
                        data: {reorderList, totalCost},
                        message: `Calculated reorder for ${reorderList.length} items, total cost: $${totalCost.toLocaleString()}`,
                    };
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    };
                }
            },
        },

        {
            name: 'Generate Procurement Report',
            description: 'Create CSV report for procurement team',
            agent: 'manufacturing',
            tool: 'csv_generator',
            action: async (state: WorkflowState): Promise<StepResult> => {
                try {
                    const registry = AgentRegistry.getInstance();
                    const manufacturingAgent = registry.getAgent('manufacturing');

                    if (!manufacturingAgent) {
                        return {success: false, error: 'Manufacturing Agent not found'};
                    }

                    const result = await manufacturingAgent.executeTool('csv_generator', {
                        data: state.data.reorderList,
                        filename: `inventory_restock_${new Date().toISOString().split('T')[0]}.csv`,
                    });

                    if (result.success) {
                        return {
                            success: true,
                            data: result.data,
                            message: `Procurement report exported to CSV`,
                        };
                    }

                    return {success: false, error: result.error};
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    };
                }
            },
        },

        {
            name: 'Send Procurement Summary',
            description: 'Email summary to procurement team (if configured)',
            agent: 'manufacturing',
            tool: 'email_sender',
            condition: (state: WorkflowState) => {
                // Only send if we have items to reorder
                return state.data.lowStockCount > 0;
            },
            action: async (state: WorkflowState): Promise<StepResult> => {
                try {
                    const registry = AgentRegistry.getInstance();
                    const manufacturingAgent = registry.getAgent('manufacturing');

                    if (!manufacturingAgent) {
                        return {success: false, error: 'Manufacturing Agent not found'};
                    }

                    const itemsList = state.data.reorderList
                        .map((item: any) => `- ${item.name}: ${item.reorderQuantity} units ($${item.estimatedCost.toLocaleString()})`)
                        .join('\n');

                    const result = await manufacturingAgent.executeTool('email_sender', {
                        to: state.data.procurementEmail || 'procurement@company.com',
                        subject: `Inventory Restock Required - ${state.data.lowStockCount} Items`,
                        body: `
INVENTORY RESTOCK ALERT

Low Stock Items: ${state.data.lowStockCount}
Total Reorder Cost: $${state.data.totalReorderCost.toLocaleString()}

ITEMS TO REORDER:
${itemsList}

Please review the attached CSV report for detailed information.

Generated: ${new Date().toISOString()}
                        `.trim(),
                    });

                    if (result.success) {
                        return {
                            success: true,
                            data: result.data,
                            message: 'Procurement summary sent',
                        };
                    }

                    // Email not configured is OK - don't fail the workflow
                    if (result.error?.includes('not configured')) {
                        logger.warn('Email not configured, skipping procurement summary');
                        return {
                            success: true,
                            message: 'Email not configured (skipped)',
                        };
                    }

                    return {success: false, error: result.error};
                } catch (error) {
                    return {
                        success: false,
                        error: error instanceof Error ? error.message : 'Unknown error',
                    };
                }
            },
        },
    ],
};

/**
 * All predefined workflows
 */
export const predefinedWorkflows: Workflow[] = [
    employeeOnboardingWorkflow,
    projectKickoffWorkflow,
    inventoryRestockWorkflow,
];
