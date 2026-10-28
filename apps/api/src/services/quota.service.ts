import { getRedisClient } from '../lib/redis';

export const MAX_JOBS_PER_DAY = 20;
export const MAX_BYTES_PER_DAY = 524288000; // 500 MB

function getDateKey(): string {
  return new Date().toISOString().slice(0, 10); // YYYY-MM-DD
}

function getNextMidnightUtc(): Date {
  const now = new Date();
  const midnight = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1, 0, 0, 0, 0));
  return midnight;
}

function getTtlSeconds(): number {
  const now = Date.now();
  const resetMs = getNextMidnightUtc().getTime();
  const diffSeconds = Math.ceil((resetMs - now) / 1000);
  return Math.max(diffSeconds + 3600, 3600); // include 1h grace window
}

export interface QuotaStatus {
  session: string;
  quota: {
    jobsUsedToday: number;
    jobsLimitToday: number;
    bytesUsedToday: number;
    bytesLimitToday: number;
  };
  resetsAt: string;
}

export async function getQuotaStatus(sessionId: string): Promise<QuotaStatus> {
  const redis = getRedisClient();
  const dateKey = getDateKey();

  const jobsKey = `quota:jobs:${sessionId}:${dateKey}`;
  const bytesKey = `quota:bytes:${sessionId}:${dateKey}`;

  const [jobsVal, bytesVal] = await redis.mget(jobsKey, bytesKey);

  return {
    session: sessionId,
    quota: {
      jobsUsedToday: Number(jobsVal || 0),
      jobsLimitToday: MAX_JOBS_PER_DAY,
      bytesUsedToday: Number(bytesVal || 0),
      bytesLimitToday: MAX_BYTES_PER_DAY,
    },
    resetsAt: getNextMidnightUtc().toISOString(),
  };
}

export async function checkAndIncrementBytes(
  sessionId: string,
  additionalBytes: number,
): Promise<{ allowed: boolean; currentBytes: number }> {
  const redis = getRedisClient();
  const dateKey = getDateKey();
  const bytesKey = `quota:bytes:${sessionId}:${dateKey}`;
  const ttl = getTtlSeconds();

  const currentVal = await redis.get(bytesKey);
  const currentBytes = Number(currentVal || 0);

  if (currentBytes + additionalBytes > MAX_BYTES_PER_DAY) {
    return { allowed: false, currentBytes };
  }

  // Atomically increment and set TTL
  const multi = redis.multi();
  multi.incrby(bytesKey, additionalBytes);
  multi.expire(bytesKey, ttl);
  await multi.exec();

  return { allowed: true, currentBytes: currentBytes + additionalBytes };
}

export async function checkAndIncrementJobs(
  sessionId: string,
): Promise<{ allowed: boolean; currentJobs: number }> {
  const redis = getRedisClient();
  const dateKey = getDateKey();
  const jobsKey = `quota:jobs:${sessionId}:${dateKey}`;
  const ttl = getTtlSeconds();

  const currentVal = await redis.get(jobsKey);
  const currentJobs = Number(currentVal || 0);

  if (currentJobs >= MAX_JOBS_PER_DAY) {
    return { allowed: false, currentJobs };
  }

  // Atomically increment and set TTL
  const multi = redis.multi();
  multi.incr(jobsKey);
  multi.expire(jobsKey, ttl);
  await multi.exec();

  return { allowed: true, currentJobs: currentJobs + 1 };
}
