import { useState } from 'react';
import { UploadZone } from '@/components/upload/upload-zone';
import { JobProgress } from '@/components/processing/job-progress';
import { RotateControls } from '../components/rotate-controls';
import { UploadedFileResult } from '@/lib/s3-upload';
import { apiRequest } from '@/lib/api-client';
import { useJobPolling } from '@/hooks/use-job-polling';
import { RotateOptions } from '@imagelabs/shared';
import { ArrowLeft, ArrowDownToLine, RefreshCw, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function RotatePage({ onBack }: { onBack?: () => void }) {
  const [stagedFiles, setStagedFiles] = useState<UploadedFileResult[]>([]);
  const [rotateOptions, setRotateOptions] = useState<RotateOptions>({ angle: 90, autoOrient: true });
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  const { job, error } = useJobPolling(activeJobId);

  const handleStartRotate = async () => {
    if (stagedFiles.length === 0) return;
    setIsDispatching(true);

    try {
      const data = await apiRequest<{ jobId: string }>('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          tool: 'rotate',
          inputs: stagedFiles.map((f) => ({
            s3Key: f.s3Key,
            filename: f.filename,
            mimeType: f.mimeType,
            sizeBytes: f.sizeBytes,
          })),
          options: rotateOptions,
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
          Rotate Images
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
          Rotate your images left, right, or fine-tune with arbitrary angle degrees.
        </p>
      </div>

      {isCompleted && (
        <Card className="p-6 text-center space-y-6 bg-card/60 border-border">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Images Successfully Rotated!</h3>
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
              Download Rotated Images
            </a>
            <Button
              variant="secondary"
              className="rounded-full inline-flex items-center gap-2"
              onClick={handleReset}
            >
              <RefreshCw className="size-4" />
              Rotate More Images
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
              {/* Live transform preview */}
              <div className="flex justify-center p-6 bg-black/30 rounded-2xl border border-border overflow-hidden">
                <img
                  src={stagedFiles[0].previewUrl || ''}
                  alt="Rotate preview"
                  className="max-h-72 object-contain transition-transform duration-300 ease-out"
                  style={{ transform: `rotate(${rotateOptions.angle}deg)` }}
                />
              </div>

              <RotateControls
                options={rotateOptions}
                onChange={setRotateOptions}
                disabled={isDispatching}
              />

              <div className="flex items-center justify-end">
                <Button
                  size="lg"
                  className="rounded-full px-8 shadow-none font-semibold flex items-center gap-2"
                  disabled={isDispatching}
                  onClick={handleStartRotate}
                >
                  <RotateCw className="size-4" />
                  {isDispatching ? 'Dispatching...' : `Rotate ${stagedFiles.length} Image${stagedFiles.length > 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
