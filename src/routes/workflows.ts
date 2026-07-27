import { Elysia } from 'elysia';
import { z } from 'zod';
import { WorkflowRegistry } from '../workflows/WorkflowRegistry';
import { WorkflowEngine } from '../workflows/WorkflowEngine';
import { logger } from '../config/logger';
import { randomUUID } from 'crypto';
import { onboardingGraph } from '../workflows/langgraph/onboarding';
import { companyControlGraph } from '../workflows/langgraph/companyControl';
import { projectKickoffGraph } from '../workflows/langgraph/projectKickoff';
import { inventoryRestockGraph } from '../workflows/langgraph/inventoryRestock';
import { employeeOffboardingGraph } from '../workflows/langgraph/employeeOffboarding';
import { executiveReportGraph } from '../workflows/langgraph/executiveReport';

const workflowRouter = new Elysia();

// Request schemas
const ExecuteWorkflowSchema = z.object({
    message: z.string().optional(),
    workflowId: z.string().optional(),
    context: z.record(z.string(), z.unknown()).optional(),
    sessionId: z.string().optional(),
    continueOnError: z.boolean().optional().default(false),
});

/**
 * NEW: Execute a LangGraph workflow (Experimental)
 */
workflowRouter.post('/langgraph/execute', async (c) => {
    try {
        const body = await c.request.json();
        const { context, sessionId } = ExecuteWorkflowSchema.parse(body);

        const finalSessionId = sessionId || randomUUID();

        logger.info({ sessionId: finalSessionId }, 'Executing LangGraph Onboarding Workflow');

        const result = await onboardingGraph.invoke({
            workflowId: randomUUID(),
            sessionId: finalSessionId,
            currentStep: 0,
            totalSteps: 3,
            status: 'running',
            data: context || {},
            results: [],
            errors: [],
        });

        return {
            sessionId: finalSessionId,
            success: result.errors.length === 0,
            status: result.status === 'running' && result.errors.length > 0 ? 'failed' : result.status,
            results: result.results,
            errors: result.errors.map((e: any) => typeof e === 'string' ? e : JSON.stringify(e, null, 2)),
            finalData: result.data
        };
    } catch (error) {
        logger.error({ error }, 'Error executing LangGraph workflow');
        c.set.status = 500;
        return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
});

/**
 * Super Orchestrator: Control the entire company via LangGraph
 */
workflowRouter.post('/langgraph/company-control', async (c) => {
    try {
        const body = await c.request.json();
        const { message, sessionId, context } = ExecuteWorkflowSchema.parse(body);

        const finalSessionId = sessionId || randomUUID();
        const inputMessage = message || (context?.message as string);

        if (!inputMessage) {
            c.set.status = 400;
            return { error: 'Message is required for company control' };
        }

        logger.info({ sessionId: finalSessionId }, 'Executing Company Control Graph');

        const result = await companyControlGraph.invoke({
            workflowId: randomUUID(),
            sessionId: finalSessionId,
            currentStep: 0,
            totalSteps: 1, // Dynamic in graph
            status: 'running',
            data: { ...context, message: inputMessage },
            results: [],
            errors: [],
        });

        return {
            sessionId: finalSessionId,
            success: result.errors.length === 0,
            status: result.status,
            results: result.results,
            errors: result.errors,
            finalData: result.data
        };
    } catch (error) {
        logger.error({ error }, 'Error executing Company Control Graph');
        c.set.status = 500;
        return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
})
// NEW ENDPOINTS
.post('/langgraph/project-kickoff', async (c) => {
    try {
        const body = await c.request.json();
        const { context, sessionId } = ExecuteWorkflowSchema.parse(body);
        const finalSessionId = sessionId || randomUUID();
        
        const result = await projectKickoffGraph.invoke({
            workflowId: randomUUID(), sessionId: finalSessionId, currentStep: 0, totalSteps: 4,
            status: 'running', data: context || {}, results: [], errors: []
        });

        return {
            sessionId: finalSessionId, success: result.errors.length === 0, status: result.status,
            results: result.results, errors: result.errors, finalData: result.data
        };
    } catch (error) {
        c.set.status = 500;
        return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
})
.post('/langgraph/inventory-restock', async (c) => {
    try {
        const body = await c.request.json();
        const { context, sessionId } = ExecuteWorkflowSchema.parse(body);
        const finalSessionId = sessionId || randomUUID();
        
        const result = await inventoryRestockGraph.invoke({
            workflowId: randomUUID(), sessionId: finalSessionId, currentStep: 0, totalSteps: 3,
            status: 'running', data: context || {}, results: [], errors: []
        });

        return {
            sessionId: finalSessionId, success: result.errors.length === 0, status: result.status,
            results: result.results, errors: result.errors, finalData: result.data
        };
    } catch (error) {
        c.set.status = 500;
        return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
})
.post('/langgraph/employee-offboarding', async (c) => {
    try {
        const body = await c.request.json();
        const { context, sessionId } = ExecuteWorkflowSchema.parse(body);
        const finalSessionId = sessionId || randomUUID();
        
        const result = await employeeOffboardingGraph.invoke({
            workflowId: randomUUID(), sessionId: finalSessionId, currentStep: 0, totalSteps: 3,
            status: 'running', data: context || {}, results: [], errors: []
        });

        return {
            sessionId: finalSessionId, success: result.errors.length === 0, status: result.status,
            results: result.results, errors: result.errors, finalData: result.data
        };
    } catch (error) {
        c.set.status = 500;
        return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
})
.post('/langgraph/executive-report', async (c) => {
    try {
        const body = await c.request.json();
        const { context, sessionId } = ExecuteWorkflowSchema.parse(body);
        const finalSessionId = sessionId || randomUUID();
        
        const result = await executiveReportGraph.invoke({
            workflowId: randomUUID(), sessionId: finalSessionId, currentStep: 0, totalSteps: 3,
            status: 'running', data: context || {}, results: [], errors: []
        });

        return {
            sessionId: finalSessionId, success: result.errors.length === 0, status: result.status,
            results: result.results, errors: result.errors, finalData: result.data
        };
    } catch (error) {
        c.set.status = 500;
        return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
});

export default workflowRouter;
