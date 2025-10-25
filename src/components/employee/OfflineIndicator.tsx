import { useEffect, useState } from 'react';
import { WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

export function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <Alert className="mb-4 border-yellow-500 bg-yellow-500/10">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        Offline režim aktívny. Vaše záznamy budú synchronizované po obnovení pripojenia.
      </AlertDescription>
    </Alert>
  );
}
