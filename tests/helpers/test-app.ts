import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildApp } from '../../src/infrastructure/http/app.js';
import type { FastifyInstance } from 'fastify';
import {
  createTestPrismaClient,
  getProjectRoot,
  resetAndMigrateDatabase,
} from './db-setup.js';
import type { PrismaClient } from '@prisma/client';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = getProjectRoot(__dirname);
const testDbPath = path.join(projectRoot, 'test.db');

let prisma: PrismaClient;
let app: FastifyInstance;

export async function setupTestApp() {
  const databaseUrl = `file:${testDbPath}`;

  process.env.DATABASE_URL = databaseUrl;
  process.env.NODE_ENV = 'test';

  resetAndMigrateDatabase(databaseUrl, projectRoot);

  prisma = createTestPrismaClient(databaseUrl);

  app = await buildApp({ prisma, logger: false });
  await app.ready();

  return { app, prisma };
}

export async function teardownTestApp() {
  if (app) await app.close();
  if (prisma) await prisma.$disconnect();
}

export async function getProductBySku(sku: string) {
  return prisma.product.findUnique({ where: { sku } });
}

export { app, prisma };
