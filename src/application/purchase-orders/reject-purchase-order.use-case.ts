import type { PurchaseOrder, PurchaseOrderRepository } from '../../domain/purchase-order/order-state.machine.js';
import { canTransition } from '../../domain/purchase-order/order-state.machine.js';
import {
  InvalidStateTransitionError,
  NotFoundError,
  ValidationError,
} from '../../shared/errors/domain.errors.js';

export class RejectPurchaseOrderUseCase {
  constructor(private readonly purchaseOrderRepository: PurchaseOrderRepository) {}

  async execute(id: string, reason: string): Promise<PurchaseOrder> {
    if (reason.length < 10) {
      throw new ValidationError('El motivo de rechazo debe tener al menos 10 caracteres');
    }

    const order = await this.purchaseOrderRepository.findById(id);
    if (!order) {
      throw new NotFoundError('Orden de compra', id);
    }

    if (!canTransition(order.status, 'RECHAZADA')) {
      throw new InvalidStateTransitionError(order.status, 'RECHAZADA', 'rechazar');
    }

    return this.purchaseOrderRepository.updateStatus(id, 'RECHAZADA', reason);
  }
}
