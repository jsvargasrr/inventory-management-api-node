import type { ProductRepository } from '../../domain/product/product.repository.js';
import type { InventoryRepository, MovementType, StockMovement } from '../../domain/inventory/inventory.repository.js';
import type { AlertRepository } from '../../domain/alert/alert.repository.js';
import type { UnitOfWork } from '../../domain/shared/unit-of-work.js';
import {
  calculateNewStock,
  isStockBelowMinimum,
  isStockAboveMinimum,
} from '../../domain/product/product.rules.js';
import {
  InsufficientStockError,
  NotFoundError,
  ValidationError,
} from '../../shared/errors/domain.errors.js';

export interface AdjustStockInput {
  productId: string;
  type: MovementType;
  quantity: number;
  reason: string;
}

export interface AdjustStockResult {
  product: Awaited<ReturnType<ProductRepository['updateStock']>>;
  movement: StockMovement;
}

export class AdjustStockUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly inventoryRepository: InventoryRepository,
    private readonly alertRepository: AlertRepository,
    private readonly unitOfWork: UnitOfWork,
  ) {}

  async execute(input: AdjustStockInput): Promise<AdjustStockResult> {
    if (input.quantity <= 0) {
      throw new ValidationError('La cantidad debe ser mayor a 0');
    }

    if (!input.reason.trim()) {
      throw new ValidationError('El motivo es obligatorio');
    }

    const product = await this.productRepository.findById(input.productId);
    if (!product) {
      throw new NotFoundError('Producto', input.productId);
    }

    const newStock = calculateNewStock(product.currentStock, input.type, input.quantity);

    if (newStock < 0) {
      throw new InsufficientStockError(
        product.currentStock,
        input.quantity,
        input.quantity - product.currentStock,
      );
    }

    return this.unitOfWork.execute(async () => {
      const updatedProduct = await this.productRepository.updateStock(product.id, newStock);

      const movement = await this.inventoryRepository.createMovement({
        productId: product.id,
        type: input.type,
        quantity: input.quantity,
        reason: input.reason,
      });

      await this.syncAlerts(product.id, product.minStock, newStock);

      return { product: updatedProduct, movement };
    });
  }

  private async syncAlerts(productId: string, minStock: number, newStock: number): Promise<void> {
    const activeAlert = await this.alertRepository.findActiveByProductId(productId);

    if (isStockBelowMinimum(newStock, minStock) && !activeAlert) {
      await this.alertRepository.create({
        productId,
        type: 'STOCK_BAJO',
      });
      return;
    }

    if (isStockAboveMinimum(newStock, minStock) && activeAlert) {
      await this.alertRepository.resolve(activeAlert.id);
    }
  }
}
