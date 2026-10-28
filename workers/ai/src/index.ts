import { Worker, Job as BullJob } from 'bullmq';
import { Redis } from 'ioredis';
import dotenv from 'dotenv';
import {
  JobInput,
  JobOutput,
  UpscaleOptions,
  RemoveBgOptions,
  BlurFaceOptions,
} from '@imagelabs/shared';
import { downloadS3Buffer, uploadS3Buffer } from './lib/s3';
import { processUpscale } from './processors/upscale';
import { processRemoveBg } from './processors/remove-bg';
import { processBlurFace } from './processors/blur-face';

dotenv.config({ path: '../../.env' });
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: null });

interface JobPayload {
  jobId: string;
  tool: string;
  inputs: JobInput[];
  options: Record<string, unknown>;
  sessionId: string;
}

export const aiWorker = new Worker<JobPayload>(
  'ai-jobs',
  async (bullJob: BullJob<JobPayload>) => {
    const { jobId, tool, inputs, options } = bullJob.data;
    const redisKey = `job:${jobId}`;

    console.info(`[AIWorker] Processing job ${jobId} with AI tool: ${tool}`);

    try {
      await redis.hset(redisKey, {
        status: 'processing',
        progress: '15',
        updatedAt: new Date().toISOString(),
      });

      const outputs: JobOutput[] = [];

      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];
        const inputBuffer = await downloadS3Buffer(input.s3Key);

        let outputBuffer: Buffer;
        let outputMimeType = 'image/png';
        let ext = 'png';

        if (tool === 'upscale') {
          const res = await processUpscale(inputBuffer, options as unknown as UpscaleOptions);
          outputBuffer = res.buffer;
          ext = res.format;
          outputMimeType = `image/${res.format}`;
        } else if (tool === 'remove-background') {
          const res = await processRemoveBg(inputBuffer, options as unknown as RemoveBgOptions);
          outputBuffer = res.buffer;
          ext = 'png';
          outputMimeType = 'image/png';
        } else if (tool === 'blur-face') {
          const res = await processBlurFace(inputBuffer, options as unknown as BlurFaceOptions);
          outputBuffer = res.buffer;
          ext = 'png';
          outputMimeType = 'image/png';
        } else {
          outputBuffer = inputBuffer;
        }

        const baseNameWithoutExt = input.filename.replace(/\.[^/.]+$/, '');
        const outputFilename = `${tool}-${baseNameWithoutExt}.${ext}`;
        const outputS3Key = `outputs/${jobId}/${outputFilename}`;

        await uploadS3Buffer(outputS3Key, outputBuffer, outputMimeType);

        outputs.push({
          s3Key: outputS3Key,
          filename: outputFilename,
          mimeType: outputMimeType,
          sizeBytes: outputBuffer.length,
        });

        const currentProgress = Math.round(15 + ((i + 1) / inputs.length) * 80);
        await redis.hset(redisKey, {
          progress: currentProgress.toString(),
          updatedAt: new Date().toISOString(),
        });
      }

      await redis.hset(redisKey, {
        status: 'completed',
        progress: '100',
        outputs: JSON.stringify(outputs),
        updatedAt: new Date().toISOString(),
      });

      console.info(`[AIWorker] Successfully completed job ${jobId}`);
      return { outputsCount: outputs.length };
    } catch (err) {
      console.error(`[AIWorker] Failed processing job ${jobId}`, err);

      await redis.hset(redisKey, {
        status: 'failed',
        error: JSON.stringify({
          code: 'PROCESSING_ERROR',
          message: (err as Error).message || 'AI job execution failed',
        }),
        updatedAt: new Date().toISOString(),
      });

      throw err;
    }
  },
  {
    connection: {
      url: REDIS_URL,
    },
    concurrency: 2,
  },
);

aiWorker.on('completed', (job) => {
  console.info(`[AIWorker] BullMQ job ${job.id} completed.`);
});

aiWorker.on('failed', (job, err) => {
  console.error(`[AIWorker] BullMQ job ${job?.id} failed with error:`, err);
});
