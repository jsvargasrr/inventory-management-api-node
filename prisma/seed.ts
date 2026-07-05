import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const CATEGORIES = ['Bebidas', 'Lácteos', 'Snacks', 'Limpieza', 'Frutas', 'Granos'];

const PRODUCTS = [
  {
    sku: 'BEB-001',
    name: 'Agua Mineral 500ml',
    category: 'Bebidas',
    price: 1500,
    currentStock: 150,
    minStock: 50,
    supplier: 'Distribuidora Andina',
  },
  {
    sku: 'BEB-002',
    name: 'Jugo de Naranja 1L',
    category: 'Bebidas',
    price: 3200,
    currentStock: 30,
    minStock: 40,
    supplier: 'Lácteos del Valle',
  },
  {
    sku: 'LAC-001',
    name: 'Leche Entera 1L',
    category: 'Lácteos',
    price: 2100,
    currentStock: 200,
    minStock: 60,
    supplier: 'Lácteos del Valle',
  },
  {
    sku: 'LAC-002',
    name: 'Yogur Natural 500g',
    category: 'Lácteos',
    price: 2800,
    currentStock: 15,
    minStock: 25,
    supplier: 'Lácteos del Valle',
  },
  {
    sku: 'SNA-001',
    name: 'Papas Fritas 200g',
    category: 'Snacks',
    price: 2500,
    currentStock: 80,
    minStock: 30,
    supplier: 'SnacksCorp',
  },
  {
    sku: 'LIM-001',
    name: 'Detergente 1L',
    category: 'Limpieza',
    price: 4500,
    currentStock: 45,
    minStock: 20,
    supplier: 'Químicos del Sur',
  },
];

async function main() {
  console.log('Seeding database...');

  await prisma.stockMovement.deleteMany();
  await prisma.purchaseOrder.deleteMany();
  await prisma.alert.deleteMany();
  await prisma.product.deleteMany();

  for (const product of PRODUCTS) {
    const created = await prisma.product.create({ data: product });

    if (created.currentStock <= created.minStock) {
      await prisma.alert.create({
        data: {
          productId: created.id,
          type: 'STOCK_BAJO',
          status: 'ACTIVA',
        },
      });
    }
  }

  console.log(`Seeded ${PRODUCTS.length} products`);
  console.log(`Categories available: ${CATEGORIES.join(', ')}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
