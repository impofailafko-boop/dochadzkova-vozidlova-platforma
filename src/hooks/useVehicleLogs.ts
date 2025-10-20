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

export function useVehicleLogs(userId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: logs, isLoading } = useQuery({
    queryKey: ['vehicle-logs', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('vehicle_logs')
        .select(`
          *,
          vehicles (spz, brand, type),
          projects (name)
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false })
        .limit(30);

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

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
    isLoading,
    createLog: createLog.mutate,
    isCreating: createLog.isPending,
    completeLog: completeLog.mutate,
    isCompleting: completeLog.isPending,
  };
}
