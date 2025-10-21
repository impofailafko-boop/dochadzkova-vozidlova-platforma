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
    onMutate: async (input: VehicleLogInput) => {
      // Dismiss any existing toasts
      toast.dismiss();
      
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['vehicle-logs', userId] });
      
      // Snapshot previous data
      const previousLogs = queryClient.getQueryData(['vehicle-logs', userId, limit, offset, startDate, endDate]);
      
      // Create optimistic log entry
      const optimisticLog = {
        id: 'temp-' + Date.now(),
        user_id: userId,
        vehicle_id: input.vehicle_id,
        project_id: input.project_id,
        date: input.date,
        km_start: input.km_start,
        km_end: null,
        km_driven: null,
        photo_km_start: null,
        photo_km_end: null,
        is_completed: false,
        created_at: new Date().toISOString(),
        vehicles: null,
        projects: null,
      };
      
      // Optimistically update logs
      queryClient.setQueryData(['vehicle-logs', userId, limit, offset, startDate, endDate], (old: any) => {
        if (!old) return { data: [optimisticLog], count: 1 };
        return {
          data: [optimisticLog, ...old.data],
          count: old.count + 1,
        };
      });
      
      // Show success toast immediately
      toast.success('Jazda zaznamenaná');
      
      return { previousLogs };
    },
    onError: (error: any, _variables, context) => {
      // Rollback to previous state
      if (context?.previousLogs !== undefined) {
        queryClient.setQueryData(['vehicle-logs', userId, limit, offset, startDate, endDate], context.previousLogs);
      }
      toast.error(error.message || 'Chyba pri zaznamenaní jazdy');
    },
    onSettled: () => {
      // Always refetch after error or success to sync with server
      queryClient.invalidateQueries({ queryKey: ['vehicle-logs'] });
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
    onMutate: async (input: CompleteLogInput) => {
      // Dismiss any existing toasts
      toast.dismiss();
      
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['vehicle-logs', userId] });
      
      // Snapshot previous data
      const previousLogs = queryClient.getQueryData(['vehicle-logs', userId, limit, offset, startDate, endDate]);
      
      // Optimistically update the log
      queryClient.setQueryData(['vehicle-logs', userId, limit, offset, startDate, endDate], (old: any) => {
        if (!old) return old;
        
        return {
          ...old,
          data: old.data.map((log: any) => {
            if (log.id === input.logId) {
              const km_driven = input.km_end - log.km_start;
              return {
                ...log,
                km_end: input.km_end,
                km_driven: km_driven,
                is_completed: true,
              };
            }
            return log;
          }),
        };
      });
      
      // Show success toast immediately
      toast.success('Jazda ukončená');
      
      return { previousLogs };
    },
    onError: (error: any, _variables, context) => {
      // Rollback to previous state
      if (context?.previousLogs !== undefined) {
        queryClient.setQueryData(['vehicle-logs', userId, limit, offset, startDate, endDate], context.previousLogs);
      }
      toast.error(error.message || 'Chyba pri ukončení jazdy');
    },
    onSettled: () => {
      // Always refetch after error or success to sync with server
      queryClient.invalidateQueries({ queryKey: ['vehicle-logs'] });
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
