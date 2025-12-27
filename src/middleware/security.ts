import type { Context, Next } from 'hono';
import { logger } from '../config/logger';

/**
 * Security Middleware
 * Implements various security measures to protect the API
 */

/**
 * Rate Limiting Store
 * Simple in-memory rate limiting (use Redis in production)
 */
class RateLimitStore {
    private requests: Map<string, { count: number; resetTime: number }> = new Map();

    check(key: string, limit: number, windowMs: number): { allowed: boolean; remaining: number; resetTime: number } {
        const now = Date.now();
        const record = this.requests.get(key);

        if (!record || now > record.resetTime) {
            // New window
            const resetTime = now + windowMs;
            this.requests.set(key, { count: 1, resetTime });
            return { allowed: true, remaining: limit - 1, resetTime };
        }

        if (record.count >= limit) {
            // Rate limit exceeded
            return { allowed: false, remaining: 0, resetTime: record.resetTime };
        }

        // Increment count
        record.count++;
        this.requests.set(key, record);
        return { allowed: true, remaining: limit - record.count, resetTime: record.resetTime };
    }

    cleanup(): void {
        const now = Date.now();
        for (const [key, record] of this.requests.entries()) {
            if (now > record.resetTime) {
                this.requests.delete(key);
            }
        }
    }
}

const rateLimitStore = new RateLimitStore();

// Cleanup old entries every 5 minutes
setInterval(() => rateLimitStore.cleanup(), 5 * 60 * 1000);

/**
 * Rate Limiting Middleware
 * Limits requests per IP address
 */
export const rateLimiter = (options: {
    limit?: number;
    windowMs?: number;
    message?: string;
} = {}) => {
    const limit = options.limit || 100; // 100 requests
    const windowMs = options.windowMs || 15 * 60 * 1000; // 15 minutes
    const message = options.message || 'Too many requests, please try again later';

    return async (c: Context, next: Next) => {
        // Get client IP
        const forwardedFor = c.req.header('x-forwarded-for');
        const realIp = c.req.header('x-real-ip');
        const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

        const key = `ratelimit:${ip}`;

        // Skip rate limiting if disabled in config
        if (process.env.ENABLE_RATE_LIMIT === 'false') {
            await next();
            return;
        }

        const result = rateLimitStore.check(key, limit, windowMs);

        // Set rate limit headers
        c.header('X-RateLimit-Limit', limit.toString());
        c.header('X-RateLimit-Remaining', result.remaining.toString());
        c.header('X-RateLimit-Reset', new Date(result.resetTime).toISOString());

        if (!result.allowed) {
            logger.warn({
                ip,
                path: c.req.path,
                method: c.req.method,
            }, 'Rate limit exceeded');

            return c.json({
                error: message,
                retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
            }, 429);
        }

        await next();
    };
};

/**
 * Input Sanitization Middleware
 * Prevents XSS and injection attacks
 */
export const sanitizeInput = async (c: Context, next: Next) => {
    try {
        const contentType = c.req.header('content-type');

        if (contentType?.includes('application/json')) {
            const body = await c.req.json();
            const sanitized = sanitizeObject(body);

            // Replace request body with sanitized version
            c.req.raw = new Request(c.req.raw, {
                body: JSON.stringify(sanitized),
            });
        }
    } catch (error) {
        logger.error({ error }, 'Error sanitizing input');
    }

    await next();
};

/**
 * Recursively sanitize object properties
 */
function sanitizeObject(obj: any): any {
    if (typeof obj === 'string') {
        return sanitizeString(obj);
    }

    if (Array.isArray(obj)) {
        return obj.map(item => sanitizeObject(item));
    }

    if (obj && typeof obj === 'object') {
        const sanitized: any = {};
        for (const [key, value] of Object.entries(obj)) {
            sanitized[key] = sanitizeObject(value);
        }
        return sanitized;
    }

    return obj;
}

/**
 * Sanitize string to prevent XSS
 */
