import { useAuth } from '@/contexts/AuthContext';
import { useAttendance } from '@/hooks/useAttendance';
import { useActiveVehicleLogs } from '@/hooks/useVehicleLogs';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useDebounce } from '@/hooks/useDebounce';
import { useDailyProject } from '@/hooks/useDailyProject';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { usePendingSync } from '@/hooks/usePendingSync';
import { getPendingMutations } from '@/lib/offlineStorage';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Clock, LogIn, LogOut, Loader2, MapPin, WifiOff, AlertCircle } from 'lucide-react';
import { OfflineIndicator } from './OfflineIndicator';
import { savePendingMutation } from '@/lib/offlineStorage';
import { toast } from 'sonner';
import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { formatHoursToReadable } from '@/lib/utils';
import { SelectProjectDialog } from './SelectProjectDialog';
import { useDebugLog } from '@/hooks/useDebugLog';
import { AttendanceDebugPanel } from '@/components/debug/AttendanceDebugPanel';

const AttendanceButton = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const returnUrl = searchParams.get('returnUrl');
  
  const {
    todayAttendance,
    isLoading,
    recordArrival,
    recordDeparture,
    isRecordingArrival,
    isRecordingDeparture,
  } = useAttendance(user?.id);

  const { data: activeLogs, isLoading: isLoadingActiveLogs } = useActiveVehicleLogs(user?.id);
  const { getLocation } = useGeolocation();
  const { currentProjectId, setDailyProject, clearDailyProject } = useDailyProject(user?.id);
  const { isConnected, isOnline } = useNetworkStatus();
  const { pendingCount, refreshCount } = usePendingSync();
  const { addLog } = useDebugLog();

  const [shouldNavigateBack, setShouldNavigateBack] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [offlineArrivalRecorded, setOfflineArrivalRecorded] = useState(false);
  const [offlineDepartureRecorded, setOfflineDepartureRecorded] = useState(false);
  const [isProcessingOffline, setIsProcessingOffline] = useState(false);

  const hasActiveLogs = activeLogs && activeLogs.length > 0;

  // Check for offline arrival on mount
  useEffect(() => {
    const checkOfflineArrival = async () => {
      addLog('Checking for offline attendance records...', 'info');
      
      const today = format(new Date(), 'yyyy-MM-dd');
      
      // Priority: If we have DB record FROM TODAY, use that
      if (todayAttendance && todayAttendance.date === today) {
        addLog('DB record exists for TODAY - clearing offline state', 'info');
        setOfflineArrivalRecorded(false);
        setOfflineDepartureRecorded(false);
        return;
      }
      
      // If we have old record (not today), ignore it
      if (todayAttendance && todayAttendance.date !== today) {
        addLog(`DB record is OLD (${todayAttendance.date}) - checking IndexedDB`, 'warning');
      }
      
      // Check IndexedDB for today's offline records
      if (!isLoading && user?.id) {
        const pendingMutations = await getPendingMutations('attendance');
        
        addLog(`Found ${pendingMutations.length} pending mutations`, 'info');
        
        // Find today's offline attendance mutations by timestamp
        const todayMutations = pendingMutations.filter(m => {
          if (!m.data.timestamp || m.userId !== user?.id || m.synced) return false;
          const mutationDate = format(new Date(m.data.timestamp), 'yyyy-MM-dd');
          return mutationDate === today;
        });
        
        addLog(`Found ${todayMutations.length} today's mutations`, 'info');
        
        // Check for arrival and departure types
        const hasArrival = todayMutations.some(m => m.data.type === 'arrival');
        const hasDeparture = todayMutations.some(m => m.data.type === 'departure');
        
        if (hasArrival) {
          addLog('Found offline arrival - setting offlineArrivalRecorded=true', 'success');
          setOfflineArrivalRecorded(true);
        }
        if (hasDeparture) {
          addLog('Found offline departure - setting offlineDepartureRecorded=true', 'success');
          setOfflineDepartureRecorded(true);
        }
      }
    };
    
    checkOfflineArrival();
  }, [todayAttendance, isLoading, user?.id, addLog]);

  // Clear offline state after sync
  useEffect(() => {
    if (pendingCount === 0 && (offlineArrivalRecorded || offlineDepartureRecorded)) {
      setOfflineArrivalRecorded(false);
      setOfflineDepartureRecorded(false);
      refreshCount();
    }
  }, [pendingCount, offlineArrivalRecorded, offlineDepartureRecorded, refreshCount]);

  // Navigate back after successful check-in
  useEffect(() => {
    if (shouldNavigateBack && todayAttendance?.arrival_time && returnUrl) {
      setShouldNavigateBack(false);
      setTimeout(() => {
        navigate(returnUrl);
      }, 1500); // Small delay to let user see the success message
    }
  }, [todayAttendance, shouldNavigateBack, returnUrl, navigate]);

  const today = format(new Date(), 'yyyy-MM-dd');
  const isTodayRecord = todayAttendance?.date === today;

  const hasArrived = !!(
    (isTodayRecord && todayAttendance?.arrival_time) || 
    offlineArrivalRecorded
  );

  const hasDeparted = !!(
    (isTodayRecord && todayAttendance?.departure_time) || 
    offlineDepartureRecorded
  );

  const handleArrivalClick = () => {
    console.log('=== ARRIVAL CLICK ===');
    addLog('Clicked "Príchod do práce"', 'info');
    // If project already selected today, use it directly without showing dialog
    if (currentProjectId) {
      addLog(`Using current project: ${currentProjectId}`, 'info');
      handleProjectSelect(currentProjectId);
    } else {
      addLog('Opening project selection dialog', 'info');
      // Show dialog only if no project selected today
      setShowProjectDialog(true);
    }
  };

  const handleProjectSelect = useCallback(async (projectId: string | null) => {
    addLog(`Project selected: ${projectId}`, 'info');
    
    if (!isConnected) {
      // OFFLINE: Save everything to IndexedDB
      addLog('Offline mode - saving to IndexedDB', 'info');
      setIsProcessingOffline(true);
      try {
        const now = new Date();
        
        addLog('Getting GPS location...', 'info');
        // Get GPS location with timeout (non-blocking)
        const location = await Promise.race([
          getLocation(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
        ]);

        if (location) {
          addLog(`GPS: ${location.latitude}, ${location.longitude}`, 'success');
        } else {
          addLog('GPS timeout or denied', 'warning');
        }

        // Save project selection to IndexedDB
        if (projectId) {
          addLog('Saving project_selection mutation...', 'info');
          await savePendingMutation({
            id: `${user?.id}-project-${now.getTime()}`,
            entityType: 'project_selection',
            action: 'create',
            data: {
              projectId,
              userId: user?.id || '',
              timestamp: now.toISOString(),
            },
            timestamp: now.toISOString(),
            synced: false,
            retries: 0,
            userId: user?.id || '',
          });
          addLog('Project mutation saved', 'success');
        }

        // Save attendance arrival to IndexedDB
        addLog('Saving attendance (arrival) mutation...', 'info');
        const attendanceSaved = await savePendingMutation({
          id: `${user?.id}-arrival-${now.getTime()}`,
          entityType: 'attendance',
          action: 'create',
          data: {
            type: 'arrival',
            timestamp: now.toISOString(),
            latitude: location?.latitude || null,
            longitude: location?.longitude || null,
            userId: user?.id || '',
            projectId: projectId || null,
          },
          timestamp: now.toISOString(),
          synced: false,
          retries: 0,
          userId: user?.id || '',
        });

        // Only update UI state if attendance was actually saved
        if (attendanceSaved) {
          addLog('Attendance mutation saved successfully', 'success');
          setOfflineArrivalRecorded(true);
          addLog('Set offlineArrivalRecorded = true', 'success');
          addLog(`hasArrived should now be: ${true}`, 'info');
          
          if (!location) {
            toast.success('Príchod uložený offline (bez GPS)', {
              icon: <WifiOff className="h-4 w-4" />,
              description: 'GPS poloha nie je dostupná',
            });
          } else {
            toast.success('Príchod uložený offline', {
              icon: <WifiOff className="h-4 w-4" />,
              description: 'Synchronizuje sa po pripojení',
            });
          }
        } else {
          addLog('Attendance mutation FAILED - duplicate detected', 'error');
          toast.error('Príchod už bol zaznamenaný');
        }
      } catch (error) {
        console.error('Offline arrival failed:', error);
        addLog(`Error: ${error}`, 'error');
        toast.error('Nepodarilo sa uložiť príchod offline');
      } finally {
        setIsProcessingOffline(false);
      }
    } else {
      // ONLINE: Save to database
      addLog('Online mode - using normal mutation', 'info');
      if (projectId) {
        setDailyProject({ projectId, isOnline: isConnected });
      }
      recordArrival(projectId);
      if (returnUrl) {
        setShouldNavigateBack(true);
      }
    }
  }, [isConnected, getLocation, user?.id, recordArrival, returnUrl, setDailyProject, addLog]);

  const handleDeparture = useCallback(async () => {
    addLog('Clicked "Odchod z práce"', 'info');
    
    if (!isConnected) {
      // OFFLINE: Save to IndexedDB
      addLog('Offline mode - saving to IndexedDB', 'info');
      setIsProcessingOffline(true);
      try {
        const now = new Date();
        const today = format(now, 'yyyy-MM-dd');
        
        // CRITICAL: Verify we have an arrival record from TODAY
        if (!todayAttendance) {
          addLog('No arrival record found', 'error');
          toast.error('Najprv musíte zaznamenať príchod');
          return;
        }
        
        // CRITICAL: Prevent closing old records
        if (todayAttendance.date !== today) {
          addLog(`Attempt to close old record: ${todayAttendance.date} vs ${today}`, 'error');
          toast.error('Nie je možné ukončiť záznam z iného dňa. Prosím, kontaktujte administrátora.');
          return;
        }
        
        addLog('Getting GPS location...', 'info');
        // Get GPS location with timeout (non-blocking)
        const location = await Promise.race([
          getLocation(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
        ]);

        if (location) {
          addLog(`GPS: ${location.latitude}, ${location.longitude}`, 'success');
        } else {
          addLog('GPS timeout or denied', 'warning');
        }

        addLog('Saving departure mutation...', 'info');
        const departureSaved = await savePendingMutation({
          id: `${user?.id}-departure-${now.getTime()}`,
          entityType: 'attendance',
          action: 'create',
          data: {
            type: 'departure',
            timestamp: now.toISOString(),
            latitude: location?.latitude || null,
            longitude: location?.longitude || null,
            userId: user?.id || '',
          },
          timestamp: now.toISOString(),
          synced: false,
          retries: 0,
          userId: user?.id || '',
        });

        // Only update UI state if departure was actually saved
        if (departureSaved) {
          addLog('Departure mutation saved successfully', 'success');
          setOfflineDepartureRecorded(true);
          addLog('Set offlineDepartureRecorded = true', 'success');
          
          if (!location) {
            toast.success('Odchod uložený offline (bez GPS)', {
              icon: <WifiOff className="h-4 w-4" />,
              description: 'GPS poloha nie je dostupná',
            });
          } else {
            toast.success('Odchod uložený offline', {
              icon: <WifiOff className="h-4 w-4" />,
              description: 'Synchronizuje sa po pripojení',
            });
          }
        } else {
          addLog('Departure mutation FAILED - duplicate detected', 'error');
          toast.error('Odchod už bol zaznamenaný');
        }
      } catch (error) {
        console.error('Offline departure failed:', error);
        addLog(`Error: ${error}`, 'error');
        toast.error('Nepodarilo sa uložiť odchod offline');
      } finally {
        setIsProcessingOffline(false);
      }
    } else {
      // ONLINE: Record to database
      addLog('Online mode - using normal mutation', 'info');
      recordDeparture(undefined, {
        onSuccess: () => {
          clearDailyProject();
        }
      });
    }
  }, [isConnected, getLocation, user?.id, recordDeparture, clearDailyProject, addLog, todayAttendance]);

  if (isConnected && (isLoading || isLoadingActiveLogs)) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <OfflineIndicator />
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5" />
            Dochádzka dnes
          </CardTitle>
          <CardDescription>
            {new Date().toLocaleDateString('sk-SK', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
        {/* Arrival */}
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium mb-2">Príchod</p>
            {hasArrived && (
              <>
                <p className="text-2xl font-bold text-primary">
                  {todayAttendance?.arrival_time || (
                    <span className="flex items-center gap-2">
                      {new Date().toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}
                      <WifiOff className="h-4 w-4" />
                    </span>
                  )}
                </p>
                {todayAttendance?.arrival_latitude && todayAttendance?.arrival_longitude && (
                  <a
                    href={`https://www.google.com/maps?q=${todayAttendance.arrival_latitude},${todayAttendance.arrival_longitude}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-1"
                  >
                    <MapPin className="h-3 w-3" />
                    Zobraziť polohu na mape
                  </a>
                )}
              </>
            )}
          </div>
          <Button
            onClick={handleArrivalClick}
            disabled={isRecordingArrival || isProcessingOffline || (hasArrived && !hasDeparted)}
            variant={(!hasArrived || hasDeparted) ? "success" : "outline"}
            className="w-full gap-2"
            size="lg"
          >
            {(isRecordingArrival || isProcessingOffline) ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            Príchod do práce
            {!isConnected && <WifiOff className="h-3 w-3 ml-2" />}
          </Button>
          
          <SelectProjectDialog
            open={showProjectDialog}
            onClose={() => setShowProjectDialog(false)}
            onSelect={handleProjectSelect}
          />
        </div>

        {/* Departure */}
        {hasArrived && (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-2">Odchod</p>
              {hasDeparted && (
                <>
                  <p className="text-2xl font-bold text-secondary">
                    {todayAttendance?.departure_time || (
                      <span className="flex items-center gap-2">
                        {new Date().toLocaleTimeString('sk-SK', { hour: '2-digit', minute: '2-digit' })}
                        <WifiOff className="h-4 w-4" />
                      </span>
                    )}
                  </p>
                  {todayAttendance?.departure_latitude && todayAttendance?.departure_longitude && (
                    <a
                      href={`https://www.google.com/maps?q=${todayAttendance.departure_latitude},${todayAttendance.departure_longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-1"
                    >
                      <MapPin className="h-3 w-3" />
                      Zobraziť polohu na mape
                    </a>
                  )}
                </>
              )}
            </div>
            {!hasDeparted && hasActiveLogs && (
              <Alert variant="destructive" className="mb-3">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Neukončené jazdy</AlertTitle>
                <AlertDescription className="mt-2 space-y-3">
                  <p>Pred odchodom z práce musíte ukončiť všetky aktívne jazdy.</p>
                  <p className="text-sm">Aktívnych jázd: {activeLogs?.length}</p>
                  <Button asChild variant="outline" size="sm">
                    <Link to="/dashboard">Ukončiť jazdy</Link>
                  </Button>
                </AlertDescription>
              </Alert>
            )}
            {!hasDeparted && (
              <Button
                onClick={handleDeparture}
                disabled={isRecordingDeparture || isProcessingOffline || hasActiveLogs}
                variant="secondary"
                className="w-full gap-2"
                size="lg"
              >
                {(isRecordingDeparture || isProcessingOffline) ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <LogOut className="h-4 w-4" />
                )}
                Odchod z práce
                {!isConnected && <WifiOff className="h-3 w-3 ml-2" />}
              </Button>
            )}
          </div>
        )}

        {/* Total hours */}
        {hasDeparted && todayAttendance?.total_hours && (
          <div className="pt-4 border-t">
            <p className="text-sm text-muted-foreground">Odpracované hodiny</p>
            <p className="text-3xl font-bold text-accent">
              {formatHoursToReadable(todayAttendance.total_hours)}
            </p>
          </div>
        )}
      </CardContent>
    </Card>

    {/* Debug Panel */}
    <AttendanceDebugPanel
      offlineArrivalRecorded={offlineArrivalRecorded}
      offlineDepartureRecorded={offlineDepartureRecorded}
      hasArrived={hasArrived}
      hasDeparted={hasDeparted}
      todayAttendance={todayAttendance}
      userId={user?.id || ''}
    />
    </>
  );
};

export default AttendanceButton;
