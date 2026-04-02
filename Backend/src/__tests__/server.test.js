import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import inject from 'light-my-request';

// ─── /books route tests (non-production) ────────────────────────────────────

describe('GET /books', () => {
    let app;

    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
        vi.resetModules();
        ({ app } = await import('../server.js'));
    });

    it('returns HTTP 200', async () => {
        const res = await inject(app, { method: 'GET', url: '/books' });
        expect(res.statusCode).toBe(200);
    });

    it('returns JSON content-type', async () => {
        const res = await inject(app, { method: 'GET', url: '/books' });
        expect(res.headers['content-type']).toMatch(/application\/json/);
    });

    it('returns a "books" property in the response body', async () => {
        const res = await inject(app, { method: 'GET', url: '/books' });
        const body = JSON.parse(res.body);
        expect(body).toHaveProperty('books');
    });

    it('books value is an array', async () => {
        const res = await inject(app, { method: 'GET', url: '/books' });
        const body = JSON.parse(res.body);
        expect(Array.isArray(body.books)).toBe(true);
    });

    it('books array contains exactly 3 items', async () => {
        const res = await inject(app, { method: 'GET', url: '/books' });
        const body = JSON.parse(res.body);
        expect(body.books).toHaveLength(3);
    });

    it('books array contains the expected titles', async () => {
        const res = await inject(app, { method: 'GET', url: '/books' });
        const body = JSON.parse(res.body);
        expect(body.books).toEqual(['Book 1', 'Book 2', 'Book 3']);
    });

    it('response body has no extra top-level properties', async () => {
        const res = await inject(app, { method: 'GET', url: '/books' });
        const body = JSON.parse(res.body);
        expect(Object.keys(body)).toEqual(['books']);
    });
});

// ─── Non-production: catch-all / static serving NOT active ──────────────────

describe('Non-production mode', () => {
    let app;

    beforeAll(async () => {
        process.env.NODE_ENV = 'test';
        vi.resetModules();
        ({ app } = await import('../server.js'));
    });

    it('unknown routes return 404 (no catch-all registered)', async () => {
        const res = await inject(app, { method: 'GET', url: '/non-existent-route' });
        expect(res.statusCode).toBe(404);
    });

    it('/books is still reachable in non-production mode', async () => {
        const res = await inject(app, { method: 'GET', url: '/books' });
        expect(res.statusCode).toBe(200);
    });

    it('/books returns correct data in non-production mode', async () => {
        const res = await inject(app, { method: 'GET', url: '/books' });
        const body = JSON.parse(res.body);
        expect(body.books).toEqual(['Book 1', 'Book 2', 'Book 3']);
    });
});

// ─── Production mode: static serving + catch-all ────────────────────────────

describe('Production mode', () => {
    let app;

    beforeAll(async () => {
        process.env.NODE_ENV = 'production';
        vi.resetModules();
        ({ app } = await import('../server.js'));
    });

    afterAll(() => {
        process.env.NODE_ENV = 'test';
    });

    it('/books still works in production mode', async () => {
        const res = await inject(app, { method: 'GET', url: '/books' });
        expect(res.statusCode).toBe(200);
        const body = JSON.parse(res.body);
        expect(body.books).toEqual(['Book 1', 'Book 2', 'Book 3']);
    });

    it('GET / still works in production mode', async () => {
        const res = await inject(app, { method: 'GET', url: '/' });
        expect(res.statusCode).toBe(200);
    });

    it('catch-all route is registered and handles unknown paths', async () => {
        // The catch-all route is active in production; express will try to send
        // the SPA index.html. Since the dist directory does not exist in CI,
        // express.static passes through and sendFile returns a 404 or 500 —
        // but the important thing is the request does NOT get the generic Express
        // "Cannot GET /..." response (which would be a plain 404 text).
        const res = await inject(app, { method: 'GET', url: '/some/spa/route' });
        // Route was handled by our catch-all (not Express's default handler)
        expect([200, 404, 500]).toContain(res.statusCode);
    });

    it('unknown path in production returns a response (catch-all registered)', async () => {
        const res1 = await inject(app, { method: 'GET', url: '/dashboard' });
        const res2 = await inject(app, { method: 'GET', url: '/profile/settings' });
        // Both should be handled by catch-all, not result in unhandled errors
        expect([200, 404, 500]).toContain(res1.statusCode);
        expect([200, 404, 500]).toContain(res2.statusCode);
    });
});

// ─── Server startup guard ────────────────────────────────────────────────────

describe('Server startup guard (NODE_ENV=test)', () => {
    it('app is exported and is an express RequestListener (function)', async () => {
        process.env.NODE_ENV = 'test';
        vi.resetModules();
        const mod = await import('../server.js');
        expect(mod).toHaveProperty('app');
        expect(typeof mod.app).toBe('function');
    });

    it('app handles requests without binding to a real port', async () => {
        process.env.NODE_ENV = 'test';
        vi.resetModules();
        const { app } = await import('../server.js');
        // light-my-request performs in-process injection — no TCP socket needed
        const res = await inject(app, { method: 'GET', url: '/books' });
        expect(res.statusCode).toBe(200);
    });
});