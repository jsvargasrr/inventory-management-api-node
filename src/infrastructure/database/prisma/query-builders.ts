import type { ProductFilters } from '../../../domain/product/product.repository.js';
import type { PurchaseOrderFilters } from '../../../domain/purchase-order/order-state.machine.js';
import { resolvePagination } from '../../../shared/types/pagination.js';

export function buildProductWhere(filters?: ProductFilters): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  if (filters?.category) {
    where.category = filters.category;
  }

  if (filters?.supplier) {
    where.supplier = { contains: filters.supplier };
  }

  if (filters?.minStock !== undefined || filters?.maxStock !== undefined) {
    where.currentStock = {
      ...(filters.minStock !== undefined ? { gte: filters.minStock } : {}),
      ...(filters.maxStock !== undefined ? { lte: filters.maxStock } : {}),
    };
  }

  if (filters?.hasActiveAlert) {
    where.alerts = {
      some: { status: 'ACTIVA' },
    };
  }

  return where;
}

export function buildProductFindArgs(filters?: ProductFilters) {
  const where = buildProductWhere(filters);
  const pagination = resolvePagination(filters);

  return {
    where,
    orderBy: { name: 'asc' as const },
    ...(pagination
      ? {
          skip: (pagination.page! - 1) * pagination.limit!,
          take: pagination.limit,
        }
      : {}),
  };
}

export function buildOrderWhere(filters?: PurchaseOrderFilters): Record<string, unknown> {
  const where: Record<string, unknown> = {};

  if (filters?.status) {
    where.status = filters.status;
  }

  if (filters?.productId) {
    where.productId = filters.productId;
  }

  return where;
}

export function buildOrderFindArgs(filters?: PurchaseOrderFilters) {
  const where = buildOrderWhere(filters);
  const pagination = resolvePagination(filters);

  return {
    where,
    orderBy: { createdAt: 'desc' as const },
    ...(pagination
      ? {
          skip: (pagination.page! - 1) * pagination.limit!,
          take: pagination.limit,
        }
      : {}),
  };
}
