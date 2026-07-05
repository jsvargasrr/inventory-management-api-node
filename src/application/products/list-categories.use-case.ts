import { PRODUCT_CATEGORIES } from '../../domain/product/product.repository.js';

export class ListCategoriesUseCase {
  execute(): readonly string[] {
    return PRODUCT_CATEGORIES;
  }
}
