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

export function useFuelLogs(userId: string | undefined) {
  const queryClient = useQueryClient();

  const { data: logs, isLoading } = useQuery({
    queryKey: ['fuel-logs', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data, error } = await supabase
        .from('fuel_logs')
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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fuel-logs'] });
      toast.success('Tankovanie zaznamenané');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Chyba pri zaznamenaní tankovania');
    },
  });

  return {
    logs,
    isLoading,
    createLog: createLog.mutate,
    isCreating: createLog.isPending,
  };
}
