import { Hono } from 'hono';
import { z } from 'zod';
import { WorkflowRegistry } from '../workflows/WorkflowRegistry';
import { WorkflowEngine } from '../workflows/WorkflowEngine';
import { logger } from '../config/logger';
import { randomUUID } from 'crypto';
import { onboardingGraph } from '../workflows/langgraph/onboarding';

import { companyControlGraph } from '../workflows/langgraph/companyControl';

const workflowRouter = new Hono();

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
        const body = await c.req.json();
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

        return c.json({
            sessionId: finalSessionId,
            success: result.errors.length === 0,
            status: result.status === 'running' && result.errors.length > 0 ? 'failed' : result.status,
            results: result.results,
            errors: result.errors.map((e: any) => typeof e === 'string' ? e : JSON.stringify(e, null, 2)),
            finalData: result.data
        });
    } catch (error) {
        logger.error({ error }, 'Error executing LangGraph workflow');
        return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
});

/**
 * Super Orchestrator: Control the entire company via LangGraph 
 */
workflowRouter.post('/langgraph/company-control', async (c) => {
    try {
        const body = await c.req.json();
        const { message, sessionId, context } = ExecuteWorkflowSchema.parse(body);

        const finalSessionId = sessionId || randomUUID();
        const inputMessage = message || (context?.message as string);

        if (!inputMessage) {
            return c.json({ error: 'Message is required for company control' }, 400);
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

        return c.json({
            sessionId: finalSessionId,
            success: result.errors.length === 0,
            status: result.status,
            results: result.results,
            errors: result.errors,
            finalData: result.data
        });
    } catch (error) {
        logger.error({ error }, 'Error executing Company Control Graph');
        return c.json({ error: error instanceof Error ? error.message : 'Unknown error' }, 500);
    }
});

export default workflowRouter;
