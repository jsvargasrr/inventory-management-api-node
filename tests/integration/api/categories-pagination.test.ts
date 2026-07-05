import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestApp, teardownTestApp, getProductBySku } from '../../helpers/test-app.js';

describe('Categories & Pagination API', () => {
  let app: Awaited<ReturnType<typeof setupTestApp>>['app'];

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
  });

  afterAll(async () => {
    await teardownTestApp();
  });

  it('GET /categories retorna categorías del enunciado', async () => {
    const response = await app.inject({ method: 'GET', url: '/categories' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toEqual([
      'Bebidas',
      'Lácteos',
      'Snacks',
      'Limpieza',
      'Frutas',
      'Granos',
    ]);
  });

  it('GET /products?page=1&limit=2 retorna respuesta paginada', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/products?page=1&limit=2',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data).toHaveLength(2);
    expect(body.meta).toMatchObject({
      page: 1,
      limit: 2,
      total: 6,
      totalPages: 3,
    });
  });

  it('GET /products sin paginación retorna array (compatibilidad)', async () => {
    const response = await app.inject({ method: 'GET', url: '/products' });
    expect(response.statusCode).toBe(200);
    expect(Array.isArray(response.json())).toBe(true);
    expect(response.json()).toHaveLength(6);
  });

  it('GET /purchase-orders?page=1&limit=1 retorna respuesta paginada', async () => {
    const product = await getProductBySku('SNA-001');

    const createRes = await app.inject({
      method: 'POST',
      url: '/purchase-orders',
      payload: { productId: product!.id, quantity: 60 },
    });
    expect(createRes.statusCode).toBe(201);

    const response = await app.inject({
      method: 'GET',
      url: '/purchase-orders?page=1&limit=1',
    });

    expect(response.statusCode).toBe(200);
    const body = response.json();
    expect(body.data).toHaveLength(1);
    expect(body.meta.total).toBeGreaterThanOrEqual(1);
  });
});
