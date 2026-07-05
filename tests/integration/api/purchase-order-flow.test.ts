import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestApp, teardownTestApp, getProductBySku } from '../../helpers/test-app.js';

describe('Purchase Order Flow', () => {
  let app: Awaited<ReturnType<typeof setupTestApp>>['app'];

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
  });

  afterAll(async () => {
    await teardownTestApp();
  });

  it('flujo completo: alerta → orden → aprobar → recibir → stock y alerta resuelta', async () => {
    const product = await getProductBySku('LAC-002');
    expect(product).toBeTruthy();

    const alertsResponse = await app.inject({
      method: 'GET',
      url: `/alerts?productId=${product!.id}&status=ACTIVA`,
    });
    const alerts = alertsResponse.json();
    expect(alerts.length).toBe(1);

    const createOrderResponse = await app.inject({
      method: 'POST',
      url: '/purchase-orders',
      payload: { alertId: alerts[0].id, quantity: 50 },
    });
    expect(createOrderResponse.statusCode).toBe(201);
    const order = createOrderResponse.json();
    expect(order.status).toBe('PENDIENTE');

    const approveResponse = await app.inject({
      method: 'PATCH',
      url: `/purchase-orders/${order.id}/approve`,
    });
    expect(approveResponse.statusCode).toBe(200);
    expect(approveResponse.json().status).toBe('APROBADA');

    const receiveResponse = await app.inject({
      method: 'PATCH',
      url: `/purchase-orders/${order.id}/receive`,
    });
    expect(receiveResponse.statusCode).toBe(200);
    expect(receiveResponse.json().status).toBe('RECIBIDA');

    const productResponse = await app.inject({
      method: 'GET',
      url: `/products/${product!.id}`,
    });
    expect(productResponse.json().currentStock).toBe(product!.currentStock + 50);

    const resolvedAlerts = await app.inject({
      method: 'GET',
      url: `/alerts?productId=${product!.id}&status=RESUELTA`,
    });
    expect(resolvedAlerts.json().length).toBeGreaterThan(0);
  });

  it('rechaza orden pendiente con motivo corto', async () => {
    const product = await getProductBySku('BEB-002');

    const createResponse = await app.inject({
      method: 'POST',
      url: '/purchase-orders',
      payload: { productId: product!.id, quantity: 80 },
    });
    const order = createResponse.json();

    const rejectResponse = await app.inject({
      method: 'PATCH',
      url: `/purchase-orders/${order.id}/reject`,
      payload: { reason: 'corto' },
    });
    expect(rejectResponse.statusCode).toBe(400);
  });

  it('no permite aprobar orden ya aprobada', async () => {
    const product = await getProductBySku('SNA-001');

    const createResponse = await app.inject({
      method: 'POST',
      url: '/purchase-orders',
      payload: { productId: product!.id, quantity: 60 },
    });
    const order = createResponse.json();

    await app.inject({ method: 'PATCH', url: `/purchase-orders/${order.id}/approve` });

    const secondApprove = await app.inject({
      method: 'PATCH',
      url: `/purchase-orders/${order.id}/approve`,
    });
    expect(secondApprove.statusCode).toBe(422);
  });
});
