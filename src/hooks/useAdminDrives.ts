import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useAdminDrives(filters?: { 
  startDate?: string; 
  endDate?: string; 
  userId?: string;
  vehicleId?: string;
  projectId?: string;
}) {
  return useQuery({
    queryKey: ['admin-drives', filters],
    queryFn: async () => {
      let query = supabase
        .from('vehicle_logs')
        .select(`
          *,
          profiles!inner (
            full_name,
            user_id
          ),
          vehicles (
            spz,
            brand,
            type
          ),
          projects (
            name
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
      if (filters?.vehicleId) {
        query = query.eq('vehicle_id', filters.vehicleId);
      }
      if (filters?.projectId) {
        query = query.eq('project_id', filters.projectId);
      }

      const { data, error } = await query.limit(100);

      if (error) throw error;
      return data;
    },
  });
}
