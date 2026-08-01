import { describe, expect, it } from 'bun:test';
import { ConstructionAgent } from '../../src/agents/ConstructionAgent';

describe('Construction Agent', () => {
    const agent = new ConstructionAgent();

    it('should have correct name and department', () => {
        expect(agent.name).toBe('Construction');
    });

    it('should process a generic message gracefully', async () => {
        const result = await agent.processMessage("Tell me about the project", "test-session", {});
        expect(result.department).toBe('construction');
        expect(result.message).toBeDefined();
    });

    it('should successfully execute the material_cost_calculator tool', async () => {
        const result = await agent.executeTool('material_cost_calculator', {
            materials: [
                { material: 'concrete', quantity: 50, unit: 'cu_yd' },
                { material: 'steel', quantity: 10, unit: 'tons' }
            ]
        });

        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data.grandTotal).toBeGreaterThan(0);
    });

    it('should successfully execute the safety_checklist_generator tool', async () => {
        const result = await agent.executeTool('safety_checklist_generator', {
            projectType: 'commercial'
        });

        expect(result.success).toBe(true);
        expect(result.data.checklist).toBeDefined();
        expect(result.data.checklist.length).toBeGreaterThan(0);
    });
});
