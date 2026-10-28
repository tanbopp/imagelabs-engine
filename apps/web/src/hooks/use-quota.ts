import { useState, useEffect, useCallback } from 'react';
import { apiRequest } from '@/lib/api-client';
import { QuotaResponse } from '@imagelabs/shared';

export function useQuota(pollIntervalMs = 30000) {
  const [quotaData, setQuotaData] = useState<QuotaResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchQuota = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await apiRequest<QuotaResponse>('/quota');
      setQuotaData(data);
      setError(null);
    } catch (err) {
      setError((err as Error).message || 'Failed to fetch quota');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchQuota();
    const interval = setInterval(fetchQuota, pollIntervalMs);
    return () => clearInterval(interval);
  }, [fetchQuota, pollIntervalMs]);

  return {
    quota: quotaData?.quota,
    session: quotaData?.session,
    resetsAt: quotaData?.resetsAt,
    isLoading,
    error,
    refetch: fetchQuota,
  };
}
