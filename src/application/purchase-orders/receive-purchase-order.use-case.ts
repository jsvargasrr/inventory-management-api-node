import type { ProductRepository } from '../../domain/product/product.repository.js';
import type { InventoryRepository } from '../../domain/inventory/inventory.repository.js';
import type { AlertRepository } from '../../domain/alert/alert.repository.js';
import type { PurchaseOrder, PurchaseOrderRepository } from '../../domain/purchase-order/order-state.machine.js';
import type { UnitOfWork } from '../../domain/shared/unit-of-work.js';
import { canTransition } from '../../domain/purchase-order/order-state.machine.js';
import { isStockAboveMinimum } from '../../domain/product/product.rules.js';
import {
  InvalidStateTransitionError,
  NotFoundError,
} from '../../shared/errors/domain.errors.js';

export class ReceivePurchaseOrderUseCase {
  constructor(
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
    private readonly productRepository: ProductRepository,
    private readonly inventoryRepository: InventoryRepository,
    private readonly alertRepository: AlertRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(id: string): Promise<PurchaseOrder> {
    const order = await this.purchaseOrderRepository.findById(id);
    if (!order) {
      throw new NotFoundError('Orden de compra', id);
    }

    if (!canTransition(order.status, 'RECIBIDA')) {
      throw new InvalidStateTransitionError(order.status, 'RECIBIDA', 'recibir');
    }

    return this.unitOfWork.execute(async () => {
      const product = await this.productRepository.findById(order.productId);
      if (!product) {
        throw new NotFoundError('Producto', order.productId);
      }

      const newStock = product.currentStock + order.quantity;

      await this.productRepository.updateStock(product.id, newStock);

      await this.inventoryRepository.createMovement({
        productId: product.id,
        type: 'ENTRADA',
        quantity: order.quantity,
        reason: `Recepción de orden de compra ${order.id}`,
      });

      const updatedOrder = await this.purchaseOrderRepository.updateStatus(id, 'RECIBIDA');

      if (isStockAboveMinimum(newStock, product.minStock)) {
        const alertToResolve = order.alertId
          ? await this.alertRepository.findById(order.alertId)
          : await this.alertRepository.findActiveByProductId(product.id);

        if (alertToResolve && alertToResolve.status === 'ACTIVA') {
          await this.alertRepository.resolve(alertToResolve.id);
        }
      }

      return updatedOrder;
    });
  }
}
