import { useState, useRef } from 'react';
import { UploadZone } from '@/components/upload/upload-zone';
import { JobProgress } from '@/components/processing/job-progress';
import { BeforeAfterSlider } from '@/features/ai/components/before-after-slider';
import { detectFacesInImage, DetectedFace } from '../lib/mediapipe-face';
import { UploadedFileResult } from '@/lib/s3-upload';
import { apiRequest } from '@/lib/api-client';
import { useJobPolling } from '@/hooks/use-job-polling';
import { BlurFaceOptions } from '@imagelabs/shared';
import { ArrowLeft, ArrowDownToLine, RefreshCw, EyeOff, Sliders } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function BlurFacePage({ onBack }: { onBack?: () => void }) {
  const [stagedFiles, setStagedFiles] = useState<UploadedFileResult[]>([]);
  const [detectedFaces, setDetectedFaces] = useState<DetectedFace[]>([]);
  const [blurStrength, setBlurStrength] = useState<number>(35);
  const [padding, setPadding] = useState<number>(0.1);
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  const imageRef = useRef<HTMLImageElement | null>(null);
  const { job, error } = useJobPolling(activeJobId);

  const handleImageLoad = async (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    imageRef.current = img;
    const faces = await detectFacesInImage(img);
    setDetectedFaces(faces);
  };

  const handleStartBlur = async () => {
    if (stagedFiles.length === 0) return;
    setIsDispatching(true);

    try {
      const options: BlurFaceOptions = {
        blurStrength,
        padding,
        faces: detectedFaces.length > 0 ? detectedFaces : undefined,
      };

      const data = await apiRequest<{ jobId: string }>('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          tool: 'blur-face',
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
    setDetectedFaces([]);
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
          <EyeOff className="size-8 text-primary" />
          <span>Blur Face (Privacy Protection)</span>
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
          Automatically detect faces and apply Gaussian blurring to protect personal identity.
        </p>
      </div>

      {isCompleted && (
        <div className="space-y-6">
          <BeforeAfterSlider
            originalUrl={stagedFiles[0]?.previewUrl || ''}
            processedUrl={`/api/jobs/${job.id}/download`}
            originalLabel="Original"
            processedLabel="Faces Blurred"
          />

          <Card className="p-6 text-center space-y-4 bg-card/60 border-border">
            <h3 className="text-lg font-semibold text-foreground">Faces Successfully Blurred!</h3>
            <p className="text-sm text-muted-foreground">
              Privacy-sanitized image is ready for download.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-4">
              <a
                href={`/api/jobs/${job.id}/download`}
                className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
              >
                <ArrowDownToLine className="size-4" />
                Download Blurred Image
              </a>
              <Button
                variant="secondary"
                className="rounded-full inline-flex items-center gap-2"
                onClick={handleReset}
              >
                <RefreshCw className="size-4" />
                Blur Another Image
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
              {/* Preview with Face Outline Overlays */}
              <div className="relative flex justify-center p-4 bg-black/40 rounded-2xl border border-border overflow-hidden">
                <img
                  src={stagedFiles[0].previewUrl || ''}
                  alt="Face detection preview"
                  onLoad={handleImageLoad}
                  className="max-h-80 object-contain rounded-xl"
                />
              </div>

              {/* Controls */}
              <Card className="p-6 bg-card/60 backdrop-blur-sm border-border space-y-5">
                <div className="space-y-2">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-foreground flex items-center gap-1.5">
                      <Sliders className="size-3.5 text-muted-foreground" /> Blur Strength
                    </span>
                    <span className="font-mono text-muted-foreground">{blurStrength}px</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="80"
                    value={blurStrength}
                    onChange={(e) => setBlurStrength(Number(e.target.value))}
                    className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-2 pt-2 border-t border-border">
                  <div className="flex justify-between text-xs">
                    <span className="font-semibold text-foreground">Padding Margin</span>
                    <span className="font-mono text-muted-foreground">
                      {Math.round(padding * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="0.4"
                    step="0.05"
                    value={padding}
                    onChange={(e) => setPadding(Number(e.target.value))}
                    className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
                  />
                </div>
              </Card>

              <div className="flex items-center justify-end">
                <Button
                  size="lg"
                  className="rounded-full px-8 shadow-none font-semibold flex items-center gap-2"
                  disabled={isDispatching}
                  onClick={handleStartBlur}
                >
                  <EyeOff className="size-4" />
                  {isDispatching ? 'Dispatching...' : `Blur Faces (${stagedFiles.length})`}
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
