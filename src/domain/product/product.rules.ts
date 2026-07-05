import { ValidationError } from '../../shared/errors/domain.errors.js';

const SKU_REGEX = /^[A-Za-z0-9-]{6,20}$/;

export function validateSku(sku: string): void {
  if (!SKU_REGEX.test(sku)) {
    throw new ValidationError('SKU debe ser alfanumérico de 6 a 20 caracteres');
  }
}

export function validateProductName(name: string): void {
  if (name.length < 3 || name.length > 100) {
    throw new ValidationError('El nombre debe tener entre 3 y 100 caracteres');
  }
}

export function validatePrice(price: number): void {
  if (price <= 0) {
    throw new ValidationError('El precio debe ser mayor a 0');
  }
}

export function validateMinStock(minStock: number): void {
  if (minStock <= 0) {
    throw new ValidationError('El stock mínimo debe ser mayor a 0');
  }
}

export function validateCurrentStock(currentStock: number): void {
  if (currentStock < 0) {
    throw new ValidationError('El stock actual debe ser mayor o igual a 0');
  }
}

export function validateSupplier(supplier: string): void {
  if (!supplier.trim()) {
    throw new ValidationError('El proveedor es obligatorio');
  }
}

export function validateMinimumOrderQuantity(quantity: number, minStock: number): void {
  const minimumRequired = minStock * 2;
  if (quantity < minimumRequired) {
    throw new ValidationError(
      `La cantidad mínima de la orden debe ser al menos ${minimumRequired} (2x stock mínimo)`,
    );
  }
}

export function calculateNewStock(
  currentStock: number,
  type: 'ENTRADA' | 'SALIDA',
  quantity: number,
): number {
  return type === 'ENTRADA' ? currentStock + quantity : currentStock - quantity;
}

export function isStockBelowMinimum(stock: number, minStock: number): boolean {
  return stock <= minStock;
}

export function isStockAboveMinimum(stock: number, minStock: number): boolean {
  return stock > minStock;
}
