export const ErrorCode = {
  INVALID_INPUT: 400,
  NO_SESSION: 401,
  QUOTA_EXCEEDED: 403,
  JOB_NOT_FOUND: 404,
  FILE_TOO_LARGE: 413,
  UNSUPPORTED_TYPE: 415,
  RATE_LIMITED: 429,
  INTERNAL: 500,
} as const;

export type ErrorCode = keyof typeof ErrorCode;

export const ErrorMessages: Record<ErrorCode, string> = {
  INVALID_INPUT: 'Invalid input payload or malformed parameters.',
  NO_SESSION: 'Missing or expired session token.',
  QUOTA_EXCEEDED: 'Daily job processing or upload quota exceeded.',
  JOB_NOT_FOUND: 'Job not found or has expired from temporary storage.',
  FILE_TOO_LARGE: 'Uploaded file exceeds the maximum allowed size limit.',
  UNSUPPORTED_TYPE: 'Unsupported file MIME type for this tool.',
  RATE_LIMITED: 'Too many requests. Please slow down and try again later.',
  INTERNAL: 'An unexpected internal server error occurred.',
};
