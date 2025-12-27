import { Hono } from 'hono';
import { z } from 'zod';
import { WorkflowRegistry } from '../workflows/WorkflowRegistry';
import { WorkflowEngine } from '../workflows/WorkflowEngine';
import { logger } from '../config/logger';
import { randomUUID } from 'crypto';
import { onboardingGraph } from '../workflows/langgraph/onboarding';

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
 * Execute a workflow
 */
workflowRouter.post('/execute', async (c) => {
    try {
        const body = await c.req.json();
        const validated = ExecuteWorkflowSchema.parse(body);

        const sessionId = validated.sessionId || randomUUID();
        let workflow;

        // Detect workflow from message or use provided ID
        if (validated.workflowId) {
            workflow = WorkflowRegistry.getWorkflow(validated.workflowId);
            if (!workflow) {
                return c.json({
                    error: `Workflow not found: ${validated.workflowId}`,
                }, 404);
            }
        } else if (validated.message) {
            workflow = WorkflowRegistry.detectWorkflow(validated.message);
            if (!workflow) {
                return c.json({
                    error: 'No workflow detected from message',
                    message: validated.message,
                    hint: 'Try using keywords like: hire, onboard, new employee',
                }, 404);
            }
        } else {
            return c.json({
                error: 'Either message or workflowId must be provided',
            }, 400);
        }

        // Validate context
        const validation = WorkflowRegistry.validateContext(workflow, validated.context || {});
        if (!validation.valid) {
            return c.json({
                error: 'Missing required context fields',
                workflow: workflow.name,
                missing: validation.missing,
                required: workflow.requiredContext,
            }, 400);
        }

        // Execute workflow
        const result = await WorkflowEngine.execute(workflow, {
            sessionId,
            context: validated.context,
            continueOnError: validated.continueOnError,
        });

        return c.json(result);

    } catch (error) {
        logger.error({ error }, 'Error executing workflow');

        if (error instanceof z.ZodError) {
            return c.json({
                error: 'Validation error',
                details: error.issues,
            }, 400);
        }

        return c.json({
            error: error instanceof Error ? error.message : 'Unknown error',
        }, 500);
    }
});

/**
 * List all available workflows
 */
workflowRouter.get('/list', (c) => {
    const workflows = WorkflowRegistry.getAllWorkflows();

    return c.json({
        count: workflows.length,
        workflows: workflows.map(w => ({
            id: w.id,
            name: w.name,
            description: w.description,
            keywords: w.keywords,
            requiredContext: w.requiredContext,
            steps: w.steps.length,
        })),
    });
});

/**
 * Get workflow details
 */
workflowRouter.get('/:id', (c) => {
    const id = c.req.param('id');
    const workflow = WorkflowRegistry.getWorkflow(id);

    if (!workflow) {
        return c.json({
            error: `Workflow not found: ${id}`,
        }, 404);
    }

    return c.json({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        keywords: workflow.keywords,
        requiredContext: workflow.requiredContext,
        steps: workflow.steps.map((step, index) => ({
            step: index + 1,
            name: step.name,
            description: step.description,
            agent: step.agent,
            tool: step.tool,
            hasCondition: !!step.condition,
            hasErrorHandler: !!step.onError,
        })),
    });
});

/**
 * Get workflow statistics
 */
workflowRouter.get('/stats', (c) => {
    const stats = WorkflowRegistry.getStats();
    return c.json(stats);
});

export default workflowRouter;
