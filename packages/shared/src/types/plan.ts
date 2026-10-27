export interface QuotaSnapshot {
  jobsUsedToday: number;
  jobsLimitToday: number;
  bytesUsedToday: number;
  bytesLimitToday: number;
}

export interface QuotaResponse {
  session: string;
  quota: QuotaSnapshot;
  resetsAt: string;
}
