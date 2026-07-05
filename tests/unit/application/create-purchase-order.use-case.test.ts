import { describe, it, expect, vi } from 'vitest';
import { CreatePurchaseOrderUseCase } from '../../../src/application/purchase-orders/create-purchase-order.use-case.js';
import type { ProductRepository } from '../../../src/domain/product/product.repository.js';
import type { AlertRepository } from '../../../src/domain/alert/alert.repository.js';
import type { PurchaseOrderRepository } from '../../../src/domain/purchase-order/order-state.machine.js';
import { ValidationError } from '../../../src/shared/errors/domain.errors.js';

describe('CreatePurchaseOrderUseCase', () => {
  const product = {
    id: 'prod-1',
    name: 'Yogur',
    sku: 'LAC-002',
    category: 'Lácteos',
    price: 2800,
    currentStock: 15,
    minStock: 25,
    supplier: 'Lácteos del Valle',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  it('rechaza cantidad menor a 2x stock mínimo', async () => {
    const productRepository: ProductRepository = {
      findById: vi.fn().mockResolvedValue(product),
      create: vi.fn(),
      findBySku: vi.fn(),
      findAll: vi.fn(),
      updateStock: vi.fn(),
      existsBySku: vi.fn(),
    };

    const useCase = new CreatePurchaseOrderUseCase(
      productRepository,
      {} as AlertRepository,
      {} as PurchaseOrderRepository,
    );

    await expect(
      useCase.execute({ productId: 'prod-1', quantity: 40 }),
    ).rejects.toThrow(ValidationError);
  });

  it('crea orden con cantidad válida', async () => {
    const productRepository: ProductRepository = {
      findById: vi.fn().mockResolvedValue(product),
      create: vi.fn(),
      findBySku: vi.fn(),
      findAll: vi.fn(),
      updateStock: vi.fn(),
      existsBySku: vi.fn(),
    };

    const purchaseOrderRepository: PurchaseOrderRepository = {
      create: vi.fn().mockResolvedValue({
        id: 'order-1',
        productId: 'prod-1',
        alertId: null,
        supplier: product.supplier,
        quantity: 50,
        status: 'PENDIENTE',
        rejectReason: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      findById: vi.fn(),
      findAll: vi.fn(),
      updateStatus: vi.fn(),
    };

    const useCase = new CreatePurchaseOrderUseCase(
      productRepository,
      {} as AlertRepository,
      purchaseOrderRepository,
    );

    const order = await useCase.execute({ productId: 'prod-1', quantity: 50 });

    expect(order.quantity).toBe(50);
    expect(order.status).toBe('PENDIENTE');
  });
});
