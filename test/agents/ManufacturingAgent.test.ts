import { describe, expect, it } from 'bun:test';
import { ManufacturingAgent } from '../../src/agents/ManufacturingAgent';

describe('Manufacturing Agent', () => {
    const agent = new ManufacturingAgent();

    it('should have correct name', () => {
        expect(agent.name).toBe('Manufacturing');
    });

    it('should successfully execute the inventory_tracker tool', async () => {
        const result = await agent.executeTool('inventory_tracker', {
            action: 'list_items'
        });
        
        expect(result.success).toBe(true);
        expect(result.data.items).toBeInstanceOf(Array);
    });

    it('should reject invalid actions for inventory tracker', async () => {
        const result = await agent.executeTool('inventory_tracker', {
            action: 'invalid_action'
        });

        expect(result.success).toBe(false);
    });
});
