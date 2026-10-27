import { FastifyPluginAsync } from 'fastify';
import { UploadRequestSchema } from '@imagelabs/shared';
import { createPresignedUploadUrl } from '../services/storage.service';

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/avif',
  'image/gif',
  'image/tiff',
  'image/heic',
]);

const MAX_FILE_SIZE_BYTES = 52428800; // 50 MB

export const uploadRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/upload', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    // Validate request schema
    const parsed = UploadRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid upload request payload.',
          details: parsed.error.flatten(),
        },
      });
    }

    const { filename, mimeType, sizeBytes } = parsed.data;

    // Validate MIME type
    if (!ALLOWED_MIME_TYPES.has(mimeType)) {
      return reply.status(415).send({
        error: {
          code: 'UNSUPPORTED_TYPE',
          message: `The file format '${mimeType}' is not supported. Please upload a standard image file.`,
        },
      });
    }

    // Validate maximum file size
    if (sizeBytes > MAX_FILE_SIZE_BYTES) {
      return reply.status(413).send({
        error: {
          code: 'FILE_TOO_LARGE',
          message: 'The file exceeds the maximum allowed size of 50 MB.',
        },
      });
    }

    const presignedData = await createPresignedUploadUrl(filename, mimeType, sizeBytes);

    return reply.status(200).send(presignedData);
  });
};
