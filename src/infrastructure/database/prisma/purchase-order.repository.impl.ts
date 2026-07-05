import type { PrismaClient } from '@prisma/client';
import type {
  CreatePurchaseOrderData,
  PurchaseOrder,
  PurchaseOrderFilters,
  PurchaseOrderRepository,
  PurchaseOrderStatus,
} from '../../../domain/purchase-order/order-state.machine.js';
import { getDbClient } from './prisma-context.js';
import type { PrismaOrderRecord } from './prisma-types.js';

function mapOrder(record: PrismaOrderRecord): PurchaseOrder {
  return {
    id: record.id,
    productId: record.productId,
    alertId: record.alertId,
    supplier: record.supplier,
    quantity: record.quantity,
    status: record.status,
    rejectReason: record.rejectReason,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export class PrismaPurchaseOrderRepository implements PurchaseOrderRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private db() {
    return getDbClient(this.prisma);
  }

  async create(data: CreatePurchaseOrderData): Promise<PurchaseOrder> {
    const order = await this.db().purchaseOrder.create({
      data: {
        productId: data.productId,
        alertId: data.alertId ?? null,
        supplier: data.supplier,
        quantity: data.quantity,
      },
    });
    return mapOrder(order);
  }

  async findById(id: string): Promise<PurchaseOrder | null> {
    const order = await this.db().purchaseOrder.findUnique({ where: { id } });
    return order ? mapOrder(order) : null;
  }

  async findAll(filters?: PurchaseOrderFilters): Promise<PurchaseOrder[]> {
    const where: Record<string, unknown> = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.productId) {
      where.productId = filters.productId;
    }

    const orders = await this.db().purchaseOrder.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return orders.map(mapOrder);
  }

  async updateStatus(
    id: string,
    status: PurchaseOrderStatus,
    rejectReason?: string | null,
  ): Promise<PurchaseOrder> {
    const order = await this.db().purchaseOrder.update({
      where: { id },
      data: {
        status,
        ...(rejectReason !== undefined ? { rejectReason } : {}),
      },
    });
    return mapOrder(order);
  }
}
