import { useState, useRef, useEffect, useCallback } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CropOptions } from '@imagelabs/shared';
import { Crop, Maximize2 } from 'lucide-react';

interface CropCanvasOverlayProps {
  imageUrl: string;
  onCropChange: (options: CropOptions) => void;
}

type AspectRatioPreset = 'free' | '1:1' | '4:3' | '16:9' | '3:2' | '9:16';

export function CropCanvasOverlay({ imageUrl, onCropChange }: CropCanvasOverlayProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [naturalDimensions, setNaturalDimensions] = useState<{ width: number; height: number } | null>(null);
  const [selectedRatio, setSelectedRatio] = useState<AspectRatioPreset>('free');

  // Relative bounding box in percentage (0 to 100)
  const [box, setBox] = useState<{ x: number; y: number; width: number; height: number }>({
    x: 10,
    y: 10,
    width: 80,
    height: 80,
  });

  const isDraggingRef = useRef(false);
  const dragTypeRef = useRef<'move' | 'se' | null>(null);
  const dragStartRef = useRef<{ mouseX: number; mouseY: number; boxX: number; boxY: number; boxW: number; boxH: number }>({
    mouseX: 0,
    mouseY: 0,
    boxX: 10,
    boxY: 10,
    boxW: 80,
    boxH: 80,
  });

  const emitCrop = useCallback((curBox: typeof box, dims: { width: number; height: number } | null, ratio: AspectRatioPreset) => {
    if (!dims) return;
    if (ratio !== 'free') {
      onCropChange({ aspectRatio: ratio });
      return;
    }
    const left = Math.round((curBox.x / 100) * dims.width);
    const top = Math.round((curBox.y / 100) * dims.height);
    const width = Math.round((curBox.width / 100) * dims.width);
    const height = Math.round((curBox.height / 100) * dims.height);

    onCropChange({ left, top, width, height, aspectRatio: 'free' });
  }, [onCropChange]);

  const handleRatioChange = (ratio: AspectRatioPreset) => {
    setSelectedRatio(ratio);
    if (ratio === 'free') {
      emitCrop(box, naturalDimensions, 'free');
      return;
    }

    const [num, den] = ratio.split(':').map(Number);
    const targetAspect = num / den;

    let newWidth = 80;
    let newHeight = 80;

    if (targetAspect >= 1) {
      newHeight = Math.min(80, Math.round(80 / targetAspect));
    } else {
      newWidth = Math.min(80, Math.round(80 * targetAspect));
    }

    const newX = Math.round((100 - newWidth) / 2);
    const newY = Math.round((100 - newHeight) / 2);
    const updated = { x: newX, y: newY, width: newWidth, height: newHeight };
    setBox(updated);
    emitCrop(updated, naturalDimensions, ratio);
  };

  const handleMouseDown = (e: React.MouseEvent, type: 'move' | 'se') => {
    e.preventDefault();
    isDraggingRef.current = true;
    dragTypeRef.current = type;
    dragStartRef.current = {
      mouseX: e.clientX,
      mouseY: e.clientY,
      boxX: box.x,
      boxY: box.y,
      boxW: box.width,
      boxH: box.height,
    };
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const deltaXPercent = ((e.clientX - dragStartRef.current.mouseX) / rect.width) * 100;
      const deltaYPercent = ((e.clientY - dragStartRef.current.mouseY) / rect.height) * 100;

      if (dragTypeRef.current === 'move') {
        const maxX = 100 - dragStartRef.current.boxW;
        const maxY = 100 - dragStartRef.current.boxH;
        const newX = Math.max(0, Math.min(maxX, dragStartRef.current.boxX + deltaXPercent));
        const newY = Math.max(0, Math.min(maxY, dragStartRef.current.boxY + deltaYPercent));
        const updated = { ...box, x: newX, y: newY };
        setBox(updated);
        emitCrop(updated, naturalDimensions, selectedRatio);
      } else if (dragTypeRef.current === 'se') {
        const maxW = 100 - dragStartRef.current.boxX;
        const maxH = 100 - dragStartRef.current.boxY;
        const newW = Math.max(10, Math.min(maxW, dragStartRef.current.boxW + deltaXPercent));
        const newH = Math.max(10, Math.min(maxH, dragStartRef.current.boxH + deltaYPercent));
        const updated = { ...box, width: newW, height: newH };
        setBox(updated);
        emitCrop(updated, naturalDimensions, selectedRatio);
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      dragTypeRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [box, naturalDimensions, selectedRatio, emitCrop]);

  return (
    <Card className="p-4 bg-card/60 backdrop-blur-sm border-border space-y-4">
      {/* Preset bar */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-semibold text-muted-foreground mr-1 flex items-center gap-1">
          <Crop className="size-3.5" /> Ratio:
        </span>
        {(['free', '1:1', '4:3', '16:9', '3:2', '9:16'] as AspectRatioPreset[]).map((r) => (
          <Button
            key={r}
            type="button"
            size="sm"
            variant={selectedRatio === r ? 'default' : 'secondary'}
            className="rounded-full text-xs h-7 px-3 capitalize"
            onClick={() => handleRatioChange(r)}
          >
            {r}
          </Button>
        ))}
      </div>

      {/* Interactive preview area */}
      <div
        ref={containerRef}
        className="relative w-full max-h-[460px] flex items-center justify-center bg-black/40 rounded-xl overflow-hidden select-none"
      >
        <img
          src={imageUrl}
          alt="Crop workspace preview"
          className="max-h-[460px] object-contain pointer-events-none"
          onLoad={(e) => {
            const img = e.currentTarget;
            const dims = { width: img.naturalWidth, height: img.naturalHeight };
            setNaturalDimensions(dims);
            emitCrop(box, dims, selectedRatio);
          }}
        />

        {/* Shading overlay */}
        <div
          className="absolute border-2 border-primary bg-primary/10 rounded-sm cursor-move shadow-none"
          style={{
            left: `${box.x}%`,
            top: `${box.y}%`,
            width: `${box.width}%`,
            height: `${box.height}%`,
          }}
          onMouseDown={(e) => handleMouseDown(e, 'move')}
        >
          {/* Thirds grid lines */}
          <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
            <div className="border-r border-b border-primary/20" />
            <div className="border-r border-b border-primary/20" />
            <div className="border-b border-primary/20" />
            <div className="border-r border-b border-primary/20" />
            <div className="border-r border-b border-primary/20" />
            <div className="border-b border-primary/20" />
            <div className="border-r border-primary/20" />
            <div className="border-r border-primary/20" />
            <div />
          </div>

          {/* Resize handle bottom right */}
          <div
            className="absolute -right-2 -bottom-2 size-5 bg-primary rounded-full cursor-se-resize flex items-center justify-center shadow-none hover:scale-110 transition-transform"
            onMouseDown={(e) => {
              e.stopPropagation();
              handleMouseDown(e, 'se');
            }}
          >
            <Maximize2 className="size-3 text-primary-foreground rotate-90" />
          </div>
        </div>
      </div>
    </Card>
  );
}
