import type { AppContainer } from '../../../composition-root.js';
import {
  adjustStockSchema,
  alertFiltersSchema,
  createProductSchema,
  createPurchaseOrderSchema,
  productFiltersSchema,
  purchaseOrderFiltersSchema,
  rejectPurchaseOrderSchema,
} from '../schemas/validation.schemas.js';
import type { FastifyInstance } from 'fastify';

export async function registerProductRoutes(
  app: FastifyInstance,
  container: AppContainer,
): Promise<void> {
  app.post('/products', async (request, reply) => {
    const body = createProductSchema.parse(request.body);
    const product = await container.createProduct.execute(body);
    return reply.status(201).send(product);
  });

  app.get('/products', async (request) => {
    const filters = productFiltersSchema.parse(request.query);
    return container.listProducts.execute(filters);
  });

  app.get<{ Params: { id: string } }>('/products/:id', async (request) => {
    return container.getProduct.execute(request.params.id);
  });

  app.post<{ Params: { id: string } }>(
    '/products/:id/adjustments',
    async (request, reply) => {
      const body = adjustStockSchema.parse(request.body);
      const result = await container.adjustStock.execute({
        productId: request.params.id,
        ...body,
      });
      return reply.status(200).send(result);
    },
  );

  app.get<{ Params: { id: string } }>(
    '/products/:id/movements',
    async (request) => {
      return container.listMovements.execute(request.params.id);
    },
  );
}

export async function registerAlertRoutes(
  app: FastifyInstance,
  container: AppContainer,
): Promise<void> {
  app.get('/alerts', async (request) => {
    const filters = alertFiltersSchema.parse(request.query);
    return container.listAlerts.execute(filters);
  });
}

export async function registerPurchaseOrderRoutes(
  app: FastifyInstance,
  container: AppContainer,
): Promise<void> {
  app.post('/purchase-orders', async (request, reply) => {
    const body = createPurchaseOrderSchema.parse(request.body);
    const order = await container.createPurchaseOrder.execute(body);
    return reply.status(201).send(order);
  });

  app.get('/purchase-orders', async (request) => {
    const filters = purchaseOrderFiltersSchema.parse(request.query);
    return container.listPurchaseOrders.execute(filters);
  });

  app.get<{ Params: { id: string } }>('/purchase-orders/:id', async (request) => {
    return container.getPurchaseOrder.execute(request.params.id);
  });

  app.patch<{ Params: { id: string } }>(
    '/purchase-orders/:id/approve',
    async (request) => {
      return container.approvePurchaseOrder.execute(request.params.id);
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/purchase-orders/:id/reject',
    async (request) => {
      const body = rejectPurchaseOrderSchema.parse(request.body);
      return container.rejectPurchaseOrder.execute(request.params.id, body.reason);
    },
  );

  app.patch<{ Params: { id: string } }>(
    '/purchase-orders/:id/receive',
    async (request) => {
      return container.receivePurchaseOrder.execute(request.params.id);
    },
  );
}

export async function registerHealthRoutes(app: FastifyInstance): Promise<void> {
  app.get('/health', async () => ({
    status: 'ok',
    timestamp: new Date().toISOString(),
  }));
}
