import {Db, MongoClient} from 'mongodb';
import {env} from '../config/env';
import {logger} from '../config/logger';

class MongoDB {
    private client: MongoClient | null = null;
    private db: Db | null = null;

    async connect(): Promise<Db> {
        if (this.db) {
            return this.db;
        }

        try {
            this.client = new MongoClient(env.MONGODB_URI);
            await this.client.connect();
            this.db = this.client.db(env.MONGODB_DB_NAME);

            logger.info('✅ MongoDB connected successfully');
            return this.db;
        } catch (error) {
            logger.error({error}, '❌ MongoDB connection failed');
            throw error;
        }
    }

    async disconnect(): Promise<void> {
        if (this.client) {
            await this.client.close();
            this.client = null;
            this.db = null;
            logger.info('MongoDB disconnected');
        }
    }

    getDb(): Db {
        if (!this.db) {
            throw new Error('MongoDB not connected. Call connect() first.');
        }
        return this.db;
    }
}

export const mongodb = new MongoDB();
