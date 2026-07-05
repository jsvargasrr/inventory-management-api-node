import { describe, it, expect } from 'vitest';
import { buildApp } from '../../../src/infrastructure/http/app.js';

describe('Swagger docs', () => {
  it('expone /docs cuando enableDocs está activo', async () => {
    process.env.NODE_ENV = 'development';
    const app = await buildApp({ logger: false, enableDocs: true });
    await app.ready();

    const response = await app.inject({ method: 'GET', url: '/docs' });
    expect(response.statusCode).toBe(200);

    const jsonResponse = await app.inject({ method: 'GET', url: '/docs/json' });
    expect(jsonResponse.statusCode).toBe(200);
    expect(jsonResponse.json().info.title).toContain('MercadoExpress');

    await app.close();
    process.env.NODE_ENV = 'test';
  });
});
