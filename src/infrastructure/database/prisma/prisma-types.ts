import type { PrismaClient } from '@prisma/client';

export type PrismaProductRecord = NonNullable<
  Awaited<ReturnType<PrismaClient['product']['findFirst']>>
>;

export type PrismaAlertRecord = NonNullable<
  Awaited<ReturnType<PrismaClient['alert']['findFirst']>>
>;

export type PrismaOrderRecord = NonNullable<
  Awaited<ReturnType<PrismaClient['purchaseOrder']['findFirst']>>
>;

export type PrismaMovementRecord = NonNullable<
  Awaited<ReturnType<PrismaClient['stockMovement']['findFirst']>>
>;
