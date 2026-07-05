import type { AlertRepository } from '../../domain/alert/alert.repository.js';
import type { ProductRepository } from '../../domain/product/product.repository.js';
import type {
  PurchaseOrder,
  PurchaseOrderRepository,
} from '../../domain/purchase-order/order-state.machine.js';
import { validateMinimumOrderQuantity } from '../../domain/product/product.rules.js';
import {
  BusinessRuleError,
  NotFoundError,
  ValidationError,
} from '../../shared/errors/domain.errors.js';

export interface CreatePurchaseOrderInput {
  productId?: string;
  alertId?: string;
  quantity: number;
}

export class CreatePurchaseOrderUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly alertRepository: AlertRepository,
    private readonly purchaseOrderRepository: PurchaseOrderRepository,
  ) {}

  async execute(input: CreatePurchaseOrderInput): Promise<PurchaseOrder> {
    if (input.quantity <= 0) {
      throw new ValidationError('La cantidad debe ser mayor a 0');
    }

    let productId = input.productId;
    let alertId: string | null = null;

    if (input.alertId) {
      const alert = await this.alertRepository.findById(input.alertId);
      if (!alert) {
        throw new NotFoundError('Alerta', input.alertId);
      }
      if (alert.status !== 'ACTIVA') {
        throw new BusinessRuleError('Solo se pueden generar órdenes desde alertas activas');
      }
      if (alert.type !== 'STOCK_BAJO') {
        throw new BusinessRuleError('Solo se pueden generar órdenes desde alertas de tipo STOCK_BAJO');
      }
      productId = alert.productId;
      alertId = alert.id;
    }

    if (!productId) {
      throw new ValidationError('Se requiere productId o alertId');
    }

    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Producto', productId);
    }

    validateMinimumOrderQuantity(input.quantity, product.minStock);

    return this.purchaseOrderRepository.create({
      productId: product.id,
      alertId,
      supplier: product.supplier,
      quantity: input.quantity,
    });
  }
}
