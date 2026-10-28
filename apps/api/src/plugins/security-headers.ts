import fp from 'fastify-plugin';
import helmet from '@fastify/helmet';
import { FastifyPluginAsync } from 'fastify';
import { env } from '../config/env';

export const securityHeadersPlugin: FastifyPluginAsync = fp(async (fastify) => {
  await fastify.register(helmet, {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: [
          "'self'",
          'https://apis.google.com',
          'https://accounts.google.com',
          'https://www.dropbox.com',
          "'unsafe-inline'", // for dynamic UI loaders
        ],
        styleSrc: ["'self'", "'unsafe-inline'"],
        imgSrc: [
          "'self'",
          'data:',
          'blob:',
          'https:',
          env.S3_ENDPOINT || 'http://localhost:9000',
        ],
        connectSrc: [
          "'self'",
          'https:',
          env.S3_ENDPOINT || 'http://localhost:9000',
        ],
        frameSrc: [
          'https://accounts.google.com',
          'https://www.dropbox.com',
        ],
        objectSrc: ["'none'"],
        upgradeInsecureRequests: env.NODE_ENV === 'production' ? [] : null,
      },
    },
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    hsts: {
      maxAge: 31536000,
      includeSubDomains: true,
      preload: true,
    },
    frameguard: {
      action: 'deny',
    },
    noSniff: true,
  });
});
