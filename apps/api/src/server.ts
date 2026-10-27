import fastify, { FastifyInstance } from 'fastify';
import cookie from '@fastify/cookie';
import cors from '@fastify/cors';
import helmet from '@fastify/helmet';
import { env } from './config/env';
import { authPlugin } from './plugins/auth';
import { rateLimitPlugin } from './plugins/rate-limit';
import { errorHandler } from './plugins/error-handler';
import { healthRoutes } from './routes/health';
import { sessionRoutes } from './routes/session';
import { uploadRoutes } from './routes/upload';
import { jobRoutes } from './routes/jobs';

export function buildServer(): FastifyInstance {
  const app = fastify({
    logger: env.NODE_ENV !== 'test',
  });

  // Global Error Handler
  app.setErrorHandler(errorHandler);

  // Security & Utility Plugins
  app.register(helmet, {
    contentSecurityPolicy: env.NODE_ENV === 'production',
  });

  app.register(cors, {
    origin: env.CORS_ORIGIN,
    credentials: true,
  });

  app.register(cookie);

  // Custom Authentication and Rate Limiting Plugins
  app.register(authPlugin);
  app.register(rateLimitPlugin);

  // Register API Routes
  app.register(healthRoutes, { prefix: '/api' });
  app.register(sessionRoutes, { prefix: '/api' });
  app.register(uploadRoutes, { prefix: '/api' });
  app.register(jobRoutes, { prefix: '/api' });

  return app;
}
