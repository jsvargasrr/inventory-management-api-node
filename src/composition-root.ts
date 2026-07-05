import type { PrismaClient } from '@prisma/client';
import { CreateProductUseCase } from './application/products/create-product.use-case.js';
import { GetProductUseCase } from './application/products/get-product.use-case.js';
import { ListProductsUseCase } from './application/products/list-products.use-case.js';
import { AdjustStockUseCase } from './application/inventory/adjust-stock.use-case.js';
import { ListMovementsUseCase } from './application/inventory/list-movements.use-case.js';
import { ListAlertsUseCase } from './application/alerts/list-alerts.use-case.js';
import { CreatePurchaseOrderUseCase } from './application/purchase-orders/create-purchase-order.use-case.js';
import {
  GetPurchaseOrderUseCase,
  ListPurchaseOrdersUseCase,
} from './application/purchase-orders/list-purchase-orders.use-case.js';
import { ApprovePurchaseOrderUseCase } from './application/purchase-orders/approve-purchase-order.use-case.js';
import { RejectPurchaseOrderUseCase } from './application/purchase-orders/reject-purchase-order.use-case.js';
import { ReceivePurchaseOrderUseCase } from './application/purchase-orders/receive-purchase-order.use-case.js';
import { prisma as defaultPrisma } from './infrastructure/database/prisma/client.js';
import { PrismaProductRepository } from './infrastructure/database/prisma/product.repository.impl.js';
import { PrismaInventoryRepository } from './infrastructure/database/prisma/inventory.repository.impl.js';
import { PrismaAlertRepository } from './infrastructure/database/prisma/alert.repository.impl.js';
import { PrismaPurchaseOrderRepository } from './infrastructure/database/prisma/purchase-order.repository.impl.js';
import { PrismaUnitOfWork } from './infrastructure/database/prisma/unit-of-work.impl.js';

export interface AppContainer {
  createProduct: CreateProductUseCase;
  listProducts: ListProductsUseCase;
  getProduct: GetProductUseCase;
  adjustStock: AdjustStockUseCase;
  listMovements: ListMovementsUseCase;
  listAlerts: ListAlertsUseCase;
  createPurchaseOrder: CreatePurchaseOrderUseCase;
  listPurchaseOrders: ListPurchaseOrdersUseCase;
  getPurchaseOrder: GetPurchaseOrderUseCase;
  approvePurchaseOrder: ApprovePurchaseOrderUseCase;
  rejectPurchaseOrder: RejectPurchaseOrderUseCase;
  receivePurchaseOrder: ReceivePurchaseOrderUseCase;
}

export function buildContainer(prismaClient?: PrismaClient): AppContainer {
  const prisma = prismaClient ?? defaultPrisma;

  const productRepository = new PrismaProductRepository(prisma);
  const inventoryRepository = new PrismaInventoryRepository(prisma);
  const alertRepository = new PrismaAlertRepository(prisma);
  const purchaseOrderRepository = new PrismaPurchaseOrderRepository(prisma);
  const unitOfWork = new PrismaUnitOfWork(prisma);

  return {
    createProduct: new CreateProductUseCase(productRepository),
    listProducts: new ListProductsUseCase(productRepository),
    getProduct: new GetProductUseCase(productRepository),
    adjustStock: new AdjustStockUseCase(
      productRepository,
      inventoryRepository,
      alertRepository,
      unitOfWork,
    ),
    listMovements: new ListMovementsUseCase(productRepository, inventoryRepository),
    listAlerts: new ListAlertsUseCase(alertRepository),
    createPurchaseOrder: new CreatePurchaseOrderUseCase(
      productRepository,
      alertRepository,
      purchaseOrderRepository,
    ),
    listPurchaseOrders: new ListPurchaseOrdersUseCase(purchaseOrderRepository),
    getPurchaseOrder: new GetPurchaseOrderUseCase(purchaseOrderRepository),
    approvePurchaseOrder: new ApprovePurchaseOrderUseCase(purchaseOrderRepository),
    rejectPurchaseOrder: new RejectPurchaseOrderUseCase(purchaseOrderRepository),
    receivePurchaseOrder: new ReceivePurchaseOrderUseCase(
      purchaseOrderRepository,
      productRepository,
      inventoryRepository,
      alertRepository,
      unitOfWork,
    ),
  };
}
