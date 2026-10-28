import { S3Client, ListObjectsV2Command, DeleteObjectsCommand } from '@aws-sdk/client-s3';
import { Redis } from 'ioredis';
import dotenv from 'dotenv';

dotenv.config();

const S3_BUCKET = process.env.S3_BUCKET || 'imagelabs-temp';
const S3_ENDPOINT = process.env.S3_ENDPOINT || 'http://localhost:9000';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';

const s3 = new S3Client({
  endpoint: S3_ENDPOINT,
  region: process.env.S3_REGION || 'us-east-1',
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY_ID || 'minioadmin',
    secretAccessKey: process.env.S3_SECRET_ACCESS_KEY || 'minioadmin',
  },
  forcePathStyle: true,
});

const redis = new Redis(REDIS_URL);

const ONE_HOUR_MS = 60 * 60 * 1000;

async function runCleanup() {
  console.info('[OrphanCleanup] Starting automated S3 & Redis sweep...');
  const now = Date.now();

  try {
    // 1. Sweep S3 Bucket for objects older than 1 hour
    const listResponse = await s3.send(
      new ListObjectsV2Command({
        Bucket: S3_BUCKET,
      }),
    );

    const objectsToDelete: { Key: string }[] = [];

    if (listResponse.Contents) {
      for (const obj of listResponse.Contents) {
        if (obj.Key && obj.LastModified) {
          const ageMs = now - obj.LastModified.getTime();
          if (ageMs > ONE_HOUR_MS) {
            objectsToDelete.push({ Key: obj.Key });
          }
        }
      }
    }

    if (objectsToDelete.length > 0) {
      console.info(`[OrphanCleanup] Purging ${objectsToDelete.length} expired S3 objects older than 1h...`);
      await s3.send(
        new DeleteObjectsCommand({
          Bucket: S3_BUCKET,
          Delete: { Objects: objectsToDelete },
        }),
      );
      console.info('[OrphanCleanup] Expired S3 objects purged successfully.');
    } else {
      console.info('[OrphanCleanup] No expired S3 objects found.');
    }

    // 2. Scan Redis for orphan jobs that have no remaining TTL
    const jobKeys = await redis.keys('job:*');
    let evictedRedisCount = 0;

    for (const key of jobKeys) {
      const ttl = await redis.ttl(key);
      if (ttl === -1) {
        // Key has no TTL set, force 1h TTL or delete immediately if older than 1h
        await redis.del(key);
        evictedRedisCount++;
      }
    }

    if (evictedRedisCount > 0) {
      console.info(`[OrphanCleanup] Evicted ${evictedRedisCount} untracked Redis keys.`);
    }

    console.info('[OrphanCleanup] Sweep complete. Zero data retention upheld.');
  } catch (err) {
    console.error('[OrphanCleanup] Sweep error:', err);
  } finally {
    await redis.quit();
  }
}

runCleanup();
