export interface ApiErrorPayload {
  code: string;
  message: string;
  details?: unknown;
}

export class ApiError extends Error {
  code: string;
  details?: unknown;
  status: number;

  constructor(status: number, payload: ApiErrorPayload) {
    super(payload.message);
    this.name = 'ApiError';
    this.status = status;
    this.code = payload.code;
    this.details = payload.details;
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `/api${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Ensure session cookie is transmitted
  });

  if (!response.ok) {
    let errorPayload: ApiErrorPayload = {
      code: 'INTERNAL',
      message: response.statusText || 'An unexpected error occurred',
    };

    try {
      const data = await response.json();
      if (data && data.error) {
        errorPayload = data.error;
      }
    } catch {
      // Use fallback errorPayload if response is not JSON
    }

    throw new ApiError(response.status, errorPayload);
  }

  return response.json() as Promise<T>;
}
