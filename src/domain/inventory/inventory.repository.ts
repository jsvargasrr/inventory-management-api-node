export type MovementType = 'ENTRADA' | 'SALIDA';

export interface StockMovement {
  id: string;
  productId: string;
  type: MovementType;
  quantity: number;
  reason: string;
  createdAt: Date;
}

export interface CreateMovementData {
  productId: string;
  type: MovementType;
  quantity: number;
  reason: string;
}

export interface InventoryRepository {
  createMovement(data: CreateMovementData): Promise<StockMovement>;
  findByProductId(productId: string): Promise<StockMovement[]>;
}
