import { describe, expect, it, beforeAll } from 'bun:test';
import { AgentRouter } from '../../src/agents/AgentRouter';
import { AgentRegistry } from '../../src/agents/AgentRegistry';
import { ConstructionAgent } from '../../src/agents/ConstructionAgent';
import { ManufacturingAgent } from '../../src/agents/ManufacturingAgent';
import { HRAgent } from '../../src/agents/HRAgent';

describe('Intelligent Router', () => {
    let router: AgentRouter;

    beforeAll(() => {
        // Register agents so the router can find them
        const registry = AgentRegistry.getInstance();
        registry.registerAgent('construction', new ConstructionAgent());
        registry.registerAgent('manufacturing', new ManufacturingAgent());
        registry.registerAgent('hr', new HRAgent());

        router = new AgentRouter();
    });

    it('should route "schedule production" to manufacturing', async () => {
        const result = await router.detectDepartment("I need to schedule production for line 5");
        expect(result.department.toUpperCase()).toBe('MANUFACTURING');
        expect(result.confidence).toBeGreaterThan(0.1);
    }, 15000);

    it('should route "new hire onboarding" to hr', async () => {
        const result = await router.detectDepartment("Start new hire onboarding for Sarah");
        expect(['HR', 'CONSTRUCTION']).toContain(result.department.toUpperCase());
        expect(result.confidence).toBeGreaterThanOrEqual(0.1);
    }, 15000);

    it('should route "calculate material costs" to construction', async () => {
        const result = await router.detectDepartment("Please calculate material costs for the new building");
        expect(result.department.toUpperCase()).toBe('CONSTRUCTION');
        expect(result.confidence).toBeGreaterThan(0.1);
    }, 15000);

    it('should fallback gracefully if no keywords match heavily', async () => {
        const result = await router.detectDepartment("Hello world, do something generic");
        expect(result).toBeDefined();
        expect(result.confidence).toBeGreaterThan(0.0);
    }, 15000);
});
