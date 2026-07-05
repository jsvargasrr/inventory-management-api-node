import { describe, it, expect, vi } from 'vitest';
import { ApprovePurchaseOrderUseCase } from '../../../src/application/purchase-orders/approve-purchase-order.use-case.js';
import type { PurchaseOrderRepository } from '../../../src/domain/purchase-order/order-state.machine.js';
import { InvalidStateTransitionError, NotFoundError } from '../../../src/shared/errors/domain.errors.js';

const pendingOrder = {
  id: 'order-1',
  productId: 'prod-1',
  alertId: null,
  supplier: 'Proveedor',
  quantity: 50,
  status: 'PENDIENTE' as const,
  rejectReason: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe('ApprovePurchaseOrderUseCase', () => {
  it('aprueba orden pendiente', async () => {
    const repo: PurchaseOrderRepository = {
      findById: vi.fn().mockResolvedValue(pendingOrder),
      updateStatus: vi.fn().mockResolvedValue({ ...pendingOrder, status: 'APROBADA' }),
      create: vi.fn(),
      findAll: vi.fn(),
      count: vi.fn(),
    };

    const useCase = new ApprovePurchaseOrderUseCase(repo);
    const result = await useCase.execute('order-1');

    expect(result.status).toBe('APROBADA');
    expect(repo.updateStatus).toHaveBeenCalledWith('order-1', 'APROBADA');
  });

  it('rechaza aprobar orden ya recibida', async () => {
    const repo: PurchaseOrderRepository = {
      findById: vi.fn().mockResolvedValue({ ...pendingOrder, status: 'RECIBIDA' }),
      updateStatus: vi.fn(),
      create: vi.fn(),
      findAll: vi.fn(),
      count: vi.fn(),
    };

    const useCase = new ApprovePurchaseOrderUseCase(repo);

    await expect(useCase.execute('order-1')).rejects.toThrow(InvalidStateTransitionError);
  });

  it('lanza NotFoundError si la orden no existe', async () => {
    const repo: PurchaseOrderRepository = {
      findById: vi.fn().mockResolvedValue(null),
      updateStatus: vi.fn(),
      create: vi.fn(),
      findAll: vi.fn(),
      count: vi.fn(),
    };

    const useCase = new ApprovePurchaseOrderUseCase(repo);

    await expect(useCase.execute('inexistente')).rejects.toThrow(NotFoundError);
  });
});
