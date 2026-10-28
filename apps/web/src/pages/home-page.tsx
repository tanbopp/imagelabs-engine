import { useState, useEffect } from 'react';
import { ToolGrid } from '@/components/tools/tool-grid';
import { UploadZone } from '@/components/upload/upload-zone';
import { Button } from '@/components/ui/button';
import { ArrowDown, Sparkles } from 'lucide-react';
import { UploadedFileResult } from '@/lib/s3-upload';
import { CompressPage } from '@/features/compress/pages/compress-page';
import { ResizePage } from '@/features/resize/pages/resize-page';
import { ConvertToJpgPage } from '@/features/convert/pages/convert-to-jpg-page';
import { ConvertFromJpgPage } from '@/features/convert/pages/convert-from-jpg-page';
import { ConvertPage } from '@/features/convert/pages/convert-page';
import { CropPage } from '@/features/crop/pages/crop-page';
import { RotatePage } from '@/features/rotate/pages/rotate-page';
import { WatermarkPage } from '@/features/watermark/pages/watermark-page';
import { EditorPage } from '@/features/editor/pages/editor-page';
import { MemePage } from '@/features/meme/pages/meme-page';
import { UpscalePage } from '@/features/upscale/pages/upscale-page';
import { RemoveBgPage } from '@/features/remove-bg/pages/remove-bg-page';
import { BlurFacePage } from '@/features/blur-face/pages/blur-face-page';
import { HtmlToImagePage } from '@/features/html-to-image/pages/html-to-image-page';

export function HomePage() {
  const [selectedTool, setSelectedTool] = useState<string | null>(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      const hash = window.location.hash.replace('#tool-', '').replace('#', '');
      return hash || null;
    }
    return null;
  });
  const [, setUploadedFiles] = useState<UploadedFileResult[]>([]);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash.replace('#tool-', '').replace('#', '');
      setSelectedTool(hash || null);
    };

    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  const handleSelectTool = (toolId: string | null) => {
    setSelectedTool(toolId);
    if (toolId) {
      window.location.hash = `tool-${toolId}`;
    } else {
      history.pushState(null, '', window.location.pathname + window.location.search);
    }
  };

  if (selectedTool === 'compress') {
    return <CompressPage onBack={() => handleSelectTool(null)} />;
  }

  if (selectedTool === 'resize') {
    return <ResizePage onBack={() => handleSelectTool(null)} />;
  }

  if (selectedTool === 'convert-to-jpg') {
    return <ConvertToJpgPage onBack={() => handleSelectTool(null)} />;
  }

  if (selectedTool === 'convert-from-jpg') {
    return <ConvertFromJpgPage onBack={() => handleSelectTool(null)} />;
  }

  if (selectedTool === 'convert-image') {
    return <ConvertPage onBack={() => handleSelectTool(null)} />;
  }

  if (selectedTool === 'crop') {
    return <CropPage onBack={() => handleSelectTool(null)} />;
  }

  if (selectedTool === 'rotate') {
    return <RotatePage onBack={() => handleSelectTool(null)} />;
  }

  if (selectedTool === 'watermark') {
    return <WatermarkPage onBack={() => handleSelectTool(null)} />;
  }

  if (selectedTool === 'image-editor') {
    return <EditorPage onBack={() => handleSelectTool(null)} />;
  }

  if (selectedTool === 'meme-generator') {
    return <MemePage onBack={() => handleSelectTool(null)} />;
  }

  if (selectedTool === 'upscale') {
    return <UpscalePage onBack={() => handleSelectTool(null)} />;
  }

  if (selectedTool === 'remove-background') {
    return <RemoveBgPage onBack={() => handleSelectTool(null)} />;
  }

  if (selectedTool === 'blur-face') {
    return <BlurFacePage onBack={() => handleSelectTool(null)} />;
  }

  if (selectedTool === 'html-to-image') {
    return <HtmlToImagePage onBack={() => handleSelectTool(null)} />;
  }

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <section className="text-center py-10 md:py-16 space-y-6 max-w-3xl mx-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-border bg-muted/40 px-3.5 py-1 text-xs font-semibold text-foreground select-none">
          <Sparkles className="size-3.5" />
          <span>Every image tool you need, 100% free and private</span>
        </div>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-foreground leading-[1.1]">
          Fast, Private In-Browser Image Tools.
        </h1>

        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed">
          Compress, resize, edit, convert, and enhance images instantly. No account creation, no tracking, and no persistent databases. Files auto-delete after 1 hour.
        </p>

        {/* Global Quick Ingestion Zone */}
        <div className="pt-4 max-w-2xl mx-auto">
          <UploadZone
            onFilesUploaded={(files) => {
              setUploadedFiles((prev) => [...prev, ...files]);
              handleSelectTool('compress');
            }}
          />
        </div>

        <div className="pt-2 flex justify-center">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-full gap-2 font-medium"
          >
            <a href="#optimize">
              <span>Browse All 14 Tools</span>
              <ArrowDown className="size-3.5" />
            </a>
          </Button>
        </div>
      </section>

      {/* Categorized Tools Grid */}
      <ToolGrid onSelectTool={(toolId) => handleSelectTool(toolId)} />
    </div>
  );
}
