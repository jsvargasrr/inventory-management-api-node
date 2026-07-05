import { PrismaClient } from '@prisma/client';
import { execSync } from 'node:child_process';
import fs from 'node:fs';

export function resetAndMigrateDatabase(databaseUrl: string, projectRoot: string): void {
  const dbPath = databaseUrl.replace(/^file:/, '');

  for (const file of [dbPath, `${dbPath}-journal`]) {
    if (fs.existsSync(file)) {
      fs.unlinkSync(file);
    }
  }

  execSync('npx prisma migrate deploy', {
    cwd: projectRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });

  execSync('npx tsx prisma/seed.ts', {
    cwd: projectRoot,
    env: { ...process.env, DATABASE_URL: databaseUrl },
    stdio: 'pipe',
  });
}

export function createTestPrismaClient(databaseUrl: string): PrismaClient {
  return new PrismaClient({
    datasources: { db: { url: databaseUrl } },
  });
}

export function getProjectRoot(fromDir: string): string {
  return path.resolve(fromDir, '../..');
}

export function getScriptsProjectRoot(fromDir: string): string {
  return path.resolve(fromDir, '..');
}
