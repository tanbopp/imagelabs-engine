import { useState } from 'react';
import { HtmlCodeEditor } from '../components/html-code-editor';
import { ViewportControls, ViewportSettings } from '../components/viewport-controls';
import { JobProgress } from '@/components/processing/job-progress';
import { apiRequest } from '@/lib/api-client';
import { useJobPolling } from '@/hooks/use-job-polling';
import { HtmlToImageOptions } from '@imagelabs/shared';
import { ArrowLeft, ArrowDownToLine, RefreshCw, Code2, Globe, Camera } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const SAMPLE_HTML = `<div style="background: linear-gradient(135deg, #1e1b4b, #312e81); color: #fff; padding: 48px; border-radius: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 40px auto; box-shadow: 0 20px 40px rgba(0,0,0,0.4);">
  <div style="font-size: 14px; text-transform: uppercase; letter-spacing: 2px; color: #a5b4fc; font-weight: 700; margin-bottom: 12px;">ImageLabs Renderer</div>
  <h1 style="font-size: 36px; margin: 0 0 16px 0; font-weight: 800; line-height: 1.2;">High-Fidelity HTML to Image</h1>
  <p style="font-size: 16px; color: #cbd5e1; line-height: 1.6; margin: 0 0 24px 0;">Capture pixel-perfect raster screenshots of any HTML5 markup, Tailwind components, or live web pages with headless Chromium.</p>
  <div style="display: inline-block; background: #6366f1; color: #fff; padding: 12px 24px; border-radius: 9999px; font-weight: 600; font-size: 14px;">Instant Raster Capture</div>
</div>`;

export function HtmlToImagePage({ onBack }: { onBack?: () => void }) {
  const [sourceType, setSourceType] = useState<'html' | 'url'>('html');
  const [htmlContent, setHtmlContent] = useState<string>(SAMPLE_HTML);
  const [urlInput, setUrlInput] = useState<string>('https://example.com');
  const [viewport, setViewport] = useState<ViewportSettings>({
    width: 1280,
    height: 800,
    deviceScaleFactor: 2,
  });
  const [format, setFormat] = useState<'png' | 'jpeg'>('png');
  const [fullPage, setFullPage] = useState<boolean>(false);

  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [isDispatching, setIsDispatching] = useState(false);

  const { job, error } = useJobPolling(activeJobId);

  const handleStartRender = async () => {
    setIsDispatching(true);

    try {
      const options: HtmlToImageOptions = {
        sourceType,
        html: sourceType === 'html' ? htmlContent : undefined,
        url: sourceType === 'url' ? urlInput : undefined,
        format,
        quality: 90,
        viewport,
        fullPage,
        delayMs: 600,
      };

      const data = await apiRequest<{ jobId: string }>('/jobs', {
        method: 'POST',
        body: JSON.stringify({
          tool: 'html-to-image',
          inputs: [],
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
          <Code2 className="size-8 text-primary" />
          <span>HTML to Image</span>
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
          Convert raw HTML/CSS code or public websites into high-resolution PNG or JPEG images.
        </p>
      </div>

      {isCompleted && (
        <Card className="p-6 text-center space-y-6 bg-card/60 border-border">
          <h3 className="text-lg font-semibold text-foreground">Screenshot Captured!</h3>
          <p className="text-sm text-muted-foreground">
            Rendered with headless Chromium sandbox. Ready for download.
          </p>

          <div className="flex justify-center p-3 bg-black/40 rounded-xl overflow-hidden max-h-96">
            <img
              src={`/api/jobs/${job.id}/download`}
              alt="Rendered output"
              className="max-h-80 object-contain rounded-lg"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4">
            <a
              href={`/api/jobs/${job.id}/download`}
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <ArrowDownToLine className="size-4" />
              Download Rendered Image
            </a>
            <Button
              variant="secondary"
              className="rounded-full inline-flex items-center gap-2"
              onClick={handleReset}
            >
              <RefreshCw className="size-4" />
              Render Another Snippet
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
          {/* Mode Tabs */}
          <div className="flex items-center gap-2 p-1 bg-muted/50 rounded-full w-fit mx-auto">
            <button
              type="button"
              onClick={() => setSourceType('html')}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                sourceType === 'html'
                  ? 'bg-primary text-primary-foreground shadow-none'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Code2 className="size-3.5" />
              <span>Raw HTML Code</span>
            </button>

            <button
              type="button"
              onClick={() => setSourceType('url')}
              className={`inline-flex items-center gap-2 px-5 py-2 rounded-full text-xs font-semibold transition-all ${
                sourceType === 'url'
                  ? 'bg-primary text-primary-foreground shadow-none'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Globe className="size-3.5" />
              <span>Website URL</span>
            </button>
          </div>

          {/* Source Input */}
          {sourceType === 'html' ? (
            <HtmlCodeEditor
              value={htmlContent}
              onChange={setHtmlContent}
              disabled={isDispatching}
            />
          ) : (
            <Card className="p-5 bg-card/60 border-border space-y-2">
              <label className="text-xs font-semibold text-foreground uppercase tracking-wider block">
                Target Web Page URL
              </label>
              <input
                type="url"
                value={urlInput}
                disabled={isDispatching}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
              />
              <p className="text-[11px] text-muted-foreground">
                Protected by SSRF firewall. Internal/private IP addresses are blocked.
              </p>
            </Card>
          )}

          {/* Viewport Settings */}
          <ViewportControls
            viewport={viewport}
            onChange={setViewport}
            fullPage={fullPage}
            onFullPageChange={setFullPage}
            format={format}
            onFormatChange={setFormat}
            disabled={isDispatching}
          />

          <div className="flex items-center justify-end">
            <Button
              size="lg"
              className="rounded-full px-8 shadow-none font-semibold flex items-center gap-2"
              disabled={isDispatching}
              onClick={handleStartRender}
            >
              <Camera className="size-4" />
              {isDispatching ? 'Dispatching...' : 'Render & Capture Image'}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
