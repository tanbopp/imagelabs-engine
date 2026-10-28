export interface DetectedFace {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Client-side face detection using Browser Shape Detection API or lightweight heuristic
export async function detectFacesInImage(imageEl: HTMLImageElement): Promise<DetectedFace[]> {
  // 1. Try Native Browser FaceDetector API if available (Chrome Experimental)
  if ('FaceDetector' in window) {
    try {
      // @ts-expect-error FaceDetector is experimental in standard DOM lib
      const detector = new window.FaceDetector({ fastMode: true, maxDetectedFaces: 10 });
      const faces = await detector.detect(imageEl);
      return faces.map((f: { boundingBox: { x: number; y: number; width: number; height: number } }) => ({
        x: Math.round(f.boundingBox.x),
        y: Math.round(f.boundingBox.y),
        width: Math.round(f.boundingBox.width),
        height: Math.round(f.boundingBox.height),
      }));
    } catch {
      // Fallback
    }
  }

  // 2. Default center portrait heuristic for client instant-feedback if native detector is unsupported
  const imgWidth = imageEl.naturalWidth || imageEl.width;
  const imgHeight = imageEl.naturalHeight || imageEl.height;

  return [
    {
      x: Math.round(imgWidth * 0.35),
      y: Math.round(imgHeight * 0.2),
      width: Math.round(imgWidth * 0.3),
      height: Math.round(imgHeight * 0.3),
    },
  ];
}
