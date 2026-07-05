/**
 * Script de verificación manual — Fase 1.2
 * Ejecutar: npx tsx scripts/verify-enunciado.ts
 */
import { PrismaClient } from '@prisma/client';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildApp } from '../src/infrastructure/http/app.js';
import type { FastifyInstance } from 'fastify';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.resolve(__dirname, '..');
const verifyDbPath = path.join(projectRoot, 'verify-checklist.db');

interface CheckResult {
  id: string;
  name: string;
  passed: boolean;
  detail?: string;
}

const results: CheckResult[] = [];

function check(id: string, name: string, passed: boolean, detail?: string) {
  results.push({ id, name, passed, detail });
  const icon = passed ? '✅' : '❌';
  console.log(`${icon} [${id}] ${name}${detail ? ` — ${detail}` : ''}`);
}

async function setupApp(): Promise<{ app: FastifyInstance; prisma: PrismaClient }> {
  const databaseUrl = `file:${verifyDbPath}`;

  for (const file of [verifyDbPath, `${verifyDbPath}-journal`]) {
    if (fs.existsSync(file)) fs.unlinkSync(file);
  }

  const { execSync } = await import('node:child_process');
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

  const prisma = new PrismaClient({ datasources: { db: { url: databaseUrl } } });
  const app = await buildApp({ prisma, logger: false });
  await app.ready();
  return { app, prisma };
}

async function getSku(prisma: PrismaClient, sku: string) {
  return prisma.product.findUnique({ where: { sku } });
}

