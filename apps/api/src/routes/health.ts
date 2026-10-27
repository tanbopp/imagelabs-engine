import { FastifyPluginAsync } from 'fastify';
import { getRedisClient } from '../lib/redis';

export const healthRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/health', async (_request, reply) => {
    const redis = getRedisClient();
    let redisStatus = 'disconnected';

    try {
      const pingRes = await redis.ping();
      if (pingRes === 'PONG') {
        redisStatus = 'connected';
      }
    } catch {
      redisStatus = 'error';
    }

    const isHealthy = redisStatus === 'connected';

    return reply.status(isHealthy ? 200 : 503).send({
      status: isHealthy ? 'ok' : 'degraded',
      redis: redisStatus,
      timestamp: new Date().toISOString(),
    });
  });
};
