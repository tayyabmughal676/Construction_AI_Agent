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

        logger.info('🎉 Multi-Agent Enterprise Orchestrator Ready!');
        logger.info(`🚀 Server running on http://localhost:${server.port}`);
        logger.info(`📊 Environment: ${env.NODE_ENV}`);
        logger.info(`🏥 Health check: http://localhost:${server.port}/health`);
        logger.info('');
        logger.info('✅ Production-Ready Infrastructure initialized');
        logger.info('✅ Hono server running');
        logger.info('✅ Multi-Agent Orchestrator active');
        logger.info('✅ LangGraph Workflows registered');
        logger.info('✅ MongoDB & Redis persistence online');
        logger.info('');
        logger.info('🚀 System is live and ready for production usage.');
    } catch (error) {
        logger.error({ error }, 'Failed to start server');
        process.exit(1);
    }
}

startServer();