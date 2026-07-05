import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestApp, teardownTestApp } from '../../helpers/test-app.js';

describe('Inventory Filters', () => {
  let app: Awaited<ReturnType<typeof setupTestApp>>['app'];

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
  });

  afterAll(async () => {
    await teardownTestApp();
  });

  it('combina filtro de categoría y rango de stock', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/products?category=Bebidas&minStock=10&maxStock=100',
    });

    expect(response.statusCode).toBe(200);
    const products = response.json();
    expect(products.length).toBeGreaterThan(0);
    expect(
      products.every(
        (p: { category: string; currentStock: number }) =>
          p.category === 'Bebidas' && p.currentStock >= 10 && p.currentStock <= 100,
      ),
    ).toBe(true);
  });

  it('filtra productos con alerta activa en categoría Lácteos', async () => {
    const response = await app.inject({
      method: 'GET',
      url: '/products?category=Lácteos&hasActiveAlert=true',
    });

    expect(response.statusCode).toBe(200);
    const products = response.json();
    expect(products.every((p: { category: string }) => p.category === 'Lácteos')).toBe(true);
    expect(products.some((p: { sku: string }) => p.sku === 'LAC-002')).toBe(true);
  });

  it('historial de movimientos es solo lectura', async () => {
    const products = await app.inject({ method: 'GET', url: '/products' });
    const productId = products.json()[0].id;

    await app.inject({
      method: 'POST',
      url: `/products/${productId}/adjustments`,
      payload: { type: 'ENTRADA', quantity: 5, reason: 'Test inmutable' },
    });

    const movements = await app.inject({
      method: 'GET',
      url: `/products/${productId}/movements`,
    });
    const movementId = movements.json()[0].id;

    const patchRes = await app.inject({
      method: 'PATCH',
      url: `/products/${productId}/movements/${movementId}`,
      payload: { reason: 'modificado' },
    });
    const deleteRes = await app.inject({
      method: 'DELETE',
      url: `/products/${productId}/movements/${movementId}`,
    });

    expect(patchRes.statusCode).toBe(404);
    expect(deleteRes.statusCode).toBe(404);
  });
});
