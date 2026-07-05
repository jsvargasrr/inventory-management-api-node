import { describe, it, expect } from 'vitest';
import {
  buildPaginationMeta,
  isPaginatedRequest,
  resolvePagination,
} from '../../../src/shared/types/pagination.js';

describe('pagination', () => {
  it('resolvePagination retorna undefined sin params', () => {
    expect(resolvePagination({})).toBeUndefined();
    expect(isPaginatedRequest({})).toBe(false);
  });

  it('resolvePagination aplica defaults', () => {
    expect(resolvePagination({ page: 2 })).toEqual({ page: 2, limit: 20 });
    expect(resolvePagination({ limit: 5 })).toEqual({ page: 1, limit: 5 });
  });

  it('buildPaginationMeta calcula totalPages', () => {
    expect(buildPaginationMeta(6, 1, 2)).toEqual({
      page: 1,
      limit: 2,
      total: 6,
      totalPages: 3,
    });
  });
});
