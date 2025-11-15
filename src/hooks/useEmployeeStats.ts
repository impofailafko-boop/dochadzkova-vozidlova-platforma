import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, startOfWeek } from 'date-fns';
import { formatDateToISO } from '@/lib/utils';

export function useEmployeeStats(userId: string | undefined) {
  return useQuery({
    queryKey: ['employee-stats', userId],
    queryFn: async () => {
      if (!userId) return { monthHours: 0, weekHours: 0 };

      const today = new Date();
      const monthStart = startOfMonth(today);
      const weekStart = startOfWeek(today, { weekStartsOn: 1 }); // pondelok = 1

      // Fetch attendance records from start of month
      const { data, error } = await supabase
        .from('attendance')
        .select('total_hours, date')
        .eq('user_id', userId)
        .gte('date', formatDateToISO(monthStart))
        .not('total_hours', 'is', null);

      if (error) throw error;

      // Calculate month hours (sum all from month start)
      const monthHours = data?.reduce((sum, record) => {
        return sum + (parseFloat(record.total_hours as any) || 0);
      }, 0) || 0;

      // Calculate week hours (only from week start)
      const weekStartStr = formatDateToISO(weekStart);
      const weekHours = data
        ?.filter(record => record.date >= weekStartStr)
        .reduce((sum, record) => {
          return sum + (parseFloat(record.total_hours as any) || 0);
        }, 0) || 0;

      const weekRecords = data?.filter(r => r.date >= weekStartStr).length || 0;

      return {
        monthHours: Math.max(0, monthHours - (data?.length || 0) * 0.5), // netto (odrátané prestávky)
        weekHours: Math.max(0, weekHours - weekRecords * 0.5),
      };
    },
    enabled: !!userId,
    refetchOnWindowFocus: true,
    staleTime: 60000, // refresh každú minútu
  });
}
