import { config } from 'dotenv';
import { z } from 'zod';

// Load environment variables
config();

const envSchema = z.object({
    // Server
    PORT: z.string().default('3000'),
    NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),

    // MongoDB
    MONGODB_URI: z.string().default('mongodb://localhost:27017/multi-ai-agency'),
    MONGODB_DB_NAME: z.string().default('multi-ai-agency'),

    // Redis
    REDIS_HOST: z.string().default('localhost'),
    REDIS_PORT: z.string().default('6379'),
    REDIS_PASSWORD: z.string().optional(),

    // AI/LLM
    OPENAI_API_KEY: z.string().optional(),
    ANTHROPIC_API_KEY: z.string().optional(),
    GOOGLE_API_KEY: z.string().optional(),
    LM_STUDIO_URL: z.string().default('http://192.168.100.150:1234/v1'),
    LM_STUDIO_MODEL: z.string().default('zai-org/glm-4.6v-flash'),

    // Security
    JWT_SECRET: z.string().default('dev-secret-key'),
    JWT_EXPIRES_IN: z.string().default('7d'),
    ALLOWED_ORIGINS: z.string().optional(),
    RATE_LIMIT: z.string().default('100'),
    RATE_WINDOW_MS: z.string().default('900000'), // 15 minutes
    MAX_BODY_SIZE: z.string().default('1048576'), // 1MB

    // Logging
    LOG_LEVEL: z.enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace']).default('info'),
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
