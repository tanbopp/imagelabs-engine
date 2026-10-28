import { useState, useRef, useCallback } from 'react';
import { fabric } from 'fabric';

export interface UseFabricHistoryReturn {
  canUndo: boolean;
  canRedo: boolean;
  saveState: () => void;
  undo: () => void;
  redo: () => void;
  clearHistory: () => void;
}

export function useFabricHistory(
  getCanvas: () => fabric.Canvas | null,
  maxStates = 20,
): UseFabricHistoryReturn {
  const historyRef = useRef<string[]>([]);
  const indexRef = useRef<number>(-1);
  const isLockRef = useRef<boolean>(false);

  const [canUndo, setCanUndo] = useState(false);
  const [canRedo, setCanRedo] = useState(false);

  const updateFlags = useCallback(() => {
    setCanUndo(indexRef.current > 0);
    setCanRedo(indexRef.current < historyRef.current.length - 1);
  }, []);

  const saveState = useCallback(() => {
    if (isLockRef.current) return;
    const canvas = getCanvas();
    if (!canvas) return;

    const json = JSON.stringify(canvas.toJSON());

    // Discard any redo branch if we make a new change
    if (indexRef.current < historyRef.current.length - 1) {
      historyRef.current = historyRef.current.slice(0, indexRef.current + 1);
    }

    historyRef.current.push(json);

    // Limit maximum states to avoid memory bloat
    if (historyRef.current.length > maxStates) {
      historyRef.current.shift();
    } else {
      indexRef.current += 1;
    }

    updateFlags();
  }, [getCanvas, maxStates, updateFlags]);

  const undo = useCallback(() => {
    const canvas = getCanvas();
    if (!canvas || indexRef.current <= 0) return;

    isLockRef.current = true;
    indexRef.current -= 1;
    const state = historyRef.current[indexRef.current];

    canvas.loadFromJSON(state, () => {
      canvas.renderAll();
      isLockRef.current = false;
      updateFlags();
    });
  }, [getCanvas, updateFlags]);

  const redo = useCallback(() => {
    const canvas = getCanvas();
    if (!canvas || indexRef.current >= historyRef.current.length - 1) return;

    isLockRef.current = true;
    indexRef.current += 1;
    const state = historyRef.current[indexRef.current];

    canvas.loadFromJSON(state, () => {
      canvas.renderAll();
      isLockRef.current = false;
      updateFlags();
    });
  }, [getCanvas, updateFlags]);

  const clearHistory = useCallback(() => {
    historyRef.current = [];
    indexRef.current = -1;
    updateFlags();
  }, [updateFlags]);

  return {
    canUndo,
    canRedo,
    saveState,
    undo,
    redo,
    clearHistory,
  };
}
