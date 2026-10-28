import { useRef, useEffect } from 'react';

interface MemeCanvasProps {
  imageUrl: string;
  topText: string;
  bottomText: string;
  fontSize: number;
  onCanvasReady?: (canvas: HTMLCanvasElement) => void;
}

export function MemeCanvas({
  imageUrl,
  topText,
  bottomText,
  fontSize,
  onCanvasReady,
}: MemeCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageObjRef = useRef<HTMLImageElement | null>(null);

  // Helper to wrap text into multiple lines if it exceeds canvas bounds
  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    x: number,
    y: number,
    maxWidth: number,
    lineHeight: number,
    isBottom: boolean,
  ) => {
    const words = text.toUpperCase().split(' ');
    const lines: string[] = [];
    let currentLine = '';

    for (let i = 0; i < words.length; i++) {
      const testLine = currentLine ? `${currentLine} ${words[i]}` : words[i];
      const metrics = ctx.measureText(testLine);
      if (metrics.width > maxWidth && currentLine) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) lines.push(currentLine);

    const startY = isBottom ? y - (lines.length - 1) * lineHeight : y;

    lines.forEach((line, index) => {
      const lineY = startY + index * lineHeight;
      ctx.strokeText(line, x, lineY);
      ctx.fillText(line, x, lineY);
    });
  };

  const renderMeme = () => {
    const canvas = canvasRef.current;
    const img = imageObjRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Draw background base image
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    // Font and Outline styling
    ctx.font = `bold ${fontSize}px Impact, 'Arial Black', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#000000';
    ctx.lineWidth = Math.max(3, Math.round(fontSize / 8));
    ctx.lineJoin = 'miter';
    ctx.miterLimit = 2;

    const maxWidth = canvas.width * 0.9;
    const lineHeight = fontSize * 1.15;

    // Render Top Text
    if (topText.trim()) {
      wrapText(ctx, topText, canvas.width / 2, fontSize + 16, maxWidth, lineHeight, false);
    }

    // Render Bottom Text
    if (bottomText.trim()) {
      wrapText(ctx, bottomText, canvas.width / 2, canvas.height - 24, maxWidth, lineHeight, true);
    }
  };

  useEffect(() => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = imageUrl;
    img.onload = () => {
      imageObjRef.current = img;
      const canvas = canvasRef.current;
      if (!canvas) return;

      const maxWidth = 700;
      const scale = Math.min(maxWidth / img.naturalWidth, 1);
      canvas.width = img.naturalWidth * scale;
      canvas.height = img.naturalHeight * scale;

      renderMeme();
      if (onCanvasReady) onCanvasReady(canvas);
    };
  }, [imageUrl]);

  useEffect(() => {
    renderMeme();
  }, [topText, bottomText, fontSize]);

  return (
    <div className="flex items-center justify-center p-4 bg-black/40 rounded-2xl border border-border overflow-hidden">
      <canvas ref={canvasRef} className="rounded-xl shadow-none max-w-full h-auto" />
    </div>
  );
}
