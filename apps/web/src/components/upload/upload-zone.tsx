import React, { useRef, useState, useCallback } from 'react';
import { UploadCloud } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { uploadFileToS3, UploadedFileResult } from '@/lib/s3-upload';
import { UploadFileItem, FileUploadItemState } from './upload-file-item';
import { CloudImportButtons } from '@/components/cloud/cloud-import-buttons';

interface UploadZoneProps {
  onFilesUploaded?: (files: UploadedFileResult[]) => void;
  acceptMultiple?: boolean;
}

export function UploadZone({ onFilesUploaded, acceptMultiple = true }: UploadZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false);
  const [items, setItems] = useState<FileUploadItemState[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFiles = useCallback(
    async (fileList: FileList | File[]) => {
      const validFiles = Array.from(fileList).filter((f) => f.type.startsWith('image/'));
      if (validFiles.length === 0) return;

      const newUploadItems: FileUploadItemState[] = validFiles.map((file) => ({
        id: crypto.randomUUID(),
        file,
        progress: 0,
        status: 'uploading',
      }));

      setItems((prev) => (acceptMultiple ? [...prev, ...newUploadItems] : newUploadItems));

      const completedResults: UploadedFileResult[] = [];

      await Promise.all(
        newUploadItems.map(async (uploadItem) => {
          // Reject files larger than 50MB before calling API
          if (uploadItem.file.size > 52428800) {
            setItems((prev) =>
              prev.map((i) =>
                i.id === uploadItem.id
                  ? { ...i, status: 'error', errorMessage: 'File exceeds 50 MB limit' }
                  : i,
              ),
            );
            return;
          }

          try {
            const result = await uploadFileToS3(uploadItem.file, (progress) => {
              setItems((prev) =>
                prev.map((i) => (i.id === uploadItem.id ? { ...i, progress } : i)),
              );
            });

            setItems((prev) =>
              prev.map((i) =>
                i.id === uploadItem.id ? { ...i, status: 'completed', progress: 100 } : i,
              ),
            );

            completedResults.push(result);
          } catch (err) {
            setItems((prev) =>
              prev.map((i) =>
                i.id === uploadItem.id
                  ? {
                      ...i,
                      status: 'error',
                      errorMessage: (err as Error).message || 'Upload failed',
                    }
                  : i,
              ),
            );
          }
        }),
      );

      if (completedResults.length > 0 && onFilesUploaded) {
        onFilesUploaded(completedResults);
      }
    },
    [acceptMultiple, onFilesUploaded],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files) {
      processFiles(e.dataTransfer.files);
    }
  };

  const handleRemove = (id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  };

  return (
    <div className="space-y-6 w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`relative flex flex-col items-center justify-center p-10 md:p-14 rounded-2xl border-2 border-dashed transition-colors select-none text-center ${
          isDragOver
            ? 'border-foreground bg-muted/60'
            : 'border-border bg-muted/20 hover:border-foreground/60 hover:bg-muted/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple={acceptMultiple}
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              processFiles(e.target.files);
            }
          }}
        />

        <div className="flex size-16 items-center justify-center rounded-2xl bg-foreground text-background mb-4 shadow-none">
          <UploadCloud className="size-8" />
        </div>

        <h3 className="text-xl font-bold text-foreground">Drag & drop your images here</h3>
        <p className="mt-1 text-sm text-muted-foreground max-w-sm">
          Supports JPG, PNG, WebP, AVIF, GIF, TIFF up to 50 MB. Direct encrypted upload.
        </p>

        <div className="mt-6 flex flex-col items-center gap-3">
          <Button
            type="button"
            size="lg"
            className="rounded-full font-medium"
            onClick={() => fileInputRef.current?.click()}
          >
            Select Images
          </Button>

          <div className="flex items-center gap-2 text-xs text-muted-foreground my-1">
            <span className="h-px w-8 bg-border" />
            <span>or import from cloud</span>
            <span className="h-px w-8 bg-border" />
          </div>

          <CloudImportButtons
            onFilesImported={(files) => {
              if (onFilesUploaded) onFilesUploaded(files);
            }}
          />
        </div>
      </div>

      {items.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            <span>Staged Files</span>
            <span>{items.length} file(s)</span>
          </div>

          <div className="space-y-2">
            {items.map((item) => (
              <UploadFileItem key={item.id} item={item} onRemove={handleRemove} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
