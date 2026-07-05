import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
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
  const isProduction = process.env.NODE_ENV === 'production';

  const app = Fastify({
    logger: options.logger ?? process.env.NODE_ENV !== 'test',
    bodyLimit: 1048576,
  });

  await app.register(helmet, {
    contentSecurityPolicy: isProduction ? undefined : false,
  });

  await app.register(rateLimit, {
    max: isProduction ? 100 : 1000,
    timeWindow: '1 minute',
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
