import Redis from 'ioredis';
import { env } from '../config/env';
import { logger } from '../config/logger';

class RedisClient {
    private client: Redis | null = null;

    connect(): Redis {
        if (this.client) {
            return this.client;
        }

        this.client = new Redis({
            host: env.REDIS_HOST,
            port: parseInt(env.REDIS_PORT),
            password: env.REDIS_PASSWORD || undefined,
            retryStrategy: (times) => {
                const delay = Math.min(times * 50, 2000);
                return delay;
            },
        });

        this.client.on('connect', () => {
            logger.info('✅ Redis connected successfully');
        });

        this.client.on('error', (error) => {
            logger.error({ error }, '❌ Redis connection error');
        });

        return this.client;
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.quit();
            this.client = null;
            logger.info('Redis disconnected');
        }
    }

    getClient(): Redis {
        if (!this.client) {
            throw new Error('Redis not connected. Call connect() first.');
        }
        return this.client;
    }
}

export const redis = new RedisClient();
