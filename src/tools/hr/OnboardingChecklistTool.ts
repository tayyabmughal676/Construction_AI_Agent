import type {BaseTool, ToolResult} from '../../agents/types';
import {z} from 'zod';

const OnboardingSchema = z.object({
    employeeId: z.string(),
    role: z.string(),
    department: z.string().optional(),
});

// Role-based onboarding checklists
const ONBOARDING_CHECKLISTS: {
    [key: string]: {
        general: string[];
        roleSpecific: string[];
    };
} = {
    developer: {
        general: [
            '✓ Complete HR paperwork and tax forms',
            '✓ Set up company email and accounts',
            '✓ Receive employee handbook',
            '✓ Complete IT security training',
            '✓ Get office tour and introduction to team',
            '✓ Set up workstation and equipment',
            '✓ Review company policies and procedures',
            '✓ Schedule 1-on-1 with manager',
        ],
        roleSpecific: [
            '✓ Set up development environment',
            '✓ Get access to code repositories (GitHub/GitLab)',
            '✓ Review coding standards and best practices',
            '✓ Set up IDE and development tools',
            '✓ Get access to staging and development servers',
            '✓ Review architecture documentation',
            '✓ Attend technical onboarding session',
            '✓ Pair programming with senior developer',
            '✓ Complete first code review',
        ],
    },
    manager: {
        general: [
            '✓ Complete HR paperwork and tax forms',
            '✓ Set up company email and accounts',
            '✓ Receive employee handbook',
            '✓ Complete IT security training',
            '✓ Get office tour and introduction to team',
            '✓ Set up workstation and equipment',
            '✓ Review company policies and procedures',
            '✓ Schedule 1-on-1 with manager',
        ],
        roleSpecific: [
            '✓ Review team structure and org chart',
            '✓ Meet with direct reports individually',
            '✓ Review team goals and KPIs',
            '✓ Complete management training',
            '✓ Get access to HR systems and tools',
            '✓ Review budget and resource allocation',
            '✓ Attend leadership team meeting',
            '✓ Set up performance review schedule',
        ],
    },
    sales: {
        general: [
            '✓ Complete HR paperwork and tax forms',
            '✓ Set up company email and accounts',
            '✓ Receive employee handbook',
            '✓ Complete IT security training',
            '✓ Get office tour and introduction to team',
            '✓ Set up workstation and equipment',
            '✓ Review company policies and procedures',
            '✓ Schedule 1-on-1 with manager',
        ],
        roleSpecific: [
            '✓ Product training and demo sessions',
            '✓ Get access to CRM system',
            '✓ Review sales process and methodology',
            '✓ Shadow experienced sales rep',
            '✓ Learn pricing and discount policies',
            '✓ Get assigned territory/accounts',
            '✓ Set up sales tools and software',
            '✓ Review sales targets and quotas',
            '✓ Attend sales team meeting',
        ],
    },
    hr: {
        general: [
            '✓ Complete HR paperwork and tax forms',
            '✓ Set up company email and accounts',
            '✓ Receive employee handbook',
            '✓ Complete IT security training',
            '✓ Get office tour and introduction to team',
            '✓ Set up workstation and equipment',
            '✓ Review company policies and procedures',
            '✓ Schedule 1-on-1 with manager',
        ],
        roleSpecific: [
            '✓ Get access to HRIS system',
            '✓ Review employee files and records',
            '✓ Learn payroll processing procedures',
            '✓ Review benefits administration',
            '✓ Complete employment law training',
            '✓ Learn recruitment process',
            '✓ Review performance management system',
            '✓ Understand compliance requirements',
        ],
    },
    marketing: {
        general: [
            '✓ Complete HR paperwork and tax forms',
            '✓ Set up company email and accounts',
            '✓ Receive employee handbook',
            '✓ Complete IT security training',
            '✓ Get office tour and introduction to team',
            '✓ Set up workstation and equipment',
            '✓ Review company policies and procedures',
            '✓ Schedule 1-on-1 with manager',
        ],
        roleSpecific: [
            '✓ Review brand guidelines and assets',
            '✓ Get access to marketing tools (CMS, analytics, etc.)',
            '✓ Learn content approval process',
            '✓ Review marketing strategy and campaigns',
            '✓ Get access to social media accounts',
            '✓ Meet with creative team',
            '✓ Review marketing calendar',
            '✓ Learn SEO and content best practices',
        ],
    },
    default: {
        general: [
            '✓ Complete HR paperwork and tax forms',
            '✓ Set up company email and accounts',
            '✓ Receive employee handbook',
            '✓ Complete IT security training',
            '✓ Get office tour and introduction to team',
            '✓ Set up workstation and equipment',
            '✓ Review company policies and procedures',
            '✓ Schedule 1-on-1 with manager',
            '✓ Complete required compliance training',
            '✓ Set up benefits enrollment',
        ],
        roleSpecific: [
            '✓ Review role-specific responsibilities',
            '✓ Meet with team members',
            '✓ Get access to necessary tools and systems',
            '✓ Review department processes',
            '✓ Set 30-60-90 day goals',
        ],
    },
};

export class OnboardingChecklistTool implements BaseTool {
    name = 'onboarding_checklist';
    description = 'Generate role-based onboarding checklists for new employees';

    async execute(params: any): Promise<ToolResult> {
        try {
            const validated = OnboardingSchema.parse(params);

            // Normalize role to lowercase for matching
            const roleLower = validated.role.toLowerCase();

            // Find matching checklist or use default
            let checklist = ONBOARDING_CHECKLISTS[roleLower];

            if (!checklist) {
                // Try partial matching
                const matchingRole = Object.keys(ONBOARDING_CHECKLISTS).find(
                    key => roleLower.includes(key) || key.includes(roleLower)
                );
                checklist = matchingRole
                    ? ONBOARDING_CHECKLISTS[matchingRole]
                    : ONBOARDING_CHECKLISTS.default;
            }

            // At this point checklist is guaranteed to be defined
            const combinedChecklist = [
                '=== GENERAL ONBOARDING ===',
                '',
                ...checklist!.general,
                '',
                '=== ROLE-SPECIFIC ONBOARDING ===',
                '',
                ...checklist!.roleSpecific,
            ];

            const totalItems = checklist!.general.length + checklist!.roleSpecific.length;

            return {
                success: true,
                data: {
                    employeeId: validated.employeeId,
                    role: validated.role,
                    department: validated.department,
                    checklist: combinedChecklist,
                    totalItems,
                    generalItems: checklist!.general.length,
                    roleSpecificItems: checklist!.roleSpecific.length,
                    generatedAt: new Date().toISOString(),
                    estimatedDays: Math.ceil(totalItems / 3), // Rough estimate: 3 items per day
                },
            };
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}
