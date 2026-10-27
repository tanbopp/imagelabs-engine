import { randomUUID } from 'node:crypto';
import { FastifyPluginAsync } from 'fastify';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { getRedisClient } from '../lib/redis';
import { SessionTokenPayload } from '../plugins/auth';

export const sessionRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/session', async (request, reply) => {
    const existingToken = request.cookies.imagelabs_session;
    let sessionId: string | null = null;
    let isExisting = false;

    if (existingToken) {
      try {
        const decoded = jwt.verify(existingToken, env.JWT_SECRET) as SessionTokenPayload;
        sessionId = decoded.sessionId;
        isExisting = true;
      } catch {
        sessionId = null;
      }
    }

    if (!sessionId) {
      sessionId = `sess_${randomUUID()}`;
    }

    const token = jwt.sign({ sessionId }, env.JWT_SECRET, { expiresIn: '7d' });

    reply.setCookie('imagelabs_session', token, {
      path: '/',
      httpOnly: true,
      secure: env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days in seconds
    });

    const now = new Date().toISOString();
    const redis = getRedisClient();

    // Store session creation metadata in Redis hash with 7 days TTL
    try {
      if (!isExisting) {
        await redis
          .pipeline()
          .hset(`session:${sessionId}`, 'createdAt', now)
          .expire(`session:${sessionId}`, 7 * 24 * 60 * 60)
          .exec();
      }
    } catch (err) {
      request.log.warn({ err }, 'Failed to record session birth in Redis');
    }

    return reply.status(200).send({
      sessionId,
      createdAt: now,
    });
  });
};
