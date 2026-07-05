export type PurchaseOrderStatus = 'PENDIENTE' | 'APROBADA' | 'RECHAZADA' | 'RECIBIDA';

export interface PurchaseOrder {
  id: string;
  productId: string;
  alertId: string | null;
  supplier: string;
  quantity: number;
  status: PurchaseOrderStatus;
  rejectReason: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreatePurchaseOrderData {
  productId: string;
  alertId?: string | null;
  supplier: string;
  quantity: number;
}

import type { PaginationParams } from '../../shared/types/pagination.js';

export interface PurchaseOrderFilters extends PaginationParams {
  status?: PurchaseOrderStatus;
  productId?: string;
}

export interface PurchaseOrderRepository {
  create(data: CreatePurchaseOrderData): Promise<PurchaseOrder>;
  findById(id: string): Promise<PurchaseOrder | null>;
  findAll(filters?: PurchaseOrderFilters): Promise<PurchaseOrder[]>;
  count(filters?: PurchaseOrderFilters): Promise<number>;
  updateStatus(
    id: string,
    status: PurchaseOrderStatus,
    rejectReason?: string | null,
  ): Promise<PurchaseOrder>;
}

export const ORDER_TRANSITIONS: Record<
  PurchaseOrderStatus,
  Partial<Record<PurchaseOrderStatus, string>>
> = {
  PENDIENTE: {
    APROBADA: 'approve',
    RECHAZADA: 'reject',
  },
  APROBADA: {
    RECIBIDA: 'receive',
  },
  RECHAZADA: {},
  RECIBIDA: {},
};

export function canTransition(
  from: PurchaseOrderStatus,
  to: PurchaseOrderStatus,
): boolean {
  return ORDER_TRANSITIONS[from][to] !== undefined;
}

export function getTransitionAction(
  from: PurchaseOrderStatus,
  to: PurchaseOrderStatus,
): string | undefined {
  return ORDER_TRANSITIONS[from][to];
}
