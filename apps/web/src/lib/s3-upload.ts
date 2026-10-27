import { apiRequest } from './api-client';
import { UploadResponse } from '@imagelabs/shared';

export interface UploadProgressCallback {
  (progressPercent: number): void;
}

export interface UploadedFileResult {
  s3Key: string;
  filename: string;
  mimeType: string;
  sizeBytes: number;
}

export async function uploadFileToS3(
  file: File,
  onProgress?: UploadProgressCallback,
): Promise<UploadedFileResult> {
  // 1. Obtain presigned URL from Fastify backend
  const { uploadUrl, s3Key } = await apiRequest<UploadResponse>('/upload', {
    method: 'POST',
    body: JSON.stringify({
      filename: file.name,
      mimeType: file.type || 'image/jpeg',
      sizeBytes: file.size,
    }),
  });

  // 2. Direct upload to S3 / MinIO via XMLHttpRequest to track upload progress accurately
  await new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', uploadUrl, true);
    xhr.setRequestHeader('Content-Type', file.type || 'image/jpeg');

    if (xhr.upload && onProgress) {
      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          const percent = Math.round((event.loaded / event.total) * 100);
          onProgress(percent);
        }
      };
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        if (onProgress) onProgress(100);
        resolve();
      } else {
        reject(new Error(`S3 upload failed with status ${xhr.status}: ${xhr.statusText}`));
      }
    };

    xhr.onerror = () => {
      reject(new Error('Network error occurred during direct S3 file upload'));
    };

    xhr.send(file);
  });

  return {
    s3Key,
    filename: file.name,
    mimeType: file.type || 'image/jpeg',
    sizeBytes: file.size,
  };
}
