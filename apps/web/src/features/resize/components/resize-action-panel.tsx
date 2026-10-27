import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Maximize2, Lock, Unlock } from 'lucide-react';
import { ResizeOptions } from '@imagelabs/shared';

interface ResizeActionPanelProps {
  onProcess: (options: ResizeOptions) => void;
  disabled?: boolean;
}

export function ResizeActionPanel({ onProcess, disabled = false }: ResizeActionPanelProps) {
  const [width, setWidth] = useState<number>(1920);
  const [height, setHeight] = useState<number>(1080);
  const [aspectLock, setAspectLock] = useState<boolean>(true);
  const [fit, setFit] = useState<'cover' | 'contain' | 'fill'>('contain');
  const [withoutEnlargement, setWithoutEnlargement] = useState<boolean>(true);

  const aspectRatio = 16 / 9;

  const handleWidthChange = (val: number) => {
    setWidth(val);
    if (aspectLock && val > 0) {
      setHeight(Math.round(val / aspectRatio));
    }
  };

  const handleHeightChange = (val: number) => {
    setHeight(val);
    if (aspectLock && val > 0) {
      setWidth(Math.round(val * aspectRatio));
    }
  };

  const handleSubmit = () => {
    onProcess({
      width: width || undefined,
      height: height || undefined,
      fit,
      withoutEnlargement,
    });
  };

  return (
    <div className="space-y-6 p-6 rounded-2xl border border-border bg-muted/30">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6">
        {/* Dimension Inputs */}
        <div className="flex items-center gap-3">
          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Width (px)</label>
            <input
              type="number"
              min="1"
              max="16384"
              value={width}
              onChange={(e) => handleWidthChange(Number(e.target.value))}
              className="h-10 w-28 rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
            />
          </div>

          <button
            type="button"
            onClick={() => setAspectLock((prev) => !prev)}
            aria-label={aspectLock ? 'Unlock aspect ratio' : 'Lock aspect ratio'}
            className="mt-5 rounded-full p-2.5 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            {aspectLock ? <Lock className="size-4" /> : <Unlock className="size-4" />}
          </button>

          <div className="space-y-1">
            <label className="text-xs font-semibold text-muted-foreground uppercase">Height (px)</label>
            <input
              type="number"
              min="1"
              max="16384"
              value={height}
              onChange={(e) => handleHeightChange(Number(e.target.value))}
              className="h-10 w-28 rounded-xl border border-border bg-background px-3 text-sm font-medium text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground"
            />
          </div>
        </div>

        {/* Fit Mode Selector */}
        <div className="space-y-1">
          <label className="text-xs font-semibold text-muted-foreground uppercase">Fit Mode</label>
          <div className="flex rounded-full border border-border bg-muted/40 p-1">
            {(['contain', 'cover', 'fill'] as const).map((mode) => (
              <button
                key={mode}
                type="button"
                onClick={() => setFit(mode)}
                className={`rounded-full px-4 py-1.5 text-xs font-medium transition-colors ${
                  fit === mode
                    ? 'bg-foreground text-background shadow-none'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between border-t border-border pt-4 gap-4">
        <label className="flex items-center gap-2.5 text-xs text-muted-foreground cursor-pointer select-none">
          <input
            type="checkbox"
            checked={withoutEnlargement}
            onChange={(e) => setWithoutEnlargement(e.target.checked)}
            className="size-4 rounded border-border text-foreground accent-foreground"
          />
          <span>Do not enlarge if image is smaller than target</span>
        </label>

        <Button
          size="lg"
          onClick={handleSubmit}
          disabled={disabled || (!width && !height)}
          className="rounded-full font-semibold gap-2 w-full sm:w-auto px-8"
        >
          <Maximize2 className="size-4" />
          <span>Resize Images</span>
        </Button>
      </div>
    </div>
  );
}
