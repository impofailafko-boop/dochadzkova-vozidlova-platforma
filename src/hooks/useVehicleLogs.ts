import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VehicleLogInput {
  vehicle_id: string;
  project_id: string;
  date: string;
  km_start: number;
  km_end: number;
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

      const { error } = await supabase
        .from('vehicle_logs')
        .insert({
          ...input,
          user_id: userId,
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

  return {
    logs,
    isLoading,
    createLog: createLog.mutate,
    isCreating: createLog.isPending,
  };
}
