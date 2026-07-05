import type { Product, ProductFilters, ProductRepository } from '../../domain/product/product.repository.js';

export class ListProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(filters?: ProductFilters): Promise<Product[]> {
    return this.productRepository.findAll(filters);
  }
}
