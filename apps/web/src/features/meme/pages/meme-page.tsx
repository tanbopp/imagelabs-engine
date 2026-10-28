import { useState, useRef } from 'react';
import { UploadZone } from '@/components/upload/upload-zone';
import { MemeCanvas } from '../components/meme-canvas';
import { MemeControls } from '../components/meme-controls';
import { UploadedFileResult, uploadFileToS3 } from '@/lib/s3-upload';
import { ArrowLeft, Download, RefreshCw, Smile } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function MemePage({ onBack }: { onBack?: () => void }) {
  const [stagedFiles, setStagedFiles] = useState<UploadedFileResult[]>([]);
  const [topText, setTopText] = useState('ONE DOES NOT SIMPLY');
  const [bottomText, setBottomText] = useState('MAKE A MEME WITHOUT IMAGELABS');
  const [fontSize, setFontSize] = useState(42);
  const [isExporting, setIsExporting] = useState(false);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const handleExport = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsExporting(true);

    try {
      const dataUrl = canvas.toDataURL('image/jpeg', 0.95);
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `meme-${Date.now()}.jpg`, { type: 'image/jpeg' });

      // Save to S3 via presigned PUT
      await uploadFileToS3(file);

      // Offer direct client download link
      const blobUrl = URL.createObjectURL(blob);
      setExportedUrl(blobUrl);
    } catch (err) {
      console.error('Meme export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setStagedFiles([]);
    setExportedUrl(null);
  };

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
          Meme Generator
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
          Create classic memes instantly. Authentic Impact font, auto text wrapping, and zero-lag rendering.
        </p>
      </div>

      {exportedUrl && (
        <Card className="p-6 text-center space-y-4 bg-card/60 border-border max-w-xl mx-auto">
          <h3 className="text-lg font-semibold text-foreground">Meme Generated Successfully!</h3>
          <p className="text-sm text-muted-foreground">
            Your custom meme has been rendered and saved.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href={exportedUrl}
              download="imagelabs-meme.jpg"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Download className="size-4" />
              Download Meme
            </a>
            <Button
              variant="secondary"
              className="rounded-full inline-flex items-center gap-2"
              onClick={handleReset}
            >
              <RefreshCw className="size-4" />
              Create Another Meme
            </Button>
          </div>
        </Card>
      )}

      {!exportedUrl && stagedFiles.length === 0 && (
        <UploadZone
          acceptMultiple={false}
          onFilesUploaded={(files) => {
            if (files.length > 0) setStagedFiles(files);
          }}
        />
      )}

      {!exportedUrl && stagedFiles.length > 0 && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-start">
            <MemeCanvas
              imageUrl={stagedFiles[0].previewUrl || ''}
              topText={topText}
              bottomText={bottomText}
              fontSize={fontSize}
              onCanvasReady={(canvas) => {
                canvasRef.current = canvas;
              }}
            />

            <div className="space-y-4">
              <MemeControls
                topText={topText}
                onTopTextChange={setTopText}
                bottomText={bottomText}
                onBottomTextChange={setBottomText}
                fontSize={fontSize}
                onFontSizeChange={setFontSize}
                disabled={isExporting}
              />

              <div className="flex items-center justify-end">
                <Button
                  size="lg"
                  className="rounded-full px-8 shadow-none font-semibold flex items-center gap-2"
                  disabled={isExporting}
                  onClick={handleExport}
                >
                  <Smile className="size-4" />
                  <span>{isExporting ? 'Generating...' : 'Export Meme'}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
