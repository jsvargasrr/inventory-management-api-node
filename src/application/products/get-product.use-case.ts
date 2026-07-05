import type { Product, ProductRepository } from '../../domain/product/product.repository.js';
import { NotFoundError } from '../../shared/errors/domain.errors.js';

export class GetProductUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(id: string): Promise<Product> {
    const product = await this.productRepository.findById(id);
    if (!product) {
      throw new NotFoundError('Producto', id);
    }
    return product;
  }
}
