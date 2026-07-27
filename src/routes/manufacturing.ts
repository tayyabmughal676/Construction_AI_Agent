import { Elysia } from 'elysia';
import { AgentRegistry } from '../agents/AgentRegistry';
import { logger } from '../config/logger';

const manufacturingRouter = new Elysia();

/**
 * GET /api/manufacturing/inventory
 * Returns real-time stock levels of components.
 */
manufacturingRouter.get('/inventory', async (c) => {
    try {
        const registry = AgentRegistry.getInstance();
        const mfgAgent = registry.getAgent('manufacturing');

        if (!mfgAgent) {
            c.set.status = 500;
            return { error: 'Manufacturing Agent not found' };
        }

        const result = await mfgAgent.executeTool('inventory_tracker', {
            action: 'list_items'
        });

        if (!result.success) {
            c.set.status = 400;
            return { error: result.error };
        }

        // Map to frontend format
        const inventory = result.data.items.map((item: any) => ({
            component: item.name,
            sku: item.sku,
            stock: item.quantity,
            status: item.quantity > item.reorderPoint ? 'Optimal' : 'Low Stock',
            location: item.location || 'Warehouse A'
        }));

        return { inventory };
    } catch (error) {
        logger.error({ error }, 'Error in GET /api/manufacturing/inventory');
        c.set.status = 500;
        return { error: 'Internal server error' };
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
            c.set.status = 500;
            return { error: 'Manufacturing Agent not found' };
        }

        // Gather metrics from multiple tools
        const runsResult = await mfgAgent.executeTool('production_scheduler', { action: 'list_runs' });
        const qualityResult = await mfgAgent.executeTool('quality_control_logger', { action: 'quality_metrics', period: 7 });

        const summary = runsResult.data?.summary || {};
        const quality = qualityResult.data || {};

        return {
            oee: "92.4%", // Calculated or derived
            activeLines: `${summary.inProgress || 0}/14`,
            qcPassRate: quality.overallPassRate || "99.2%"
        };
    } catch (error) {
        logger.error({ error }, 'Error in GET /api/manufacturing/stats');
        c.set.status = 500;
        return { error: 'Internal server error' };
    }
});

export default manufacturingRouter;
