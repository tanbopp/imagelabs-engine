import { useState } from 'react';
import { UploadZone } from '@/components/upload/upload-zone';
import { JobProgress } from '@/components/processing/job-progress';
import { CropCanvasOverlay } from '../components/crop-canvas-overlay';
import { UploadedFileResult } from '@/lib/s3-upload';
import { apiRequest } from '@/lib/api-client';
import { useJobPolling } from '@/hooks/use-job-polling';
import { CropOptions } from '@imagelabs/shared';
import { ArrowLeft, ArrowDownToLine, RefreshCw, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function CropPage({ onBack }: { onBack?: () => void }) {
  const [stagedFiles, setStagedFiles] = useState<UploadedFileResult[]>([]);
  const [cropOptions, setCropOptions] = useState<CropOptions>({ aspectRatio: '16:9' });
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  const { job, error } = useJobPolling(activeJobId);

  const handleStartCrop = async () => {
    if (stagedFiles.length === 0) return;
    setIsDispatching(true);

    try {
      const data = await apiRequest<{ jobId: string }>('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          tool: 'crop',
          inputs: stagedFiles.map((f) => ({
            s3Key: f.s3Key,
            filename: f.filename,
            mimeType: f.mimeType,
            sizeBytes: f.sizeBytes,
          })),
          options: cropOptions,
        }),
      });

      setActiveJobId(data.jobId);
    } catch {
      // Handled via polling
    } finally {
      setIsDispatching(false);
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
          Crop Images
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
          Cut images by defining coordinates or selecting standard aspect ratio presets.
        </p>
      </div>

      {isCompleted && (
        <Card className="p-6 text-center space-y-6 bg-card/60 border-border">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Images Successfully Cropped!</h3>
            <p className="text-sm text-muted-foreground">
              Processed {job.outputs.length} file{job.outputs.length > 1 ? 's' : ''}. Ready for download.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={`/api/jobs/${job.id}/download`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <ArrowDownToLine className="size-4" />
              Download Cropped Images
            </a>
            <Button
              variant="secondary"
              className="rounded-full inline-flex items-center gap-2"
              onClick={handleReset}
            >
              <RefreshCw className="size-4" />
              Crop More Images
            </Button>
          </div>
        </Card>
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
            <div className="space-y-6">
              <CropCanvasOverlay
                imageUrl={stagedFiles[0].previewUrl || ''}
                onCropChange={setCropOptions}
              />

              <div className="flex items-center justify-end">
                <Button
                  size="lg"
                  className="rounded-full px-8 shadow-none font-semibold flex items-center gap-2"
                  disabled={isDispatching}
                  onClick={handleStartCrop}
                >
                  <Scissors className="size-4" />
                  {isDispatching ? 'Dispatching...' : `Crop ${stagedFiles.length} Image${stagedFiles.length > 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
