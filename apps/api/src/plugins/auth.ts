import { FastifyPluginAsync, FastifyReply, FastifyRequest } from 'fastify';
import fp from 'fastify-plugin';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

export interface SessionTokenPayload {
  sessionId: string;
  iat?: number;
  exp?: number;
}

declare module 'fastify' {
  interface FastifyInstance {
    authenticate: (request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  }
  interface FastifyRequest {
    sessionId?: string;
  }
}

const authPluginCallback: FastifyPluginAsync = async (fastify) => {
  fastify.decorate('authenticate', async (request: FastifyRequest, reply: FastifyReply) => {
    const token = request.cookies.imagelabs_session;

    if (!token) {
      return reply.status(401).send({
        error: {
          code: 'NO_SESSION',
          message: 'Missing or expired session token.',
        },
      });
    }

    try {
      const decoded = jwt.verify(token, env.JWT_SECRET) as SessionTokenPayload;
      request.sessionId = decoded.sessionId;
    } catch {
      return reply.status(401).send({
        error: {
          code: 'NO_SESSION',
          message: 'Invalid or forged session token.',
        },
      });
    }
  });
};

export const authPlugin = fp(authPluginCallback);
