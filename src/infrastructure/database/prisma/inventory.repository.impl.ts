import type { PrismaClient } from '@prisma/client';
import type {
  CreateMovementData,
  InventoryRepository,
  StockMovement,
} from '../../../domain/inventory/inventory.repository.js';
import { getDbClient } from './prisma-context.js';

type PrismaMovementRecord = NonNullable<
  Awaited<ReturnType<PrismaClient['stockMovement']['findFirst']>>
>;

function mapMovement(record: PrismaMovementRecord): StockMovement {
  return {
    id: record.id,
    productId: record.productId,
    type: record.type,
    quantity: record.quantity,
    reason: record.reason,
    createdAt: record.createdAt,
  };
}

export class PrismaInventoryRepository implements InventoryRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private db() {
    return getDbClient(this.prisma);
  }

  async createMovement(data: CreateMovementData): Promise<StockMovement> {
    const movement = await this.db().stockMovement.create({ data });
    return mapMovement(movement);
  }

  async findByProductId(productId: string): Promise<StockMovement[]> {
    const movements = await this.db().stockMovement.findMany({
      where: { productId },
      orderBy: { createdAt: 'desc' },
    });
    return movements.map(mapMovement);
  }
}
