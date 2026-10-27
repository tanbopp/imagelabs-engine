import { randomUUID } from 'node:crypto';
import { FastifyPluginAsync } from 'fastify';
import { GetObjectCommand, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { JobCreateRequestSchema, TOOLS, ToolMeta } from '@imagelabs/shared';
import { createJobRecord, getJobRecord, deleteJobRecord } from '../services/job.service';
import { fastQueue, aiQueue, puppeteerQueue } from '../lib/queue';
import { getS3Client } from '../lib/s3';
import { env } from '../config/env';

export const jobRoutes: FastifyPluginAsync = async (fastify) => {
  // Dispatch a new processing job
  fastify.post('/jobs', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const parsed = JobCreateRequestSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_INPUT',
          message: 'Invalid job request payload.',
          details: parsed.error.flatten(),
        },
      });
    }

    const { tool, inputs, options } = parsed.data;
    const sessionId = request.sessionId!;
    const jobId = randomUUID();

    // Verify tool metadata
    const toolMeta = TOOLS.find((t: ToolMeta) => t.id === tool);
    if (!toolMeta) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_INPUT',
          message: `Unknown or unconfigured tool: ${tool}`,
        },
      });
    }

    // Save job state to Redis hash (TTL 3600s)
    await createJobRecord(jobId, tool, inputs, sessionId);

    // Enqueue task into BullMQ based on tool category/worker type
    const jobPayload = {
      jobId,
      tool,
      inputs,
      options,
      sessionId,
    };

    if (toolMeta.requiresAI) {
      await aiQueue.add(tool, jobPayload, { jobId });
    } else if (tool === 'html-to-image') {
      await puppeteerQueue.add(tool, jobPayload, { jobId });
    } else {
      await fastQueue.add(tool, jobPayload, { jobId });
    }

    return reply.status(200).send({ jobId });
  });

  // Get real-time job status and progress
  fastify.get('/jobs/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const job = await getJobRecord(id);

    if (!job || job.session !== request.sessionId) {
      return reply.status(404).send({
        error: {
          code: 'JOB_NOT_FOUND',
          message: 'Job not found or has expired from temporary storage.',
        },
      });
    }

    return reply.status(200).send(job);
  });

  // Get presigned download URLs for completed outputs
  fastify.get('/jobs/:id/download', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const job = await getJobRecord(id);

    if (!job || job.session !== request.sessionId) {
      return reply.status(404).send({
        error: {
          code: 'JOB_NOT_FOUND',
          message: 'Job not found or has expired.',
        },
      });
    }

    if (job.status !== 'completed' || job.outputs.length === 0) {
      return reply.status(400).send({
        error: {
          code: 'INVALID_INPUT',
          message: 'Job is not completed or has no outputs available for download.',
        },
      });
    }

    const s3 = getS3Client();
    const expiresInSeconds = 900; // 15 mins
    const expiresAt = new Date(Date.now() + expiresInSeconds * 1000).toISOString();

    const files = await Promise.all(
      job.outputs.map(async (output) => {
        const command = new GetObjectCommand({
          Bucket: env.S3_BUCKET,
          Key: output.s3Key,
        });
        const url = await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
        return {
          filename: output.filename,
          url,
          expiresAt,
        };
      }),
    );

    return reply.status(200).send({ files });
  });

  // Cancel or abort job and purge S3 files immediately
  fastify.delete('/jobs/:id', { preHandler: [fastify.authenticate] }, async (request, reply) => {
    const { id } = request.params as { id: string };
    const job = await getJobRecord(id);

    if (!job || job.session !== request.sessionId) {
      return reply.status(404).send({
        error: {
          code: 'JOB_NOT_FOUND',
          message: 'Job not found or has expired.',
        },
      });
    }

    // Collect all input and output keys to delete from S3
    const allKeys = [
      ...job.inputs.map((i) => ({ Key: i.s3Key })),
      ...job.outputs.map((o) => ({ Key: o.s3Key })),
    ];

    if (allKeys.length > 0) {
      try {
        const s3 = getS3Client();
        await s3.send(
          new DeleteObjectsCommand({
            Bucket: env.S3_BUCKET,
            Delete: { Objects: allKeys },
          }),
        );
      } catch (err) {
        request.log.warn({ err }, 'Error deleting S3 objects during job abort');
      }
    }

    await deleteJobRecord(id);

    return reply.status(200).send({ success: true, message: 'Job and assets purged successfully' });
  });
};
