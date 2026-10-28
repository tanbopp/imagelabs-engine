import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { openGooglePicker } from '@/lib/cloud/google-drive';
import { openDropboxChooser } from '@/lib/cloud/dropbox';
import { uploadFileToS3, UploadedFileResult } from '@/lib/s3-upload';
import { Cloud, Loader2 } from 'lucide-react';

interface CloudImportButtonsProps {
  onFilesImported: (files: UploadedFileResult[]) => void;
  disabled?: boolean;
}

export function CloudImportButtons({ onFilesImported, disabled }: CloudImportButtonsProps) {
  const [isLoading, setIsLoading] = useState<'google' | 'dropbox' | null>(null);

  const handleGoogleImport = async () => {
    setIsLoading('google');
    try {
      const files = await openGooglePicker();
      const uploaded: UploadedFileResult[] = [];

      for (const item of files) {
        const file = new File([item.blob], item.name, { type: item.mimeType || 'image/jpeg' });
        const res = await uploadFileToS3(file);
        uploaded.push(res);
      }

      if (uploaded.length > 0) {
        onFilesImported(uploaded);
      }
    } catch (err) {
      console.error('Google Drive import error:', err);
    } finally {
      setIsLoading(null);
    }
  };

  const handleDropboxImport = async () => {
    setIsLoading('dropbox');
    try {
      const files = await openDropboxChooser();
      const uploaded: UploadedFileResult[] = [];

      for (const item of files) {
        const file = new File([item.blob], item.name, { type: 'image/jpeg' });
        const res = await uploadFileToS3(file);
        uploaded.push(res);
      }

      if (uploaded.length > 0) {
        onFilesImported(uploaded);
      }
    } catch (err) {
      console.error('Dropbox import error:', err);
    } finally {
      setIsLoading(null);
    }
  };

  return (
    <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || isLoading !== null}
        onClick={handleGoogleImport}
        className="rounded-full text-xs font-semibold gap-2 border-border/80 hover:border-foreground/50 hover:bg-[#4285F4]/10 transition-colors"
      >
        {isLoading === 'google' ? (
          <Loader2 className="size-3.5 animate-spin text-[#4285F4]" />
        ) : (
          <Cloud className="size-3.5 text-[#4285F4]" />
        )}
        <span>Google Drive</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={disabled || isLoading !== null}
        onClick={handleDropboxImport}
        className="rounded-full text-xs font-semibold gap-2 border-border/80 hover:border-foreground/50 hover:bg-[#0061FF]/10 transition-colors"
      >
        {isLoading === 'dropbox' ? (
          <Loader2 className="size-3.5 animate-spin text-[#0061FF]" />
        ) : (
          <Cloud className="size-3.5 text-[#0061FF]" />
        )}
        <span>Dropbox</span>
      </Button>
    </div>
  );
}
