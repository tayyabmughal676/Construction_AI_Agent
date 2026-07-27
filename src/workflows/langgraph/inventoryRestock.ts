import { StateGraph, START, END } from "@langchain/langgraph";
import { LangGraphState } from "./state";
import { AgentRegistry } from "../../agents/AgentRegistry";
import { logger } from "../../config/logger";

/**
 * Inventory Restock Workflow
 * 1. Check Stock (List items, find low stock)
 * 2. Order Parts (Generate PO)
 * 3. Notify Logistics (Email)
 */

const checkStockNode = async (state: LangGraphState) => {
    logger.info("LangGraph: Checking inventory stock...");
    const registry = AgentRegistry.getInstance();
    const agent = registry.getAgent('manufacturing');

    if (!agent) return { errors: ["Manufacturing Agent not found"] };

    const result = await agent.executeTool('inventory_tracker', {
        action: 'list_items'
    });

    if (result.success) {
        const lowStockItems = result.data.items.filter((item: any) => item.quantity <= item.reorderPoint);
        
        return {
            data: { ...state.data, lowStockItems },
            results: [{ step: "Check Stock", lowStockCount: lowStockItems.length }]
        };
    }
    return { errors: [result.error] };
};

const orderPartsNode = async (state: LangGraphState) => {
    logger.info("LangGraph: Generating purchase orders...");
    
    const lowStockItems = state.data.lowStockItems || [];
    if (lowStockItems.length === 0) {
        return {
            results: [{ step: "Order Parts", message: "No items need restocking." }]
        };
    }

    // In a real system, this would call a Procurement agent or ERP system
    // Here we generate a mock PO list
    const purchaseOrders = lowStockItems.map((item: any) => ({
        sku: item.sku,
        name: item.name,
        orderQuantity: item.reorderPoint * 2 // order double the reorder point
    }));

    return {
        data: { ...state.data, purchaseOrders },
        results: [{ step: "Order Parts", poCount: purchaseOrders.length }]
    };
};

const notifyLogisticsNode = async (state: LangGraphState) => {
    logger.info("LangGraph: Notifying logistics...");
    const registry = AgentRegistry.getInstance();
    const hrAgent = registry.getAgent('hr');

    if (!hrAgent) return { errors: ["HR Agent not found"] };

    const purchaseOrders = state.data.purchaseOrders;
    
    if (!purchaseOrders || purchaseOrders.length === 0) {
         return {
            results: [{ step: "Notify Logistics", message: "No orders placed." }]
        };
    }

    const orderDetails = purchaseOrders.map((po: any) => `- ${po.orderQuantity}x ${po.name} (${po.sku})`).join('\n');

    const emailBody = `
Automated Restock Alert:
The following items have fallen below their reorder points and purchase orders have been generated:

${orderDetails}

Please prepare the warehouse receiving docks for incoming shipments.
    `.trim();

    const result = await hrAgent.executeTool('email_sender', {
        to: state.data.logisticsEmail || 'logistics@company.com',
        subject: `Automated Restock POs Generated`,
        body: emailBody
    });

    return {
        results: [{ step: "Notify Logistics", success: result.success }]
    };
};

const checkSuccess = (nextStep: string) => (state: LangGraphState) => {
    if (state.errors.length > 0) return END;
    return nextStep;
};

const workflow = new StateGraph(LangGraphState)
    .addNode("checkStock", checkStockNode)
    .addNode("orderParts", orderPartsNode)
    .addNode("notifyLogistics", notifyLogisticsNode)
    .addEdge(START, "checkStock")
    .addConditionalEdges("checkStock", checkSuccess("orderParts"))
    .addConditionalEdges("orderParts", checkSuccess("notifyLogistics"))
    .addEdge("notifyLogistics", END);

export const inventoryRestockGraph = workflow.compile();
