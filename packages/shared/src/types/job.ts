import { ErrorCode } from '../constants/error-codes';
import { ToolId } from '../constants/tools';

export type JobStatus = 'queued' | 'processing' | 'completed' | 'failed';

export interface JobInput {
  s3Key: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface JobOutput {
  s3Key: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export interface Job {
  id: string;
  status: JobStatus;
  tool: ToolId;
  inputs: JobInput[];
  outputs: JobOutput[];
  progress: number;
  error: { code: ErrorCode; message: string } | null;
  session: string;
  createdAt: string;
  updatedAt: string;
}

export interface JobCreateRequest {
  tool: ToolId;
  inputs: JobInput[];
  options: Record<string, unknown>;
}

export interface JobCreateResponse {
  jobId: string;
}
