import { Worker, Job as BullJob } from 'bullmq';
import { Redis } from 'ioredis';
import dotenv from 'dotenv';
import { JobInput, JobOutput, CompressOptions, ResizeOptions } from '@imagelabs/shared';
import { downloadS3Buffer, uploadS3Buffer } from './lib/s3';
import { processCompress } from './processors/compress';
import { processResize } from './processors/resize';

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

export const fastWorker = new Worker<JobPayload>(
  'fast-jobs',
  async (bullJob: BullJob<JobPayload>) => {
    const { jobId, tool, inputs, options } = bullJob.data;
    const redisKey = `job:${jobId}`;

    console.info(`[FastWorker] Processing job ${jobId} with tool: ${tool}`);

    try {
      // 1. Mark status as processing in Redis
      await redis.hset(redisKey, {
        status: 'processing',
        progress: '10',
        updatedAt: new Date().toISOString(),
      });

      const outputs: JobOutput[] = [];

      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i];

        // 2. Download from S3
        const inputBuffer = await downloadS3Buffer(input.s3Key);

        let outputBuffer: Buffer;
        let outputMimeType = input.mimeType;

        // 3. Dispatch to tool processor
        if (tool === 'compress') {
          const res = await processCompress(inputBuffer, options as CompressOptions);
          outputBuffer = res.buffer;
          outputMimeType = `image/${res.format === 'jpg' ? 'jpeg' : res.format}`;
        } else if (tool === 'resize') {
          const res = await processResize(inputBuffer, options as unknown as ResizeOptions);
          outputBuffer = res.buffer;
          outputMimeType = `image/${res.format === 'jpg' ? 'jpeg' : res.format}`;
        } else {
          // Pass-through default
          outputBuffer = inputBuffer;
        }

        // 4. Upload result to S3 outputs/ directory
        const outputFilename = `${tool}-${input.filename}`;
        const outputS3Key = `outputs/${jobId}/${outputFilename}`;

        await uploadS3Buffer(outputS3Key, outputBuffer, outputMimeType);

        outputs.push({
          s3Key: outputS3Key,
          filename: outputFilename,
          mimeType: outputMimeType,
          sizeBytes: outputBuffer.length,
        });

        // Report granular progress
        const currentProgress = Math.round(10 + ((i + 1) / inputs.length) * 85);
        await redis.hset(redisKey, {
          progress: currentProgress.toString(),
          updatedAt: new Date().toISOString(),
        });
      }

      // 5. Mark completed
      await redis.hset(redisKey, {
        status: 'completed',
        progress: '100',
        outputs: JSON.stringify(outputs),
        updatedAt: new Date().toISOString(),
      });

      console.info(`[FastWorker] Successfully completed job ${jobId}`);
      return { outputsCount: outputs.length };
    } catch (err) {
      console.error(`[FastWorker] Failed processing job ${jobId}`, err);

      await redis.hset(redisKey, {
        status: 'failed',
        error: JSON.stringify({
          code: 'INVALID_INPUT',
          message: (err as Error).message || 'Image processing failed in fast worker',
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
    concurrency: 5,
  },
);

fastWorker.on('completed', (job) => {
  console.info(`[FastWorker] BullMQ job ${job.id} completed.`);
});

fastWorker.on('failed', (job, err) => {
  console.error(`[FastWorker] BullMQ job ${job?.id} failed with error:`, err);
});
