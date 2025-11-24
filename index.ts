import app from './src/app';
import { env } from './src/config/env';
import { logger } from './src/config/logger';
import { initializeAgents } from './src/config/agents';

async function startServer() {
    try {
        // Initialize all agents
        initializeAgents();

        // Note: Database connections will be added in Phase 2
        // For now, just start the server

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
        logger.info('');
        logger.info('📝 Next: Phase 3.1 - Manufacturing Agent');
    } catch (error) {
        logger.error({ error }, 'Failed to start server');
        process.exit(1);
    }
}

startServer();