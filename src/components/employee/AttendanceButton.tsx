import { useAuth } from '@/contexts/AuthContext';
import { useAttendance } from '@/hooks/useAttendance';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Clock, LogIn, LogOut, Loader2, MapPin } from 'lucide-react';

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

  const hasArrived = todayAttendance?.arrival_time;
  const hasDeparted = todayAttendance?.departure_time;

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
            onClick={() => recordArrival()}
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
          </Button>
        </div>

        {/* Departure */}
        {hasArrived && (
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium mb-2">Odchod</p>
              {hasDeparted && (
                <p className="text-2xl font-bold text-secondary">
                  {todayAttendance.departure_time}
                </p>
              )}
            </div>
            {!hasDeparted && (
              <Button
                onClick={() => recordDeparture()}
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
  );
};

export default AttendanceButton;
