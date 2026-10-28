import { useState } from 'react';
import { UploadZone } from '@/components/upload/upload-zone';
import { JobProgress } from '@/components/processing/job-progress';
import { UploadedFileResult } from '@/lib/s3-upload';
import { apiRequest } from '@/lib/api-client';
import { useJobPolling } from '@/hooks/use-job-polling';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Download, FileImage, Check } from 'lucide-react';
import { JobOutput } from '@imagelabs/shared';

export function ConvertToJpgPage({ onBack }: { onBack?: () => void }) {
  const [stagedFiles, setStagedFiles] = useState<UploadedFileResult[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const { job, error } = useJobPolling(activeJobId);

  const handleStartConvert = async () => {
    if (stagedFiles.length === 0) return;
    setIsDispatching(true);

    try {
      const data = await apiRequest<{ jobId: string }>('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          tool: 'convert-to-jpg',
          inputs: stagedFiles.map((f) => ({
            s3Key: f.s3Key,
            filename: f.filename,
            mimeType: f.mimeType,
            sizeBytes: f.sizeBytes,
          })),
          options: {},
        }),
      });

      setActiveJobId(data.jobId);
    } finally {
      setIsDispatching(false);
    }
  };

  const handleDownloadAll = async () => {
    if (!job?.id) return;
    setDownloading(true);
    try {
      const data = await apiRequest<{ files: Array<{ filename: string; url: string }> }>(
        `/jobs/${job.id}/download`,
      );

      for (const file of data.files) {
        const link = document.createElement('a');
        link.href = file.url;
        link.download = file.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
    } finally {
      setDownloading(false);
    }
  };

  const handleReset = () => {
    setStagedFiles([]);
    setActiveJobId(null);
  };

  const isCompleted = job?.status === 'completed';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="size-4" />
          <span>Back to All Tools</span>
        </button>
      )}

      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Convert to JPG
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
          Transform PNG, WebP, GIF, AVIF, TIFF, or HEIC images into high-quality JPEG files with clean background flattening.
        </p>
      </div>

      {isCompleted && (
        <div className="space-y-6 max-w-2xl mx-auto">
          <Card className="rounded-2xl border-2 border-border bg-muted/40 text-center p-8 shadow-none">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Conversion Completed!
            </h2>
            <p className="mt-1 text-sm text-muted-foreground font-medium">
              Converted {job.outputs.length} {job.outputs.length === 1 ? 'image' : 'images'} to JPG.
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={handleDownloadAll}
                disabled={downloading}
                className="rounded-full font-semibold gap-2 px-8"
              >
                <Download className="size-5" />
                <span>{downloading ? 'Preparing...' : 'Download JPG Images'}</span>
              </Button>

              <Button variant="outline" size="lg" onClick={handleReset} className="rounded-full">
                Convert More
              </Button>
            </div>
          </Card>

          <div className="space-y-2">
            {job.outputs.map((output: JobOutput) => (
              <Card key={output.s3Key} className="rounded-xl border border-border bg-muted/20 p-4 shadow-none">
                <CardContent className="p-0 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                      <FileImage className="size-4" />
                    </div>
                    <p className="text-sm font-semibold truncate text-foreground">{output.filename}</p>
                  </div>
                  <Check className="size-4 text-foreground" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {activeJobId && !isCompleted && (
        <div className="max-w-xl mx-auto">
          <JobProgress job={job} error={error} onCancel={handleReset} />
        </div>
      )}

      {!activeJobId && (
        <div className="space-y-6">
          <UploadZone
            onFilesUploaded={(files) => {
              setStagedFiles((prev) => [...prev, ...files]);
            }}
          />

          {stagedFiles.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-muted/30">
              <div>
                <h4 className="text-base font-bold text-foreground">
                  Ready to Convert {stagedFiles.length} {stagedFiles.length === 1 ? 'Image' : 'Images'} to JPG
                </h4>
                <p className="text-xs text-muted-foreground mt-0.5">
                  High-compression MozJPEG encoding with alpha transparency compensation.
                </p>
              </div>

              <Button
                size="lg"
                onClick={handleStartConvert}
                disabled={isDispatching}
                className="rounded-full font-semibold gap-2 w-full sm:w-auto px-8"
              >
                Convert to JPG
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
