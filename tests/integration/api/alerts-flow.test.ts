import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { setupTestApp, teardownTestApp, getProductBySku } from '../../helpers/test-app.js';

describe('Alerts Flow', () => {
  let app: Awaited<ReturnType<typeof setupTestApp>>['app'];

  beforeAll(async () => {
    const setup = await setupTestApp();
    app = setup.app;
  });

  afterAll(async () => {
    await teardownTestApp();
  });

  it('ajuste baja stock → crea alerta → ajuste sube stock → alerta resuelta', async () => {
    const product = await getProductBySku('BEB-001');
    expect(product).toBeTruthy();

    const initialAlerts = await app.inject({
      method: 'GET',
      url: `/alerts?productId=${product!.id}&status=ACTIVA`,
    });
    expect(initialAlerts.json()).toHaveLength(0);

    await app.inject({
      method: 'POST',
      url: `/products/${product!.id}/adjustments`,
      payload: { type: 'SALIDA', quantity: 110, reason: 'Liquidación temporal' },
    });

    const activeAlert = await app.inject({
      method: 'GET',
      url: `/alerts?productId=${product!.id}&status=ACTIVA`,
    });
    expect(activeAlert.json()).toHaveLength(1);

    await app.inject({
      method: 'POST',
      url: `/products/${product!.id}/adjustments`,
      payload: { type: 'ENTRADA', quantity: 70, reason: 'Reposición urgente' },
    });

    const resolvedAlert = await app.inject({
      method: 'GET',
      url: `/alerts?productId=${product!.id}&status=RESUELTA`,
    });
    expect(resolvedAlert.json().length).toBeGreaterThan(0);

    const stillActive = await app.inject({
      method: 'GET',
      url: `/alerts?productId=${product!.id}&status=ACTIVA`,
    });
    expect(stillActive.json()).toHaveLength(0);
  });
});
