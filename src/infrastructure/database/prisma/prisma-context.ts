import { AsyncLocalStorage } from 'node:async_hooks';
import type { Prisma, PrismaClient } from '@prisma/client';

type DbClient = PrismaClient | Prisma.TransactionClient;

const transactionStorage = new AsyncLocalStorage<Prisma.TransactionClient>();

export function getDbClient(client: PrismaClient): DbClient {
  return transactionStorage.getStore() ?? client;
}

export function runInTransaction<T>(
  _prisma: PrismaClient,
  tx: Prisma.TransactionClient,
  work: () => Promise<T>,
): Promise<T> {
  return transactionStorage.run(tx, work);
}

export { transactionStorage };
