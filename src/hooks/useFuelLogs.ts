import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface FuelLogInput {
  vehicle_id: string;
  project_id?: string;
  date: string;
  liters: number;
  price?: number;
  note?: string;
  photo_receipt?: File;
}

interface UpdateFuelLogInput {
  id: string;
  photo_receipt?: File;
}

export function useFuelLogs(userId: string | undefined, params?: { limit?: number; offset?: number; startDate?: string; endDate?: string }) {
  const queryClient = useQueryClient();
  const { limit = 30, offset = 0, startDate, endDate } = params || {};

  const { data, isLoading } = useQuery({
    queryKey: ['fuel-logs', userId, limit, offset, startDate, endDate],
    queryFn: async () => {
      if (!userId) return { data: [], count: 0 };
      
      let query = supabase
        .from('fuel_logs')
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
    mutationFn: async (input: FuelLogInput) => {
      if (!userId) throw new Error('User not authenticated');

      let photoUrl = null;
      
      // Upload photo if provided
      if (input.photo_receipt) {
        const fileExt = input.photo_receipt.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}_receipt.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('vehicle-photos')
          .upload(fileName, input.photo_receipt);

        if (uploadError) throw uploadError;
        photoUrl = fileName;
      }

      const { error } = await supabase
        .from('fuel_logs')
        .insert({
          vehicle_id: input.vehicle_id,
          project_id: input.project_id,
          date: input.date,
          liters: input.liters,
          price: input.price,
          note: input.note,
          photo_receipt: photoUrl,
          user_id: userId,
        });

      if (error) throw error;
    },
    onMutate: async () => {
      // Dismiss any existing toasts
      toast.dismiss();
      
      // Cancel outgoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['fuel-logs', userId] });
      
      // Snapshot previous data
      const previousData = queryClient.getQueryData(['fuel-logs', userId, limit, offset, startDate, endDate]);
      
      // Show success toast immediately
      toast.success('Tankovanie zaznamenané');
      
      // Return context for rollback
      return { previousData };
    },
    onError: (error: any, _variables, context) => {
      // Rollback to previous state if available
      if (context?.previousData !== undefined) {
        queryClient.setQueryData(['fuel-logs', userId, limit, offset, startDate, endDate], context.previousData);
      }
      toast.error(error.message || 'Chyba pri zaznamenaní tankovania');
    },
    onSettled: () => {
      // Always refetch after error or success to sync with server
      queryClient.invalidateQueries({ queryKey: ['fuel-logs'] });
    },
  });

  const updateLog = useMutation({
    mutationFn: async (input: UpdateFuelLogInput) => {
      if (!userId) throw new Error('User not authenticated');

      let photoUrl: string | null = null;
      
      // Upload new photo if provided
      if (input.photo_receipt) {
        const fileExt = input.photo_receipt.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}_receipt.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('vehicle-photos')
          .upload(fileName, input.photo_receipt);

        if (uploadError) throw uploadError;
        photoUrl = fileName;
      }

      const { error } = await supabase
        .from('fuel_logs')
        .update({ photo_receipt: photoUrl })
        .eq('id', input.id)
        .eq('user_id', userId); // Security check

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-logs'] });
      toast.success('Fotka bločku bola pridaná');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Chyba pri pridávaní fotky');
    },
  });

  return {
    logs,
    count,
    isLoading,
    createLog: createLog.mutate,
    isCreating: createLog.isPending,
    updateLog: updateLog.mutate,
    isUpdating: updateLog.isPending,
  };
}
