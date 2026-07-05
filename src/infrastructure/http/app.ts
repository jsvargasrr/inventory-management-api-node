import Fastify from 'fastify';
import helmet from '@fastify/helmet';
import rateLimit from '@fastify/rate-limit';
import type { PrismaClient } from '@prisma/client';
import { buildContainer, type AppContainer } from '../../composition-root.js';
import { errorHandler } from './middleware/error-handler.js';
import {
  registerAlertRoutes,
  registerProductRoutes,
  registerPurchaseOrderRoutes,
} from './routes/index.js';
import { registerRouteDocs } from './routes/docs-schemas.js';
import { registerSwagger } from './swagger.js';

export interface BuildAppOptions {
  prisma?: PrismaClient;
  logger?: boolean;
  enableDocs?: boolean;
}

export async function buildApp(options: BuildAppOptions = {}) {
  const isProduction = process.env.NODE_ENV === 'production';
  const isTest = process.env.NODE_ENV === 'test';
  const enableDocs = options.enableDocs ?? !isTest;

  const app = Fastify({
    logger: options.logger ?? !isTest,
    bodyLimit: 1048576,
  });

  await app.register(helmet, {
    contentSecurityPolicy: isProduction ? undefined : false,
  });

  await app.register(rateLimit, {
    max: isProduction ? 100 : 1000,
    timeWindow: '1 minute',
  });

  if (enableDocs) {
    await registerSwagger(app);
  }

  const container: AppContainer = buildContainer(options.prisma);

  app.setErrorHandler(errorHandler);

  if (enableDocs) {
    registerRouteDocs(app);
  } else {
    app.get('/health', async () => ({
      status: 'ok',
      timestamp: new Date().toISOString(),
    }));
  }

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
