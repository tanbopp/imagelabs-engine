import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Check, FileImage } from 'lucide-react';
import { JobOutput } from '@imagelabs/shared';
import { apiRequest } from '@/lib/api-client';

interface ResizePreviewGridProps {
  outputs: JobOutput[];
  jobId: string;
  onReset: () => void;
}

export function ResizePreviewGrid({ outputs, jobId, onReset }: ResizePreviewGridProps) {
  const [downloading, setDownloading] = useState(false);

  const handleDownloadAll = async () => {
    setDownloading(true);
    try {
      const data = await apiRequest<{ files: Array<{ filename: string; url: string }> }>(
        `/jobs/${jobId}/download`,
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

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <Card className="rounded-2xl border-2 border-border bg-muted/40 text-center p-8 shadow-none">
        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          Resize Completed!
        </h2>
        <p className="mt-1 text-sm text-muted-foreground font-medium">
          Successfully processed {outputs.length} {outputs.length === 1 ? 'image' : 'images'}.
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={handleDownloadAll}
            disabled={downloading}
            className="rounded-full font-semibold gap-2 px-8"
          >
            <Download className="size-5" />
            <span>{downloading ? 'Preparing...' : 'Download Resized Images'}</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={onReset}
            className="rounded-full"
          >
            Resize More
          </Button>
        </div>
      </Card>

      <div className="space-y-2">
        {outputs.map((output) => (
          <Card key={output.s3Key} className="rounded-xl border border-border bg-muted/20 p-4 shadow-none">
            <CardContent className="p-0 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                  <FileImage className="size-4" />
                </div>
                <p className="text-sm font-semibold truncate text-foreground">{output.filename}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <Check className="size-4 text-foreground" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
