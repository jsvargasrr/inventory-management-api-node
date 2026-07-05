export const PRODUCT_CATEGORIES = [
  'Bebidas',
  'Lácteos',
  'Snacks',
  'Limpieza',
  'Frutas',
  'Granos',
] as const;

export type ProductCategory = (typeof PRODUCT_CATEGORIES)[number];

export interface Product {
  id: string;
  name: string;
  sku: string;
  category: string;
  price: number;
  currentStock: number;
  minStock: number;
  supplier: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProductData {
  name: string;
  sku: string;
  category: string;
  price: number;
  currentStock: number;
  minStock: number;
  supplier: string;
}

export interface ProductFilters {
  category?: string;
  supplier?: string;
  hasActiveAlert?: boolean;
  minStock?: number;
  maxStock?: number;
}

export interface ProductRepository {
  create(data: CreateProductData): Promise<Product>;
  findById(id: string): Promise<Product | null>;
  findBySku(sku: string): Promise<Product | null>;
  findAll(filters?: ProductFilters): Promise<Product[]>;
  updateStock(id: string, newStock: number): Promise<Product>;
  existsBySku(sku: string): Promise<boolean>;
}
