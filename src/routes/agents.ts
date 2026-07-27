import { Elysia } from 'elysia';
import { z } from 'zod';
import { AgentRouter } from '../agents/AgentRouter';
import { logger } from '../config/logger';
import { randomUUID } from 'crypto';
import { RoutedChatRequestSchema } from '../utils/validators';

const agentApiRouter = new Elysia();
const agentRouter = new AgentRouter();

// --- Endpoints ---

/**
 * Unified chat endpoint that routes a user's message to the appropriate agent.
 */
agentApiRouter.post('/chat', async (c) => {
    try {
        const body = await c.request.json();
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

        return response;
    } catch (error) {
        logger.error({
            error
        }, 'Error in unified chat endpoint');
        if (error instanceof z.ZodError) {
            c.set.status = 400;
            return {
                error: 'Validation failed',
                details: error.flatten()
            };
        }
        c.set.status = 500;
        return {
            error: 'An internal error occurred'
        };
    }
});

/**
 * Lists the capabilities of all registered agents.
 */
agentApiRouter.get('/capabilities', (c) => {
    const capabilities = agentRouter.getAllCapabilities();
    return {
        registered_departments: Object.keys(capabilities),
        capabilities,
    };
});

export default agentApiRouter;
