import { describe, it, expect } from 'vitest';
import {
  calculateNewStock,
  isStockBelowMinimum,
  isStockAboveMinimum,
  validateMinimumOrderQuantity,
  validateSku,
} from '../../../src/domain/product/product.rules.js';
import { ValidationError } from '../../../src/shared/errors/domain.errors.js';

describe('product.rules', () => {
  describe('validateSku', () => {
    it('acepta SKU alfanumérico válido', () => {
      expect(() => validateSku('BEB-001')).not.toThrow();
    });

    it('rechaza SKU muy corto', () => {
      expect(() => validateSku('AB')).toThrow(ValidationError);
    });
  });

  describe('calculateNewStock', () => {
    it('suma en ENTRADA', () => {
      expect(calculateNewStock(100, 'ENTRADA', 50)).toBe(150);
    });

    it('resta en SALIDA', () => {
      expect(calculateNewStock(100, 'SALIDA', 30)).toBe(70);
    });
  });

  describe('isStockBelowMinimum', () => {
    it('detecta stock igual al mínimo', () => {
      expect(isStockBelowMinimum(50, 50)).toBe(true);
    });

    it('detecta stock por debajo del mínimo', () => {
      expect(isStockBelowMinimum(49, 50)).toBe(true);
    });

    it('detecta stock por encima del mínimo', () => {
      expect(isStockAboveMinimum(51, 50)).toBe(true);
    });
  });

  describe('validateMinimumOrderQuantity', () => {
    it('acepta cantidad igual a 2x stock mínimo', () => {
      expect(() => validateMinimumOrderQuantity(100, 50)).not.toThrow();
    });

    it('rechaza cantidad menor a 2x stock mínimo', () => {
      expect(() => validateMinimumOrderQuantity(99, 50)).toThrow(ValidationError);
    });
  });
});
