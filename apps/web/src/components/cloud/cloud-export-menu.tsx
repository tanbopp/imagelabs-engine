import { useState } from 'react';
import { exportToGoogleDrive } from '@/lib/cloud/google-drive';
import { exportToDropbox } from '@/lib/cloud/dropbox';
import { Cloud, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CloudExportMenuProps {
  downloadUrl: string;
  filename: string;
}

export function CloudExportMenu({ downloadUrl, filename }: CloudExportMenuProps) {
  const [status, setStatus] = useState<'idle' | 'google-saving' | 'dropbox-saving' | 'saved'>('idle');

  const handleSaveToGoogleDrive = async () => {
    setStatus('google-saving');
    try {
      const res = await fetch(downloadUrl);
      const blob = await res.blob();
      await exportToGoogleDrive(blob, filename);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error('Save to Google Drive failed:', err);
      setStatus('idle');
    }
  };

  const handleSaveToDropbox = async () => {
    setStatus('dropbox-saving');
    try {
      await exportToDropbox(downloadUrl, filename);
      setStatus('saved');
      setTimeout(() => setStatus('idle'), 3000);
    } catch (err) {
      console.error('Save to Dropbox failed:', err);
      setStatus('idle');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={status !== 'idle'}
        onClick={handleSaveToGoogleDrive}
        className="rounded-full text-xs font-semibold gap-1.5 hover:bg-[#4285F4]/10 transition-colors"
        title="Save to Google Drive"
      >
        {status === 'google-saving' ? (
          <Loader2 className="size-3.5 animate-spin text-[#4285F4]" />
        ) : status === 'saved' ? (
          <Check className="size-3.5 text-green-500" />
        ) : (
          <Cloud className="size-3.5 text-[#4285F4]" />
        )}
        <span>Save to Drive</span>
      </Button>

      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={status !== 'idle'}
        onClick={handleSaveToDropbox}
        className="rounded-full text-xs font-semibold gap-1.5 hover:bg-[#0061FF]/10 transition-colors"
        title="Save to Dropbox"
      >
        {status === 'dropbox-saving' ? (
          <Loader2 className="size-3.5 animate-spin text-[#0061FF]" />
        ) : (
          <Cloud className="size-3.5 text-[#0061FF]" />
        )}
        <span>Save to Dropbox</span>
      </Button>
    </div>
  );
}
