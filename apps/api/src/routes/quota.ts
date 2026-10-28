import { FastifyPluginAsync } from 'fastify';
import { getQuotaStatus } from '../services/quota.service';

export const quotaRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/quota', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const sessionId = request.sessionId!;
    const status = await getQuotaStatus(sessionId);
    return reply.status(200).send(status);
  });
};
