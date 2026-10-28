import { useState } from 'react';
import { UploadZone } from '@/components/upload/upload-zone';
import { JobProgress } from '@/components/processing/job-progress';
import { BeforeAfterSlider } from '@/features/ai/components/before-after-slider';
import { UploadedFileResult } from '@/lib/s3-upload';
import { apiRequest } from '@/lib/api-client';
import { useJobPolling } from '@/hooks/use-job-polling';
import { UpscaleOptions } from '@imagelabs/shared';
import { ArrowLeft, ArrowDownToLine, RefreshCw, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function UpscalePage({ onBack }: { onBack?: () => void }) {
  const [stagedFiles, setStagedFiles] = useState<UploadedFileResult[]>([]);
  const [scale, setScale] = useState<'2x' | '4x'>('2x');
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  const { job, error } = useJobPolling(activeJobId);

  const handleStartUpscale = async () => {
    if (stagedFiles.length === 0) return;
    setIsDispatching(true);

    try {
      const options: UpscaleOptions = { scale };

      const data = await apiRequest<{ jobId: string }>('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          tool: 'upscale',
          inputs: stagedFiles.map((f) => ({
            s3Key: f.s3Key,
            filename: f.filename,
            mimeType: f.mimeType,
            sizeBytes: f.sizeBytes,
          })),
          options,
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
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground flex items-center justify-center gap-2.5">
          <Sparkles className="size-8 text-primary" />
          <span>AI Image Upscaler</span>
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
          Increase resolution by 2x or 4x with deep neural detail restoration and de-noising.
        </p>
      </div>

      {isCompleted && (
        <div className="space-y-6">
          <BeforeAfterSlider
            originalUrl={stagedFiles[0]?.previewUrl || ''}
            processedUrl={`/api/jobs/${job.id}/download`}
            originalLabel="Original"
            processedLabel={`Upscaled (${scale})`}
          />

          <Card className="p-6 text-center space-y-4 bg-card/60 border-border">
            <h3 className="text-lg font-semibold text-foreground">Upscaling Completed!</h3>
            <p className="text-sm text-muted-foreground">
              Your image resolution has been enhanced. Files auto-delete in 1 hour.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href={`/api/jobs/${job.id}/download`}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <ArrowDownToLine className="size-4" />
                Download Upscaled Image
              </a>
              <Button
                variant="secondary"
                className="rounded-full inline-flex items-center gap-2"
                onClick={handleReset}
              >
                <RefreshCw className="size-4" />
                Upscale Another Image
              </Button>
            </div>
          </Card>
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
            <div className="space-y-6">
              <Card className="p-6 bg-card/60 backdrop-blur-sm border-border space-y-4">
                <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                  Enhancement Scale Factor
                </span>

                <div className="grid grid-cols-2 gap-4">
                  <button
                    type="button"
                    onClick={() => setScale('2x')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      scale === '2x'
                        ? 'bg-primary/10 border-primary text-foreground'
                        : 'bg-card/70 border-border hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <div className="font-bold text-base text-foreground">2x (Recommended)</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Doubles pixel dimensions. Fast neural enhancement and sharp fidelity.
                    </p>
                  </button>

                  <button
                    type="button"
                    onClick={() => setScale('4x')}
                    className={`p-4 rounded-xl border text-left transition-all ${
                      scale === '4x'
                        ? 'bg-primary/10 border-primary text-foreground'
                        : 'bg-card/70 border-border hover:bg-muted text-muted-foreground'
                    }`}
                  >
                    <div className="font-bold text-base text-foreground">4x (Ultra HD)</div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Quadruples pixel dimensions for large-format print and 4K displays.
                    </p>
                  </button>
                </div>
              </Card>

              <div className="flex items-center justify-end">
                <Button
                  size="lg"
                  className="rounded-full px-8 shadow-none font-semibold flex items-center gap-2"
                  disabled={isDispatching}
                  onClick={handleStartUpscale}
                >
                  <Sparkles className="size-4" />
                  {isDispatching ? 'Dispatching...' : `Upscale ${stagedFiles.length} Image${stagedFiles.length > 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
