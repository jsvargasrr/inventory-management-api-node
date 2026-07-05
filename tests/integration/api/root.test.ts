import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestApp, teardownTestApp } from '../../helpers/test-app.js';

describe('Root API', () => {
  let app: Awaited<ReturnType<typeof setupTestApp>>['app'];

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
  });

  afterAll(async () => {
    await teardownTestApp();
  });

  it('GET / retorna info y links de la API', async () => {
    const response = await app.inject({ method: 'GET', url: '/' });
    expect(response.statusCode).toBe(200);

    const body = response.json();
    expect(body.name).toContain('MercadoExpress');
    expect(body.links.documentation).toBe('/docs');
    expect(body.links.products).toBe('/products');
  });
});
