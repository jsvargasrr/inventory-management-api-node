import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestApp, teardownTestApp, getProductBySku } from '../../helpers/test-app.js';

describe('Purchase Order States', () => {
  let app: Awaited<ReturnType<typeof setupTestApp>>['app'];

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
  });

  afterAll(async () => {
    await teardownTestApp();
  });

  it('orden rechazada no puede aprobarse', async () => {
    const product = await getProductBySku('LIM-001');

    const createRes = await app.inject({
      method: 'POST',
      url: '/purchase-orders',
      payload: { productId: product!.id, quantity: 40 },
    });
    const order = createRes.json();

    await app.inject({
      method: 'PATCH',
      url: `/purchase-orders/${order.id}/reject`,
      payload: { reason: 'Proveedor sin stock disponible' },
    });

    const approveRes = await app.inject({
      method: 'PATCH',
      url: `/purchase-orders/${order.id}/approve`,
    });
    expect(approveRes.statusCode).toBe(422);
  });

  it('orden recibida no puede recibirse de nuevo', async () => {
    const product = await getProductBySku('BEB-002');
    const alerts = await app.inject({
      method: 'GET',
      url: `/alerts?productId=${product!.id}&status=ACTIVA`,
    });

    const createRes = await app.inject({
      method: 'POST',
      url: '/purchase-orders',
      payload: { alertId: alerts.json()[0].id, quantity: 80 },
    });
    const order = createRes.json();

    await app.inject({ method: 'PATCH', url: `/purchase-orders/${order.id}/approve` });
    await app.inject({ method: 'PATCH', url: `/purchase-orders/${order.id}/receive` });

    const secondReceive = await app.inject({
      method: 'PATCH',
      url: `/purchase-orders/${order.id}/receive`,
    });
    expect(secondReceive.statusCode).toBe(422);
  });
});
