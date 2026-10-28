import { useState, useRef, useCallback } from 'react';
import { fabric } from 'fabric';
import { UploadZone } from '@/components/upload/upload-zone';
import { CanvasWorkspace } from '../components/canvas-workspace';
import { EditorToolbar, EditorMode, ShapeType } from '../components/editor-toolbar';
import { useFabricHistory } from '../hooks/use-fabric-history';
import { UploadedFileResult, uploadFileToS3 } from '@/lib/s3-upload';
import { ArrowLeft, Undo2, Redo2, Download, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

export function EditorPage({ onBack }: { onBack?: () => void }) {
  const [stagedFiles, setStagedFiles] = useState<UploadedFileResult[]>([]);
  const [mode, setMode] = useState<EditorMode>('select');
  const [brushColor, setBrushColor] = useState<string>('#3b82f6');
  const [brushWidth, setBrushWidth] = useState<number>(5);
  const [isExporting, setIsExporting] = useState(false);
  const [exportedUrl, setExportedUrl] = useState<string | null>(null);

  const canvasRef = useRef<fabric.Canvas | null>(null);

  const getCanvas = useCallback(() => canvasRef.current, []);
  const { canUndo, canRedo, saveState, undo, redo } = useFabricHistory(getCanvas);

  const handleCanvasReady = useCallback((canvas: fabric.Canvas) => {
    canvasRef.current = canvas;
  }, []);

  const handleModeChange = (newMode: EditorMode) => {
    setMode(newMode);
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (newMode === 'brush') {
      canvas.isDrawingMode = true;
      canvas.freeDrawingBrush.color = brushColor;
      canvas.freeDrawingBrush.width = brushWidth;
    } else {
      canvas.isDrawingMode = false;
    }
  };

  const handleBrushColorChange = (color: string) => {
    setBrushColor(color);
    if (canvasRef.current && mode === 'brush') {
      canvasRef.current.freeDrawingBrush.color = color;
    }
  };

  const handleBrushWidthChange = (width: number) => {
    setBrushWidth(width);
    if (canvasRef.current && mode === 'brush') {
      canvasRef.current.freeDrawingBrush.width = width;
    }
  };

  const handleAddText = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const text = new fabric.IText('Double click to edit', {
      left: 100,
      top: 100,
      fontFamily: 'Manrope, sans-serif',
      fontSize: 24,
      fill: '#ffffff',
    });

    canvas.add(text);
    canvas.setActiveObject(text);
    canvas.renderAll();
    saveState();
  };

  const handleAddShape = (shape: ShapeType) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    let obj: fabric.Object;

    if (shape === 'rect') {
      obj = new fabric.Rect({
        left: 100,
        top: 100,
        width: 120,
        height: 80,
        fill: 'transparent',
        stroke: brushColor,
        strokeWidth: 3,
      });
    } else if (shape === 'circle') {
      obj = new fabric.Circle({
        left: 100,
        top: 100,
        radius: 50,
        fill: 'transparent',
        stroke: brushColor,
        strokeWidth: 3,
      });
    } else if (shape === 'line') {
      obj = new fabric.Line([50, 100, 200, 100], {
        stroke: brushColor,
        strokeWidth: 3,
      });
    } else {
      // Arrow: Line with triangle tip
      const line = new fabric.Line([50, 100, 180, 100], {
        stroke: brushColor,
        strokeWidth: 3,
        originX: 'center',
        originY: 'center',
      });
      const triangle = new fabric.Triangle({
        left: 190,
        top: 100,
        angle: 90,
        width: 14,
        height: 14,
        fill: brushColor,
        originX: 'center',
        originY: 'center',
      });
      obj = new fabric.Group([line, triangle]);
    }

    canvas.add(obj);
    canvas.setActiveObject(obj);
    canvas.renderAll();
    saveState();
  };

  const handleApplyFilter = (filterType: 'brightness' | 'contrast' | 'grayscale' | 'sepia' | 'invert') => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const bgImage = canvas.backgroundImage as fabric.Image;
    if (!bgImage) return;

    if (!bgImage.filters) {
      bgImage.filters = [];
    }

    if (filterType === 'brightness') {
      bgImage.filters.push(new fabric.Image.filters.Brightness({ brightness: 0.1 }));
    } else if (filterType === 'contrast') {
      bgImage.filters.push(new fabric.Image.filters.Contrast({ contrast: 0.15 }));
    } else if (filterType === 'grayscale') {
      bgImage.filters.push(new fabric.Image.filters.Grayscale());
    } else if (filterType === 'sepia') {
      bgImage.filters.push(new fabric.Image.filters.Sepia());
    } else if (filterType === 'invert') {
      bgImage.filters.push(new fabric.Image.filters.Invert());
    }

    bgImage.applyFilters();
    canvas.renderAll();
    saveState();
  };

  const handleBringForward = () => {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (active && canvas) {
      canvas.bringForward(active);
      canvas.renderAll();
      saveState();
    }
  };

  const handleSendBackward = () => {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (active && canvas) {
      canvas.sendBackwards(active);
      canvas.renderAll();
      saveState();
    }
  };

  const handleDeleteSelected = () => {
    const canvas = canvasRef.current;
    const active = canvas?.getActiveObject();
    if (active && canvas) {
      canvas.remove(active);
      canvas.discardActiveObject();
      canvas.renderAll();
      saveState();
    }
  };

  const handleExportAndDownload = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setIsExporting(true);

    try {
      // Discard active object selection bounding box during export
      canvas.discardActiveObject();
      canvas.renderAll();

      const dataUrl = canvas.toDataURL({ format: 'png', quality: 1.0 });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      const file = new File([blob], `edited-${Date.now()}.png`, { type: 'image/png' });

      // Direct upload to S3 using the presigned pipeline
      await uploadFileToS3(file);

      // Offer direct client download link
      const blobUrl = URL.createObjectURL(blob);
      setExportedUrl(blobUrl);
    } catch (err) {
      console.error('Export error:', err);
    } finally {
      setIsExporting(false);
    }
  };

  const handleReset = () => {
    setStagedFiles([]);
    setExportedUrl(null);
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors font-medium"
        >
          <ArrowLeft className="size-4" />
          <span>Back to All Tools</span>
        </button>
      )}

      <div className="text-center space-y-2">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
          Photo Editor
        </h1>
        <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto">
          In-browser canvas editing: annotate, draw, insert shapes, and apply filters. Zero latency, 100% private.
        </p>
      </div>

      {exportedUrl && (
        <Card className="p-6 text-center space-y-4 bg-card/60 border-border max-w-xl mx-auto">
          <h3 className="text-lg font-semibold text-foreground">Image Exported Successfully!</h3>
          <p className="text-sm text-muted-foreground">
            Your annotated image has been generated and saved.
          </p>
          <div className="flex items-center justify-center gap-4">
            <a
              href={exportedUrl}
              download="edited-imagelabs.png"
              className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
            >
              <Download className="size-4" />
              Download PNG
            </a>
            <Button
              variant="secondary"
              className="rounded-full inline-flex items-center gap-2"
              onClick={handleReset}
            >
              <RefreshCw className="size-4" />
              Edit Another Image
            </Button>
          </div>
        </Card>
      )}

      {!exportedUrl && stagedFiles.length === 0 && (
        <UploadZone
          acceptMultiple={false}
          onFilesUploaded={(files) => {
            if (files.length > 0) setStagedFiles(files);
          }}
        />
      )}

      {!exportedUrl && stagedFiles.length > 0 && (
        <div className="space-y-4">
          {/* Top Bar with History & Export */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full size-8 p-0"
                disabled={!canUndo}
                onClick={undo}
                title="Undo (Ctrl+Z)"
              >
                <Undo2 className="size-4" />
              </Button>
              <Button
                type="button"
                variant="secondary"
                size="sm"
                className="rounded-full size-8 p-0"
                disabled={!canRedo}
                onClick={redo}
                title="Redo (Ctrl+Y)"
              >
                <Redo2 className="size-4" />
              </Button>
            </div>

            <Button
              type="button"
              size="sm"
              className="rounded-full px-6 font-semibold flex items-center gap-2 shadow-none"
              disabled={isExporting}
              onClick={handleExportAndDownload}
            >
              <Download className="size-4" />
              <span>{isExporting ? 'Exporting...' : 'Save & Download'}</span>
            </Button>
          </div>

          {/* Interactive Toolbar */}
          <EditorToolbar
            mode={mode}
            onModeChange={handleModeChange}
            brushColor={brushColor}
            onBrushColorChange={handleBrushColorChange}
            brushWidth={brushWidth}
            onBrushWidthChange={handleBrushWidthChange}
            onAddText={handleAddText}
            onAddShape={handleAddShape}
            onApplyFilter={handleApplyFilter}
            onBringForward={handleBringForward}
            onSendBackward={handleSendBackward}
            onDeleteSelected={handleDeleteSelected}
          />

          {/* Canvas Workspace */}
          <CanvasWorkspace
            imageUrl={stagedFiles[0].previewUrl || ''}
            onCanvasReady={handleCanvasReady}
            onStateChange={saveState}
          />
        </div>
      )}
    </div>
  );
}
