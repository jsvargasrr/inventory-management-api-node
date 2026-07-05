import type {
  PurchaseOrder,
  PurchaseOrderFilters,
  PurchaseOrderRepository,
} from '../../domain/purchase-order/order-state.machine.js';
import { NotFoundError } from '../../shared/errors/domain.errors.js';

export class ListPurchaseOrdersUseCase {
  constructor(private readonly purchaseOrderRepository: PurchaseOrderRepository) {}

  async execute(filters?: PurchaseOrderFilters): Promise<PurchaseOrder[]> {
    return this.purchaseOrderRepository.findAll(filters);
  }
}

export class GetPurchaseOrderUseCase {
  constructor(private readonly purchaseOrderRepository: PurchaseOrderRepository) {}

  async execute(id: string): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepository.findById(id);
    if (!order) {
      throw new NotFoundError('Orden de compra', id);
    }
    return order;
  }
}
