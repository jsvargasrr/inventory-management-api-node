import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import type { FastifyInstance } from 'fastify';

export async function registerSwagger(app: FastifyInstance): Promise<void> {
  await app.register(swagger, {
    openapi: {
      info: {
        title: 'MercadoExpress — Inventory Management API',
        description: 'API REST de gestión de inventario, alertas y órdenes de compra',
        version: '1.0.0',
      },
      tags: [
        { name: 'Health', description: 'Estado del servicio' },
        { name: 'Products', description: 'Gestión de productos e inventario' },
        { name: 'Alerts', description: 'Alertas de stock bajo' },
        { name: 'Purchase Orders', description: 'Órdenes de compra' },
      ],
      components: {
        schemas: {
          Error: {
            type: 'object',
            properties: {
              error: { type: 'string' },
              code: { type: 'string' },
              details: { type: 'object' },
            },
          },
          Product: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              name: { type: 'string' },
              sku: { type: 'string' },
              category: { type: 'string' },
              price: { type: 'number' },
              currentStock: { type: 'integer' },
              minStock: { type: 'integer' },
              supplier: { type: 'string' },
            },
          },
          AdjustStock: {
            type: 'object',
            required: ['type', 'quantity', 'reason'],
            properties: {
              type: { type: 'string', enum: ['ENTRADA', 'SALIDA'] },
              quantity: { type: 'integer', minimum: 1 },
              reason: { type: 'string' },
            },
          },
          PurchaseOrder: {
            type: 'object',
            properties: {
              id: { type: 'string', format: 'uuid' },
              productId: { type: 'string', format: 'uuid' },
              supplier: { type: 'string' },
              quantity: { type: 'integer' },
              status: {
                type: 'string',
                enum: ['PENDIENTE', 'APROBADA', 'RECHAZADA', 'RECIBIDA'],
              },
            },
          },
        },
      },
    },
  });

  await app.register(swaggerUi, {
    routePrefix: '/docs',
    uiConfig: {
      docExpansion: 'list',
      deepLinking: true,
    },
  });
}
