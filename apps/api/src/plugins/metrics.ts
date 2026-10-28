import fp from 'fastify-plugin';
import { FastifyPluginAsync } from 'fastify';
import client from 'prom-client';

// Initialize default Node.js and process metrics
const register = new client.Registry();
client.collectDefaultMetrics({ register });

// Define custom Prometheus metrics
export const httpRequestDurationSeconds = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'HTTP request latency in seconds partitioned by route and status code',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5],
  registers: [register],
});

export const jobsEnqueuedTotal = new client.Counter({
  name: 'jobs_enqueued_total',
  help: 'Cumulative count of jobs dispatched to workers partitioned by tool',
  labelNames: ['tool'],
  registers: [register],
});

export const jobsCompletedTotal = new client.Counter({
  name: 'jobs_completed_total',
  help: 'Cumulative count of jobs completed partitioned by tool',
  labelNames: ['tool'],
  registers: [register],
});

export const jobsFailedTotal = new client.Counter({
  name: 'jobs_failed_total',
  help: 'Cumulative count of jobs failed partitioned by tool',
  labelNames: ['tool'],
  registers: [register],
});

export const metricsPlugin: FastifyPluginAsync = fp(async (fastify) => {
  // Record HTTP latency
  fastify.addHook('onRequest', async (request) => {
    (request as any).startTime = process.hrtime();
  });

  fastify.addHook('onResponse', async (request, reply) => {
    const startTime = (request as any).startTime;
    if (startTime) {
      const diff = process.hrtime(startTime);
      const durationSeconds = diff[0] + diff[1] / 1e9;
      const route = request.routeOptions?.url || request.url;

      httpRequestDurationSeconds.observe(
        {
          method: request.method,
          route,
          status_code: reply.statusCode.toString(),
        },
        durationSeconds,
      );
    }
  });

  // Expose /metrics endpoint
  fastify.get('/metrics', async (_request, reply) => {
    reply.header('Content-Type', register.contentType);
    return reply.send(await register.metrics());
  });
});
