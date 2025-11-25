import { useState, useEffect } from 'react';
import { Bug, X, Download, Trash2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { usePendingSync } from '@/hooks/usePendingSync';
import { useDebugLog } from '@/hooks/useDebugLog';
import { getPendingMutations, clearPendingMutations } from '@/lib/offlineStorage';
import { format } from 'date-fns';
import { toast } from 'sonner';

interface AttendanceDebugPanelProps {
  offlineArrivalRecorded: boolean;
  offlineDepartureRecorded: boolean;
  hasArrived: boolean;
  hasDeparted: boolean;
  todayAttendance: any;
  userId: string;
}

export function AttendanceDebugPanel({
  offlineArrivalRecorded,
  offlineDepartureRecorded,
  hasArrived,
  hasDeparted,
  todayAttendance,
  userId,
}: AttendanceDebugPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [indexDBInfo, setIndexDBInfo] = useState<any>(null);
  const [lastUpdate, setLastUpdate] = useState<string>('');
  
  const { isOnline, isConnected } = useNetworkStatus();
  const { pendingCount } = usePendingSync();
  const { logs, clearLogs, exportLogs } = useDebugLog();

  // Refresh IndexedDB info
  const refreshIndexDB = async () => {
    try {
      console.log('[DEBUG] Fetching IndexedDB mutations...');
      const mutations = await getPendingMutations('attendance');
      console.log('[DEBUG] Got mutations:', mutations.length);
      
      const today = format(new Date(), 'yyyy-MM-dd');
      const todayMutations = mutations.filter((m: any) => {
        const timestamp = m.data.timestamp || m.timestamp;
        if (!timestamp) return false;
        const mutationDate = format(new Date(timestamp), 'yyyy-MM-dd');
        return mutationDate === today && m.userId === userId;
      });
      
      console.log('[DEBUG] Filtered today mutations:', todayMutations.length);
      
      setIndexDBInfo({
        totalPending: mutations.length,
        todayArrivals: todayMutations.filter((m: any) => m.data.type === 'arrival').length,
        todayDepartures: todayMutations.filter((m: any) => m.data.type === 'departure').length,
        mutations: todayMutations,
      });
      setLastUpdate(new Date().toLocaleTimeString());
    } catch (error) {
      console.error('[DEBUG] ERROR in refreshIndexDB:', error);
      console.error('[DEBUG] Error stack:', (error as Error).stack);
      toast.error('Chyba pri načítaní IndexedDB');
    }
  };

  const clearOldMutations = async () => {
    try {
      console.log('[DEBUG] Clearing all attendance mutations...');
      await clearPendingMutations('attendance');
      console.log('[DEBUG] Mutations cleared successfully');
      
      console.log('[DEBUG] Refreshing IndexedDB info...');
      await refreshIndexDB();
      console.log('[DEBUG] IndexedDB refreshed');
      
      toast.success('Všetky offline mutácie vymazané');
    } catch (error) {
      console.error('[DEBUG] ERROR in clearOldMutations:', error);
      console.error('[DEBUG] Error message:', (error as Error).message);
      console.error('[DEBUG] Error stack:', (error as Error).stack);
      toast.error(`Chyba: ${(error as Error).message || 'Nepodarilo sa vymazať mutácie'}`);
    }
  };

  useEffect(() => {
    if (isOpen) {
      refreshIndexDB();
      const interval = setInterval(refreshIndexDB, 2000);
      return () => clearInterval(interval);
    }
  }, [isOpen, userId]);

  const StatusIndicator = ({ active }: { active: boolean }) => (
    <span className={`inline-block w-2 h-2 rounded-full ${active ? 'bg-green-500' : 'bg-red-500'}`} />
  );

  if (!isOpen) {
    return (
      <Button
        size="icon"
        variant="outline"
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-[9999] h-12 w-12 rounded-full shadow-lg"
      >
        <Bug className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-4 right-4 z-[9999] w-[400px] max-h-[600px] overflow-hidden flex flex-col shadow-2xl">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b bg-muted/50">
        <div className="flex items-center gap-2">
          <Bug className="h-4 w-4" />
          <span className="font-semibold text-sm">Attendance Debug</span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="icon" variant="ghost" onClick={refreshIndexDB} className="h-7 w-7">
            <RefreshCw className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" onClick={exportLogs} className="h-7 w-7">
            <Download className="h-3 w-3" />
          </Button>
          <Button 
            size="icon" 
            variant="ghost" 
            onClick={clearOldMutations} 
            className="h-7 w-7 text-destructive hover:text-destructive"
            title="Clear all mutations"
          >
            <Trash2 className="h-3 w-3" />
          </Button>
          <Button size="icon" variant="ghost" onClick={() => setIsOpen(false)} className="h-7 w-7">
            <X className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="overflow-y-auto flex-1 p-3 space-y-2 text-xs">
        {/* Network Status */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-muted/50 rounded hover:bg-muted">
            <span className="font-semibold">Network Status</span>
            <span className="text-xs text-muted-foreground">{lastUpdate}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 px-2 space-y-1">
            <div className="flex items-center justify-between">
              <span>isOnline:</span>
              <div className="flex items-center gap-2">
                <StatusIndicator active={isOnline} />
                <span className="font-mono">{String(isOnline)}</span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span>isConnected:</span>
              <div className="flex items-center gap-2">
                <StatusIndicator active={isConnected} />
                <span className="font-mono">{String(isConnected)}</span>
              </div>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* Offline State */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-muted/50 rounded hover:bg-muted">
            <span className="font-semibold">Offline State</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 px-2 space-y-1">
            <div className="flex items-center justify-between">
              <span>offlineArrivalRecorded:</span>
              <span className="font-mono">{String(offlineArrivalRecorded)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>offlineDepartureRecorded:</span>
              <span className="font-mono">{String(offlineDepartureRecorded)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>hasArrived:</span>
              <span className="font-mono font-bold text-primary">{String(hasArrived)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>hasDeparted:</span>
              <span className="font-mono font-bold text-primary">{String(hasDeparted)}</span>
            </div>
          </CollapsibleContent>
        </Collapsible>

        {/* IndexedDB Info */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-muted/50 rounded hover:bg-muted">
            <span className="font-semibold">IndexedDB Info</span>
            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">{pendingCount}</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 px-2 space-y-1">
            {indexDBInfo ? (
              <>
                <div className="flex items-center justify-between">
                  <span>Total pending attendance:</span>
                  <span className="font-mono">{indexDBInfo.totalPending}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Today arrivals (unsynced):</span>
                  <span className="font-mono">{indexDBInfo.todayArrivals}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Today departures (unsynced):</span>
                  <span className="font-mono">{indexDBInfo.todayDepartures}</span>
                </div>
                {indexDBInfo.mutations.length > 0 && (
                  <div className="mt-2 pt-2 border-t space-y-1">
                    <div className="font-semibold">Mutations:</div>
                    {indexDBInfo.mutations.map((m: any) => (
                      <div key={m.id} className="bg-muted/30 p-1 rounded text-[10px] font-mono">
                        <div>id: {m.id.slice(0, 8)}...</div>
                        <div>type: {m.data.type || 'unknown'}</div>
                        <div>synced: {String(m.synced)}</div>
                        <div>time: {new Date(m.timestamp).toLocaleTimeString()}</div>
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-muted-foreground">Loading...</div>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Database State */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-muted/50 rounded hover:bg-muted">
            <span className="font-semibold">Database State</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 px-2 space-y-1">
            <div className="flex items-center justify-between">
              <span>todayAttendance exists:</span>
              <span className="font-mono">{String(!!todayAttendance)}</span>
            </div>
            {todayAttendance && (
              <>
                <div className="flex items-center justify-between">
                  <span>date:</span>
                  <span className="font-mono">{todayAttendance.date}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>arrival_time:</span>
                  <span className="font-mono">{todayAttendance.arrival_time || 'null'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>departure_time:</span>
                  <span className="font-mono">{todayAttendance.departure_time || 'null'}</span>
                </div>
              </>
            )}
          </CollapsibleContent>
        </Collapsible>

        {/* Event Logs */}
        <Collapsible defaultOpen>
          <CollapsibleTrigger className="flex items-center justify-between w-full p-2 bg-muted/50 rounded hover:bg-muted">
            <span className="font-semibold">Event Logs</span>
            <span className="text-xs text-muted-foreground">{logs.length} events</span>
          </CollapsibleTrigger>
          <CollapsibleContent className="pt-2 px-2 space-y-1 max-h-[200px] overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-muted-foreground text-center py-2">No events logged</div>
            ) : (
              logs.map((log, idx) => (
                <div
                  key={idx}
                  className={`font-mono text-[10px] p-1 rounded ${
                    log.level === 'success'
                      ? 'bg-green-500/10 text-green-700 dark:text-green-400'
                      : log.level === 'error'
                      ? 'bg-red-500/10 text-red-700 dark:text-red-400'
                      : log.level === 'warning'
                      ? 'bg-yellow-500/10 text-yellow-700 dark:text-yellow-400'
                      : 'bg-muted/30'
                  }`}
                >
                  <span className="text-muted-foreground">[{log.timestamp}]</span> {log.message}
                </div>
              ))
            )}
          </CollapsibleContent>
        </Collapsible>
      </div>
    </Card>
  );
}
