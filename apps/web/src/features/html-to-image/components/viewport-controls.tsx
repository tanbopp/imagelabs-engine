import { Card } from '@/components/ui/card';
import { Monitor, Tablet, Smartphone } from 'lucide-react';

export interface ViewportSettings {
  width: number;
  height: number;
  deviceScaleFactor: number;
}

interface ViewportControlsProps {
  viewport: ViewportSettings;
  onChange: (vp: ViewportSettings) => void;
  fullPage: boolean;
  onFullPageChange: (fp: boolean) => void;
  format: 'png' | 'jpeg';
  onFormatChange: (fmt: 'png' | 'jpeg') => void;
  disabled?: boolean;
}

const PRESETS = [
  { label: 'Desktop', width: 1920, height: 1080, icon: Monitor },
  { label: 'Laptop', width: 1280, height: 800, icon: Monitor },
  { label: 'Tablet', width: 768, height: 1024, icon: Tablet },
  { label: 'Mobile', width: 375, height: 667, icon: Smartphone },
];

export function ViewportControls({
  viewport,
  onChange,
  fullPage,
  onFullPageChange,
  format,
  onFormatChange,
  disabled,
}: ViewportControlsProps) {
  return (
    <Card className="p-5 bg-card/60 backdrop-blur-sm border-border space-y-5">
      <div className="space-y-2">
        <span className="text-xs font-semibold text-foreground uppercase tracking-wider block">
          Viewport Preset
        </span>
        <div className="flex flex-wrap gap-2">
          {PRESETS.map((preset) => {
            const Icon = preset.icon;
            const isSelected = viewport.width === preset.width && viewport.height === preset.height;
            return (
              <button
                key={preset.label}
                type="button"
                disabled={disabled}
                onClick={() =>
                  onChange({
                    ...viewport,
                    width: preset.width,
                    height: preset.height,
                  })
                }
                className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all ${
                  isSelected
                    ? 'bg-primary text-primary-foreground shadow-none'
                    : 'bg-muted/60 text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="size-3.5" />
                <span>
                  {preset.label} ({preset.width}x{preset.height})
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-border">
        {/* Format Selector */}
        <div className="space-y-1.5">
          <label className="text-xs font-medium text-foreground">Output Format</label>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={disabled}
              onClick={() => onFormatChange('png')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase ${
                format === 'png'
                  ? 'bg-primary text-primary-foreground shadow-none'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              PNG
            </button>
            <button
              type="button"
              disabled={disabled}
              onClick={() => onFormatChange('jpeg')}
              className={`px-4 py-1.5 rounded-full text-xs font-semibold uppercase ${
                format === 'jpeg'
                  ? 'bg-primary text-primary-foreground shadow-none'
                  : 'bg-muted text-muted-foreground'
              }`}
            >
              JPEG
            </button>
          </div>
        </div>

        {/* Full-Page Toggle */}
        <label className="flex items-center justify-between cursor-pointer">
          <div className="space-y-0.5">
            <span className="text-xs font-medium text-foreground">Full Page Screenshot</span>
            <p className="text-[11px] text-muted-foreground">Capture entire scrollable height</p>
          </div>
          <input
            type="checkbox"
            checked={fullPage}
            disabled={disabled}
            onChange={(e) => onFullPageChange(e.target.checked)}
            className="size-4 accent-primary rounded cursor-pointer"
          />
        </label>
      </div>
    </Card>
  );
}
