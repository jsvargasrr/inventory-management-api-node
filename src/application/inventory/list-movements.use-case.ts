import type { InventoryRepository, StockMovement } from '../../domain/inventory/inventory.repository.js';
import type { ProductRepository } from '../../domain/product/product.repository.js';
import { NotFoundError } from '../../shared/errors/domain.errors.js';

export class ListMovementsUseCase {
  constructor(
    private readonly productRepository: ProductRepository,
    private readonly inventoryRepository: InventoryRepository,
  ) {}

  async execute(productId: string): Promise<StockMovement[]> {
    const product = await this.productRepository.findById(productId);
    if (!product) {
      throw new NotFoundError('Producto', productId);
    }

    return this.inventoryRepository.findByProductId(productId);
  }
}
