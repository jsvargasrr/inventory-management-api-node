import { describe, it, expect, vi } from 'vitest';
import { CreateProductUseCase } from '../../../src/application/products/create-product.use-case.js';
import type { ProductRepository } from '../../../src/domain/product/product.repository.js';
import { ConflictError, ValidationError } from '../../../src/shared/errors/domain.errors.js';

const validData = {
  name: 'Arroz Premium 1kg',
  sku: 'GRA-001',
  category: 'Granos',
  price: 3500,
  currentStock: 100,
  minStock: 30,
  supplier: 'Granos del Norte',
};

function createRepository(overrides: Partial<ProductRepository> = {}): ProductRepository {
  return {
    create: vi.fn().mockResolvedValue({ id: 'new-id', ...validData, createdAt: new Date(), updatedAt: new Date() }),
    findById: vi.fn(),
    findBySku: vi.fn(),
    findAll: vi.fn(),
    updateStock: vi.fn(),
    existsBySku: vi.fn().mockResolvedValue(false),
    ...overrides,
  };
}

describe('CreateProductUseCase', () => {
  it('crea producto con datos válidos', async () => {
    const repo = createRepository();
    const useCase = new CreateProductUseCase(repo);

    const product = await useCase.execute(validData);

    expect(product.sku).toBe('GRA-001');
    expect(repo.create).toHaveBeenCalledWith(validData);
  });

  it('rechaza SKU duplicado', async () => {
    const repo = createRepository({ existsBySku: vi.fn().mockResolvedValue(true) });
    const useCase = new CreateProductUseCase(repo);

    await expect(useCase.execute(validData)).rejects.toThrow(ConflictError);
  });

  it('rechaza nombre muy corto', async () => {
    const useCase = new CreateProductUseCase(createRepository());

    await expect(useCase.execute({ ...validData, name: 'AB' })).rejects.toThrow(ValidationError);
  });

  it('rechaza precio menor o igual a 0', async () => {
    const useCase = new CreateProductUseCase(createRepository());

    await expect(useCase.execute({ ...validData, price: 0 })).rejects.toThrow(ValidationError);
  });

  it('rechaza stock mínimo menor o igual a 0', async () => {
    const useCase = new CreateProductUseCase(createRepository());

    await expect(useCase.execute({ ...validData, minStock: 0 })).rejects.toThrow(ValidationError);
  });

  it('rechaza stock actual negativo', async () => {
    const useCase = new CreateProductUseCase(createRepository());

    await expect(useCase.execute({ ...validData, currentStock: -1 })).rejects.toThrow(ValidationError);
  });

  it('rechaza proveedor vacío', async () => {
    const useCase = new CreateProductUseCase(createRepository());

    await expect(useCase.execute({ ...validData, supplier: '   ' })).rejects.toThrow(ValidationError);
  });
});
