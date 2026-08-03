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
            await this.createIndexes();
            return this.db;
        } catch (error) {
            logger.error({error}, '❌ MongoDB connection failed');
            throw error;
        }
    }

    private async createIndexes(): Promise<void> {
        if (!this.db) return;
        try {
            // Text index for fast employee search
            await this.db.collection('employees').createIndex({
                firstName: 'text',
                lastName: 'text',
                email: 'text',
                department: 'text',
                position: 'text',
            }, { name: 'EmployeeTextIndex', background: true }).catch(() => {});

            // Text index for project search
            await this.db.collection('projects').createIndex({
                name: 'text',
                description: 'text',
                status: 'text',
            }, { name: 'ProjectTextIndex', background: true }).catch(() => {});

            // Text index for inventory search
            await this.db.collection('inventory').createIndex({
                name: 'text',
                itemCode: 'text',
                category: 'text',
            }, { name: 'InventoryTextIndex', background: true }).catch(() => {});

            // Text index for knowledge base search
            await this.db.collection('knowledge').createIndex({
                title: 'text',
                content: 'text',
                tags: 'text',
                category: 'text',
            }, { name: 'KnowledgeTextIndex', background: true }).catch(() => {});

            logger.info('✅ MongoDB text indexes verified/created');
        } catch (err) {
            logger.warn({ err }, 'Warning creating MongoDB indexes');
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
