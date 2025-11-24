import { Hono } from 'hono';
import { logger as pinoLogger } from 'hono/logger';
import { cors } from 'hono/cors';
import { env } from './config/env';
import { logger } from './config/logger';
import constructionRouter from './routes/construction';
import agentRouter from './routes/agents';

const app = new Hono();

// Middleware
app.use('*', pinoLogger());
app.use('*', cors());

// Health check endpoint (basic version without DB checks)
app.get('/health', async (c) => {
    return c.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        message: 'Server is running (databases not checked yet)',
    });
});

// Root endpoint
app.get('/', (c) => {
    return c.json({
        name: 'Multi-Purpose AI Agent API',
        version: '1.0.0',
        status: 'running',
        phase: 'Phase 3 - Multi-Agent Router ✅',
        endpoints: {
            health: '/health',
            api: '/api',
            agents: '/api/agents (unified multi-agent endpoint)',
        },
    });
});

// API routes
app.route('/api/agents', agentRouter);        // NEW: Unified multi-agent router
app.route('/api/construction', constructionRouter);

app.get('/api', (c) => {
    return c.json({
        message: 'Multi-Purpose AI Agent API',
        unified: {
            chat: 'POST /api/agents/chat (auto-routes to correct department)',
            capabilities: 'GET /api/agents/capabilities (all departments)',
            stats: 'GET /api/agents/stats',
            detect: 'POST /api/agents/detect (test department detection)',
        },
        departments: {
            construction: '/api/construction',
            manufacturing: '/api/manufacturing (coming in Phase 3.1)',
            hr: '/api/hr (coming in Phase 3.2)',
        },
        endpoints: {
            construction: {
                chat: 'POST /api/construction/chat',
                capabilities: 'GET /api/construction/capabilities',
                tools: 'POST /api/construction/tools/:toolName',
            },
        },
    });
});

// 404 handler
app.notFound((c) => {
    return c.json({ error: 'Not Found' }, 404);
});

// Error handler
app.onError((err, c) => {
    logger.error({ err }, 'Unhandled error');
    return c.json({
        error: 'Internal Server Error',
        message: env.NODE_ENV === 'development' ? err.message : undefined,
    }, 500);
});

export default app;
