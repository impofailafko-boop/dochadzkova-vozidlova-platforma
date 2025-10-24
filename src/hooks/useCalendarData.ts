import { useQuery } from '@tanstack/react-query';
import { useAdminAttendance } from './useAdminAttendance';
import { useAdminDrives } from './useAdminDrives';
import { useAdminFuelings } from './useAdminFuelings';

export interface CalendarDayData {
  date: string;
  attendance: {
    count: number;
    totalHours: number;
    records: any[];
  };
  drives: {
    count: number;
    totalKm: number;
    records: any[];
  };
  fuelings: {
    count: number;
    totalLiters: number;
    totalCost: number;
    records: any[];
  };
  hasData: boolean;
}

export interface CalendarAggregatedData {
  byDate: Record<string, CalendarDayData>;
  dates: string[];
  totalAttendance: number;
  totalDrives: number;
  totalFuelings: number;
}

export function useCalendarData(filters?: { startDate?: string; endDate?: string; userId?: string }) {
  const { data: attendance, isLoading: loadingAttendance } = useAdminAttendance(filters);
  const { data: drives, isLoading: loadingDrives } = useAdminDrives(filters);
  const { data: fuelings, isLoading: loadingFuelings } = useAdminFuelings(filters);

  return useQuery({
    queryKey: ['calendar-data', filters],
    queryFn: async (): Promise<CalendarAggregatedData> => {
      const byDate: Record<string, CalendarDayData> = {};
      const dateSet = new Set<string>();

      // Process attendance
      attendance?.forEach((record: any) => {
        const date = record.date;
        dateSet.add(date);
        
        if (!byDate[date]) {
          byDate[date] = {
            date,
            attendance: { count: 0, totalHours: 0, records: [] },
            drives: { count: 0, totalKm: 0, records: [] },
            fuelings: { count: 0, totalLiters: 0, totalCost: 0, records: [] },
            hasData: false,
          };
        }
        
        byDate[date].attendance.count++;
        byDate[date].attendance.totalHours += record.total_hours || 0;
        byDate[date].attendance.records.push(record);
        byDate[date].hasData = true;
      });

      // Process drives
      drives?.forEach((record: any) => {
        const date = record.date;
        dateSet.add(date);
        
        if (!byDate[date]) {
          byDate[date] = {
            date,
            attendance: { count: 0, totalHours: 0, records: [] },
            drives: { count: 0, totalKm: 0, records: [] },
            fuelings: { count: 0, totalLiters: 0, totalCost: 0, records: [] },
            hasData: false,
          };
        }
        
        byDate[date].drives.count++;
        byDate[date].drives.totalKm += record.km_driven || 0;
        byDate[date].drives.records.push(record);
        byDate[date].hasData = true;
      });

      // Process fuelings
      fuelings?.forEach((record: any) => {
        const date = record.date;
        dateSet.add(date);
        
        if (!byDate[date]) {
          byDate[date] = {
            date,
            attendance: { count: 0, totalHours: 0, records: [] },
            drives: { count: 0, totalKm: 0, records: [] },
            fuelings: { count: 0, totalLiters: 0, totalCost: 0, records: [] },
            hasData: false,
          };
        }
        
        byDate[date].fuelings.count++;
        byDate[date].fuelings.totalLiters += record.liters || 0;
        byDate[date].fuelings.totalCost += record.price || 0;
        byDate[date].fuelings.records.push(record);
        byDate[date].hasData = true;
      });

      // Sort dates
      const dates = Array.from(dateSet).sort((a, b) => b.localeCompare(a));

      return {
        byDate,
        dates,
        totalAttendance: attendance?.length || 0,
        totalDrives: drives?.length || 0,
        totalFuelings: fuelings?.length || 0,
      };
    },
    enabled: !loadingAttendance && !loadingDrives && !loadingFuelings,
  });
}
