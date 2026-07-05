import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdjustStockUseCase } from '../../../src/application/inventory/adjust-stock.use-case.js';
import type { Product, ProductRepository } from '../../../src/domain/product/product.repository.js';
import type { InventoryRepository } from '../../../src/domain/inventory/inventory.repository.js';
import type { AlertRepository } from '../../../src/domain/alert/alert.repository.js';
import type { UnitOfWork } from '../../../src/domain/shared/unit-of-work.js';
import { InsufficientStockError } from '../../../src/shared/errors/domain.errors.js';

const baseProduct: Product = {
  id: 'prod-1',
  name: 'Test Product',
  sku: 'TEST-001',
  category: 'Bebidas',
  price: 1000,
  currentStock: 50,
  minStock: 40,
  supplier: 'Proveedor Test',
  createdAt: new Date(),
  updatedAt: new Date(),
};

function createMocks(stock = 50) {
  const product = { ...baseProduct, currentStock: stock };

  const productRepository: ProductRepository = {
    create: vi.fn(),
    findById: vi.fn().mockResolvedValue(product),
    findBySku: vi.fn(),
    findAll: vi.fn(),
    updateStock: vi.fn().mockImplementation(async (_id, newStock) => ({
      ...product,
      currentStock: newStock,
    })),
    existsBySku: vi.fn(),
  };

  const inventoryRepository: InventoryRepository = {
    createMovement: vi.fn().mockResolvedValue({
      id: 'mov-1',
      productId: product.id,
      type: 'SALIDA',
      quantity: 10,
      reason: 'Venta',
      createdAt: new Date(),
    }),
    findByProductId: vi.fn(),
  };

  const alertRepository: AlertRepository = {
    create: vi.fn(),
    findById: vi.fn(),
    findActiveByProductId: vi.fn().mockResolvedValue(null),
    findAll: vi.fn(),
    resolve: vi.fn(),
  };

  const unitOfWork: UnitOfWork = {
    execute: vi.fn().mockImplementation(async (work) => work()),
  };

  return { productRepository, inventoryRepository, alertRepository, unitOfWork, product };
}

describe('AdjustStockUseCase', () => {
  let useCase: AdjustStockUseCase;
  let mocks: ReturnType<typeof createMocks>;

  beforeEach(() => {
    mocks = createMocks();
    useCase = new AdjustStockUseCase(
      mocks.productRepository,
      mocks.inventoryRepository,
      mocks.alertRepository,
      mocks.unitOfWork,
    );
  });

  it('rechaza salida que dejaría stock negativo', async () => {
    await expect(
      useCase.execute({
        productId: 'prod-1',
        type: 'SALIDA',
        quantity: 60,
        reason: 'Venta mayor',
      }),
    ).rejects.toThrow(InsufficientStockError);

    await expect(
      useCase.execute({
        productId: 'prod-1',
        type: 'SALIDA',
        quantity: 60,
        reason: 'Venta mayor',
      }),
    ).rejects.toMatchObject({ shortfall: 10 });
  });

  it('crea alerta cuando stock baja al mínimo', async () => {
    mocks = createMocks(45);
    useCase = new AdjustStockUseCase(
      mocks.productRepository,
      mocks.inventoryRepository,
      mocks.alertRepository,
      mocks.unitOfWork,
    );

    await useCase.execute({
      productId: 'prod-1',
      type: 'SALIDA',
      quantity: 5,
      reason: 'Venta',
    });

    expect(mocks.alertRepository.create).toHaveBeenCalledWith({
      productId: 'prod-1',
      type: 'STOCK_BAJO',
    });
  });

  it('cierra alerta activa cuando stock supera el mínimo', async () => {
    mocks = createMocks(35);
    vi.mocked(mocks.alertRepository.findActiveByProductId).mockResolvedValue({
      id: 'alert-1',
      productId: 'prod-1',
      type: 'STOCK_BAJO',
      status: 'ACTIVA',
      resolvedAt: null,
      createdAt: new Date(),
    });

    useCase = new AdjustStockUseCase(
      mocks.productRepository,
      mocks.inventoryRepository,
      mocks.alertRepository,
      mocks.unitOfWork,
    );

    await useCase.execute({
      productId: 'prod-1',
      type: 'ENTRADA',
      quantity: 10,
      reason: 'Reposición',
    });

    expect(mocks.alertRepository.resolve).toHaveBeenCalledWith('alert-1');
  });

  it('no crea alerta duplicada si ya existe una activa', async () => {
    mocks = createMocks(35);
    vi.mocked(mocks.alertRepository.findActiveByProductId).mockResolvedValue({
      id: 'alert-1',
      productId: 'prod-1',
      type: 'STOCK_BAJO',
      status: 'ACTIVA',
      resolvedAt: null,
      createdAt: new Date(),
    });

    useCase = new AdjustStockUseCase(
      mocks.productRepository,
      mocks.inventoryRepository,
      mocks.alertRepository,
      mocks.unitOfWork,
    );

    await useCase.execute({
      productId: 'prod-1',
      type: 'SALIDA',
      quantity: 5,
      reason: 'Venta',
    });

    expect(mocks.alertRepository.create).not.toHaveBeenCalled();
  });
});
