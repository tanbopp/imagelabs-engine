import React, { useState, useRef, useCallback } from 'react';
import { Card } from '@/components/ui/card';

interface BeforeAfterSliderProps {
  originalUrl: string;
  processedUrl: string;
  originalLabel?: string;
  processedLabel?: string;
}

export function BeforeAfterSlider({
  originalUrl,
  processedUrl,
  originalLabel = 'Original',
  processedLabel = 'Enhanced',
}: BeforeAfterSliderProps) {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const containerRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percent = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPos(percent);
  }, []);

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseDown = () => {
    isDraggingRef.current = true;
  };

  React.useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (isDraggingRef.current) {
        handleMove(e.clientX);
      }
    };
    const onMouseUp = () => {
      isDraggingRef.current = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [handleMove]);

  return (
    <Card className="relative overflow-hidden rounded-2xl border-border bg-black/40 select-none max-w-2xl mx-auto">
      <div
        ref={containerRef}
        className="relative w-full h-[400px] flex items-center justify-center cursor-ew-resize overflow-hidden"
        onMouseDown={handleMouseDown}
        onTouchMove={handleTouchMove}
      >
        {/* Processed (Right / Background) Image */}
        <img
          src={processedUrl}
          alt={processedLabel}
          className="absolute inset-0 w-full h-full object-contain pointer-events-none"
        />

        {/* Original (Left / Foreground Clip) Image */}
        <div
          className="absolute inset-0 overflow-hidden pointer-events-none"
          style={{ width: `${sliderPos}%` }}
        >
          <img
            src={originalUrl}
            alt={originalLabel}
            className="absolute inset-0 w-full h-full object-contain pointer-events-none max-w-none"
            style={{ width: containerRef.current?.clientWidth || '100%' }}
          />
        </div>

        {/* Divider Line */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-white shadow-none pointer-events-none z-10"
          style={{ left: `${sliderPos}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 size-7 rounded-full bg-white text-black flex items-center justify-center font-bold text-xs shadow-none">
            ↔
          </div>
        </div>

        {/* Labels */}
        <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-semibold backdrop-blur-sm pointer-events-none z-20">
          {originalLabel}
        </div>
        <div className="absolute top-3 right-3 px-2.5 py-1 rounded-full bg-black/60 text-white text-[11px] font-semibold backdrop-blur-sm pointer-events-none z-20">
          {processedLabel}
        </div>
      </div>
    </Card>
  );
}
