import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import {
  BusinessRuleError,
  ConflictError,
  DomainError,
  InsufficientStockError,
  InvalidStateTransitionError,
  NotFoundError,
  ValidationError,
} from '../../../shared/errors/domain.errors.js';

interface ErrorResponse {
  error: string;
  code: string;
  details?: unknown;
}

export function errorHandler(
  error: FastifyError | Error,
  _request: FastifyRequest,
  reply: FastifyReply,
): void {
  if (error instanceof ZodError) {
    const response: ErrorResponse = {
      error: 'Error de validación',
      code: 'VALIDATION_ERROR',
      details: error.issues.map((e) => ({
        field: e.path.join('.'),
        message: e.message,
      })),
    };
    reply.status(400).send(response);
    return;
  }

  if (error instanceof NotFoundError) {
    reply.status(404).send({ error: error.message, code: error.code });
    return;
  }

  if (error instanceof ValidationError || error instanceof BusinessRuleError) {
    reply.status(422).send({ error: error.message, code: error.code });
    return;
  }

  if (error instanceof InsufficientStockError) {
    reply.status(422).send({
      error: error.message,
      code: error.code,
      details: {
        currentStock: error.currentStock,
        requestedQuantity: error.requestedQuantity,
        shortfall: error.shortfall,
      },
    });
    return;
  }

  if (error instanceof ConflictError) {
    reply.status(409).send({ error: error.message, code: error.code });
    return;
  }

  if (error instanceof InvalidStateTransitionError) {
    reply.status(422).send({ error: error.message, code: error.code });
    return;
  }

  if (error instanceof DomainError) {
    reply.status(422).send({ error: error.message, code: error.code });
    return;
  }

  console.error('Unhandled error:', error);
  reply.status(500).send({
    error: 'Error interno del servidor',
    code: 'INTERNAL_SERVER_ERROR',
  });
}
