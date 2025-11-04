import { useAuth } from '@/contexts/AuthContext';
import { useAttendance } from '@/hooks/useAttendance';
import { useActiveVehicleLogs } from '@/hooks/useVehicleLogs';
import { useGeolocation } from '@/hooks/useGeolocation';
import { useDebounce } from '@/hooks/useDebounce';
import { useDailyProject } from '@/hooks/useDailyProject';
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
  const { currentProjectId, setDailyProject } = useDailyProject(user?.id);

  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [shouldNavigateBack, setShouldNavigateBack] = useState(false);
  const [showProjectDialog, setShowProjectDialog] = useState(false);

  const hasActiveLogs = activeLogs && activeLogs.length > 0;

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

  // Navigate back after successful check-in
  useEffect(() => {
    if (shouldNavigateBack && todayAttendance?.arrival_time && returnUrl) {
      setShouldNavigateBack(false);
      setTimeout(() => {
        navigate(returnUrl);
      }, 1500); // Small delay to let user see the success message
    }
  }, [todayAttendance, shouldNavigateBack, returnUrl, navigate]);

  const hasArrived = todayAttendance?.arrival_time;
  const hasDeparted = todayAttendance?.departure_time;

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
    // Save project to profile for daily use
    if (projectId) {
      setDailyProject(projectId);
    }
    
    if (!isOnline) {
      // Save to IndexedDB for offline
      try {
        const now = new Date();
        
        // Get GPS location using centralized hook
        const location = await getLocation();

        await savePendingMutation({
          id: `${user?.id}-arrival-${now.getTime()}`,
          entityType: 'attendance',
          action: 'create',
          data: {
            type: 'arrival',
            timestamp: now.toISOString(),
            latitude: location?.latitude,
            longitude: location?.longitude,
            userId: user?.id || '',
          },
          timestamp: now.toISOString(),
          synced: false,
          retries: 0,
          userId: user?.id || '',
        });

        toast.success('Príchod uložený offline. Synchronizuje sa po pripojení.', {
          icon: <WifiOff className="h-4 w-4" />,
        });
      } catch (error) {
        toast.error('Nepodarilo sa uložiť príchod offline');
      }
    } else {
      recordArrival(projectId);
      if (returnUrl) {
        setShouldNavigateBack(true);
      }
    }
  }, [isOnline, getLocation, user?.id, recordArrival, returnUrl, setDailyProject]);

  const { debouncedFn: debouncedProjectSelect } = useDebounce(handleProjectSelectCore, 2000);
  
  const handleProjectSelect = (projectId: string | null) => {
    debouncedProjectSelect(projectId);
  };

  const handleDepartureCore = useCallback(async () => {
    if (!isOnline) {
      // Save to IndexedDB for offline
      try {
        const now = new Date();
        
        // Get GPS location using centralized hook
        const location = await getLocation();

        await savePendingMutation({
          id: `${user?.id}-departure-${now.getTime()}`,
          entityType: 'attendance',
          action: 'create',
          data: {
            type: 'departure',
            timestamp: now.toISOString(),
            latitude: location?.latitude,
            longitude: location?.longitude,
            userId: user?.id || '',
          },
          timestamp: now.toISOString(),
          synced: false,
          retries: 0,
          userId: user?.id || '',
        });

        toast.success('Odchod uložený offline. Synchronizuje sa po pripojení.', {
          icon: <WifiOff className="h-4 w-4" />,
        });
      } catch (error) {
        toast.error('Nepodarilo sa uložiť odchod offline');
      }
    } else {
      recordDeparture();
    }
  }, [isOnline, getLocation, user?.id, recordDeparture]);

  const { debouncedFn: debouncedDeparture } = useDebounce(handleDepartureCore, 2000);
  
  const handleDeparture = () => {
    debouncedDeparture();
  };

  if (isLoading || isLoadingActiveLogs) {
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
                  {todayAttendance.arrival_time}
                </p>
                {todayAttendance.arrival_latitude && todayAttendance.arrival_longitude && (
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
            {!isOnline && <WifiOff className="h-3 w-3 ml-2" />}
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
                    {todayAttendance.departure_time}
                  </p>
                  {todayAttendance.departure_latitude && todayAttendance.departure_longitude && (
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
                {!isOnline && <WifiOff className="h-3 w-3 ml-2" />}
              </Button>
            )}
          </div>
        )}

        {/* Total hours */}
        {hasDeparted && todayAttendance.total_hours && (
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
