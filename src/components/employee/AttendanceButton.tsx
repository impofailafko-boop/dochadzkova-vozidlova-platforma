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
  const { isConnected } = useNetworkStatus();
  const { pendingCount, refreshCount } = usePendingSync();

  const [shouldNavigateBack, setShouldNavigateBack] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);
  const [offlineArrivalRecorded, setOfflineArrivalRecorded] = useState(false);
  const [offlineDepartureRecorded, setOfflineDepartureRecorded] = useState(false);

  const hasActiveLogs = activeLogs && activeLogs.length > 0;

  // Check for offline arrival on mount
  useEffect(() => {
    const checkOfflineArrival = async () => {
      // Priority: If we have DB record, use that (online mode)
      if (todayAttendance) {
        setOfflineArrivalRecorded(false);
        setOfflineDepartureRecorded(false);
        return;
      }
      
      // Offline: No DB record, check IndexedDB
      if (!isLoading && !todayAttendance && user?.id) {
        const today = format(new Date(), 'yyyy-MM-dd');
        const pendingMutations = await getPendingMutations('attendance');
        
        // Find today's offline attendance mutations by timestamp
        const todayMutations = pendingMutations.filter(m => {
          if (!m.data.timestamp || m.userId !== user?.id || m.synced) return false;
          const mutationDate = format(new Date(m.data.timestamp), 'yyyy-MM-dd');
          return mutationDate === today;
        });
        
        // Check for arrival and departure types
        const hasArrival = todayMutations.some(m => m.data.type === 'arrival');
        const hasDeparture = todayMutations.some(m => m.data.type === 'departure');
        
        setOfflineArrivalRecorded(hasArrival);
        setOfflineDepartureRecorded(hasDeparture);
      }
    };
    
    checkOfflineArrival();
  }, [todayAttendance, isLoading, user?.id]);

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

  const hasArrived = todayAttendance?.arrival_time || offlineArrivalRecorded;
  const hasDeparted = todayAttendance?.departure_time || offlineDepartureRecorded;

  const handleArrivalClick = () => {
    // If project already selected today, use it directly without showing dialog
    if (currentProjectId) {
      handleProjectSelectCore(currentProjectId);
    } else {
      // Show dialog only if no project selected today
      setShowProjectDialog(true);
    }
  };

  const handleProjectSelectCore = useCallback(async (projectId: string | null) => {
    if (!isConnected) {
      // OFFLINE: Save everything to IndexedDB
      try {
        const now = new Date();
        
        // Get GPS location with timeout (non-blocking)
        const location = await Promise.race([
          getLocation(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
        ]);

        // Save project selection to IndexedDB
        if (projectId) {
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
        }

        // Save attendance arrival to IndexedDB
        await savePendingMutation({
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

        setOfflineArrivalRecorded(true);
        
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
      } catch (error) {
        console.error('Offline arrival failed:', error);
        toast.error('Nepodarilo sa uložiť príchod offline');
      }
    } else {
      // ONLINE: Save to database
      if (projectId) {
        setDailyProject({ projectId, isOnline: isConnected });
      }
      recordArrival(projectId);
      if (returnUrl) {
        setShouldNavigateBack(true);
      }
    }
  }, [isConnected, getLocation, user?.id, recordArrival, returnUrl, setDailyProject]);

  const { debouncedFn: debouncedProjectSelect } = useDebounce(handleProjectSelectCore, 500);
  
  const handleProjectSelect = (projectId: string | null) => {
    debouncedProjectSelect(projectId);
  };

  const handleDepartureCore = useCallback(async () => {
    if (!isConnected) {
      // OFFLINE: Save to IndexedDB
      try {
        const now = new Date();
        
        // Get GPS location with timeout (non-blocking)
        const location = await Promise.race([
          getLocation(),
          new Promise<null>((resolve) => setTimeout(() => resolve(null), 3000))
        ]);

        await savePendingMutation({
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

        setOfflineDepartureRecorded(true);
        
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
      } catch (error) {
        console.error('Offline departure failed:', error);
        toast.error('Nepodarilo sa uložiť odchod offline');
      }
    } else {
      // ONLINE: Record to database
      recordDeparture(undefined, {
        onSuccess: () => {
          clearDailyProject();
        }
      });
    }
  }, [isConnected, getLocation, user?.id, recordDeparture, clearDailyProject]);

  const { debouncedFn: debouncedDeparture } = useDebounce(handleDepartureCore, 500);
  
  const handleDeparture = () => {
    debouncedDeparture();
  };

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
            disabled={isRecordingArrival || (hasArrived && !hasDeparted)}
            variant={(!hasArrived || hasDeparted) ? "success" : "outline"}
            className="w-full gap-2"
            size="lg"
          >
            {isRecordingArrival ? (
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
                disabled={isRecordingDeparture || hasActiveLogs}
                variant="secondary"
                className="w-full gap-2"
                size="lg"
              >
                {isRecordingDeparture ? (
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
    </>
  );
};

export default AttendanceButton;
