import type { PrismaClient } from '@prisma/client';
import type { UnitOfWork } from '../../../domain/shared/unit-of-work.js';
import { runInTransaction } from './prisma-context.js';

export class PrismaUnitOfWork implements UnitOfWork {
  constructor(private readonly prisma: PrismaClient) {}

  async execute<T>(work: () => Promise<T>): Promise<T> {
    return this.prisma.$transaction(async (tx) => runInTransaction(this.prisma, tx, work));
  }
}
