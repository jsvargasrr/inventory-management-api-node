import type { FastifyInstance } from 'fastify';

export function registerRootRoute(app: FastifyInstance): void {
  app.get('/', async () => ({
    name: 'MercadoExpress — Inventory Management API',
    version: '1.0.0',
    description: 'API REST de gestión de inventario, alertas y órdenes de compra',
    links: {
      documentation: '/docs',
      openApi: '/docs/json',
      health: '/health',
      categories: '/categories',
      products: '/products',
      alerts: '/alerts',
      purchaseOrders: '/purchase-orders',
    },
  }));
}
