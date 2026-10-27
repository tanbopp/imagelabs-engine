import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '@/lib/api-client';
import { Job } from '@imagelabs/shared';

interface UseJobPollingOptions {
  intervalMs?: number;
  timeoutMs?: number;
}

export function useJobPolling(jobId: string | null, options: UseJobPollingOptions = {}) {
  const { intervalMs = 800, timeoutMs = 120000 } = options;
  const [job, setJob] = useState<Job | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const startTimeRef = useRef<number>(0);

  useEffect(() => {
    if (!jobId) {
      setJob(null);
      setError(null);
      setIsPolling(false);
      return;
    }

    let isMounted = true;
    setIsPolling(true);
    setError(null);
    startTimeRef.current = Date.now();

    const checkJobStatus = async () => {
      try {
        if (Date.now() - startTimeRef.current > timeoutMs) {
          if (isMounted) {
            setError('Processing timed out after 2 minutes');
            setIsPolling(false);
          }
          return;
        }

        const data = await apiRequest<Job>(`/jobs/${jobId}`);
        if (!isMounted) return;

        setJob(data);

        if (data.status === 'completed' || data.status === 'failed') {
          setIsPolling(false);
          if (data.error) {
            setError(data.error.message);
          }
        } else {
          setTimeout(checkJobStatus, intervalMs);
        }
      } catch (err) {
        if (isMounted) {
          setError((err as Error).message || 'Failed to fetch job progress');
          setIsPolling(false);
        }
      }
    };

    checkJobStatus();

    return () => {
      isMounted = false;
    };
  }, [jobId, intervalMs, timeoutMs]);

  return { job, error, isPolling };
}
