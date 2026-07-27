import { Elysia } from 'elysia';
import { AgentRegistry } from '../agents/AgentRegistry';
import { logger } from '../config/logger';

const hrRouter = new Elysia();

/**
 * GET /api/hr/employees
 * Returns the full workforce directory.
 */
hrRouter.get('/employees', async (c) => {
    try {
        const registry = AgentRegistry.getInstance();
        const hrAgent = registry.getAgent('hr');

        if (!hrAgent) {
            c.set.status = 500;
            return { error: 'HR Agent not found' };
        }

        const result = await hrAgent.executeTool('employee_directory', {
            action: 'list',
            limit: 100
        });

        if (!result.success) {
            c.set.status = 400;
            return { error: result.error };
        }

        // Map internal data to the format requested by frontend
        const employees = result.data.employees.map((emp: any) => ({
            id: emp.employeeId,
            name: `${emp.firstName} ${emp.lastName}`,
            role: emp.position,
            department: emp.department,
            status: emp.status || 'Active'
        }));

        return { employees };
    } catch (error) {
        logger.error({ error }, 'Error in GET /api/hr/employees');
        c.set.status = 500;
        return { error: 'Internal server error' };
    }
});

export default hrRouter;
