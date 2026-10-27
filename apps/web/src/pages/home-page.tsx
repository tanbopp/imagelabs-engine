import { useState } from 'react';
import { ToolGrid } from '@/components/tools/tool-grid';
import { UploadZone } from '@/components/upload/upload-zone';
import { Button } from '@/components/ui/button';
import { ArrowDown, Sparkles } from 'lucide-react';
import { UploadedFileResult } from '@/lib/s3-upload';
import { CompressPage } from '@/features/compress/pages/compress-page';
import { ResizePage } from '@/features/resize/pages/resize-page';

export function HomePage() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [, setUploadedFiles] = useState<UploadedFileResult[]>([]);

  if (selectedTool === 'compress') {
    return <CompressPage onBack={() => setSelectedTool(null)} />;
  }

  if (selectedTool === 'resize') {
    return <ResizePage onBack={() => setSelectedTool(null)} />;
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
              // Default to compress on direct home upload
              setSelectedTool('compress');
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
      <ToolGrid onSelectTool={(toolId) => setSelectedTool(toolId)} />
    </div>
  );
}
