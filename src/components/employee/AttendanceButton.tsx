import { useAuth } from '@/contexts/AuthContext';
import { useAttendance } from '@/hooks/useAttendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, LogIn, LogOut, Loader2, MapPin, WifiOff } from 'lucide-react';
import { OfflineIndicator } from './OfflineIndicator';
import { savePendingAttendance } from '@/lib/offlineStorage';
import { toast } from 'sonner';
import { useState, useEffect } from 'react';

const AttendanceButton = () => {
  const { user } = useAuth();
  const {
    todayAttendance,
    isLoading,
    recordArrival,
    recordDeparture,
    isRecordingArrival,
    isRecordingDeparture,
  } = useAttendance(user?.id);

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

  const hasArrived = todayAttendance?.arrival_time;
  const hasDeparted = todayAttendance?.departure_time;

  const handleArrival = async () => {
    if (!isOnline) {
      // Save to IndexedDB for offline
      try {
        const now = new Date();
        let latitude: number | undefined;
        let longitude: number | undefined;

        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (error) {
          console.log('GPS not available');
        }

        await savePendingAttendance({
          id: `${user?.id}-arrival-${now.getTime()}`,
          type: 'arrival',
          timestamp: now.toISOString(),
          latitude,
          longitude,
          synced: false,
          userId: user?.id || '',
        });

        toast.success('Príchod uložený offline. Synchronizuje sa po pripojení.', {
          icon: <WifiOff className="h-4 w-4" />,
        });
      } catch (error) {
        toast.error('Nepodarilo sa uložiť príchod offline');
      }
    } else {
      recordArrival();
    }
  };

  const handleDeparture = async () => {
    if (!isOnline) {
      // Save to IndexedDB for offline
      try {
        const now = new Date();
        let latitude: number | undefined;
        let longitude: number | undefined;

        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject);
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (error) {
          console.log('GPS not available');
        }

        await savePendingAttendance({
          id: `${user?.id}-departure-${now.getTime()}`,
          type: 'departure',
          timestamp: now.toISOString(),
          latitude,
          longitude,
          synced: false,
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
  };

  if (isLoading) {
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
            onClick={handleArrival}
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
            {!hasDeparted && (
              <Button
                onClick={handleDeparture}
                disabled={isRecordingDeparture}
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
              {todayAttendance.total_hours}h
            </p>
          </div>
        )}
      </CardContent>
    </Card>
    </>
  );
};

export default AttendanceButton;
