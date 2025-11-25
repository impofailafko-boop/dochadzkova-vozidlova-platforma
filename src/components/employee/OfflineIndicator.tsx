import { WifiOff } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export function OfflineIndicator() {
  const { isConnected } = useNetworkStatus();

  if (isConnected) return null;

  return (
    <Alert className="mb-4 border-yellow-500 bg-yellow-500/10">
      <WifiOff className="h-4 w-4" />
      <AlertDescription>
        Offline režim aktívny. Vaše záznamy budú synchronizované po obnovení pripojenia.
      </AlertDescription>
    </Alert>
  );
}
