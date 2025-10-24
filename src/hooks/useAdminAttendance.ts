import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAdminAttendance(filters?: { startDate?: string; endDate?: string; userId?: string }) {
  return useQuery({
    queryKey: ['admin-attendance', filters],
    queryFn: async () => {
      let query = supabase
        .from('attendance')
        .select(`
          *,
          profiles!inner (
            full_name,
            user_id
          )
        `)
        .order('date', { ascending: false });

      if (filters?.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('date', filters.endDate);
      }
      if (filters?.userId) {
        query = query.eq('user_id', filters.userId);
      }

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });
}
