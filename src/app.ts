import './patch';
import { Elysia } from 'elysia';
import { swagger } from '@elysiajs/swagger';
import jwt from 'jsonwebtoken';
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

// 3. Initialize Elysia App
const app = new Elysia();

// Add Swagger
app.use(swagger());

// 4. Apply Middleware
logger.info('🔒 Applying security and logging middleware...');
// Note: Elysia middleware handlers executed here
app.onBeforeHandle(async (c) => {
    await securityHeaders(c);
    await requestLogger(c);
    
    const rateLimitRes = await rateLimiter()(c);
    if (rateLimitRes) return rateLimitRes;
    
    const corsRes = await corsMiddleware()(c);
    if (corsRes) return corsRes;
    
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
        // Conditional auth
        if (c.path.startsWith('/api/auth') || c.path === '/api/docs' || c.path === '/api/openapi.json' || c.path === '/api/health' || c.path === '/api/') {
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
    .post('/auth/register', async (c) => {
        console.log('Register request received')
        try {
            console.log('Parsing body')
            const body = await c.request.json();
            console.log('Body parsed:', body)
            const userData = UserSchema.parse(body);
            console.log('User data validated:', userData)

            // Check if user already exists
            const existingUser = await mongodb.getDb().collection('users').findOne({ email: userData.email });
            if (existingUser) {
                console.log('User already exists')
                c.set.status = 409;
                return { error: 'User already exists' };
            }

            // Hash password
            console.log('Hashing password')
            const hashedPassword = await bcrypt.hash(userData.password, 10);

            const user = {
                name: userData.name,
                email: userData.email,
                password: hashedPassword,
                role: userData.role,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            console.log('Inserting user')
            const result = await mongodb.getDb().collection('users').insertOne(user);
            console.log('User inserted:', result.insertedId)
            c.set.status = 201;
            return { message: 'User registered successfully', userId: result.insertedId };
        } catch (error) {
            console.error('Register error:', error)
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            c.set.status = 400;
            return { error: 'Registration failed', details: errorMessage };
        }
    })
    .post('/auth/login', async (c) => {
        console.log('Login request received')
        try {
            const { email, password } = await c.request.json() as { email: string; password: string };
            console.log('Login attempt for:', email)

            if (!email || !password) {
                console.log('Missing email or password')
                c.set.status = 400;
                return { error: 'Email and password required' };
            }

            const user = await mongodb.getDb().collection('users').findOne({ email });
            if (!user) {
                console.log('User not found')
                c.set.status = 401;
                return { error: 'Invalid credentials' };
            }

            const isValidPassword = await bcrypt.compare(password, user.password);
            if (!isValidPassword) {
                console.log('Invalid password')
                c.set.status = 401;
                return { error: 'Invalid credentials' };
            }

            console.log('Login successful, generating token')
            const token = jwt.sign(
                { id: user._id.toString(), email: user.email, role: user.role },
                env.JWT_SECRET,
                { expiresIn: env.JWT_EXPIRES_IN || '7d' } as SignOptions
            );

            return {
                token,
                user: { id: user._id, email: user.email, role: user.role }
            };
        } catch (error) {
            console.error('Login error:', error)
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            c.set.status = 400;
            return { error: 'Login failed', details: errorMessage };
        }
    })
    .group('/agents', (group) => group.use(requireRole(['admin', 'user'])).use(agentRouter))
    .group('/workflows', (group) => group.use(requireRole(['admin'])).use(workflowRouter))
    .group('/hr', (group) => group.use(requireRole(['admin', 'user'])).use(hrRouter))
    .group('/construction', (group) => group.use(requireRole(['admin', 'user'])).use(constructionRouter))
    .group('/manufacturing', (group) => group.use(requireRole(['admin', 'user'])).use(manufacturingRouter))
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

// 7. Not Found and Error Handlers
app.onError(({ code, error, set }) => {
    logger.error({
        error
    }, 'An unhandled error occurred');
    set.status = 500;
    return {
        error: 'Internal Server Error',
        message: (error as Error)?.message || 'A server error occurred.',
    };
});

export default app;
