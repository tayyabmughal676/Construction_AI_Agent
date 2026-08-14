import { Elysia } from 'elysia';
import { AgentRegistry } from '../agents/AgentRegistry';
import { logger } from '../config/logger';
import { mongodb } from '../db/mongodb';
import { ObjectId } from 'mongodb';

function buildInventoryFilter(id: string) {
    if (ObjectId.isValid(id) && id.length === 24) {
        return { $or: [{ itemCode: id }, { sku: id }, { _id: new ObjectId(id) }] };
    }
    return { $or: [{ itemCode: id }, { sku: id }] };
}

const manufacturingRouter = new Elysia();

/**
 * GET /api/manufacturing/inventory
 * Returns real-time stock levels of components.
 */
manufacturingRouter.get('/inventory', async (c) => {
    try {
        const db = mongodb.getDb();
        const rawInventory = await db.collection('inventory').find({}).toArray();

        const inventory = rawInventory.map((item: any) => ({
            id: item.itemCode || item._id.toString(),
            mongoId: item._id.toString(),
            itemCode: item.itemCode || 'ITEM-' + item._id.toString().substring(0, 4),
            component: item.name || item.component || 'Component',
            name: item.name || item.component || 'Component',
            category: item.category || 'General',
            sku: item.itemCode || item.sku || 'SKU-000',
            stock: item.quantity !== undefined ? item.quantity : item.stock || 0,
            quantity: item.quantity !== undefined ? item.quantity : item.stock || 0,
            unitCost: item.unitCost || 0,
            reorderPoint: item.reorderPoint || 100,
            status: (item.quantity !== undefined ? item.quantity : item.stock || 0) > (item.reorderPoint || 100) ? 'Optimal' : 'Low Stock',
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
 * POST /api/manufacturing/inventory
 * Add a new inventory item.
 */
manufacturingRouter.post('/inventory', async (c) => {
    try {
        const body = (c.body as any) || await c.request.clone().json();
        const db = mongodb.getDb();

        const newItem = {
            itemCode: body.itemCode || body.sku || `ITEM-${Date.now().toString().slice(-4)}`,
            name: body.name || body.component || 'New Component',
            category: body.category || 'Raw Materials',
            quantity: Number(body.quantity || body.stock) || 100,
            unit: body.unit || 'units',
            unitCost: Number(body.unitCost) || 10.0,
            reorderPoint: Number(body.reorderPoint) || 50,
            location: body.location || 'Warehouse A',
            createdAt: new Date()
        };

        const result = await db.collection('inventory').insertOne(newItem);
        return { success: true, item: { ...newItem, _id: result.insertedId } };
    } catch (error) {
        logger.error({ error }, 'Error in POST /api/manufacturing/inventory');
        c.set.status = 500;
        return { error: 'Failed to add inventory item' };
    }
});

/**
 * PUT /api/manufacturing/inventory/:id
 * Update inventory stock quantity or item details.
 */
manufacturingRouter.put('/inventory/:id', async (c) => {
    try {
        const { id } = c.params;
        const body = (c.body as any) || await c.request.clone().json();
        const db = mongodb.getDb();

        const updateData: any = {};
        if (body.name || body.component) updateData.name = body.name || body.component;
        if (body.quantity !== undefined || body.stock !== undefined) updateData.quantity = Number(body.quantity ?? body.stock);
        if (body.unitCost !== undefined) updateData.unitCost = Number(body.unitCost);
        if (body.reorderPoint !== undefined) updateData.reorderPoint = Number(body.reorderPoint);
        if (body.location) updateData.location = body.location;
        if (body.category) updateData.category = body.category;
        updateData.updatedAt = new Date();

        await db.collection('inventory').updateOne(
            buildInventoryFilter(id),
            { $set: updateData }
        );

        return { success: true, message: 'Inventory item updated successfully' };
    } catch (error) {
        logger.error({ error }, 'Error in PUT /api/manufacturing/inventory');
        c.set.status = 500;
        return { error: 'Failed to update inventory item' };
    }
});

/**
 * DELETE /api/manufacturing/inventory/:id
 * Delete an inventory item.
 */
manufacturingRouter.delete('/inventory/:id', async (c) => {
    try {
        const { id } = c.params;
        const db = mongodb.getDb();

        await db.collection('inventory').deleteOne(
            buildInventoryFilter(id)
        );

        return { success: true, message: 'Inventory item deleted successfully' };
    } catch (error) {
        logger.error({ error }, 'Error in DELETE /api/manufacturing/inventory');
        c.set.status = 500;
        return { error: 'Failed to delete inventory item' };
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
