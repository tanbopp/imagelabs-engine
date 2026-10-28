import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';

export const csrfGuardPlugin: FastifyPluginAsync = fp(async (fastify) => {
  fastify.addHook('onRequest', async (request, reply) => {
    // Only enforce CSRF verification on state-changing methods
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
      const origin = request.headers.origin;
      const secFetchSite = request.headers['sec-fetch-site'];

      // Allow same-origin or explicit trusted frontends
      if (secFetchSite && ['cross-site'].includes(secFetchSite as string)) {
        // Disallow cross-site form POSTs unless authorized
        if (!origin) {
          return reply.status(403).send({
            error: {
              code: 'UNAUTHORIZED',
              message: 'Cross-site request blocked by CSRF guard.',
            },
          });
        }
      }
    }
  });
});