function sanitizeString(str: string): string {
    return str
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#x27;')
        .replace(/\//g, '&#x2F;');
}

/**
 * CORS Middleware
 * Configure Cross-Origin Resource Sharing
 */
export const corsMiddleware = (options: {
    origin?: string | string[];
    credentials?: boolean;
} = {}) => {
    const allowedOrigins = Array.isArray(options.origin)
        ? options.origin
        : options.origin
            ? [options.origin]
            : ['*'];

    return async (c: Context, next: Next) => {
        const origin = c.req.header('origin');

        // Check if origin is allowed
        if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
            c.header('Access-Control-Allow-Origin', origin);
        } else if (allowedOrigins.includes('*')) {
            c.header('Access-Control-Allow-Origin', '*');
        }

        c.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
        c.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

        if (options.credentials) {
            c.header('Access-Control-Allow-Credentials', 'true');
        }

        // Handle preflight requests
        if (c.req.method === 'OPTIONS') {
            return new Response('', { status: 204 });
        }

        await next();
    };
};

/**
 * Security Headers Middleware
 * Adds security-related HTTP headers
 */
export const securityHeaders = async (c: Context, next: Next) => {
    // Prevent clickjacking
    c.header('X-Frame-Options', 'DENY');

    // Prevent MIME type sniffing
    c.header('X-Content-Type-Options', 'nosniff');

    // Enable XSS protection
    c.header('X-XSS-Protection', '1; mode=block');

    // Referrer policy
    c.header('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Content Security Policy
    c.header('Content-Security-Policy', "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'");

    // Strict Transport Security (HTTPS only)
    if (c.req.url.startsWith('https://')) {
        c.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    }

    // Permissions Policy
    c.header('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');

    await next();
};

/**
 * Request Validation Middleware
 * Validates request size and content
 */
export const validateRequest = (options: {
    maxBodySize?: number;
    allowedMethods?: string[];
} = {}) => {
    const maxBodySize = options.maxBodySize || 1024 * 1024; // 1MB default
    const allowedMethods = options.allowedMethods || ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'];

    return async (c: Context, next: Next) => {
        // Check method
        if (!allowedMethods.includes(c.req.method)) {
            logger.warn({
                method: c.req.method,
                path: c.req.path,
            }, 'Method not allowed');

            return c.json({ error: 'Method not allowed' }, 405);
        }

        // Check content length
        const contentLength = c.req.header('content-length');
        if (contentLength && parseInt(contentLength) > maxBodySize) {
            logger.warn({
                contentLength,
                maxBodySize,
                path: c.req.path,
            }, 'Request body too large');

            return c.json({ error: 'Request body too large' }, 413);
        }

        await next();
    };
};

/**
 * IP Whitelist/Blacklist Middleware
 * Control access based on IP address
 */
export const ipFilter = (options: {
    whitelist?: string[];
    blacklist?: string[];
} = {}) => {
    return async (c: Context, next: Next) => {
        const forwardedFor = c.req.header('x-forwarded-for');
        const realIp = c.req.header('x-real-ip');
        const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

        // Check blacklist first
        if (options.blacklist && options.blacklist.includes(ip)) {
            logger.warn({ ip, path: c.req.path }, 'IP blocked (blacklist)');
            return c.json({ error: 'Access denied' }, 403);
        }

        // Check whitelist if configured
        if (options.whitelist && options.whitelist.length > 0) {
            if (!options.whitelist.includes(ip)) {
                logger.warn({ ip, path: c.req.path }, 'IP not in whitelist');
                return c.json({ error: 'Access denied' }, 403);
            }
        }

        await next();
    };
};

/**
 * Request Logger Middleware
 * Logs all incoming requests for security monitoring
 */
export const requestLogger = async (c: Context, next: Next) => {
    const start = Date.now();
    const forwardedFor = c.req.header('x-forwarded-for');
    const realIp = c.req.header('x-real-ip');
    const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

    await next();

    const duration = Date.now() - start;

    logger.info({
        method: c.req.method,
        path: c.req.path,
        status: c.res.status,
        duration,
        ip,
        userAgent: c.req.header('user-agent'),
    }, 'Request completed');
};

/**
 * Error Handler Middleware
 * Catches and handles errors securely
 */
export const errorHandler = async (c: Context, next: Next) => {
    try {
        await next();
    } catch (error) {
        logger.error({
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            path: c.req.path,
            method: c.req.method,
        }, 'Request error');

        // Don't expose internal errors to clients
        return c.json({
            error: 'Internal server error',
            message: process.env.NODE_ENV === 'development' && error instanceof Error
                ? error.message
                : 'An unexpected error occurred',
        }, 500);
    }
};

