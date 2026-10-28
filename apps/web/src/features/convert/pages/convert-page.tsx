import { useState } from 'react';
import { UploadZone } from '@/components/upload/upload-zone';
import { JobProgress } from '@/components/processing/job-progress';
import { FormatSelector } from '../components/format-selector';
import { UploadedFileResult } from '@/lib/s3-upload';
import { apiRequest } from '@/lib/api-client';
import { useJobPolling } from '@/hooks/use-job-polling';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, Download, FileImage, Check } from 'lucide-react';
import { JobOutput } from '@imagelabs/shared';

export function ConvertPage({ onBack }: { onBack?: () => void }) {
  const [stagedFiles, setStagedFiles] = useState<UploadedFileResult[]>([]);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const [targetFormat, setTargetFormat] = useState<string>('webp');
  const [quality, setQuality] = useState<number>(85);

  const { job, error } = useJobPolling(activeJobId);

  const handleStartConvert = async () => {
    if (stagedFiles.length === 0) return;
    setIsDispatching(true);

    try {
      const data = await apiRequest<{ jobId: string }>('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          tool: 'convert-image',
          inputs: stagedFiles.map((f) => ({
            s3Key: f.s3Key,
            filename: f.filename,
            mimeType: f.mimeType,
            sizeBytes: f.sizeBytes,
          })),
          options: {
            targetFormat,
            quality,
          },
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
          Convert Image
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
          Universal multi-format image converter. Convert to WebP, AVIF, PNG, TIFF, or JPEG with quality controls.
        </p>
      </div>

      {isCompleted && (
        <div className="space-y-6 max-w-2xl mx-auto">
          <Card className="rounded-2xl border-2 border-border bg-muted/40 text-center p-8 shadow-none">
            <h2 className="text-3xl font-bold tracking-tight text-foreground">
              Conversion Completed!
            </h2>
            <p className="mt-1 text-sm text-muted-foreground font-medium">
              Output format: {targetFormat.toUpperCase()} ({job.outputs.length} {job.outputs.length === 1 ? 'file' : 'files'}).
            </p>

            <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={handleDownloadAll}
                disabled={downloading}
                className="rounded-full font-semibold gap-2 px-8"
              >
                <Download className="size-5" />
                <span>{downloading ? 'Preparing...' : 'Download Converted Images'}</span>
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
            <div className="space-y-6 p-6 rounded-2xl border border-border bg-muted/30">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase">Target Format</label>
                <FormatSelector
                  formats={[
                    { id: 'webp', label: 'WebP (Modern)' },
                    { id: 'avif', label: 'AVIF (Next-Gen)' },
                    { id: 'png', label: 'PNG (Lossless)' },
                    { id: 'jpeg', label: 'JPEG (Universal)' },
                    { id: 'tiff', label: 'TIFF (High-Res)' },
                  ]}
                  selectedFormat={targetFormat}
                  onSelect={(fmt) => setTargetFormat(fmt)}
                />
              </div>

              <div className="space-y-2 border-t border-border pt-4">
                <div className="flex justify-between items-center text-xs">
                  <span className="font-semibold text-muted-foreground uppercase">Quality</span>
                  <span className="font-bold text-foreground">{quality}%</span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="100"
                  value={quality}
                  onChange={(e) => setQuality(Number(e.target.value))}
                  className="w-full accent-foreground cursor-pointer"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border pt-4 gap-4">
                <span className="text-xs text-muted-foreground">
                  {stagedFiles.length} file(s) staged for conversion to {targetFormat.toUpperCase()}
                </span>

                <Button
                  size="lg"
                  onClick={handleStartConvert}
                  disabled={isDispatching}
                  className="rounded-full font-semibold gap-2 w-full sm:w-auto px-8"
                >
                  Convert Images
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
