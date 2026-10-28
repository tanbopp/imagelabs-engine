import { useEffect, useRef } from 'react';
import { fabric } from 'fabric';

interface CanvasWorkspaceProps {
  imageUrl: string;
  onCanvasReady: (canvas: fabric.Canvas) => void;
  onStateChange: () => void;
}

export function CanvasWorkspace({ imageUrl, onCanvasReady, onStateChange }: CanvasWorkspaceProps) {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const fabricCanvasRef = useRef<fabric.Canvas | null>(null);

  useEffect(() => {
    if (!canvasElRef.current || !containerRef.current) return;

    // Initialize Fabric Canvas
    const canvas = new fabric.Canvas(canvasElRef.current, {
      preserveObjectStacking: true,
      selection: true,
      backgroundColor: '#171717',
    });
    fabricCanvasRef.current = canvas;
    onCanvasReady(canvas);

    // Load background image
    fabric.Image.fromURL(
      imageUrl,
      (img) => {
        if (!containerRef.current) return;
        const containerWidth = containerRef.current.clientWidth || 800;
        const maxCanvasHeight = 560;

        const imgWidth = img.width || 800;
        const imgHeight = img.height || 600;

        const scale = Math.min(
          containerWidth / imgWidth,
          maxCanvasHeight / imgHeight,
          1,
        );

        canvas.setWidth(imgWidth * scale);
        canvas.setHeight(imgHeight * scale);

        img.set({
          scaleX: scale,
          scaleY: scale,
          originX: 'left',
          originY: 'top',
          selectable: false,
          evented: false,
        });

        canvas.setBackgroundImage(img, canvas.renderAll.bind(canvas));
        canvas.renderAll();
        onStateChange();
      },
      { crossOrigin: 'anonymous' },
    );

    // Listen for object transformations to notify history
    canvas.on('object:modified', onStateChange);
    canvas.on('object:added', onStateChange);
    canvas.on('object:removed', onStateChange);

    return () => {
      canvas.dispose();
      fabricCanvasRef.current = null;
    };
  }, [imageUrl, onCanvasReady, onStateChange]);

  return (
    <div
      ref={containerRef}
      className="w-full flex items-center justify-center p-4 bg-black/40 rounded-2xl border border-border overflow-hidden min-h-[400px]"
    >
      <canvas ref={canvasElRef} className="rounded-xl shadow-none" />
    </div>
  );
}
