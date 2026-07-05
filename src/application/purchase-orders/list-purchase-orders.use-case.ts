import type {
  PurchaseOrder,
  PurchaseOrderFilters,
  PurchaseOrderRepository,
} from '../../domain/purchase-order/order-state.machine.js';
import { NotFoundError } from '../../shared/errors/domain.errors.js';
import {
  buildPaginationMeta,
  isPaginatedRequest,
  resolvePagination,
  type PaginatedResult,
} from '../../shared/types/pagination.js';

export class ListPurchaseOrdersUseCase {
  constructor(private readonly purchaseOrderRepository: PurchaseOrderRepository) {}

  async execute(
    filters?: PurchaseOrderFilters,
  ): Promise<PurchaseOrder[] | PaginatedResult<PurchaseOrder>> {
    if (!isPaginatedRequest(filters)) {
      return this.purchaseOrderRepository.findAll(filters);
    }

    const pagination = resolvePagination(filters)!;
    const queryFilters = { ...filters, ...pagination };

    const [data, total] = await Promise.all([
      this.purchaseOrderRepository.findAll(queryFilters),
      this.purchaseOrderRepository.count(filters),
    ]);

    return {
      data,
      meta: buildPaginationMeta(total, pagination.page!, pagination.limit!),
    };
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
