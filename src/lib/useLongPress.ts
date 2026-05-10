import { useCallback, useRef, useState } from 'react';

interface UseLongPressOptions {
  threshold?: number; // ms before long press triggers (default 500)
  onLongPress?: () => void;
  onClick?: () => void;
}

export function useLongPress({ threshold = 500, onLongPress, onClick }: UseLongPressOptions) {
  const [isPressed, setIsPressed] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isLongRef = useRef(false);

  const start = useCallback(() => {
    setIsPressed(true);
    isLongRef.current = false;
    timeoutRef.current = setTimeout(() => {
      isLongRef.current = true;
      onLongPress?.();
    }, threshold);
  }, [threshold, onLongPress]);

  const end = useCallback(() => {
    setIsPressed(false);
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (!isLongRef.current) {
      onClick?.();
    }
    isLongRef.current = false;
  }, [onClick]);

  return {
    isPressed,
    handlers: {
      onMouseDown: start,
      onMouseUp: end,
      onMouseLeave: end,
      onTouchStart: start,
      onTouchEnd: end,
    },
  };
}