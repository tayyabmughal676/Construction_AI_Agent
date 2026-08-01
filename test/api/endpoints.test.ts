import { describe, expect, it } from 'bun:test';
import app from '../../src/app';

describe('API Endpoints', () => {
    it('should return health check', async () => {
        const req = new Request('http://localhost/health');
        const res = await app.handle(req);

        expect(res.status).toBe(200);
        const data: any = await res.json();
        expect(data.status).toBe('healthy');
    });

    it('should reject unauthorized access to protected routes', async () => {
        const req = new Request('http://localhost/api/workflows/langgraph/execute', {
            method: 'POST',
            body: JSON.stringify({ message: "test" }),
            headers: { 'Content-Type': 'application/json' }
        });

        const res = await app.handle(req);
        expect(res.status).toBe(401);
    });

    it('should fetch HR employees when authenticated', async () => {
        const req = new Request('http://localhost/api/hr/employees');
        const res = await app.handle(req);
        expect(res.status).toBe(401);
    });
});
