import { z } from 'zod';
import { PRODUCT_CATEGORIES } from '../../../domain/product/product.repository.js';

export const createProductSchema = z.object({
  name: z.string().min(3).max(100),
  sku: z
    .string()
    .regex(/^[A-Za-z0-9-]{6,20}$/, 'SKU debe ser alfanumérico de 6 a 20 caracteres'),
  category: z.enum(PRODUCT_CATEGORIES as unknown as [string, ...string[]]),
  price: z.number().positive(),
  currentStock: z.number().int().min(0).default(0),
  minStock: z.number().int().positive(),
  supplier: z.string().min(1),
});

export const productFiltersSchema = z.object({
  category: z.string().optional(),
  supplier: z.string().optional(),
  hasActiveAlert: z
    .enum(['true', 'false'])
    .transform((v) => v === 'true')
    .optional(),
  minStock: z.coerce.number().int().optional(),
  maxStock: z.coerce.number().int().optional(),
});

export const adjustStockSchema = z.object({
  type: z.enum(['ENTRADA', 'SALIDA']),
  quantity: z.number().int().positive(),
  reason: z.string().min(1),
});

export const createPurchaseOrderSchema = z
  .object({
    productId: z.string().uuid().optional(),
    alertId: z.string().uuid().optional(),
    quantity: z.number().int().positive(),
  })
  .refine((data) => data.productId || data.alertId, {
    message: 'Se requiere productId o alertId',
  });

export const rejectPurchaseOrderSchema = z.object({
  reason: z.string().min(10, 'El motivo debe tener al menos 10 caracteres'),
});

export const alertFiltersSchema = z.object({
  status: z.enum(['ACTIVA', 'RESUELTA']).optional(),
  productId: z.string().uuid().optional(),
});

export const purchaseOrderFiltersSchema = z.object({
  status: z.enum(['PENDIENTE', 'APROBADA', 'RECHAZADA', 'RECIBIDA']).optional(),
  productId: z.string().uuid().optional(),
});

export type CreateProductBody = z.infer<typeof createProductSchema>;
export type AdjustStockBody = z.infer<typeof adjustStockSchema>;
export type CreatePurchaseOrderBody = z.infer<typeof createPurchaseOrderSchema>;
