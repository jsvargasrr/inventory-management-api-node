import type { PurchaseOrder, PurchaseOrderRepository } from '../../domain/purchase-order/order-state.machine.js';
import { canTransition } from '../../domain/purchase-order/order-state.machine.js';
import { InvalidStateTransitionError, NotFoundError } from '../../shared/errors/domain.errors.js';

export class ApprovePurchaseOrderUseCase {
  constructor(private readonly purchaseOrderRepository: PurchaseOrderRepository) {}

  async execute(id: string): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepository.findById(id);
    if (!order) {
      throw new NotFoundError('Orden de compra', id);
    }

    if (!canTransition(order.status, 'APROBADA')) {
      throw new InvalidStateTransitionError(order.status, 'APROBADA', 'aprobar');
    }

    return this.purchaseOrderRepository.updateStatus(id, 'APROBADA');
  }
}
