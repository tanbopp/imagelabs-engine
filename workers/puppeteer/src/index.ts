import { Worker, Job as BullJob } from 'bullmq';
import { Redis } from 'ioredis';
import dotenv from 'dotenv';
import { JobOutput, HtmlToImageOptions } from '@imagelabs/shared';
import { uploadS3Buffer } from './lib/s3';
import { processHtmlToImage } from './processors/html-to-image';
import { closeBrowser } from './lib/browser-pool';

dotenv.config({ path: '../../.env' });
dotenv.config();

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const redis = new Redis(REDIS_URL, { maxRetriesPerRequest: null });

interface JobPayload {
  jobId: string;
  tool: string;
  inputs: unknown[];
  options: Record<string, unknown>;
  sessionId: string;
}

export const puppeteerWorker = new Worker<JobPayload>(
  'puppeteer-jobs',
  async (bullJob: BullJob<JobPayload>) => {
    const { jobId, tool, options } = bullJob.data;
    const redisKey = `job:${jobId}`;

    console.info(`[PuppeteerWorker] Processing job ${jobId} with tool: ${tool}`);

    try {
      await redis.hset(redisKey, {
        status: 'processing',
        progress: '20',
        updatedAt: new Date().toISOString(),
      });

      if (tool !== 'html-to-image') {
        throw new Error(`Unsupported tool in puppeteer worker: ${tool}`);
      }

      const res = await processHtmlToImage(options as unknown as HtmlToImageOptions);

      await redis.hset(redisKey, {
        progress: '75',
        updatedAt: new Date().toISOString(),
      });

      const ext = res.format === 'jpeg' ? 'jpg' : 'png';
      const outputFilename = `render-${jobId.slice(0, 8)}.${ext}`;
      const outputS3Key = `outputs/${jobId}/${outputFilename}`;
      const mimeType = `image/${res.format}`;

      await uploadS3Buffer(outputS3Key, res.buffer, mimeType);

      const outputs: JobOutput[] = [
        {
          s3Key: outputS3Key,
          filename: outputFilename,
          mimeType,
          sizeBytes: res.buffer.length,
        },
      ];

      await redis.hset(redisKey, {
        status: 'completed',
        progress: '100',
        outputs: JSON.stringify(outputs),
        updatedAt: new Date().toISOString(),
      });

      console.info(`[PuppeteerWorker] Successfully rendered and uploaded job ${jobId}`);
      return { outputsCount: outputs.length };
    } catch (err) {
      console.error(`[PuppeteerWorker] Failed processing job ${jobId}`, err);

      await redis.hset(redisKey, {
        status: 'failed',
        error: JSON.stringify({
          code: 'RENDER_ERROR',
          message: (err as Error).message || 'Puppeteer rendering failed',
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

puppeteerWorker.on('completed', (job) => {
  console.info(`[PuppeteerWorker] BullMQ job ${job.id} completed.`);
});

puppeteerWorker.on('failed', (job, err) => {
  console.error(`[PuppeteerWorker] BullMQ job ${job?.id} failed with error:`, err);
});

process.on('SIGTERM', async () => {
  await closeBrowser();
});
