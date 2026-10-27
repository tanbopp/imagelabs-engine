import { Button } from '@/components/ui/button';
import { Minimize2 } from 'lucide-react';
import { UploadedFileResult } from '@/lib/s3-upload';

interface CompressActionPanelProps {
  files: UploadedFileResult[];
  onProcess: () => void;
  disabled?: boolean;
}

export function CompressActionPanel({ files, onProcess, disabled = false }: CompressActionPanelProps) {
  const totalBytes = files.reduce((sum, f) => sum + f.sizeBytes, 0);

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 p-5 rounded-2xl border border-border bg-muted/30">
      <div className="text-center sm:text-left">
        <h4 className="text-base font-bold text-foreground">
          Ready to Compress {files.length} {files.length === 1 ? 'Image' : 'Images'}
        </h4>
        <p className="text-xs text-muted-foreground mt-0.5">
          Combined payload: {formatSize(totalBytes)} • Automatic lossy/lossless optimization
        </p>
      </div>

      <Button
        size="lg"
        onClick={onProcess}
        disabled={disabled}
        className="rounded-full font-semibold gap-2 w-full sm:w-auto px-8"
      >
        <Minimize2 className="size-4" />
        <span>Compress Images</span>
      </Button>
    </div>
  );
}
