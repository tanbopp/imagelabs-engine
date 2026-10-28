import { Card } from '@/components/ui/card';

export type WatermarkPosition =
  | 'top-left'
  | 'top-center'
  | 'top-right'
  | 'center-left'
  | 'center'
  | 'center-right'
  | 'bottom-left'
  | 'bottom-center'
  | 'bottom-right';

interface WatermarkPositionGridProps {
  value: WatermarkPosition;
  onChange: (pos: WatermarkPosition) => void;
  disabled?: boolean;
}

const POSITIONS: WatermarkPosition[] = [
  'top-left',
  'top-center',
  'top-right',
  'center-left',
  'center',
  'center-right',
  'bottom-left',
  'bottom-center',
  'bottom-right',
];

export function WatermarkPositionGrid({ value, onChange, disabled }: WatermarkPositionGridProps) {
  return (
    <Card className="p-3 bg-muted/30 border-border inline-block">
      <div className="grid grid-cols-3 gap-2 w-32 h-32">
        {POSITIONS.map((pos) => {
          const isSelected = value === pos;
          return (
            <button
              key={pos}
              type="button"
              disabled={disabled}
              onClick={() => onChange(pos)}
              title={pos}
              className={`rounded-lg border transition-all flex items-center justify-center ${
                isSelected
                  ? 'bg-primary border-primary text-primary-foreground shadow-none'
                  : 'bg-card/70 border-border/80 hover:bg-muted text-muted-foreground'
              }`}
            >
              <div
                className={`size-2.5 rounded-full ${
                  isSelected ? 'bg-primary-foreground' : 'bg-muted-foreground/50'
                }`}
              />
            </button>
          );
        })}
      </div>
    </Card>
  );
}
