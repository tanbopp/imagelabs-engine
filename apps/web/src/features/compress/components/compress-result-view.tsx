import { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, Sparkles, FileImage, Check } from 'lucide-react';
import { JobOutput } from '@imagelabs/shared';
import { apiRequest } from '@/lib/api-client';
import { CloudExportMenu } from '@/components/cloud/cloud-export-menu';

interface CompressResultViewProps {
  originalInputs: Array<{ filename: string; sizeBytes: number }>;
  outputs: JobOutput[];
  jobId: string;
  onReset: () => void;
}

export function CompressResultView({ originalInputs, outputs, jobId, onReset }: CompressResultViewProps) {
  const [downloading, setDownloading] = useState(false);

  const totalOriginalBytes = originalInputs.reduce((sum, item) => sum + item.sizeBytes, 0);
  const totalCompressedBytes = outputs.reduce((sum, item) => sum + item.sizeBytes, 0);
  const bytesSaved = Math.max(0, totalOriginalBytes - totalCompressedBytes);
  const percentSaved = totalOriginalBytes > 0 ? Math.round((bytesSaved / totalOriginalBytes) * 100) : 0;

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  const handleDownloadAll = async () => {
    setDownloading(true);
    try {
      const data = await apiRequest<{ files: Array<{ filename: string; url: string }> }>(
        `/jobs/${jobId}/download`,
      );

      // Trigger download for each output file
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
      {/* High-Impact Savings Summary Card */}
      <Card className="rounded-2xl border-2 border-border bg-muted/40 text-center p-8 shadow-none">
        <div className="inline-flex size-14 items-center justify-center rounded-2xl bg-foreground text-background mb-4">
          <Sparkles className="size-7" />
        </div>

        <h2 className="text-3xl font-bold tracking-tight text-foreground">
          {percentSaved}% Size Reduction!
        </h2>
        <p className="mt-1 text-sm text-muted-foreground font-medium">
          Saved {formatSize(bytesSaved)} ({formatSize(totalOriginalBytes)} &rarr; {formatSize(totalCompressedBytes)})
        </p>

        <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            onClick={handleDownloadAll}
            disabled={downloading}
            className="rounded-full font-semibold gap-2 px-8"
          >
            <Download className="size-5" />
            <span>{downloading ? 'Preparing...' : 'Download All Images'}</span>
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={onReset}
            className="rounded-full"
          >
            Compress More
          </Button>

          {outputs.length > 0 && (
            <div className="w-full flex justify-center pt-2">
              <CloudExportMenu
                downloadUrl={`/api/jobs/${jobId}/download`}
                filename={outputs[0].filename}
              />
            </div>
          )}
        </div>
      </Card>

      {/* Individual File Item Breakdown */}
      <div className="space-y-2">
        {outputs.map((output, idx) => {
          const original = originalInputs[idx] || { sizeBytes: output.sizeBytes };
          const saved = Math.max(0, original.sizeBytes - output.sizeBytes);
          const percent = original.sizeBytes > 0 ? Math.round((saved / original.sizeBytes) * 100) : 0;

          return (
            <Card key={output.s3Key} className="rounded-xl border border-border bg-muted/20 p-4 shadow-none">
              <CardContent className="p-0 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
                    <FileImage className="size-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold truncate text-foreground">{output.filename}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatSize(original.sizeBytes)} &rarr; {formatSize(output.sizeBytes)}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-bold text-foreground bg-foreground/10 px-2 py-0.5 rounded-full">
                    -{percent}%
                  </span>
                  <Check className="size-4 text-foreground" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
