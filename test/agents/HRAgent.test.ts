import { describe, expect, it } from 'bun:test';
import { HRAgent } from '../../src/agents/HRAgent';

describe('HR Agent', () => {
    const agent = new HRAgent();

    it('should have correct name', () => {
        expect(agent.name).toBe('HR');
    });

    it('should successfully execute the employee_directory tool', async () => {
        const result = await agent.executeTool('employee_directory', {
            action: 'list'
        });
        
        expect(result.success).toBe(true);
        expect(result.data.employees).toBeInstanceOf(Array);
    });

    it('should successfully execute onboarding checklist generation', async () => {
        const result = await agent.executeTool('onboarding_checklist', {
            action: 'generate',
            employeeId: 'EMP-1234',
            role: 'Developer',
            department: 'Engineering'
        });

        expect(result.success).toBe(true);
        expect(result.data.checklistId).toBeDefined();
    });
});
