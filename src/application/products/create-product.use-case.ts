import type { Product, ProductRepository, CreateProductData } from '../../domain/product/product.repository.js';
import {
  validateSku,
  validateProductName,
  validatePrice,
  validateMinStock,
  validateCurrentStock,
  validateSupplier,
} from '../../domain/product/product.rules.js';
import { ConflictError } from '../../shared/errors/domain.errors.js';

export class CreateProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(data: CreateProductData): Promise<Product> {
    validateProductName(data.name);
    validateSku(data.sku);
    validatePrice(data.price);
    validateMinStock(data.minStock);
    validateCurrentStock(data.currentStock);
    validateSupplier(data.supplier);

    if (await this.productRepository.existsBySku(data.sku)) {
      throw new ConflictError(`Ya existe un producto con SKU '${data.sku}'`);
    }

    return this.productRepository.create(data);
  }
}
