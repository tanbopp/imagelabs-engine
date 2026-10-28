import {
  MousePointer,
  Paintbrush,
  Type,
  Square,
  Circle as CircleIcon,
  Minus,
  ArrowRight,
  Sun,
  Contrast,
  Sparkles,
  Layers,
  Trash2,
  Sliders,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export type EditorMode = 'select' | 'brush' | 'text' | 'shape';
export type ShapeType = 'rect' | 'circle' | 'line' | 'arrow';

interface EditorToolbarProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
  brushColor: string;
  onBrushColorChange: (color: string) => void;
  brushWidth: number;
  onBrushWidthChange: (width: number) => void;
  onAddText: () => void;
  onAddShape: (shape: ShapeType) => void;
  onApplyFilter: (filter: 'brightness' | 'contrast' | 'grayscale' | 'sepia' | 'invert') => void;
  onBringForward: () => void;
  onSendBackward: () => void;
  onDeleteSelected: () => void;
}

export function EditorToolbar({
  mode,
  onModeChange,
  brushColor,
  onBrushColorChange,
  brushWidth,
  onBrushWidthChange,
  onAddText,
  onAddShape,
  onApplyFilter,
  onBringForward,
  onSendBackward,
  onDeleteSelected,
}: EditorToolbarProps) {
  return (
    <Card className="p-3 bg-card/70 backdrop-blur-md border-border flex flex-wrap items-center justify-between gap-3">
      {/* Primary tool modes */}
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant={mode === 'select' ? 'default' : 'secondary'}
          className="rounded-full size-9 p-0"
          title="Select & Move Objects"
          onClick={() => onModeChange('select')}
        >
          <MousePointer className="size-4" />
        </Button>

        <Button
          type="button"
          size="sm"
          variant={mode === 'brush' ? 'default' : 'secondary'}
          className="rounded-full size-9 p-0"
          title="Freehand Brush"
          onClick={() => onModeChange('brush')}
        >
          <Paintbrush className="size-4" />
        </Button>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="rounded-full size-9 p-0"
          title="Insert Text"
          onClick={onAddText}
        >
          <Type className="size-4" />
        </Button>
      </div>

      <div className="h-5 w-px bg-border/80 hidden sm:block" />

      {/* Shapes Injection */}
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="rounded-full size-9 p-0"
          title="Add Rectangle"
          onClick={() => onAddShape('rect')}
        >
          <Square className="size-4" />
        </Button>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="rounded-full size-9 p-0"
          title="Add Circle"
          onClick={() => onAddShape('circle')}
        >
          <CircleIcon className="size-4" />
        </Button>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="rounded-full size-9 p-0"
          title="Add Line"
          onClick={() => onAddShape('line')}
        >
          <Minus className="size-4" />
        </Button>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="rounded-full size-9 p-0"
          title="Add Arrow"
          onClick={() => onAddShape('arrow')}
        >
          <ArrowRight className="size-4" />
        </Button>
      </div>

      <div className="h-5 w-px bg-border/80 hidden sm:block" />

      {/* Brush Settings */}
      {mode === 'brush' && (
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={brushColor}
            onChange={(e) => onBrushColorChange(e.target.value)}
            className="size-7 rounded-full cursor-pointer border border-border bg-transparent p-0"
            title="Brush Color"
          />
          <div className="flex items-center gap-1.5">
            <Sliders className="size-3.5 text-muted-foreground" />
            <input
              type="range"
              min="1"
              max="40"
              value={brushWidth}
              onChange={(e) => onBrushWidthChange(Number(e.target.value))}
              className="w-20 accent-primary h-1.5 bg-muted rounded cursor-pointer"
              title={`Brush Width: ${brushWidth}px`}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="rounded-full size-9 p-0"
          title="Brightness"
          onClick={() => onApplyFilter('brightness')}
        >
          <Sun className="size-4" />
        </Button>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="rounded-full size-9 p-0"
          title="Contrast"
          onClick={() => onApplyFilter('contrast')}
        >
          <Contrast className="size-4" />
        </Button>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="rounded-full size-9 p-0"
          title="Grayscale"
          onClick={() => onApplyFilter('grayscale')}
        >
          <Sparkles className="size-4" />
        </Button>
      </div>

      <div className="h-5 w-px bg-border/80 hidden sm:block" />

      {/* Layers & Delete */}
      <div className="flex items-center gap-1.5">
        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="rounded-full size-9 p-0"
          title="Bring Forward"
          onClick={onBringForward}
        >
          <Layers className="size-4" />
        </Button>

        <Button
          type="button"
          size="sm"
          variant="secondary"
          className="rounded-full size-9 p-0"
          title="Send Backward"
          onClick={onSendBackward}
        >
          <Layers className="size-4 rotate-180" />
        </Button>

        <Button
          type="button"
          size="sm"
          variant="ghost"
          className="rounded-full size-9 p-0 text-destructive hover:bg-destructive/10"
          title="Delete Selected"
          onClick={onDeleteSelected}
        >
          <Trash2 className="size-4" />
        </Button>
      </div>
    </Card>
  );
}
