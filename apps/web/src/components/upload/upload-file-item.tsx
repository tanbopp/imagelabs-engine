import { CheckCircle2, AlertCircle, FileImage, X } from 'lucide-react';
import { Progress } from '@/components/ui/progress';

export interface FileUploadItemState {
  id: string;
  file: File;
  progress: number;
  status: 'uploading' | 'completed' | 'error';
  errorMessage?: string;
}

interface UploadFileItemProps {
  item: FileUploadItemState;
  onRemove?: (id: string) => void;
}

export function UploadFileItem({ item, onRemove }: UploadFileItemProps) {
  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="flex items-center gap-4 rounded-xl border border-border bg-muted/20 p-3.5 transition-colors">
      <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-muted text-foreground">
        <FileImage className="size-5" />
      </div>

      <div className="flex-1 min-w-0 space-y-1.5">
        <div className="flex items-center justify-between text-xs font-medium">
          <span className="truncate max-w-[200px] sm:max-w-[320px] text-foreground">
            {item.file.name}
          </span>
          <span className="text-muted-foreground">{formatSize(item.file.size)}</span>
        </div>

        {item.status === 'uploading' && (
          <div className="flex items-center gap-2">
            <Progress value={item.progress} className="h-1.5 flex-1" />
            <span className="text-[10px] text-muted-foreground font-semibold">{item.progress}%</span>
          </div>
        )}

        {item.status === 'completed' && (
          <div className="flex items-center gap-1.5 text-xs text-foreground font-medium">
            <CheckCircle2 className="size-3.5" />
            <span>Uploaded directly to storage</span>
          </div>
        )}

        {item.status === 'error' && (
          <div className="flex items-center gap-1.5 text-xs text-destructive font-medium">
            <AlertCircle className="size-3.5" />
            <span>{item.errorMessage || 'Upload failed'}</span>
          </div>
        )}
      </div>

      {onRemove && (
        <button
          type="button"
          onClick={() => onRemove(item.id)}
          aria-label="Remove uploaded file"
          className="rounded-full p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
        >
          <X className="size-4" />
        </button>
      )}
    </div>
  );
}
