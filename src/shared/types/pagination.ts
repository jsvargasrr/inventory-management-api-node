export interface PaginationParams {
  page?: number;
  limit?: number;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResult<T> {
  data: T[];
  meta: PaginationMeta;
}

export function buildPaginationMeta(total: number, page: number, limit: number): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit) || 0,
  };
}

export function resolvePagination(params?: PaginationParams): PaginationParams | undefined {
  if (params?.page === undefined && params?.limit === undefined) {
    return undefined;
  }

  return {
    page: params.page ?? 1,
    limit: params.limit ?? 20,
  };
}

export function isPaginatedRequest(params?: PaginationParams): boolean {
  return params?.page !== undefined || params?.limit !== undefined;
}
