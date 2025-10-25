import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { AlertTriangle, AlertCircle, Info } from 'lucide-react';
import { useVehicleAlerts, alertTypeLabels, type AlertSeverity } from '@/hooks/useVehicleAlerts';

const severityConfig: Record<AlertSeverity, { 
  icon: typeof AlertTriangle; 
  variant: "destructive" | "default" | "secondary";
  bgClass: string;
}> = {
  critical: { 
    icon: AlertTriangle, 
    variant: 'destructive',
    bgClass: 'bg-destructive/10 border-destructive/20'
  },
  warning: { 
    icon: AlertCircle, 
    variant: 'default',
    bgClass: 'bg-yellow-500/10 border-yellow-500/20'
  },
  info: { 
    icon: Info, 
    variant: 'secondary',
    bgClass: 'bg-primary/10 border-primary/20'
  },
};

export function AlertsWidget() {
  const { data: alerts, isLoading } = useVehicleAlerts();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Upozornenia na termíny</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!alerts || alerts.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Info className="h-5 w-5" />
            Upozornenia na termíny
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Žiadne blížiace sa termíny v nasledujúcich 60 dňoch.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5" />
          Upozornenia na termíny
          <Badge variant="outline" className="ml-auto">
            {alerts.length}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          <div className="space-y-3">
            {alerts.map((alert) => {
              const config = severityConfig[alert.severity];
              const Icon = config.icon;
              const daysText = alert.daysUntil < 0 
                ? `Prešiel o ${Math.abs(alert.daysUntil)} dní`
                : alert.daysUntil === 0
                ? 'Dnes'
                : alert.daysUntil === 1
                ? 'Zajtra'
                : `O ${alert.daysUntil} dní`;

              return (
                <div
                  key={alert.id}
                  className={`p-4 rounded-lg border ${config.bgClass} transition-all hover:shadow-md`}
                >
                  <div className="flex items-start gap-3">
                    <Icon className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                      alert.severity === 'critical' ? 'text-destructive' :
                      alert.severity === 'warning' ? 'text-yellow-600' :
                      'text-primary'
                    }`} />
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <div>
                          <p className="font-semibold text-sm">
                            {alert.vehicleSpz} - {alert.vehicleBrand}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {alert.vehicleType}
                          </p>
                        </div>
                        <Badge variant={config.variant} className="flex-shrink-0">
                          {alertTypeLabels[alert.alertType]}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-2 mt-2 text-sm">
                        <span className="text-muted-foreground">
                          {alert.date}
                        </span>
                        <span className="text-xs px-2 py-0.5 rounded-full bg-background font-medium">
                          {daysText}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
