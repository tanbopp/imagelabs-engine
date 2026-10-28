import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '30s', target: 20 },  // Ramp up to 20 users
    { duration: '1m', target: 50 },   // Spike to 50 users
    { duration: '30s', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'], // 95% of requests must complete below 300ms
    http_req_failed: ['rate<0.01'],   // Error rate below 1%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3000';

export default function () {
  // 1. Session handshake
  const sessionRes = http.post(`${BASE_URL}/api/session`, JSON.stringify({}), {
    headers: { 'Content-Type': 'application/json' },
  });

  check(sessionRes, {
    'session created': (r) => r.status === 200,
  });

  // 2. Query quota
  const quotaRes = http.get(`${BASE_URL}/api/quota`);
  check(quotaRes, {
    'quota retrieved': (r) => r.status === 200,
  });

  // 3. Request presigned upload URL
  const uploadPayload = JSON.stringify({
    filename: 'test-image.jpg',
    mimeType: 'image/jpeg',
    sizeBytes: 1048576, // 1 MB
  });

  const uploadRes = http.post(`${BASE_URL}/api/upload`, uploadPayload, {
    headers: { 'Content-Type': 'application/json' },
  });

  check(uploadRes, {
    'presigned URL generated': (r) => r.status === 200,
  });

  sleep(1);
}
