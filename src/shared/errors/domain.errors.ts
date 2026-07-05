export class DomainError extends Error {
  constructor(
    message: string,
    public readonly code: string,
  ) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(resource: string, id?: string) {
    super(id ? `${resource} con id '${id}' no encontrado` : `${resource} no encontrado`, 'NOT_FOUND');
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR');
    this.name = 'ValidationError';
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message, 'CONFLICT');
    this.name = 'ConflictError';
  }
}

export class InsufficientStockError extends DomainError {
  constructor(
    public readonly currentStock: number,
    public readonly requestedQuantity: number,
    public readonly shortfall: number,
  ) {
    super(
      `Stock insuficiente. Stock actual: ${currentStock}, cantidad solicitada: ${requestedQuantity}, faltan ${shortfall} unidades`,
      'INSUFFICIENT_STOCK',
    );
    this.name = 'InsufficientStockError';
  }
}

export class InvalidStateTransitionError extends DomainError {
  constructor(from: string, to: string, action: string) {
    super(
      `No se puede ${action}: transición inválida de ${from} a ${to}`,
      'INVALID_STATE_TRANSITION',
    );
    this.name = 'InvalidStateTransitionError';
  }
}

export class BusinessRuleError extends DomainError {
  constructor(message: string) {
    super(message, 'BUSINESS_RULE_VIOLATION');
    this.name = 'BusinessRuleError';
  }
}
