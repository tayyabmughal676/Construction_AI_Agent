import { Hono } from 'hono';
import { AgentRegistry } from '../agents/AgentRegistry';
import { logger } from '../config/logger';

const hrRouter = new Hono();

/**
 * GET /api/hr/employees
 * Returns the full workforce directory.
 */
hrRouter.get('/employees', async (c) => {
    try {
        const registry = AgentRegistry.getInstance();
        const hrAgent = registry.getAgent('hr');

        if (!hrAgent) {
            return c.json({ error: 'HR Agent not found' }, 500);
        }

        const result = await hrAgent.executeTool('employee_directory', {
            action: 'list',
            limit: 100
        });

        if (!result.success) {
            return c.json({ error: result.error }, 400);
        }

        // Map internal data to the format requested by frontend
        const employees = result.data.employees.map((emp: any) => ({
            id: emp.employeeId,
            name: `${emp.firstName} ${emp.lastName}`,
            role: emp.position,
            department: emp.department,
            status: emp.status || 'Active'
        }));

        return c.json({ employees });
    } catch (error) {
        logger.error({ error }, 'Error in GET /api/hr/employees');
        return c.json({ error: 'Internal server error' }, 500);
    }
});

export default hrRouter;
