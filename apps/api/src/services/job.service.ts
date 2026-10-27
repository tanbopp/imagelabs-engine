import { getRedisClient } from '../lib/redis';
import { Job, JobInput, JobOutput, JobStatus, ToolId, ErrorCode } from '@imagelabs/shared';

const JOB_TTL_SECONDS = 3600; // 1 hour

export async function createJobRecord(
  id: string,
  tool: ToolId,
  inputs: JobInput[],
  session: string,
): Promise<Job> {
  const redis = getRedisClient();
  const now = new Date().toISOString();

  const job: Job = {
    id,
    status: 'queued',
    tool,
    inputs,
    outputs: [],
    progress: 0,
    error: null,
    session,
    createdAt: now,
    updatedAt: now,
  };

  const key = `job:${id}`;
  await redis
    .pipeline()
    .hset(key, {
      id: job.id,
      status: job.status,
      tool: job.tool,
      inputs: JSON.stringify(job.inputs),
      outputs: JSON.stringify(job.outputs),
      progress: job.progress.toString(),
      error: '',
      session: job.session,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
    })
    .expire(key, JOB_TTL_SECONDS)
    .exec();

  return job;
}

export async function getJobRecord(id: string): Promise<Job | null> {
  const redis = getRedisClient();
  const key = `job:${id}`;
  const data = await redis.hgetall(key);

  if (!data || Object.keys(data).length === 0) {
    return null;
  }

  let error: { code: ErrorCode; message: string } | null = null;
  if (data.error) {
    try {
      error = JSON.parse(data.error);
    } catch {
      error = null;
    }
  }

  return {
    id: data.id,
    status: data.status as JobStatus,
    tool: data.tool as ToolId,
    inputs: JSON.parse(data.inputs || '[]'),
    outputs: JSON.parse(data.outputs || '[]'),
    progress: Number(data.progress || 0),
    error,
    session: data.session,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export async function deleteJobRecord(id: string): Promise<void> {
  const redis = getRedisClient();
  await redis.del(`job:${id}`);
}
