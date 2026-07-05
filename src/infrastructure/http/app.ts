import Fastify from 'fastify';
import type { PrismaClient } from '@prisma/client';
import { buildContainer, type AppContainer } from '../../composition-root.js';
import { errorHandler } from './middleware/error-handler.js';
import {
  registerAlertRoutes,
  registerHealthRoutes,
  registerProductRoutes,
  registerPurchaseOrderRoutes,
} from './routes/index.js';

export interface BuildAppOptions {
  prisma?: PrismaClient;
  logger?: boolean;
}

export async function buildApp(options: BuildAppOptions = {}) {
  const app = Fastify({
    logger: options.logger ?? process.env.NODE_ENV !== 'test',
  });

  const container: AppContainer = buildContainer(options.prisma);

  app.setErrorHandler(errorHandler);

  await registerHealthRoutes(app);
  await registerProductRoutes(app, container);
  await registerAlertRoutes(app, container);
  await registerPurchaseOrderRoutes(app, container);

  app.addHook('onClose', async () => {
    if (options.prisma) {
      await options.prisma.$disconnect();
    }
  });

  return app;
}
