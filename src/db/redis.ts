import Redis from 'ioredis';
import {env} from '../config/env';
import {logger} from '../config/logger';

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
            maxRetriesPerRequest: 1,
            retryStrategy: (times) => {
                // Only retry 3 times
                if (times > 3) {
                    return null; // Stop retrying
                }
                const delay = Math.min(times * 50, 500);
                return delay;
            },
            lazyConnect: true, // Don't connect immediately
        });

        this.client.on('connect', () => {
            logger.info('✅ Redis connected successfully');
        });

        this.client.on('error', (error) => {
            // Only log once, not repeatedly
            if (error.message.includes('ECONNREFUSED')) {
                // Silently ignore connection refused
                return;
            }
            logger.error({error}, '❌ Redis connection error');
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
