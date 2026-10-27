import { Queue } from 'bullmq';
import { env } from '../config/env';

export const fastQueue = new Queue('fast-jobs', {
  connection: {
    url: env.REDIS_URL,
  },
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: 'exponential',
      delay: 1000,
    },
    removeOnComplete: true,
    removeOnFail: true,
  },
});

export const aiQueue = new Queue('ai-jobs', {
  connection: {
    url: env.REDIS_URL,
  },
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: true,
    removeOnFail: true,
  },
});

export const puppeteerQueue = new Queue('puppeteer-jobs', {
  connection: {
    url: env.REDIS_URL,
  },
  defaultJobOptions: {
    attempts: 2,
    removeOnComplete: true,
    removeOnFail: true,
  },
});
