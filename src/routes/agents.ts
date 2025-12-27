import { Hono } from 'hono';
import { z } from 'zod';
import { AgentRouter } from '../agents/AgentRouter';
import { logger } from '../config/logger';
import { randomUUID } from 'crypto';
import { RoutedChatRequestSchema } from '../utils/validators';

const agentApiRouter = new Hono();
const agentRouter = new AgentRouter();

// --- Endpoints ---

/**
 * Unified chat endpoint that routes a user's message to the appropriate agent.
 */
agentApiRouter.post('/chat', async (c) => {
    try {
        const body = await c.req.json();
        const {
            message,
            sessionId,
            context,
            department
        } = RoutedChatRequestSchema.parse(body);

        const routingContext = department ? {
            ...context,
            department
        } : context;

        const response = await agentRouter.route(
            message,
            sessionId || randomUUID(),
            routingContext
        );

        return c.json(response);
    } catch (error) {
        logger.error({
            error
        }, 'Error in unified chat endpoint');
        if (error instanceof z.ZodError) {
            return c.json({
                error: 'Validation failed',
                details: error.flatten()
            }, 400);
        }
        return c.json({
            error: 'An internal error occurred'
        }, 500);
    }
});

/**
 * Lists the capabilities of all registered agents.
 */
agentApiRouter.get('/capabilities', (c) => {
    const capabilities = agentRouter.getAllCapabilities();
    return c.json({
        registered_departments: Object.keys(capabilities),
        capabilities,
    });
});

export default agentApiRouter;
