import { describe, it, expect, vi } from 'vitest';
import { RejectPurchaseOrderUseCase } from '../../../src/application/purchase-orders/reject-purchase-order.use-case.js';
import type { PurchaseOrderRepository } from '../../../src/domain/purchase-order/order-state.machine.js';
import { InvalidStateTransitionError, NotFoundError, ValidationError } from '../../../src/shared/errors/domain.errors.js';

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

describe('RejectPurchaseOrderUseCase', () => {
  it('rechaza orden pendiente con motivo válido', async () => {
    const repo: PurchaseOrderRepository = {
      findById: vi.fn().mockResolvedValue(pendingOrder),
      updateStatus: vi.fn().mockResolvedValue({
        ...pendingOrder,
        status: 'RECHAZADA',
        rejectReason: 'Presupuesto no disponible',
      }),
      create: vi.fn(),
      findAll: vi.fn(),
    };

    const useCase = new RejectPurchaseOrderUseCase(repo);
    const result = await useCase.execute('order-1', 'Presupuesto no disponible');

    expect(result.status).toBe('RECHAZADA');
    expect(repo.updateStatus).toHaveBeenCalledWith('order-1', 'RECHAZADA', 'Presupuesto no disponible');
  });

  it('rechaza motivo menor a 10 caracteres', async () => {
    const useCase = new RejectPurchaseOrderUseCase({} as PurchaseOrderRepository);

    await expect(useCase.execute('order-1', 'corto')).rejects.toThrow(ValidationError);
  });

  it('no permite rechazar orden ya aprobada', async () => {
    const repo: PurchaseOrderRepository = {
      findById: vi.fn().mockResolvedValue({ ...pendingOrder, status: 'APROBADA' }),
      updateStatus: vi.fn(),
      create: vi.fn(),
      findAll: vi.fn(),
    };

    const useCase = new RejectPurchaseOrderUseCase(repo);

    await expect(
      useCase.execute('order-1', 'Motivo válido de rechazo'),
    ).rejects.toThrow(InvalidStateTransitionError);
  });

  it('lanza NotFoundError si la orden no existe', async () => {
    const repo: PurchaseOrderRepository = {
      findById: vi.fn().mockResolvedValue(null),
      updateStatus: vi.fn(),
      create: vi.fn(),
      findAll: vi.fn(),
    };

    const useCase = new RejectPurchaseOrderUseCase(repo);

    await expect(
      useCase.execute('inexistente', 'Motivo válido de rechazo'),
    ).rejects.toThrow(NotFoundError);
  });
});
