import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RefreshCw, Loader2, WifiOff } from 'lucide-react';
import { usePendingSync } from '@/hooks/usePendingSync';
import { syncPendingMutations } from '@/lib/syncManager';
import { toast } from 'sonner';
import { useState } from 'react';

export function PendingSyncBadge() {
  const { pendingCount, isOnline, refreshCount } = usePendingSync();
  const [isSyncing, setIsSyncing] = useState(false);

  const handleSyncNow = async () => {
    if (!isOnline) {
      toast.error('Nie ste pripojení k internetu');
      return;
    }

    try {
      setIsSyncing(true);
      const result = await syncPendingMutations();
      
      if (result.success > 0) {
        toast.success(`Synchronizované ${result.success} záznamov`);
      }
      if (result.failed > 0) {
        toast.warning(`Nepodarilo sa synchronizovať ${result.failed} záznamov`);
      }
      if (result.success === 0 && result.failed === 0) {
        toast.info('Žiadne záznamy na synchronizáciu');
      }
      
      await refreshCount();
    } catch (error) {
      toast.error('Chyba pri synchronizácii');
    } finally {
      setIsSyncing(false);
    }
  };

  if (pendingCount === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 p-2 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg border border-yellow-300 dark:border-yellow-700">
      <WifiOff className="h-4 w-4 text-yellow-600 dark:text-yellow-500" />
      <Badge variant="secondary" className="gap-1 bg-yellow-200 dark:bg-yellow-800 text-yellow-900 dark:text-yellow-100">
        {pendingCount} {pendingCount === 1 ? 'záznam' : 'záznamy'} čaká
      </Badge>
      <Button
        size="sm"
        variant="outline"
        onClick={handleSyncNow}
        disabled={!isOnline || isSyncing}
        className="ml-auto"
      >
        {isSyncing ? (
          <>
            <Loader2 className="h-3 w-3 mr-1 animate-spin" />
            Synchronizuje sa
          </>
        ) : (
          <>
            <RefreshCw className="h-3 w-3 mr-1" />
            Synchronizovať
          </>
        )}
      </Button>
    </div>
  );
}
