import { Hono } from 'hono';
import { z } from 'zod';
import { AgentRouter } from '../agents/AgentRouter';
import { logger } from '../config/logger';
import { randomUUID } from 'crypto';

const agentRouter = new Hono();
const router = new AgentRouter();

// Request schema
const ChatRequestSchema = z.object({
    message: z.string().min(1, 'Message cannot be empty'),
    sessionId: z.string().optional(),
    context: z.record(z.string(), z.unknown()).optional(),
    department: z.string().optional(), // Optional explicit department
});

/**
 * Unified chat endpoint - Routes to appropriate department agent
 */
agentRouter.post('/chat', async (c) => {
    try {
        const body = await c.req.json();
        const validated = ChatRequestSchema.parse(body);

        const sessionId = validated.sessionId || randomUUID();

        // Merge department into context if provided
        const context = {
            ...validated.context,
            ...(validated.department && { department: validated.department })
        };

        // Route to appropriate agent
        const response = await router.route(
            validated.message,
            sessionId,
            context
        );

        return c.json(response);
    } catch (error) {
        logger.error({ error }, 'Error in unified chat endpoint');

        if (error instanceof z.ZodError) {
            return c.json({
                error: 'Validation error',
                details: error.issues
            }, 400);
        }

        return c.json({
            error: error instanceof Error ? error.message : 'Unknown error',
        }, 400);
    }
});

/**
 * Get all agent capabilities across departments
 */
agentRouter.get('/capabilities', (c) => {
    const capabilities = router.getAllCapabilities();
    const stats = router.getStats();

    return c.json({
        capabilities,
        stats,
        usage: {
            endpoint: 'POST /api/agents/chat',
            parameters: {
                message: 'string (required)',
                sessionId: 'string (optional)',
                department: 'string (optional) - force specific department',
                context: 'object (optional) - additional context'
            }
        }
    });
});

/**
 * Get router statistics
 */
agentRouter.get('/stats', (c) => {
    const stats = router.getStats();
    return c.json(stats);
});

/**
 * Test department detection without executing
 */
agentRouter.post('/detect', async (c) => {
    try {
        const body = await c.req.json();
        const { message, context } = z.object({
            message: z.string(),
            context: z.record(z.string(), z.unknown()).optional()
        }).parse(body);

        const detection = router.detectDepartment(message, context);

        return c.json({
            message,
            detection,
            note: 'This is a test endpoint - no agent was actually invoked'
        });
    } catch (error) {
        logger.error({ error }, 'Error in detect endpoint');
        return c.json({
            error: error instanceof Error ? error.message : 'Unknown error',
        }, 400);
    }
});

export default agentRouter;
