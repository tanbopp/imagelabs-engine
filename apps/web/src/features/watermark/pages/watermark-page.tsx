import { useState } from 'react';
import { UploadZone } from '@/components/upload/upload-zone';
import { JobProgress } from '@/components/processing/job-progress';
import { WatermarkPositionGrid, WatermarkPosition } from '../components/watermark-position-grid';
import { UploadedFileResult } from '@/lib/s3-upload';
import { apiRequest } from '@/lib/api-client';
import { useJobPolling } from '@/hooks/use-job-polling';
import { WatermarkOptions } from '@imagelabs/shared';
import { ArrowLeft, ArrowDownToLine, RefreshCw, Stamp, Type, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function WatermarkPage({ onBack }: { onBack?: () => void }) {
  const [stagedFiles, setStagedFiles] = useState<UploadedFileResult[]>([]);
  const [watermarkOptions, setWatermarkOptions] = useState<WatermarkOptions>({
    type: 'text',
    text: 'ImageLabs Protected',
    position: 'bottom-right',
    opacity: 0.7,
    scale: 0.25,
    tiled: false,
  });
  const [logoUpload, setLogoUpload] = useState<UploadedFileResult | null>(null);

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  const { job, error } = useJobPolling(activeJobId);

  const handleStartWatermark = async () => {
    if (stagedFiles.length === 0) return;
    setIsDispatching(true);

    try {
      const payloadOptions: WatermarkOptions = {
        ...watermarkOptions,
        imageKey: watermarkOptions.type === 'image' ? logoUpload?.s3Key : undefined,
      };

      const data = await apiRequest<{ jobId: string }>('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          tool: 'watermark',
          inputs: stagedFiles.map((f) => ({
            s3Key: f.s3Key,
            filename: f.filename,
            mimeType: f.mimeType,
            sizeBytes: f.sizeBytes,
          })),
          options: payloadOptions,
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
    setLogoUpload(null);
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
          Watermark Images
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
          Add custom text or image stamps with configurable opacity, position, and tiling.
        </p>
      </div>

      {isCompleted && (
        <Card className="p-6 text-center space-y-6 bg-card/60 border-border">
          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-foreground">Watermark Successfully Applied!</h3>
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
              Download Watermarked Images
            </a>
            <Button
              variant="secondary"
              className="rounded-full inline-flex items-center gap-2"
              onClick={handleReset}
            >
              <RefreshCw className="size-4" />
              Watermark More Images
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
              <Card className="p-6 bg-card/60 backdrop-blur-sm border-border space-y-6">
                {/* Mode Selector */}
                <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-full w-fit">
                  <button
                    type="button"
                    onClick={() => setWatermarkOptions((prev) => ({ ...prev, type: 'text' }))}
                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      watermarkOptions.type === 'text'
                        ? 'bg-primary text-primary-foreground shadow-none'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Type className="size-3.5" />
                    <span>Text Watermark</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setWatermarkOptions((prev) => ({ ...prev, type: 'image' }))}
                    className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold transition-all ${
                      watermarkOptions.type === 'image'
                        ? 'bg-primary text-primary-foreground shadow-none'
                        : 'text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <ImageIcon className="size-3.5" />
                    <span>Image / Logo</span>
                  </button>
                </div>

                {watermarkOptions.type === 'text' ? (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Watermark Text
                    </label>
                    <input
                      type="text"
                      maxLength={200}
                      value={watermarkOptions.text || ''}
                      onChange={(e) =>
                        setWatermarkOptions((prev) => ({ ...prev, text: e.target.value }))
                      }
                      placeholder="e.g. © 2026 ImageLabs"
                      className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-foreground uppercase tracking-wider">
                      Watermark Logo (PNG/WebP recommended)
                    </label>
                    {logoUpload ? (
                      <div className="flex items-center justify-between p-3 rounded-xl border border-border bg-background">
                        <span className="text-xs font-medium text-foreground truncate">
                          {logoUpload.filename}
                        </span>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="h-7 text-xs rounded-full"
                          onClick={() => setLogoUpload(null)}
                        >
                          Change
                        </Button>
                      </div>
                    ) : (
                      <UploadZone
                        acceptMultiple={false}
                        onFilesUploaded={(files) => {
                          if (files.length > 0) setLogoUpload(files[0]);
                        }}
                      />
                    )}
                  </div>
                )}

                {/* Alignment Grid & Sliders */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-border">
                  <div className="space-y-3">
                    <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                      Placement (Compass)
                    </span>
                    <WatermarkPositionGrid
                      value={watermarkOptions.position as WatermarkPosition}
                      onChange={(pos) =>
                        setWatermarkOptions((prev) => ({ ...prev, position: pos }))
                      }
                      disabled={watermarkOptions.tiled}
                    />
                  </div>

                  <div className="space-y-4">
                    {/* Opacity slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-foreground">Opacity</span>
                        <span className="font-mono text-muted-foreground">
                          {Math.round((watermarkOptions.opacity ?? 0.7) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.1"
                        max="1"
                        step="0.05"
                        value={watermarkOptions.opacity ?? 0.7}
                        onChange={(e) =>
                          setWatermarkOptions((prev) => ({
                            ...prev,
                            opacity: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Scale slider */}
                    <div className="space-y-2">
                      <div className="flex justify-between text-xs">
                        <span className="font-medium text-foreground">Relative Scale</span>
                        <span className="font-mono text-muted-foreground">
                          {Math.round((watermarkOptions.scale ?? 0.2) * 100)}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0.05"
                        max="0.8"
                        step="0.05"
                        value={watermarkOptions.scale ?? 0.2}
                        onChange={(e) =>
                          setWatermarkOptions((prev) => ({
                            ...prev,
                            scale: parseFloat(e.target.value),
                          }))
                        }
                        className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                      />
                    </div>

                    {/* Tiling checkbox */}
                    <label className="flex items-center gap-2.5 pt-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={watermarkOptions.tiled}
                        onChange={(e) =>
                          setWatermarkOptions((prev) => ({ ...prev, tiled: e.target.checked }))
                        }
                        className="size-4 accent-primary rounded cursor-pointer"
                      />
                      <span className="text-xs font-medium text-foreground">
                        Repeat pattern across full image (Tiled)
                      </span>
                    </label>
                  </div>
                </div>
              </Card>

              <div className="flex items-center justify-end">
                <Button
                  size="lg"
                  className="rounded-full px-8 shadow-none font-semibold flex items-center gap-2"
                  disabled={isDispatching || (watermarkOptions.type === 'image' && !logoUpload)}
                  onClick={handleStartWatermark}
                >
                  <Stamp className="size-4" />
                  {isDispatching ? 'Dispatching...' : `Watermark ${stagedFiles.length} Image${stagedFiles.length > 1 ? 's' : ''}`}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
