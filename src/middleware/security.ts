import type { Context } from 'elysia';
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

    return async (c: Context) => {
        // Get client IP
        const forwardedFor = c.headers['x-forwarded-for'];
        const realIp = c.headers['x-real-ip'];
        const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

        const key = `ratelimit:${ip}`;

        // Skip rate limiting if disabled in config
        if (process.env.ENABLE_RATE_LIMIT === 'false') {
            return;
        }

        const result = rateLimitStore.check(key, limit, windowMs);

        // Set rate limit headers
        c.set.headers['X-RateLimit-Limit'] = limit.toString();
        c.set.headers['X-RateLimit-Remaining'] = result.remaining.toString();
        c.set.headers['X-RateLimit-Reset'] = new Date(result.resetTime).toISOString();

        if (!result.allowed) {
            logger.warn({
                ip,
                path: c.path,
                method: c.request.method,
            }, 'Rate limit exceeded');

            c.set.status = 429;
            return {
                error: message,
                retryAfter: Math.ceil((result.resetTime - Date.now()) / 1000),
            };
        }
    };
};

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

    return async (c: Context) => {
        const origin = c.headers.origin;

        // Check if origin is allowed
        if (origin && (allowedOrigins.includes('*') || allowedOrigins.includes(origin))) {
            c.set.headers['Access-Control-Allow-Origin'] = origin;
        } else if (allowedOrigins.includes('*')) {
            c.set.headers['Access-Control-Allow-Origin'] = '*';
        }

        c.set.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
        c.set.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With';

        if (options.credentials) {
            c.set.headers['Access-Control-Allow-Credentials'] = 'true';
        }

        // Handle preflight requests
        if (c.request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: c.set.headers as Record<string, string>
            });
        }
    };
};

/**
 * Security Headers Middleware
 * Adds security-related HTTP headers
 */
export const securityHeaders = async (c: Context) => {
    // Prevent clickjacking
    c.set.headers['X-Frame-Options'] = 'DENY';

    // Prevent MIME type sniffing
    c.set.headers['X-Content-Type-Options'] = 'nosniff';

    // Enable XSS protection
    c.set.headers['X-XSS-Protection'] = '1; mode=block';

    // Referrer policy
    c.set.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin';

    // Content Security Policy
    c.set.headers['Content-Security-Policy'] = "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'";

    // Strict Transport Security (HTTPS only)
    if (c.request.url.startsWith('https://')) {
        c.set.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains';
    }

    // Permissions Policy
    c.set.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()';
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

    return async (c: Context) => {
        // Check method
        if (!allowedMethods.includes(c.request.method)) {
            logger.warn({
                method: c.request.method,
                path: c.path,
            }, 'Method not allowed');

            c.set.status = 405;
            return { error: 'Method not allowed' };
        }

        // Check content length
        const contentLength = c.headers['content-length'];
        if (contentLength && parseInt(contentLength) > maxBodySize) {
            logger.warn({
                contentLength,
                maxBodySize,
                path: c.path,
            }, 'Request body too large');

            c.set.status = 413;
            return { error: 'Request body too large' };
        }
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
    return async (c: Context) => {
        const forwardedFor = c.headers['x-forwarded-for'];
        const realIp = c.headers['x-real-ip'];
        const ip = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

        // Check blacklist first
        if (options.blacklist && options.blacklist.includes(ip)) {
            logger.warn({ ip, path: c.path }, 'IP blocked (blacklist)');
            c.set.status = 403;
            return { error: 'Access denied' };
        }

        // Check whitelist if configured
        if (options.whitelist && options.whitelist.length > 0) {
            if (!options.whitelist.includes(ip)) {
                logger.warn({ ip, path: c.path }, 'IP not in whitelist');
                c.set.status = 403;
                return { error: 'Access denied' };
            }
        }
    };
};

/**
 * Request Logger Middleware
 * Logs all incoming requests for security monitoring
 */
export const requestLogger = async (c: Context) => {
    logger.info({
        method: c.request.method,
        path: c.path,
        ip: c.headers['x-forwarded-for']?.split(',')[0]?.trim() || c.headers['x-real-ip'] || 'unknown',
        userAgent: c.headers['user-agent'],
    }, 'Request completed');
};

/**
 * Error Handler Middleware
 * Catches and handles errors securely
 */
export const errorHandler = async (c: Context) => {
    // Placeholder, since Elysia has built-in error handling
};

