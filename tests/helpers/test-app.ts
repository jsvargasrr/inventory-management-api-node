import { PrismaClient } from '@prisma/client';
import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildApp } from '../../src/infrastructure/http/app.js';
import type { FastifyInstance } from 'fastify';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '../..');
const testDbPath = path.join(projectRoot, 'test.db');

let prisma: PrismaClient;
let app: FastifyInstance;

export async function setupTestApp() {
  const databaseUrl = `file:${testDbPath}`;

  process.env.DATABASE_URL = databaseUrl;

  for (const file of [testDbPath, `${testDbPath}-journal`]) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  }

  execSync('npx prisma db push --skip-generate', {
    cwd: projectRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });

  execSync('npx tsx prisma/seed.ts', {
    cwd: projectRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });

  prisma = new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });

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
