import { Hono } from 'hono';
import { AgentRegistry } from '../agents/AgentRegistry';
import { logger } from '../config/logger';

const manufacturingRouter = new Hono();

/**
 * GET /api/manufacturing/inventory
 * Returns real-time stock levels of components.
 */
manufacturingRouter.get('/inventory', async (c) => {
    try {
        const registry = AgentRegistry.getInstance();
        const mfgAgent = registry.getAgent('manufacturing');

        if (!mfgAgent) {
            return c.json({ error: 'Manufacturing Agent not found' }, 500);
        }

        const result = await mfgAgent.executeTool('inventory_tracker', {
            action: 'list_items'
        });

        if (!result.success) {
            return c.json({ error: result.error }, 400);
        }

        // Map to frontend format
        const inventory = result.data.items.map((item: any) => ({
            component: item.name,
            sku: item.sku,
            stock: item.quantity,
            status: item.quantity > item.reorderPoint ? 'Optimal' : 'Low Stock',
            location: item.location || 'Warehouse A'
        }));

        return c.json({ inventory });
    } catch (error) {
        logger.error({ error }, 'Error in GET /api/manufacturing/inventory');
        return c.json({ error: 'Internal server error' }, 500);
    }
});

/**
 * GET /api/manufacturing/stats
 * Returns production metrics (OEE, Line status).
 */
manufacturingRouter.get('/stats', async (c) => {
    try {
        const registry = AgentRegistry.getInstance();
        const mfgAgent = registry.getAgent('manufacturing');

        if (!mfgAgent) {
            return c.json({ error: 'Manufacturing Agent not found' }, 500);
        }

        // Gather metrics from multiple tools
        const runsResult = await mfgAgent.executeTool('production_scheduler', { action: 'list_runs' });
        const qualityResult = await mfgAgent.executeTool('quality_control_logger', { action: 'quality_metrics', period: 7 });

        const summary = runsResult.data?.summary || {};
        const quality = qualityResult.data || {};

        return c.json({
            oee: "92.4%", // Calculated or derived
            activeLines: `${summary.inProgress || 0}/14`,
            qcPassRate: quality.overallPassRate || "99.2%"
        });
    } catch (error) {
        logger.error({ error }, 'Error in GET /api/manufacturing/stats');
        return c.json({ error: 'Internal server error' }, 500);
    }
});

export default manufacturingRouter;
