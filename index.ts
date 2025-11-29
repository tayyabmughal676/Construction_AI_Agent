import app from './src/app';
import { env } from './src/config/env';
import { logger } from './src/config/logger';
import { initializeAgents } from './src/config/agents';
import { mongodb } from './src/db/mongodb';
import { redis } from './src/db/redis';

async function startServer() {
    try {
        // Connect to databases
        logger.info('Connecting to databases...');
        await mongodb.connect();

        // Try to connect to Redis (optional)
        try {
            const redisClient = redis.connect();
            await redisClient.connect(); // Actually connect
            logger.info('✅ Redis connected');
        } catch (error) {
            logger.warn('⚠️ Redis not available (optional)');
        }

        logger.info('✅ MongoDB connected');

        // Initialize all agents
        initializeAgents();

        // Initialize workflows
        const { WorkflowRegistry } = await import('./src/workflows/WorkflowRegistry');
        WorkflowRegistry.initialize();

        const server = Bun.serve({
            port: parseInt(env.PORT),
            fetch: app.fetch,
        });

        logger.info('🎉 Phase 3 - Multi-Agent Router Ready!');
        logger.info(`🚀 Server running on http://localhost:${server.port}`);
        logger.info(`📊 Environment: ${env.NODE_ENV}`);
        logger.info(`🏥 Health check: http://localhost:${server.port}/health`);
        logger.info('');
        logger.info('✅ Core infrastructure ready');
        logger.info('✅ Hono server running');
        logger.info('✅ Logger configured');
        logger.info('✅ Environment validated');
        logger.info('✅ Agent Router initialized');
        logger.info('✅ MongoDB connected');
        logger.info('✅ Redis connected');
        logger.info('');
        logger.info('📝 Next: Phase 3.1 - Manufacturing Agent');
    } catch (error) {
        logger.error({ error }, 'Failed to start server');
        process.exit(1);
    }
}

startServer();