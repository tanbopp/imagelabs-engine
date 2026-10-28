import { RotateCw, RotateCcw, Compass, Undo } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { RotateOptions } from '@imagelabs/shared';

interface RotateControlsProps {
  options: RotateOptions;
  onChange: (options: RotateOptions) => void;
  disabled?: boolean;
}

export function RotateControls({ options, onChange, disabled }: RotateControlsProps) {
  const handleRotateStep = (delta: number) => {
    const nextAngle = (options.angle + delta + 360) % 360;
    onChange({ ...options, angle: nextAngle });
  };

  return (
    <Card className="p-6 bg-card/60 backdrop-blur-sm border-border space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Quick orthogonal buttons */}
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full flex items-center gap-2 h-9 px-4"
            disabled={disabled}
            onClick={() => handleRotateStep(-90)}
          >
            <RotateCcw className="size-4" />
            <span>-90° Left</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full flex items-center gap-2 h-9 px-4"
            disabled={disabled}
            onClick={() => handleRotateStep(90)}
          >
            <RotateCw className="size-4" />
            <span>+90° Right</span>
          </Button>

          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="rounded-full flex items-center gap-2 h-9 px-4"
            disabled={disabled}
            onClick={() => handleRotateStep(180)}
          >
            <Compass className="size-4" />
            <span>180° Flip</span>
          </Button>
        </div>

        {/* Reset button */}
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="rounded-full text-muted-foreground flex items-center gap-1.5 h-9"
          disabled={disabled || options.angle === 0}
          onClick={() => onChange({ ...options, angle: 0 })}
        >
          <Undo className="size-3.5" />
          <span>Reset</span>
        </Button>
      </div>

      {/* Angle Slider */}
      <div className="space-y-3">
        <div className="flex items-center justify-between text-sm">
          <span className="font-semibold text-foreground">Custom Angle</span>
          <span className="font-mono text-xs bg-muted px-2 py-0.5 rounded-full text-foreground">
            {options.angle}°
          </span>
        </div>
        <input
          type="range"
          min="0"
          max="360"
          step="1"
          value={options.angle}
          disabled={disabled}
          onChange={(e) => onChange({ ...options, angle: Number(e.target.value) })}
          className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
        />
        <div className="flex justify-between text-[11px] text-muted-foreground">
          <span>0°</span>
          <span>90°</span>
          <span>180°</span>
          <span>270°</span>
          <span>360°</span>
        </div>
      </div>

      {/* Auto-orient toggle */}
      <label className="flex items-center justify-between pt-2 border-t border-border/50 cursor-pointer">
        <div className="space-y-0.5">
          <span className="text-sm font-medium text-foreground">Auto-Orient via EXIF</span>
          <p className="text-xs text-muted-foreground">
            Automatically correct mobile camera rotation orientation
          </p>
        </div>
        <input
          type="checkbox"
          checked={options.autoOrient}
          disabled={disabled}
          onChange={(e) => onChange({ ...options, autoOrient: e.target.checked })}
          className="size-4 accent-primary rounded cursor-pointer"
        />
      </label>
    </Card>
  );
}
