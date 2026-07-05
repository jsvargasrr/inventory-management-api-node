import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestApp, teardownTestApp, getProductBySku } from '../../helpers/test-app.js';

describe('Products API', () => {
  let app: Awaited<ReturnType<typeof setupTestApp>>['app'];

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
  });

  afterAll(async () => {
    await teardownTestApp();
  });

  it('GET /health responde ok', async () => {
    const response = await app.inject({ method: 'GET', url: '/health' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({ status: 'ok' });
  });

  it('GET /products lista productos seed', async () => {
    const response = await app.inject({ method: 'GET', url: '/products' });
    expect(response.statusCode).toBe(200);
    expect(response.json()).toHaveLength(6);
  });

  it('GET /products filtra por categoría', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/products?category=Bebidas',
    });
    expect(response.statusCode).toBe(200);
    const products = response.json();
    expect(products.every((p: { category: string }) => p.category === 'Bebidas')).toBe(true);
  });

  it('GET /products filtra productos con alerta activa', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/products?hasActiveAlert=true',
    });
    expect(response.statusCode).toBe(200);
    const products = response.json();
    expect(products.length).toBeGreaterThan(0);
  });

  it('POST /products crea un producto', async () => {
    const response = await app.inject({
      method: 'POST',
      url: '/products',
      payload: {
        name: 'Arroz 1kg',
        sku: 'GRA-001',
        category: 'Granos',
        price: 3500,
        currentStock: 100,
        minStock: 30,
        supplier: 'Granos del Norte',
      },
    });
    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({ sku: 'GRA-001', name: 'Arroz 1kg' });
  });

  it('POST /products/:id/adjustments rechaza stock negativo', async () => {
    const product = await getProductBySku('LAC-002');
    const response = await app.inject({
      method: 'POST',
      url: `/products/${product!.id}/adjustments`,
      payload: { type: 'SALIDA', quantity: 100, reason: 'Venta excesiva' },
    });
    expect(response.statusCode).toBe(422);
    expect(response.json().code).toBe('INSUFFICIENT_STOCK');
    expect(response.json().details.shortfall).toBeGreaterThan(0);
  });
});
