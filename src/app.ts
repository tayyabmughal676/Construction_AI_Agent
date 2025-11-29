import {Hono} from 'hono';
import {env} from './config/env';
import {logger} from './config/logger';

// --- Middleware Imports ---
import {
    corsMiddleware,
    errorHandler,
    rateLimiter,
    requestLogger,
    securityHeaders,
    validateRequest,
} from './middleware/security';

// --- Route Imports ---
import constructionRouter from './routes/construction';
import agentRouter from './routes/agents';
import workflowRouter from './routes/workflows';

// --- Agent Registration ---
import {AgentRegistry} from './agents/AgentRegistry';
import {ConstructionAgent} from './agents/ConstructionAgent';
import {HRAgent} from './agents/HRAgent';


// --- Application Setup ---

// 1. Initialize Agent Registry and Register Agents
logger.info('Initializing agent registry...');
const registry = AgentRegistry.getInstance();
registry.registerAgent('construction', new ConstructionAgent());
registry.registerAgent('hr', new HRAgent());
logger.info('✅ Agents registered successfully.');


// 2. Initialize Hono App
const app = new Hono();


// 3. Apply Middleware
logger.info('🔒 Applying security and logging middleware...');
app.use('*', securityHeaders);
app.use('*', corsMiddleware({
    origin: env.ALLOWED_ORIGINS?.split(',') || ['*']
}));
app.use('*', rateLimiter({
    limit: parseInt(env.RATE_LIMIT || '100'),
    windowMs: parseInt(env.RATE_WINDOW_MS || '900000')
}));
app.use('*', validateRequest({
    maxBodySize: parseInt(env.MAX_BODY_SIZE || '1048576')
}));
app.use('*', requestLogger);
app.use('*', errorHandler);
logger.info('✅ Middleware applied.');


// 4. Define Public/Root Routes
app.get('/', (c) => c.json({
    name: 'Multi-Purpose AI Agent API',
    version: '1.0.0',
    status: 'running',
    documentation: '/api',
}));

app.get('/health', (c) => c.json({
    status: 'healthy',
    timestamp: new Date().toISOString()
}));


// 5. Define API Routes
const api = new Hono();
api.route('/agents', agentRouter);
api.route('/workflows', workflowRouter);
api.route('/construction', constructionRouter); // Keep for direct access if needed

api.get('/', (c) => c.json({
    message: 'AI Agent API',
    routes: {
        unified_chat: 'POST /agents/chat',
        list_capabilities: 'GET /agents/capabilities',
        workflows: 'POST /workflows/execute',
        list_workflows: 'GET /workflows/list',
    }
}));

app.route('/api', api);


// 6. Not Found and Error Handlers
app.notFound((c) => c.json({
    error: 'Not Found',
    message: 'The requested endpoint does not exist.'
}, 404));

app.onError((err, c) => {
    logger.error({
        err
    }, 'An unhandled error occurred');
    return c.json({
        error: 'Internal Server Error',
        message: env.NODE_ENV === 'development' ? err.message : 'A server error occurred.',
    }, 500);
});


export default app;
