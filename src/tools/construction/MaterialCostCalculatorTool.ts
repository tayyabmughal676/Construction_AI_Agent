import type {BaseTool, ToolResult} from '../../agents/types';
import {z} from 'zod';

const MaterialSchema = z.object({
    material: z.string(),
    quantity: z.number(),
    unit: z.string().optional().default('units'),
});

// Sample material costs (in USD per unit)
const MATERIAL_COSTS: Record<string, number> = {
    concrete: 150, // per cubic yard
    steel: 800, // per ton
    lumber: 450, // per 1000 board feet
    brick: 600, // per 1000 bricks
    cement: 120, // per bag
    sand: 30, // per ton
    gravel: 35, // per ton
    rebar: 650, // per ton
    drywall: 10, // per sheet
    insulation: 0.5, // per square foot
    roofing: 3.5, // per square foot
    paint: 30, // per gallon
    tile: 5, // per square foot
    glass: 25, // per square foot
    plywood: 40, // per sheet
};

export class MaterialCostCalculatorTool implements BaseTool {
    name = 'material_cost_calculator';
    description = 'Calculate costs for construction materials';

    async execute(params: any): Promise<ToolResult> {
        try {
            const {materials} = params;

            if (!materials || !Array.isArray(materials)) {
                return {
                    success: false,
                    error: 'materials array is required',
                };
            }

            const validated = z.array(MaterialSchema).parse(materials);

            const calculations = validated.map(item => {
                const materialName = item.material.toLowerCase();
                const unitCost = MATERIAL_COSTS[materialName] || 0;
                const totalCost = unitCost * item.quantity;

                return {
                    material: item.material,
                    quantity: item.quantity,
                    unit: item.unit,
                    unitCost: unitCost,
                    totalCost: totalCost,
                    available: materialName in MATERIAL_COSTS,
                };
            });

            const grandTotal = calculations.reduce((sum, item) => sum + item.totalCost, 0);
            const unknownMaterials = calculations.filter(item => !item.available);

            return {
                success: true,
                data: {
                    calculations,
                    grandTotal,
                    currency: 'USD',
                    unknownMaterials: unknownMaterials.length > 0
                        ? unknownMaterials.map(m => m.material)
                        : undefined,
                    note: unknownMaterials.length > 0
                        ? 'Some materials have no cost data (shown as $0)'
                        : undefined,
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
