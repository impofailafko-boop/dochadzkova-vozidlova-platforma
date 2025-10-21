import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VehicleLogInput {
  vehicle_id: string;
  project_id: string;
  date: string;
  km_start: number;
  photo_km_start?: File;
}

interface CompleteLogInput {
  logId: string;
  km_end: number;
  photo_km_end?: File;
}

export function useVehicleLogs(userId: string | undefined, params?: { limit?: number; offset?: number; startDate?: string; endDate?: string }) {
  const queryClient = useQueryClient();
  const { limit = 30, offset = 0, startDate, endDate } = params || {};

  const { data, isLoading } = useQuery({
    queryKey: ['vehicle-logs', userId, limit, offset, startDate, endDate],
    queryFn: async () => {
      if (!userId) return { data: [], count: 0 };
      
      let query = supabase
        .from('vehicle_logs')
        .select(`
          *,
          vehicles (spz, brand, type),
          projects (name)
        `, { count: 'exact' })
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (startDate) {
        query = query.gte('date', startDate);
      }
      if (endDate) {
        query = query.lte('date', endDate);
      }

      query = query.range(offset, offset + limit - 1);

      const { data: logs, error, count } = await query;

      if (error) throw error;
      return { data: logs || [], count: count || 0 };
    },
    enabled: !!userId,
  });

  const logs = data?.data || [];
  const count = data?.count || 0;

  const createLog = useMutation({
    mutationFn: async (input: VehicleLogInput) => {
      if (!userId) throw new Error('User not authenticated');

      let photoUrl = null;
      
      // Upload photo if provided
      if (input.photo_km_start) {
        const fileExt = input.photo_km_start.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}_start.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('vehicle-photos')
          .upload(fileName, input.photo_km_start);

        if (uploadError) throw uploadError;
        photoUrl = fileName;
      }

      const { error } = await supabase
        .from('vehicle_logs')
        .insert({
          vehicle_id: input.vehicle_id,
          project_id: input.project_id,
          date: input.date,
          km_start: input.km_start,
          photo_km_start: photoUrl,
          user_id: userId,
          is_completed: false,
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-logs'] });
      toast.success('Jazda zaznamenaná');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Chyba pri zaznamenaní jazdy');
    },
  });

  const completeLog = useMutation({
    mutationFn: async (input: CompleteLogInput) => {
      if (!userId) throw new Error('User not authenticated');

      // First, get the log to calculate km_driven
      const { data: logData, error: fetchError } = await supabase
        .from('vehicle_logs')
        .select('km_start')
        .eq('id', input.logId)
        .single();

      if (fetchError) throw fetchError;

      const km_driven = input.km_end - logData.km_start;

      let photoUrl = null;
      
      // Upload photo if provided
      if (input.photo_km_end) {
        const fileExt = input.photo_km_end.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}_end.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('vehicle-photos')
          .upload(fileName, input.photo_km_end);

        if (uploadError) throw uploadError;
        photoUrl = fileName;
      }

      const { error } = await supabase
        .from('vehicle_logs')
        .update({
          km_end: input.km_end,
          km_driven: km_driven,
          photo_km_end: photoUrl,
          is_completed: true,
        })
        .eq('id', input.logId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['vehicle-logs'] });
      toast.success('Jazda ukončená');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Chyba pri ukončení jazdy');
    },
  });

  return {
    logs,
    count,
    isLoading,
    createLog: createLog.mutate,
    isCreating: createLog.isPending,
    completeLog: completeLog.mutate,
    isCompleting: completeLog.isPending,
  };
}
