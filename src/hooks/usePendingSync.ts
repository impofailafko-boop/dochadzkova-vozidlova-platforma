import { useState, useEffect, useCallback } from 'react';
import { getPendingCount } from '@/lib/offlineStorage';

export function usePendingSync() {
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const updateCount = useCallback(async () => {
    const count = await getPendingCount();
    setPendingCount(count);
  }, []);

  useEffect(() => {
    updateCount();
    
    const handleOnline = () => {
      setIsOnline(true);
      updateCount();
    };
    
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Update count every 10 seconds
    const interval = setInterval(updateCount, 10000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, [updateCount]);

  return { pendingCount, isOnline, refreshCount: updateCount };
}
