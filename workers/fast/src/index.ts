import { Worker, Job as BullJob } from 'bullmq';
import { Redis } from 'ioredis';
import dotenv from 'dotenv';
import {
  JobInput,
  JobOutput,
  CompressOptions,
  ResizeOptions,
  ConvertImageOptions,
  ConvertFromJpgOptions,
  CropOptions,
  RotateOptions,
  WatermarkOptions,
} from '@imagelabs/shared';
import { downloadS3Buffer, uploadS3Buffer } from './lib/s3';
import { processCompress } from './processors/compress';
import { processResize } from './processors/resize';
import { processConvertToJpg } from './processors/convert-to-jpg';
import { processConvertImage } from './processors/convert-image';
import { processConvertFromJpg } from './processors/convert-from-jpg';
import { processCrop } from './processors/crop';
import { processRotate } from './processors/rotate';
import { processWatermark } from './processors/watermark';

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
      await redis.hset(redisKey, {
        status: 'processing',
        progress: '10',
        updatedAt: new Date().toISOString(),
      });

      const outputs: JobOutput[] = [];

      // Special Case: convert-from-jpg with targetFormat === 'gif' requires all input buffers together
      if (tool === 'convert-from-jpg' && (options as ConvertFromJpgOptions)?.targetFormat === 'gif') {
        const inputBuffers = await Promise.all(inputs.map((inp) => downloadS3Buffer(inp.s3Key)));
        const resList = await processConvertFromJpg(inputBuffers, options as ConvertFromJpgOptions);

        for (const res of resList) {
          const outputFilename = `animated-gif-${jobId.slice(0, 8)}.${res.filenameExt}`;
          const outputS3Key = `outputs/${jobId}/${outputFilename}`;
          const mimeType = 'image/gif';

          await uploadS3Buffer(outputS3Key, res.buffer, mimeType);

          outputs.push({
            s3Key: outputS3Key,
            filename: outputFilename,
            mimeType,
            sizeBytes: res.buffer.length,
          });
        }
      } else {
        // Standard iterative processing for single and batch files
        for (let i = 0; i < inputs.length; i++) {
          const input = inputs[i];
          const inputBuffer = await downloadS3Buffer(input.s3Key);

          let outputBuffer: Buffer;
          let outputFormat = 'jpeg';
          let outputMimeType = input.mimeType;

          if (tool === 'compress') {
            const res = await processCompress(inputBuffer, options as CompressOptions);
            outputBuffer = res.buffer;
            outputFormat = res.format === 'jpg' ? 'jpeg' : res.format;
            outputMimeType = `image/${outputFormat}`;
          } else if (tool === 'resize') {
            const res = await processResize(inputBuffer, options as unknown as ResizeOptions);
            outputBuffer = res.buffer;
            outputFormat = res.format === 'jpg' ? 'jpeg' : res.format;
            outputMimeType = `image/${outputFormat}`;
          } else if (tool === 'convert-to-jpg') {
            const res = await processConvertToJpg(inputBuffer);
            outputBuffer = res.buffer;
            outputFormat = 'jpeg';
            outputMimeType = 'image/jpeg';
          } else if (tool === 'convert-image') {
            const res = await processConvertImage(inputBuffer, options as ConvertImageOptions);
            outputBuffer = res.buffer;
            outputFormat = res.format;
            outputMimeType = `image/${res.format === 'jpg' ? 'jpeg' : res.format}`;
          } else if (tool === 'convert-from-jpg') {
            const resList = await processConvertFromJpg([inputBuffer], options as ConvertFromJpgOptions);
            outputBuffer = resList[0].buffer;
            outputFormat = resList[0].filenameExt;
            outputMimeType = `image/${resList[0].filenameExt}`;
          } else if (tool === 'crop') {
            const res = await processCrop(inputBuffer, options as unknown as CropOptions);
            outputBuffer = res.buffer;
            outputFormat = res.format === 'jpg' ? 'jpeg' : res.format;
            outputMimeType = `image/${outputFormat}`;
          } else if (tool === 'rotate') {
            const res = await processRotate(inputBuffer, options as unknown as RotateOptions);
            outputBuffer = res.buffer;
            outputFormat = res.format === 'jpg' ? 'jpeg' : res.format;
            outputMimeType = `image/${outputFormat}`;
          } else if (tool === 'watermark') {
            const res = await processWatermark(inputBuffer, options as unknown as WatermarkOptions);
            outputBuffer = res.buffer;
            outputFormat = res.format === 'jpg' ? 'jpeg' : res.format;
            outputMimeType = `image/${outputFormat}`;
          } else {
            outputBuffer = inputBuffer;
          }

          const baseNameWithoutExt = input.filename.replace(/\.[^/.]+$/, '');
          const ext = outputFormat === 'jpeg' ? 'jpg' : outputFormat;
          const outputFilename = `${tool}-${baseNameWithoutExt}.${ext}`;
          const outputS3Key = `outputs/${jobId}/${outputFilename}`;

          await uploadS3Buffer(outputS3Key, outputBuffer, outputMimeType);

          outputs.push({
            s3Key: outputS3Key,
            filename: outputFilename,
            mimeType: outputMimeType,
            sizeBytes: outputBuffer.length,
          });

          const currentProgress = Math.round(10 + ((i + 1) / inputs.length) * 85);
          await redis.hset(redisKey, {
            progress: currentProgress.toString(),
            updatedAt: new Date().toISOString(),
          });
        }
      }

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
