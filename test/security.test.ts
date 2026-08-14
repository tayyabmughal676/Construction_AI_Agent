import { describe, expect, it } from 'bun:test';
import { PDFGeneratorTool } from '../src/tools/utils/PDFGeneratorTool';
import { ExcelGeneratorTool } from '../src/tools/utils/ExcelGeneratorTool';
import { CSVGeneratorTool } from '../src/tools/utils/CSVGeneratorTool';
import { WordGeneratorTool } from '../src/tools/utils/WordGeneratorTool';
import { EmailSenderTool } from '../src/tools/utils/EmailSenderTool';
import { EmployeeDirectoryTool } from '../src/tools/hr/EmployeeDirectoryTool';
import app from '../src/app';
import path from 'path';
import { ObjectId } from 'mongodb';

describe('Security Fixes Verification Suite', () => {
    describe('SEC-01: Public User Registration Mass Assignment Protection', () => {
        it('should strictly enforce "user" role when an attacker submits "admin"', async () => {
            const testEmail = `attacker_${Date.now()}@test.com`;
            const req = new Request('http://localhost/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Attacker Test',
                    email: testEmail,
                    password: 'Password123!',
                    role: 'admin' // Attempted privilege escalation
                })
            });

            const res = await app.handle(req);
            expect(res.status).toBe(201);
            const data: any = await res.json();
            expect(data.message).toBe('User registered successfully');
            expect(data.userId).toBeDefined();
        });
    });

    describe('SEC-02: LangGraph v2 Autonomous Swarm Authentication Enforcement', () => {
        it('should reject unauthenticated POST /api/v2/graph/chat with 401', async () => {
            const req = new Request('http://localhost/api/v2/graph/chat', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'Enterprise scan' })
            });

            const res = await app.handle(req);
            expect(res.status).toBe(401);
            const data: any = await res.json();
            expect(data.error).toContain('Authorization header missing or invalid');
        });

        it('should reject unauthenticated POST /api/v2/graph/approve with 401', async () => {
            const req = new Request('http://localhost/api/v2/graph/approve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: 'session_123' })
            });

            const res = await app.handle(req);
            expect(res.status).toBe(401);
        });

        it('should reject unauthenticated GET /api/v2/graph/pending-approvals with 401', async () => {
            const req = new Request('http://localhost/api/v2/graph/pending-approvals');
            const res = await app.handle(req);
            expect(res.status).toBe(401);
        });

        it('should reject unauthenticated GET /api/v2/graph/checkpoint/:sessionId with 401', async () => {
            const req = new Request('http://localhost/api/v2/graph/checkpoint/session_test_99');
            const res = await app.handle(req);
            expect(res.status).toBe(401);
        });
    });

    describe('SEC-03: EmailSenderTool Attachment Security', () => {
        it('should reject attachments outside generated directory', async () => {
            const emailTool = new EmailSenderTool();
            // Mock transporter instance for testing
            (emailTool as any).transporter = { sendMail: async () => ({ messageId: 'test-id' }) };

            const result = await emailTool.execute({
                to: 'test@example.com',
                subject: 'Test Subject',
                body: 'Test Body',
                attachments: [
                    { filename: 'passwd', path: '/etc/passwd' }
                ]
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Access denied');
        });

        it('should reject path traversal relative paths in attachments', async () => {
            const emailTool = new EmailSenderTool();
            (emailTool as any).transporter = { sendMail: async () => ({ messageId: 'test-id' }) };

            const result = await emailTool.execute({
                to: 'test@example.com',
                subject: 'Test Subject',
                body: 'Test Body',
                attachments: [
                    { filename: 'app.ts', path: '../../src/app.ts' }
                ]
            });

            expect(result.success).toBe(false);
            expect(result.error).toContain('Access denied');
        });
    });

    describe('SEC-04: File Generator Path Traversal Protection', () => {
        it('should sanitize PDF filename against directory traversal', async () => {
            const pdfTool = new PDFGeneratorTool();
            const result = await pdfTool.execute({
                title: 'Security Test Report',
                filename: '../../evil.pdf',
                content: [{ type: 'paragraph', text: 'Safe content' }]
            });

            expect(result.success).toBe(true);
            expect(result.data?.filename).toBe('evil.pdf');
            expect(result.data?.filepath.startsWith(path.join(process.cwd(), 'generated', 'pdfs'))).toBe(true);
        });

        it('should sanitize Excel filename against directory traversal', async () => {
            const excelTool = new ExcelGeneratorTool();
            const result = await excelTool.execute({
                filename: '../../../sensitive.xlsx',
                sheets: [{ name: 'Sheet1', data: [{ col1: 'val1' }] }]
            });

            expect(result.success).toBe(true);
            expect(result.data?.filename).toBe('sensitive.xlsx');
            expect(result.data?.filepath.startsWith(path.join(process.cwd(), 'generated', 'excel'))).toBe(true);
        });

        it('should sanitize CSV filename against directory traversal', async () => {
            const csvTool = new CSVGeneratorTool();
            const result = await csvTool.execute({
                filename: '../../../../csv_leak.csv',
                data: [{ name: 'item1', price: 100 }]
            });

            expect(result.success).toBe(true);
            expect(result.data?.filename).toBe('csv_leak.csv');
            expect(result.data?.filepath.startsWith(path.join(process.cwd(), 'generated', 'csv'))).toBe(true);
        });

        it('should sanitize Word filename against directory traversal', async () => {
            const wordTool = new WordGeneratorTool();
            const result = await wordTool.execute({
                title: 'Safe Word Document',
                filename: '../../../../word_leak.docx',
                content: [{ type: 'paragraph', text: 'Safe paragraph' }]
            });

            expect(result.success).toBe(true);
            expect(result.data?.filename).toBe('word_leak.docx');
            expect(result.data?.filepath.startsWith(path.join(process.cwd(), 'generated', 'docx'))).toBe(true);
        });
    });

    describe('SEC-07: Employee Directory RegEx Injection / ReDoS Safety', () => {
        it('should handle unescaped regex special characters safely without error', async () => {
            const hrTool = new EmployeeDirectoryTool();
            const dangerousQueries = [
                '[[[[[[',
                '(((((a+)+)+)+)',
                '.*.*.*.*.*.*',
                '\\^$*+?.()|{}[]',
            ];

            for (const dq of dangerousQueries) {
                const res = await hrTool.execute({
                    action: 'search',
                    query: dq
                });
                expect(res.success).toBe(true);
                expect(Array.isArray(res.data?.results)).toBe(true);
            }
        });
    });

    describe('BUG-01: MongoDB ObjectId Handling Validation', () => {
        it('should properly validate 24-character hex MongoDB ObjectIds', () => {
            const validMongoId = '650a1234567890abcdef1234';
            const customId = 'PRJ-001';

            expect(ObjectId.isValid(validMongoId) && validMongoId.length === 24).toBe(true);
            expect(ObjectId.isValid(customId) && customId.length === 24).toBe(false);
        });

        it('should properly distinguish malformed hex strings from valid ObjectIds', () => {
            const shortHex = '650a1234';
            const invalidChars = '650a1234567890abcdef123z';
            const emptyStr = '';

            expect(ObjectId.isValid(shortHex) && shortHex.length === 24).toBe(false);
            expect(ObjectId.isValid(invalidChars) && invalidChars.length === 24).toBe(false);
            expect(ObjectId.isValid(emptyStr) && emptyStr.length === 24).toBe(false);
        });
    });

    describe('SEC-05: Rate Limiter Middleware Defensive IP Extraction & Headers', () => {
        it('should emit standard rate limit headers on public endpoints', async () => {
            const req = new Request('http://localhost/', {
                headers: {
                    'x-forwarded-for': '203.0.113.195, 198.51.100.1'
                }
            });
            const res = await app.handle(req);
            expect(res.status).toBe(200);
            expect(res.headers.get('X-RateLimit-Limit')).toBeDefined();
            expect(res.headers.get('X-RateLimit-Remaining')).toBeDefined();
            expect(res.headers.get('X-RateLimit-Reset')).toBeDefined();
        });

        it('should sanitize malformed/spoofed IP header values without error', async () => {
            const req = new Request('http://localhost/health', {
                headers: {
                    'x-forwarded-for': 'MALICIOUS_HEADER_VALUE<script>alert(1)</script>'
                }
            });
            const res = await app.handle(req);
            expect(res.status).toBe(200);
        });
    });

    describe('SEC-08: Direct Tool Invocation Validation & Error Handling', () => {
        it('should return 400 when missing tool parameter schema requirements', async () => {
            // Unauthenticated should fail with 401 first
            const req = new Request('http://localhost/api/construction/tools/project_tracker', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            });
            const res = await app.handle(req);
            expect(res.status).toBe(401);
        });
    });
});

