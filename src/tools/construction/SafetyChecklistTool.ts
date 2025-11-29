import type {BaseTool, ToolResult} from '../../agents/types';
import {z} from 'zod';

const ChecklistSchema = z.object({
    projectType: z.string(),
    phase: z.enum(['planning', 'foundation', 'framing', 'electrical', 'plumbing', 'finishing']).optional(),
});

const SAFETY_CHECKLISTS: {
    general: string[];
    planning: string[];
    foundation: string[];
    framing: string[];
    electrical: string[];
    plumbing: string[];
    finishing: string[];
} = {
    general: [
        '✓ All workers have proper PPE (hard hats, safety glasses, gloves, steel-toed boots)',
        '✓ First aid kit is accessible and stocked',
        '✓ Emergency contact numbers posted',
        '✓ Fire extinguishers available and inspected',
        '✓ Site perimeter is secured with fencing/barriers',
        '✓ Warning signs posted for hazards',
        '✓ Adequate lighting in all work areas',
        '✓ Regular safety meetings scheduled',
    ],
    planning: [
        '✓ Site survey completed',
        '✓ Utility locations marked',
        '✓ Permits obtained',
        '✓ Safety plan documented',
        '✓ Emergency evacuation routes planned',
    ],
    foundation: [
        '✓ Excavation properly shored/sloped',
        '✓ Trench safety measures in place',
        '✓ Heavy equipment operators certified',
        '✓ Ground stability assessed',
        '✓ Proper drainage planned',
    ],
    framing: [
        '✓ Fall protection systems installed',
        '✓ Scaffolding inspected and secure',
        '✓ Ladder safety protocols followed',
        '✓ Power tools inspected',
        '✓ Material storage secure',
    ],
    electrical: [
        '✓ Licensed electrician on site',
        '✓ Power sources locked out/tagged out',
        '✓ GFCI protection on temporary power',
        '✓ Electrical panels labeled',
        '✓ No exposed wiring',
    ],
    plumbing: [
        '✓ Water supply shut-off accessible',
        '✓ Proper ventilation for soldering',
        '✓ Pressure testing completed',
        '✓ Trenches properly supported',
        '✓ Gas lines tested for leaks',
    ],
    finishing: [
        '✓ Ventilation for paint/solvents',
        '✓ Dust control measures active',
        '✓ Proper disposal of hazardous materials',
        '✓ Slip/trip hazards minimized',
        '✓ Final inspections scheduled',
    ],
};

export class SafetyChecklistTool implements BaseTool {
    name = 'safety_checklist_generator';
    description = 'Generate safety checklists for construction projects';

    async execute(params: any): Promise<ToolResult> {
        try {
            const validated = ChecklistSchema.parse(params);

            const checklist: string[] = [...SAFETY_CHECKLISTS.general];

            if (validated.phase && SAFETY_CHECKLISTS[validated.phase]) {
                checklist.push('', `=== ${validated.phase.toUpperCase()} PHASE ===`, '');
                checklist.push(...SAFETY_CHECKLISTS[validated.phase]);
            }

            return {
                success: true,
                data: {
                    projectType: validated.projectType,
                    phase: validated.phase || 'general',
                    checklist,
                    totalItems: checklist.filter(item => item.startsWith('✓')).length,
                    generatedAt: new Date().toISOString(),
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
