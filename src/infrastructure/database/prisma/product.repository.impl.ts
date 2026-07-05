import type { PrismaClient, Product as PrismaProduct } from '@prisma/client';
import type {
  CreateProductData,
  Product,
  ProductFilters,
  ProductRepository,
} from '../../../domain/product/product.repository.js';
import { getDbClient } from './prisma-context.js';

function mapProduct(record: PrismaProduct): Product {
  return {
    id: record.id,
    name: record.name,
    sku: record.sku,
    category: record.category,
    price: record.price,
    currentStock: record.currentStock,
    minStock: record.minStock,
    supplier: record.supplier,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  };
}

export class PrismaProductRepository implements ProductRepository {
  constructor(private readonly prisma: PrismaClient) {}

  private db() {
    return getDbClient(this.prisma);
  }

  async create(data: CreateProductData): Promise<Product> {
    const product = await this.db().product.create({ data });
    return mapProduct(product);
  }

  async findById(id: string): Promise<Product | null> {
    const product = await this.db().product.findUnique({ where: { id } });
    return product ? mapProduct(product) : null;
  }

  async findBySku(sku: string): Promise<Product | null> {
    const product = await this.db().product.findUnique({ where: { sku } });
    return product ? mapProduct(product) : null;
  }

  async findAll(filters?: ProductFilters): Promise<Product[]> {
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

    const products = await this.db().product.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    return products.map(mapProduct);
  }

  async updateStock(id: string, newStock: number): Promise<Product> {
    const product = await this.db().product.update({
      where: { id },
      data: { currentStock: newStock },
    });
    return mapProduct(product);
  }

  async existsBySku(sku: string): Promise<boolean> {
    const count = await this.db().product.count({ where: { sku } });
    return count > 0;
  }
}