async function runChecklist() {
  console.log('\n=== FASE 1.2 — Checklist del enunciado ===\n');

  const { app, prisma } = await setupApp();

  try {
    // ── RF-01: Registro de productos ──
    const createRes = await app.inject({
      method: 'POST',
      url: '/products',
      payload: {
        name: 'Arroz Premium 1kg',
        sku: 'GRA-001',
        category: 'Granos',
        price: 3500,
        currentStock: 100,
        minStock: 30,
        supplier: 'Granos del Norte',
      },
    });
    check(
      'RF-01',
      'Crear producto con campos válidos',
      createRes.statusCode === 201 && createRes.json().sku === 'GRA-001',
      `status ${createRes.statusCode}`,
    );

    const dupSku = await app.inject({
      method: 'POST',
      url: '/products',
      payload: {
        name: 'Duplicado',
        sku: 'GRA-001',
        category: 'Granos',
        price: 1000,
        currentStock: 0,
        minStock: 10,
        supplier: 'X',
      },
    });
    check('RF-01b', 'Rechazar SKU duplicado', dupSku.statusCode === 409);

    const invalidSku = await app.inject({
      method: 'POST',
      url: '/products',
      payload: {
        name: 'Test',
        sku: 'ABC',
        category: 'Granos',
        price: 1000,
        currentStock: 0,
        minStock: 10,
        supplier: 'X',
      },
    });
    check('RF-01c', 'Rechazar SKU inválido (<6 chars)', invalidSku.statusCode === 400);

    // ── RF-02: Ajuste de inventario ──
    const beb001 = await getSku(prisma, 'BEB-001');
    const adjustIn = await app.inject({
      method: 'POST',
      url: `/products/${beb001!.id}/adjustments`,
      payload: { type: 'ENTRADA', quantity: 20, reason: 'Compra proveedor' },
    });
    check('RF-02a', 'Ajuste ENTRADA de stock', adjustIn.statusCode === 200);

    const adjustOut = await app.inject({
      method: 'POST',
      url: `/products/${beb001!.id}/adjustments`,
      payload: { type: 'SALIDA', quantity: 10, reason: 'Venta mostrador' },
    });
    check('RF-02b', 'Ajuste SALIDA de stock', adjustOut.statusCode === 200);

    const movements = await app.inject({
      method: 'GET',
      url: `/products/${beb001!.id}/movements`,
    });
    const movList = movements.json();
    check(
      'RF-02c',
      'Historial de movimientos registrado',
      movements.statusCode === 200 && movList.length >= 2,
      `${movList.length} movimientos`,
    );

    // Regla 1: stock no negativo
    const negStock = await app.inject({
      method: 'POST',
      url: `/products/${beb001!.id}/adjustments`,
      payload: { type: 'SALIDA', quantity: 99999, reason: 'Venta imposible' },
    });
    const negBody = negStock.json();
    check(
      'RN-01',
      'Rechazar stock negativo con shortfall',
      negStock.statusCode === 422 &&
        negBody.code === 'INSUFFICIENT_STOCK' &&
        negBody.details?.shortfall > 0,
      `shortfall=${negBody.details?.shortfall}`,
    );

    // ── RF-03: Alertas ──
    const lac002 = await getSku(prisma, 'LAC-002');
    const beb002 = await getSku(prisma, 'BEB-002');

    const alertsLac = await app.inject({
      method: 'GET',
      url: `/alerts?productId=${lac002!.id}&status=ACTIVA`,
    });
    check(
      'RF-03a',
      'Alerta ACTIVA en seed (LAC-002 stock 15 ≤ min 25)',
      alertsLac.json().length === 1,
    );

    const alertsBeb = await app.inject({
      method: 'GET',
      url: `/alerts?productId=${beb002!.id}&status=ACTIVA`,
    });
    check(
      'RF-03b',
      'Alerta ACTIVA en seed (BEB-002 stock 30 ≤ min 40)',
      alertsBeb.json().length === 1,
    );

    // Bajar stock para crear alerta
    const sna001 = await getSku(prisma, 'SNA-001');
    await app.inject({
      method: 'POST',
      url: `/products/${sna001!.id}/adjustments`,
      payload: { type: 'SALIDA', quantity: 55, reason: 'Liquidación' },
    });
    const newAlert = await app.inject({
      method: 'GET',
      url: `/alerts?productId=${sna001!.id}&status=ACTIVA`,
    });
    check('RF-03c', 'Crear alerta al bajar stock ≤ mínimo', newAlert.json().length === 1);

    // Subir stock para resolver alerta
    await app.inject({
      method: 'POST',
      url: `/products/${sna001!.id}/adjustments`,
      payload: { type: 'ENTRADA', quantity: 30, reason: 'Reposición' },
    });
    const resolved = await app.inject({
      method: 'GET',
      url: `/alerts?productId=${sna001!.id}&status=RESUELTA`,
    });
    check('RF-03d', 'Cerrar alerta al superar stock mínimo', resolved.json().length >= 1);

    // RN-04: una alerta activa por producto
    await app.inject({
      method: 'POST',
      url: `/products/${sna001!.id}/adjustments`,
      payload: { type: 'SALIDA', quantity: 40, reason: 'Nueva baja' },
    });
    const activeAlerts = await app.inject({
      method: 'GET',
      url: `/alerts?productId=${sna001!.id}&status=ACTIVA`,
    });
    check('RN-04', 'Solo una alerta ACTIVA por producto', activeAlerts.json().length === 1);

    // ── RF-04/05: Órdenes de compra ──
    const alertsForOrder = await app.inject({
      method: 'GET',
      url: `/alerts?productId=${lac002!.id}&status=ACTIVA`,
    });
    const alertId = alertsForOrder.json()[0].id;

    const orderFromAlert = await app.inject({
      method: 'POST',
      url: '/purchase-orders',
      payload: { alertId, quantity: 50 },
    });
    check(
      'RF-04a',
      'Crear orden desde alerta (cantidad ≥ 2× mínimo)',
      orderFromAlert.statusCode === 201 && orderFromAlert.json().status === 'PENDIENTE',
    );

    const orderManual = await app.inject({
      method: 'POST',
      url: '/purchase-orders',
      payload: { productId: beb001!.id, quantity: 100 },
    });
    check('RF-04b', 'Crear orden manual', orderManual.statusCode === 201);

    const orderLowQty = await app.inject({
      method: 'POST',
      url: '/purchase-orders',
      payload: { productId: lac002!.id, quantity: 40 },
    });
    check(
      'RN-02',
      'Rechazar orden con cantidad < 2× stock mínimo',
      orderLowQty.statusCode === 422,
    );

    const orderId = orderFromAlert.json().id;

    const approve = await app.inject({
      method: 'PATCH',
      url: `/purchase-orders/${orderId}/approve`,
    });
    check('RF-05a', 'Aprobar orden PENDIENTE → APROBADA', approve.json().status === 'APROBADA');

    const rejectShort = await app.inject({
      method: 'PATCH',
      url: `/purchase-orders/${orderManual.json().id}/reject`,
      payload: { reason: 'corto' },
    });
    check('RF-05b', 'Rechazar motivo < 10 chars', rejectShort.statusCode === 400);

    const rejectOk = await app.inject({
      method: 'PATCH',
      url: `/purchase-orders/${orderManual.json().id}/reject`,
      payload: { reason: 'Presupuesto no disponible este mes' },
    });
    check('RF-05c', 'Rechazar orden PENDIENTE → RECHAZADA', rejectOk.json().status === 'RECHAZADA');

    const stockBefore = lac002!.currentStock;
    const receive = await app.inject({
      method: 'PATCH',
      url: `/purchase-orders/${orderId}/receive`,
    });
    const productAfter = await app.inject({
      method: 'GET',
      url: `/products/${lac002!.id}`,
    });
    check('RF-05d', 'Recibir orden APROBADA → RECIBIDA', receive.json().status === 'RECIBIDA');
    check(
      'RF-05e',
      'Stock incrementado al recibir orden',
      productAfter.json().currentStock === stockBefore + 50,
      `${stockBefore} → ${productAfter.json().currentStock}`,
    );

    const alertResolved = await app.inject({
      method: 'GET',
      url: `/alerts?productId=${lac002!.id}&status=RESUELTA`,
    });
    check('RN-03', 'Cerrar alerta al recibir orden', alertResolved.json().length >= 1);

    // RN-05: no aprobar orden ya aprobada/recibida
    const reApprove = await app.inject({
      method: 'PATCH',
      url: `/purchase-orders/${orderId}/approve`,
    });
    check('RN-05', 'No aprobar orden ya RECIBIDA', reApprove.statusCode === 422);

    // ── RF-06: Filtros ──
    const byCategory = await app.inject({ method: 'GET', url: '/products?category=Lácteos' });
    check(
      'RF-06a',
      'Filtrar por categoría',
      byCategory.json().every((p: { category: string }) => p.category === 'Lácteos'),
    );

    const bySupplier = await app.inject({
      method: 'GET',
      url: '/products?supplier=Lácteos',
    });
    check(
      'RF-06b',
      'Filtrar por proveedor',
      bySupplier.json().length >= 2,
      `${bySupplier.json().length} productos`,
    );

    const byAlert = await app.inject({
      method: 'GET',
      url: '/products?hasActiveAlert=true',
    });
    check('RF-06c', 'Filtrar productos con alerta activa', byAlert.json().length >= 1);

    const byStockRange = await app.inject({
      method: 'GET',
      url: '/products?minStock=10&maxStock=50',
    });
    check(
      'RF-06d',
      'Filtrar por rango de stock',
      byStockRange.json().every(
        (p: { currentStock: number }) => p.currentStock >= 10 && p.currentStock <= 50,
      ),
      `${byStockRange.json().length} productos`,
    );

    // RN-06: historial inmutable (no hay endpoints DELETE/PATCH en movements)
    const patchMovement = await app.inject({
      method: 'PATCH',
      url: `/products/${beb001!.id}/movements`,
      payload: {},
    });
    const deleteMovement = await app.inject({
      method: 'DELETE',
      url: `/products/${beb001!.id}/movements/${movList[0]?.id}`,
    });
    check(
      'RN-06',
      'Historial inmutable (sin endpoints de modificación)',
      patchMovement.statusCode === 404 && deleteMovement.statusCode === 404,
    );

    // ── Resumen ──
    console.log('\n=== RESUMEN ===');
    const passed = results.filter((r) => r.passed).length;
    const failed = results.filter((r) => !r.passed);
    console.log(`Total: ${results.length} | Pasaron: ${passed} | Fallaron: ${failed.length}`);

    if (failed.length > 0) {
      console.log('\nFallos:');
      failed.forEach((f) => console.log(`  ❌ [${f.id}] ${f.name}${f.detail ? ` — ${f.detail}` : ''}`));
      process.exit(1);
    }

    console.log('\n✅ Todos los checks del enunciado pasaron.\n');
  } finally {
    await app.close();
    await prisma.$disconnect();
    for (const file of [verifyDbPath, `${verifyDbPath}-journal`]) {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    }
  }
}

runChecklist().catch((err) => {
  console.error(err);
  process.exit(1);
});
