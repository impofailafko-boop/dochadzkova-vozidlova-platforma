import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export type AlertSeverity = 'critical' | 'warning' | 'info';
export type AlertType = 'service' | 'stk' | 'insurance' | 'emission';

export interface VehicleAlert {
  id: string;
  vehicleSpz: string;
  vehicleBrand: string;
  vehicleType: string;
  alertType: AlertType;
  date: string;
  daysUntil: number;
  severity: AlertSeverity;
}

function parseDate(dateStr: string | null): Date | null {
  if (!dateStr) return null;
  
  // Try parsing DD.MM.YYYY format
  const ddmmyyyyMatch = dateStr.match(/^(\d{1,2})\.(\d{1,2})\.(\d{4})$/);
  if (ddmmyyyyMatch) {
    const [, day, month, year] = ddmmyyyyMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Try parsing YYYY-MM-DD format
  const yyyymmddMatch = dateStr.match(/^(\d{4})-(\d{1,2})-(\d{1,2})$/);
  if (yyyymmddMatch) {
    const [, year, month, day] = yyyymmddMatch;
    return new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
  }
  
  // Fallback to Date parsing
  const parsed = new Date(dateStr);
  return isNaN(parsed.getTime()) ? null : parsed;
}

function calculateDaysUntil(dateStr: string | null): number | null {
  const date = parseDate(dateStr);
  if (!date) return null;
  
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  
  const diffTime = date.getTime() - now.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

function getSeverity(daysUntil: number): AlertSeverity {
  if (daysUntil < 0) return 'critical'; // Prešiel termín
  if (daysUntil <= 7) return 'critical';
  if (daysUntil <= 30) return 'warning';
  if (daysUntil <= 60) return 'info';
  return 'info';
}

const alertTypeLabels: Record<AlertType, string> = {
  service: 'Servis',
  stk: 'STK',
  insurance: 'Poistenie',
  emission: 'Emisie',
};

export function useVehicleAlerts() {
  return useQuery({
    queryKey: ['vehicle-alerts'],
    queryFn: async () => {
      const { data: vehicles, error } = await supabase
        .from('vehicles')
        .select('*')
        .eq('is_active', true)
        .order('spz');

      if (error) throw error;

      const alerts: VehicleAlert[] = [];
      const now = new Date();

      vehicles?.forEach((vehicle) => {
        const dateFields: { type: AlertType; date: string | null }[] = [
          { type: 'service', date: vehicle.service_date },
          { type: 'stk', date: vehicle.stk_date },
          { type: 'insurance', date: vehicle.insurance_date },
          { type: 'emission', date: vehicle.emission_date },
        ];

        dateFields.forEach(({ type, date }) => {
          const daysUntil = calculateDaysUntil(date);
          
          // Only show alerts for dates within 60 days or expired
          if (daysUntil !== null && daysUntil <= 60) {
            alerts.push({
              id: `${vehicle.id}-${type}`,
              vehicleSpz: vehicle.spz,
              vehicleBrand: vehicle.brand,
              vehicleType: vehicle.type,
              alertType: type,
              date: date || '',
              daysUntil,
              severity: getSeverity(daysUntil),
            });
          }
        });
      });

      // Sort: critical first, then by days until
      return alerts.sort((a, b) => {
        const severityOrder = { critical: 0, warning: 1, info: 2 };
        if (severityOrder[a.severity] !== severityOrder[b.severity]) {
          return severityOrder[a.severity] - severityOrder[b.severity];
        }
        return a.daysUntil - b.daysUntil;
      });
    },
  });
}

export { alertTypeLabels };
