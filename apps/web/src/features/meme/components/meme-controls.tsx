import { Card } from '@/components/ui/card';
import { Type, Sliders } from 'lucide-react';

interface MemeControlsProps {
  topText: string;
  onTopTextChange: (text: string) => void;
  bottomText: string;
  onBottomTextChange: (text: string) => void;
  fontSize: number;
  onFontSizeChange: (size: number) => void;
  disabled?: boolean;
}

export function MemeControls({
  topText,
  onTopTextChange,
  bottomText,
  onBottomTextChange,
  fontSize,
  onFontSizeChange,
  disabled,
}: MemeControlsProps) {
  return (
    <Card className="p-6 bg-card/60 backdrop-blur-sm border-border space-y-5">
      {/* Top Text input */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Type className="size-3.5" /> Top Text
        </label>
        <input
          type="text"
          value={topText}
          disabled={disabled}
          onChange={(e) => onTopTextChange(e.target.value)}
          placeholder="ONE DOES NOT SIMPLY"
          className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground uppercase font-bold focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Bottom Text input */}
      <div className="space-y-2">
        <label className="text-xs font-semibold text-foreground uppercase tracking-wider flex items-center gap-1.5">
          <Type className="size-3.5" /> Bottom Text
        </label>
        <input
          type="text"
          value={bottomText}
          disabled={disabled}
          onChange={(e) => onBottomTextChange(e.target.value)}
          placeholder="WALK INTO MORDOR"
          className="w-full px-4 py-2.5 rounded-xl bg-background border border-border text-sm text-foreground uppercase font-bold focus:outline-none focus:ring-1 focus:ring-primary"
        />
      </div>

      {/* Font Size Slider */}
      <div className="space-y-2 pt-2 border-t border-border">
        <div className="flex justify-between text-xs">
          <span className="font-medium text-foreground flex items-center gap-1">
            <Sliders className="size-3 text-muted-foreground" /> Font Size
          </span>
          <span className="font-mono text-muted-foreground">{fontSize}px</span>
        </div>
        <input
          type="range"
          min="20"
          max="80"
          step="2"
          value={fontSize}
          disabled={disabled}
          onChange={(e) => onFontSizeChange(Number(e.target.value))}
          className="w-full accent-primary h-2 bg-muted rounded-lg cursor-pointer"
        />
      </div>
    </Card>
  );
}
