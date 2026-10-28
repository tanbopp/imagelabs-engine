import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import { getRedisClient } from '../lib/redis';

const rateLimitPluginCallback: FastifyPluginAsync = async (fastify) => {
  const redis = getRedisClient();

  fastify.addHook('onRequest', async (request: FastifyRequest, reply: FastifyReply) => {
    // Exclude health check and metrics from aggressive rate limiting
    if (request.url.startsWith('/api/health') || request.url.startsWith('/metrics')) {
      return;
    }

    const ip = request.ip || '127.0.0.1';
    const endpoint = (request as unknown as { routeOptions?: { url?: string }; routerPath?: string }).routeOptions?.url || request.url.split('?')[0];
    const key = `ratelimit:${ip}:${endpoint}`;
    const now = Date.now();
    const windowMs = 60 * 1000; // 1 minute sliding window
    const maxRequests = 30; // 30 req/min limit per PRD

    try {
      const pipeline = redis.pipeline();
      // Remove timestamps older than current window
      pipeline.zremrangebyscore(key, 0, now - windowMs);
      // Add current request timestamp
      pipeline.zadd(key, now, `${now}-${Math.random()}`);
      // Count total requests in sliding window
      pipeline.zcard(key);
      // Set key TTL to window duration
      pipeline.expire(key, 60);

      const results = await pipeline.exec();
      const count = (results?.[2]?.[1] as number) || 0;

      if (count > maxRequests) {
        return reply.status(429).send({
          error: {
            code: 'RATE_LIMITED',
            message: 'Too many requests. Please slow down and try again later.',
          },
        });
      }
    } catch (err) {
      request.log.warn({ err }, 'Redis rate limiting failed, allowing request to proceed');
    }
  });
};

export const rateLimitPlugin = fp(rateLimitPluginCallback);
