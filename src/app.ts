import './patch';
import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';
import { UserSchema } from './db/models/User';
import { mongodb } from './db/mongodb';
import bcrypt from 'bcrypt';
import { type SignOptions } from 'jsonwebtoken';
import { env } from './config/env';
import { logger } from './config/logger';
import { redis } from './db/redis'; // Import the Redis client
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
import hrRouter from './routes/hr';
import manufacturingRouter from './routes/manufacturing';
import authRouter from './routes/auth';
import filesRouter from './routes/files';
import { v2graphRouter } from './routes/v2graph';

// --- Auth Middleware (Handled Inline) ---

const requireRole = (roles: string[]) => (app: Elysia) =>
    app.onBeforeHandle((c) => {
        const user = (c.store as any).user;
        if (!user || !roles.includes(user.role)) {
            c.set.status = 403;
            return { error: 'Insufficient permissions' };
        }
    });

// --- Agent Registration ---
import { AgentRegistry } from './agents/AgentRegistry';
import { ConstructionAgent } from './agents/ConstructionAgent';
import { HRAgent } from './agents/HRAgent';
import { ManufacturingAgent } from './agents/ManufacturingAgent';

// --- Application Setup ---

// 1. Initialize Agent Registry
logger.info('Initializing agent registry...');
const registry = AgentRegistry.getInstance();
registry.registerAgent('construction', new ConstructionAgent());
registry.registerAgent('hr', new HRAgent());
registry.registerAgent('manufacturing', new ManufacturingAgent());
logger.info('✅ Agents registered successfully.');

// 2. Initialize Redis Connection
redis.connect();

import { cors } from '@elysiajs/cors';

// 3. Initialize Elysia App
const app = new Elysia();

// Add CORS and Swagger
app.use(cors());
app.use(swagger());

// 4. Apply Middleware
logger.info('🔒 Applying security and logging middleware...');
// Note: Elysia middleware handlers executed here
app.onBeforeHandle(async (c) => {
    await securityHeaders(c);
    await requestLogger(c);
    
    const rateLimitRes = await rateLimiter()(c);
    if (rateLimitRes) return rateLimitRes;
    
    const validateRes = await validateRequest()(c);
    if (validateRes) return validateRes;
});

// 5. Define Public/Root Routes
app.get('/', (c) => {
    return {
        name: 'Multi-Purpose AI Agent API',
        version: '1.0.0',
        status: 'running',
        documentation: '/swagger',
    };
});

app.get('/health', async (c) => {
    const redisHealthy = await redis.healthCheck();
    const status = redisHealthy ? 'healthy' : 'unhealthy';
    const statusCode = redisHealthy ? 200 : 503;

    c.set.status = statusCode;
    return {
        status,
        timestamp: new Date().toISOString(),
        dependencies: {
            redis: redisHealthy ? 'healthy' : 'unhealthy',
        },
    };
});

// API Routes with group
app.group('/api', (api) => api
    .onBeforeHandle(async (c) => {
        // Bypass auth for preflight requests
        if (c.request.method === 'OPTIONS') {
            return;
        }
        // Conditional auth
        if (c.path.startsWith('/api/auth') || c.path.startsWith('/api/files') || c.path === '/api/docs' || c.path === '/api/openapi.json' || c.path === '/api/health' || c.path === '/api/') {
            return;
        }
        // Auth logic
        const authHeader = c.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            c.set.status = 401;
            return { error: 'Authorization header missing or invalid' };
        }
        const token = authHeader.substring(7);
        try {
            const decoded = jwt.verify(token, env.JWT_SECRET) as any;
            (c.store as any).user = decoded;
        } catch {
            c.set.status = 401;
            return { error: 'Invalid or expired token' };
        }
    })
    .group('/auth', (group) => group.use(authRouter))
    .group('/agents', (group) => group.use(requireRole(['admin', 'user'])).use(agentRouter))
    .group('/workflows', (group) => group.use(requireRole(['admin'])).use(workflowRouter))
    .group('/hr', (group) => group.use(requireRole(['admin', 'user'])).use(hrRouter))
    .group('/construction', (group) => group.use(requireRole(['admin', 'user'])).use(constructionRouter))
    .group('/manufacturing', (group) => group.use(requireRole(['admin', 'user'])).use(manufacturingRouter))
    .use(filesRouter)
    .get('/', (c) => {
        return {
            message: 'Multi-Agent Construction & Industrial API',
            version: '1.2.0',
            endpoints: {
                chat: 'POST /api/agents/chat',
                capabilities: 'GET /api/agents/capabilities',
                orchestrator: 'POST /api/workflows/langgraph/company-control',
                onboarding: 'POST /api/workflows/langgraph/execute',
                health: 'GET /health'
            }
        };
    })
    .get('/docs', (c) => {
        return c.redirect('/swagger');
    })
    .onError(({ code, error, set }) => {
        logger.error({ error }, 'API error');
        set.status = 500;
        return { error: 'API endpoint error', message: (error as Error)?.message || 'Unknown error' };
    })
);

app.use(v2graphRouter);

export default app;
