import { Hono } from 'hono';
import { z } from 'zod';
import { ConstructionAgent } from '../agents/ConstructionAgent';
import { logger } from '../config/logger';
import { randomUUID } from 'crypto';

const constructionRouter = new Hono();
const agent = new ConstructionAgent();

// Request schema
const ChatRequestSchema = z.object({
    message: z.string(),
    sessionId: z.string().optional(),
    context: z.record(z.string(), z.unknown()).optional(),
});

// Chat endpoint
constructionRouter.post('/chat', async (c) => {
    try {
        const body = await c.req.json();
        const validated = ChatRequestSchema.parse(body);

        const sessionId = validated.sessionId || randomUUID();

        const response = await agent.processMessage(
            validated.message,
            sessionId,
            validated.context
        );

        return c.json(response);
    } catch (error) {
        logger.error({ error }, 'Error in construction chat endpoint');
        return c.json({
            error: error instanceof Error ? error.message : 'Unknown error',
        }, 400);
    }
});

// Get agent capabilities
constructionRouter.get('/capabilities', (c) => {
    return c.json({
        department: 'Construction',
        capabilities: agent.getCapabilities(),
        tools: agent.getTools().map(tool => ({
            name: tool.name,
            description: tool.description,
        })),
    });
});

// Tool execution endpoint (direct tool access)
constructionRouter.post('/tools/:toolName', async (c) => {
    try {
        const toolName = c.req.param('toolName');
        const params = await c.req.json();

        const result = await agent.executeTool(toolName, params);

        return c.json(result);
    } catch (error) {
        logger.error({ error }, 'Error executing tool');
        return c.json({
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error',
        }, 400);
    }
});

export default constructionRouter;
