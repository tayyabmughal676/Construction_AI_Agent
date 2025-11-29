import type {BaseTool, ToolResult} from '../../agents/types';
import {mongodb} from '../../db/mongodb';
import {z} from 'zod';

const InventoryItemSchema = z.object({
    itemCode: z.string(),
    name: z.string(),
    description: z.string().optional(),
    category: z.string(),
    quantity: z.number().min(0),
    unit: z.string().default('units'),
    reorderPoint: z.number().min(0).optional(),
    reorderQuantity: z.number().min(0).optional(),
    supplier: z.string().optional(),
    unitCost: z.number().min(0).optional(),
    location: z.string().optional(),
});

export class InventoryTrackerTool implements BaseTool {
    name = 'inventory_tracker';
    description = 'Track inventory levels, stock movements, reorder points, and supplier information';

    async execute(params: any): Promise<ToolResult> {
        try {
            const {action, itemCode, ...data} = params;

            const db = mongodb.getDb();
            const inventory = db.collection('inventory');
            const stockMovements = db.collection('stock_movements');

            switch (action) {
                case 'add_item': {
                    const validated = InventoryItemSchema.parse({itemCode, ...data});

                    // Check if item already exists
                    const existing = await inventory.findOne({itemCode: validated.itemCode});
                    if (existing) {
                        return {
                            success: false,
                            error: `Item with code ${validated.itemCode} already exists`,
                        };
                    }

                    const result = await inventory.insertOne({
                        ...validated,
                        createdAt: new Date(),
                        updatedAt: new Date(),
                    });

                    return {
                        success: true,
                        data: {
                            id: result.insertedId,
                            itemCode: validated.itemCode,
                            message: `Item "${validated.name}" added to inventory`,
                        },
                    };
                }

                case 'update_stock': {
                    if (!itemCode) {
                        return {success: false, error: 'itemCode is required'};
                    }

                    const {quantity, reason = 'manual adjustment', type = 'adjustment'} = data;

                    if (quantity === undefined) {
                        return {success: false, error: 'quantity is required'};
                    }

                    const item = await inventory.findOne({itemCode});
                    if (!item) {
                        return {success: false, error: `Item ${itemCode} not found`};
                    }

                    const newQuantity = (item.quantity || 0) + quantity;

                    if (newQuantity < 0) {
                        return {
                            success: false,
                            error: `Insufficient stock. Current: ${item.quantity}, Requested: ${Math.abs(quantity)}`,
                        };
                    }

                    // Update inventory
                    await inventory.updateOne(
                        {itemCode},
                        {$set: {quantity: newQuantity, updatedAt: new Date()}}
                    );

                    // Log movement
                    await stockMovements.insertOne({
                        itemCode,
                        type, // 'in', 'out', 'adjustment', 'return'
                        quantity,
                        previousQuantity: item.quantity,
                        newQuantity,
                        reason,
                        timestamp: new Date(),
                    });

                    return {
                        success: true,
                        data: {
                            itemCode,
                            previousQuantity: item.quantity,
                            newQuantity,
                            change: quantity,
                            message: `Stock updated: ${item.quantity} → ${newQuantity}`,
                        },
                    };
                }

                case 'check_stock': {
                    if (!itemCode) {
                        return {success: false, error: 'itemCode is required'};
                    }

                    const item = await inventory.findOne({itemCode});
                    if (!item) {
                        return {success: false, error: `Item ${itemCode} not found`};
                    }

                    const needsReorder = item.reorderPoint && item.quantity <= item.reorderPoint;

                    return {
                        success: true,
                        data: {
                            itemCode: item.itemCode,
                            name: item.name,
                            quantity: item.quantity,
                            unit: item.unit,
                            reorderPoint: item.reorderPoint,
                            needsReorder,
                            reorderQuantity: item.reorderQuantity,
                            supplier: item.supplier,
                            location: item.location,
                        },
                    };
                }

                case 'list_items': {
                    const {category, lowStock, limit = 50} = data;
                    const filter: any = {};

                    if (category) filter.category = category;

                    let items = await inventory
                        .find(filter)
                        .limit(limit)
                        .toArray();

                    // Filter for low stock if requested
                    if (lowStock) {
                        items = items.filter(item =>
                            item.reorderPoint && item.quantity <= item.reorderPoint
                        );
                    }

                    const totalValue = items.reduce(
                        (sum, item) => sum + ((item.quantity || 0) * (item.unitCost || 0)),
                        0
                    );

                    return {
                        success: true,
                        data: {
                            items,
                            count: items.length,
                            totalValue: Math.round(totalValue * 100) / 100,
                            lowStockItems: items.filter(item =>
                                item.reorderPoint && item.quantity <= item.reorderPoint
                            ).length,
                        },
                    };
                }

                case 'reorder_alert': {
                    const lowStockItems = await inventory
                        .find({
                            $expr: {$lte: ['$quantity', '$reorderPoint']}
                        })
                        .toArray();

                    const alerts = lowStockItems.map(item => ({
                        itemCode: item.itemCode,
                        name: item.name,
                        currentStock: item.quantity,
                        reorderPoint: item.reorderPoint,
                        reorderQuantity: item.reorderQuantity,
                        supplier: item.supplier,
                        deficit: item.reorderPoint - item.quantity,
                    }));

                    return {
                        success: true,
                        data: {
                            alerts,
                            count: alerts.length,
                            message: alerts.length > 0
                                ? `${alerts.length} item(s) need reordering`
                                : 'All items are adequately stocked',
                        },
                    };
                }

                case 'stock_history': {
                    if (!itemCode) {
                        return {success: false, error: 'itemCode is required'};
                    }

                    const {limit = 20} = data;

                    const movements = await stockMovements
                        .find({itemCode})
                        .sort({timestamp: -1})
                        .limit(limit)
                        .toArray();

                    return {
                        success: true,
                        data: {
                            itemCode,
                            movements,
                            count: movements.length,
                        },
                    };
                }

                case 'update_item': {
                    if (!itemCode) {
                        return {success: false, error: 'itemCode is required'};
                    }

                    const result = await inventory.updateOne(
                        {itemCode},
                        {$set: {...data, updatedAt: new Date()}}
                    );

                    if (result.matchedCount === 0) {
                        return {success: false, error: `Item ${itemCode} not found`};
                    }

                    return {
                        success: true,
                        data: {
                            modified: result.modifiedCount,
                            message: `Item ${itemCode} updated successfully`,
                        },
                    };
                }

                default:
                    return {
                        success: false,
                        error: `Unknown action: ${action}. Use: add_item, update_stock, check_stock, list_items, reorder_alert, stock_history, update_item`,
                    };
            }
        } catch (error) {
            return {
                success: false,
                error: error instanceof Error ? error.message : 'Unknown error',
            };
        }
    }
}
