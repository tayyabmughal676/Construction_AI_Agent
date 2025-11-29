import Redis from 'ioredis';
import {env} from '../config/env';
import {logger} from '../config/logger';

interface HealthStatus {
    healthy: boolean;
    message: string;
}

class RedisClient {
    private client: Redis | null = null;
    private isConnected: boolean = false;

    connect(): Redis {
        if (this.client) {
            return this.client;
        }

        this.client = new Redis({
            host: env.REDIS_HOST,
            port: parseInt(env.REDIS_PORT),
            password: env.REDIS_PASSWORD || undefined,
            maxRetriesPerRequest: 3,
            retryStrategy: (times) => Math.min(times * 100, 2000),
            enableReadyCheck: false,
            lazyConnect: true,
        });

        this.client.on('connect', () => {
            this.isConnected = true;
            logger.info('✅ Redis connected successfully.');
        });

        this.client.on('error', (error) => {
            if (this.isConnected) {
                logger.error({
                    error
                }, '❌ Redis connection error.');
                this.isConnected = false;
            }
        });

        this.client.on('close', () => {
            if (this.isConnected) {
                logger.info('Redis connection closed.');
                this.isConnected = false;
            }
        });

        this.client.connect().catch(err => {
            logger.error({
                error: err
            }, 'Failed to connect to Redis after multiple retries.');
        });

        return this.client;
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.quit();
            this.client = null;
            this.isConnected = false;
            logger.info('Redis disconnected.');
        }
    }

    getClient(): Redis {
        if (!this.client) {
            return this.connect();
        }
        return this.client;
    }

    async healthCheck(): Promise<HealthStatus> {
        if (!this.client) {
            return {
                healthy: false,
                message: 'Client not initialized'
            };
        }
        try {
            const pong = await this.client.ping();
            if (pong === 'PONG') {
                return {
                    healthy: true,
                    message: 'Connection successful'
                };
            } else {
                return {
                    healthy: false,
                    message: `Received '${pong}' instead of 'PONG'`
                };
            }
        } catch (error) {
            return {
                healthy: false,
                message: error instanceof Error ? error.message : 'An unknown error occurred during PING.'
            };
        }
    }
}

export const redis = new RedisClient();
