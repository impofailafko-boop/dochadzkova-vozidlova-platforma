import { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';

export function useDebounce(callback: Function, delay: number = 500) {
  const [isDebouncing, setIsDebouncing] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const debouncedFn = useCallback((...args: any[]) => {
    if (isDebouncing) {
      return;
    }

    setIsDebouncing(true);
    callback(...args);

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      setIsDebouncing(false);
    }, delay);
  }, [callback, delay, isDebouncing]);

  return { debouncedFn, isDebouncing };
}
