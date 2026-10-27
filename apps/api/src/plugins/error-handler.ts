import { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { ErrorCode, ErrorMessages } from '@imagelabs/shared';

export function errorHandler(error: FastifyError | Error, request: FastifyRequest, reply: FastifyReply) {
  request.log.error(error);

  if (error instanceof ZodError) {
    return reply.status(400).send({
      error: {
        code: 'INVALID_INPUT',
        message: 'Request validation failed',
        details: error.flatten(),
      },
    });
  }

  // Handle custom Fastify validation errors
  if ('validation' in error && error.validation) {
    return reply.status(400).send({
      error: {
        code: 'INVALID_INPUT',
        message: error.message,
        details: error.validation,
      },
    });
  }

  // Handle mapped application error codes
  const customCode = (error as unknown as { code?: string }).code;
  if (customCode && customCode in ErrorCode) {
    const statusCode = ErrorCode[customCode as ErrorCode];
    const message = ErrorMessages[customCode as ErrorCode] || error.message;
    return reply.status(statusCode).send({
      error: {
        code: customCode,
        message,
      },
    });
  }

  // Internal Server Error fallback
  return reply.status(500).send({
    error: {
      code: 'INTERNAL',
      message: process.env.NODE_ENV === 'production' ? 'An internal server error occurred.' : error.message,
    },
  });
}
