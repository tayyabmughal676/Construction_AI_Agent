import { describe, expect, it } from 'bun:test';
import { ConstructionAgent } from '../../src/agents/ConstructionAgent';

describe('Construction Agent', () => {
    const agent = new ConstructionAgent();

    it('should have correct name and department', () => {
        expect(agent.name).toBe('construction');
    });

    it('should process a generic message gracefully', async () => {
        const result = await agent.processMessage("Tell me about the project", "test-session", {});
        expect(result.department).toBe('construction');
        expect(result.message).toBeDefined();
    });

    it('should successfully execute the material_calculator tool', async () => {
        const result = await agent.executeTool('material_calculator', {
            projectType: 'commercial',
            squareFootage: 5000,
            qualityTier: 'standard'
        });
        
        expect(result.success).toBe(true);
        expect(result.data).toBeDefined();
        expect(result.data.totalEstimatedCost).toBeGreaterThan(0);
    });

    it('should successfully execute the safety_checklist tool', async () => {
        const result = await agent.executeTool('safety_checklist', {
            action: 'generate',
            projectType: 'residential'
        });

        expect(result.success).toBe(true);
        expect(result.data.checklistId).toBeDefined();
        expect(result.data.items.length).toBeGreaterThan(0);
    });
});
