import { describe, it, expect } from 'vitest';
import { canTransition, ORDER_TRANSITIONS } from '../../../src/domain/purchase-order/order-state.machine.js';

describe('order-state.machine', () => {
  it('permite PENDIENTE → APROBADA', () => {
    expect(canTransition('PENDIENTE', 'APROBADA')).toBe(true);
  });

  it('permite PENDIENTE → RECHAZADA', () => {
    expect(canTransition('PENDIENTE', 'RECHAZADA')).toBe(true);
  });

  it('permite APROBADA → RECIBIDA', () => {
    expect(canTransition('APROBADA', 'RECIBIDA')).toBe(true);
  });

  it('no permite APROBADA → RECHAZADA', () => {
    expect(canTransition('APROBADA', 'RECHAZADA')).toBe(false);
  });

  it('no permite RECIBIDA → cualquier estado', () => {
    expect(ORDER_TRANSITIONS.RECIBIDA).toEqual({});
  });

  it('no permite RECHAZADA → cualquier estado', () => {
    expect(ORDER_TRANSITIONS.RECHAZADA).toEqual({});
  });
});
