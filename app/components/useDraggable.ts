import { useState, useCallback, useRef, useEffect, useMemo } from 'react';

interface Position {
  x: number;
  y: number;
}

interface UseDraggableOptions {
  initialPosition: Position | (() => Position);
}

export function useDraggable({ initialPosition }: UseDraggableOptions) {
  const getInitial = useMemo(
    () => typeof initialPosition === 'function' ? initialPosition : () => initialPosition,
    [initialPosition]
  );
  const [position, setPosition] = useState<Position>({ x: 0, y: 0 });
  const isDragging = useRef(false);
  const dragStart = useRef<Position>({ x: 0, y: 0 });
  const posRef = useRef<Position>({ x: 0, y: 0 });
  const initialized = useRef(false);

  // Set initial position on client side to avoid SSR issues
  useEffect(() => {
    if (!initialized.current) {
      const pos = getInitial();
      posRef.current = pos;
      setPosition(pos);
      initialized.current = true;
    }
  }, [getInitial]);

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    // Only left button
    if (e.button !== 0) return;
    isDragging.current = true;
    dragStart.current = {
      x: e.clientX - posRef.current.x,
      y: e.clientY - posRef.current.y,
    };
    e.preventDefault();
  }, []);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const newX = e.clientX - dragStart.current.x;
      const newY = e.clientY - dragStart.current.y;

      // Constrain to viewport
      const maxX = window.innerWidth - 100;
      const maxY = window.innerHeight - 50;
      const clampedX = Math.max(-200, Math.min(newX, maxX));
      const clampedY = Math.max(0, Math.min(newY, maxY));

      posRef.current = { x: clampedX, y: clampedY };
      setPosition({ x: clampedX, y: clampedY });
    };

    const onMouseUp = () => {
      isDragging.current = false;
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, []);

  return { position, onMouseDown };
}
