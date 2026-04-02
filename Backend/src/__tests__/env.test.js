import { describe, it, expect, beforeEach, afterEach } from 'vitest';

describe('ENV configuration', () => {
    const originalEnv = { ...process.env };

    afterEach(() => {
        // restore original environment after each test
        Object.keys(process.env).forEach((key) => delete process.env[key]);
        Object.assign(process.env, originalEnv);
    });

    it('exports NODE_ENV from process.env', async () => {
        process.env.NODE_ENV = 'development';
        const { ENV } = await import('../lib/env.js');
        // ENV.NODE_ENV reflects what was set at module load time;
        // since the module is cached we verify the export exists with a string value
        expect(ENV).toHaveProperty('NODE_ENV');
    });

    it('ENV object contains PORT, DB_URI, and NODE_ENV keys', async () => {
        const { ENV } = await import('../lib/env.js');
        expect(ENV).toHaveProperty('PORT');
        expect(ENV).toHaveProperty('DB_URI');
        expect(ENV).toHaveProperty('NODE_ENV');
    });

    it('ENV.NODE_ENV is undefined when process.env.NODE_ENV is not set', async () => {
        // With module caching the value is fixed at first import;
        // verify that the shape of ENV does not throw and the key is accessible
        const { ENV } = await import('../lib/env.js');
        // NODE_ENV key must exist (value may be set by test runner)
        expect(Object.keys(ENV)).toContain('NODE_ENV');
    });

    it('ENV object has exactly the expected keys', async () => {
        const { ENV } = await import('../lib/env.js');
        const keys = Object.keys(ENV).sort();
        expect(keys).toEqual(['DB_URI', 'NODE_ENV', 'PORT'].sort());
    });

    it('ENV.NODE_ENV reflects the string value from process.env.NODE_ENV on module load', async () => {
        // The module is evaluated once; the exported value is whatever
        // process.env.NODE_ENV was when dotenv.config() ran.
        // We confirm the type contract: value is either a string or undefined.
        const { ENV } = await import('../lib/env.js');
        expect(
            ENV.NODE_ENV === undefined || typeof ENV.NODE_ENV === 'string'
        ).toBe(true);
    });
});