import type { Product, ProductFilters, ProductRepository } from '../../domain/product/product.repository.js';
import {
  buildPaginationMeta,
  isPaginatedRequest,
  resolvePagination,
  type PaginatedResult,
} from '../../shared/types/pagination.js';

export class ListProductsUseCase {
  constructor(private readonly productRepository: ProductRepository) {}

  async execute(filters?: ProductFilters): Promise<Product[] | PaginatedResult<Product>> {
    if (!isPaginatedRequest(filters)) {
      return this.productRepository.findAll(filters);
    }

    const pagination = resolvePagination(filters)!;
    const queryFilters = { ...filters, ...pagination };

    const [data, total] = await Promise.all([
      this.productRepository.findAll(queryFilters),
      this.productRepository.count(filters),
    ]);

    return {
      data,
      meta: buildPaginationMeta(total, pagination.page!, pagination.limit!),
    };
  }
}
