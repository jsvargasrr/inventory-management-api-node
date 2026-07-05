import { describe, it, expect, vi } from 'vitest';
import { ReceivePurchaseOrderUseCase } from '../../../src/application/purchase-orders/receive-purchase-order.use-case.js';
import type { ProductRepository } from '../../../src/domain/product/product.repository.js';
import type { InventoryRepository } from '../../../src/domain/inventory/inventory.repository.js';
import type { AlertRepository } from '../../../src/domain/alert/alert.repository.js';
import type { PurchaseOrderRepository } from '../../../src/domain/purchase-order/order-state.machine.js';
import type { UnitOfWork } from '../../../src/domain/shared/unit-of-work.js';
import { InvalidStateTransitionError } from '../../../src/shared/errors/domain.errors.js';

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

const approvedOrder = {
  id: 'order-1',
  productId: 'prod-1',
  alertId: 'alert-1',
  supplier: 'Lácteos del Valle',
  quantity: 50,
  status: 'APROBADA' as const,
  rejectReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ReceivePurchaseOrderUseCase', () => {
  it('recibe orden, incrementa stock y cierra alerta', async () => {
    const purchaseOrderRepository: PurchaseOrderRepository = {
      findById: vi.fn().mockResolvedValue(approvedOrder),
      updateStatus: vi.fn().mockResolvedValue({ ...approvedOrder, status: 'RECIBIDA' }),
      create: vi.fn(),
      findAll: vi.fn(),
    };

    const productRepository: ProductRepository = {
      findById: vi.fn().mockResolvedValue(product),
      updateStock: vi.fn().mockResolvedValue({ ...product, currentStock: 65 }),
      create: vi.fn(),
      findBySku: vi.fn(),
      findAll: vi.fn(),
      existsBySku: vi.fn(),
    };

    const inventoryRepository: InventoryRepository = {
      createMovement: vi.fn().mockResolvedValue({
        id: 'mov-1',
        productId: 'prod-1',
        type: 'ENTRADA',
        quantity: 50,
        reason: 'Recepción',
        createdAt: new Date(),
      }),
      findByProductId: vi.fn(),
    };

    const alertRepository: AlertRepository = {
      findById: vi.fn().mockResolvedValue({
        id: 'alert-1',
        productId: 'prod-1',
        type: 'STOCK_BAJO',
        status: 'ACTIVA',
        resolvedAt: null,
        createdAt: new Date(),
      }),
      resolve: vi.fn(),
      create: vi.fn(),
      findActiveByProductId: vi.fn(),
      findAll: vi.fn(),
    };

    const unitOfWork: UnitOfWork = {
      execute: vi.fn().mockImplementation(async (work) => work()),
    };

    const useCase = new ReceivePurchaseOrderUseCase(
      purchaseOrderRepository,
      productRepository,
      inventoryRepository,
      alertRepository,
      unitOfWork,
    );

    const result = await useCase.execute('order-1');

    expect(result.status).toBe('RECIBIDA');
    expect(productRepository.updateStock).toHaveBeenCalledWith('prod-1', 65);
    expect(inventoryRepository.createMovement).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'ENTRADA', quantity: 50 }),
    );
    expect(alertRepository.resolve).toHaveBeenCalledWith('alert-1');
  });

  it('no permite recibir orden pendiente', async () => {
    const purchaseOrderRepository: PurchaseOrderRepository = {
      findById: vi.fn().mockResolvedValue({ ...approvedOrder, status: 'PENDIENTE' }),
      updateStatus: vi.fn(),
      create: vi.fn(),
      findAll: vi.fn(),
    };

    const useCase = new ReceivePurchaseOrderUseCase(
      purchaseOrderRepository,
      {} as ProductRepository,
      {} as InventoryRepository,
      {} as AlertRepository,
      { execute: vi.fn() },
    );

    await expect(useCase.execute('order-1')).rejects.toThrow(InvalidStateTransitionError);
  });
});
