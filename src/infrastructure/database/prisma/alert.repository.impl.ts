import type { PrismaClient, Alert as PrismaAlert } from '@prisma/client';
import type {
  Alert,
  AlertFilters,
  AlertRepository,
  CreateAlertData,
} from '../../../domain/alert/alert.repository.js';
import { getDbClient } from './prisma-context.js';

function mapAlert(record: PrismaAlert): Alert {
  return {
    id: record.id,
    productId: record.productId,
    type: record.type,
    status: record.status,
    resolvedAt: record.resolvedAt,
    createdAt: record.createdAt,
  };
}

export class PrismaAlertRepository implements AlertRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private db() {
    return getDbClient(this.prisma);
  }

  async create(data: CreateAlertData): Promise<Alert> {
    const alert = await this.db().alert.create({ data });
    return mapAlert(alert);
  }

  async findById(id: string): Promise<Alert | null> {
    const alert = await this.db().alert.findUnique({ where: { id } });
    return alert ? mapAlert(alert) : null;
  }

  async findActiveByProductId(productId: string): Promise<Alert | null> {
    const alert = await this.db().alert.findFirst({
      where: { productId, status: 'ACTIVA' },
    });
    return alert ? mapAlert(alert) : null;
  }

  async findAll(filters?: AlertFilters): Promise<Alert[]> {
    const where: Record<string, unknown> = {};

    if (filters?.status) {
      where.status = filters.status;
    }

    if (filters?.productId) {
      where.productId = filters.productId;
    }

    const alerts = await this.db().alert.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return alerts.map(mapAlert);
  }

  async resolve(id: string): Promise<Alert> {
    const alert = await this.db().alert.update({
      where: { id },
      data: {
        status: 'RESUELTA',
        resolvedAt: new Date(),
      },
    });
    return mapAlert(alert);
  }
}
