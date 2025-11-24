import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

/**
 * Hook for reliable network connectivity detection.
 * 
 * Unlike navigator.onLine which only checks if the device has a network interface,
 * this hook performs actual connectivity tests to verify real internet access.
 * 
 * @returns {isOnline, isConnected}
 *   - isOnline: Basic check (navigator.onLine) - device has network interface
 *   - isConnected: Active test - device can actually reach the internet/Supabase
 */
export function useNetworkStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isConnected, setIsConnected] = useState(false);

  // Test actual connectivity by pinging Supabase
  const testConnectivity = async (): Promise<boolean> => {
    if (!navigator.onLine) {
      return false;
    }

    try {
      // Simple ping to Supabase to test real connectivity
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);
      
      return !error;
    } catch {
      return false;
    }
  };

  useEffect(() => {
  const handleOnline = () => {
    setIsOnline(true);
    setIsConnected(false);
    // Test actual connectivity when browser reports online
    testConnectivity().then(setIsConnected);
  };

    const handleOffline = () => {
      setIsOnline(false);
      setIsConnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initial connectivity test
    testConnectivity().then(setIsConnected);

    // Periodic connectivity test (every 30 seconds)
    const interval = setInterval(() => {
      if (navigator.onLine) {
        testConnectivity().then(setIsConnected);
      }
    }, 30000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  return {
    isOnline,      // Basic check - device has network interface
    isConnected,   // Active test - can actually reach internet
  };
}
