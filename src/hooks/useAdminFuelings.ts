import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAdminFuelings(filters?: { 
  startDate?: string; 
  endDate?: string; 
  userId?: string;
  vehicleId?: string;
  projectId?: string;
}) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin-fuelings', filters],
    queryFn: async () => {
      let query = supabase
        .from('fuel_logs')
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

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });

  const updateFueling = useMutation({
    mutationFn: async ({ id, photo_receipt, ...data }: { id: string; liters?: number; price?: number; note?: string; date?: string; vehicle_id?: string; project_id?: string; photo_receipt?: File }) => {
      let photoUrl = undefined;
      
      // Upload photo if provided
      if (photo_receipt) {
        const fileExt = photo_receipt.name.split('.').pop();
        const fileName = `admin/${Date.now()}_receipt.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('vehicle-photos')
          .upload(fileName, photo_receipt);

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Nahrávanie fotky zlyhalo: ${uploadError.message}`);
        }
        photoUrl = fileName;
      }

      const updateData = photoUrl ? { ...data, photo_receipt: photoUrl } : data;

      const { error } = await supabase
        .from('fuel_logs')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fuelings'] });
      toast.success('Tankovanie aktualizované');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Chyba pri aktualizácii tankovania');
    },
  });

  const deleteFueling = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('fuel_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fuelings'] });
      toast.success('Tankovanie odstránené');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Chyba pri odstraňovaní tankovania');
    },
  });

  const createFueling = useMutation({
    mutationFn: async ({ photo_receipt, ...data }: { user_id: string; vehicle_id: string; project_id: string; date: string; liters: number; price?: number; note?: string; photo_receipt?: File }) => {
      let photoUrl = null;
      
      // Upload photo if provided
      if (photo_receipt) {
        const fileExt = photo_receipt.name.split('.').pop();
        const fileName = `admin/${Date.now()}_receipt.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('vehicle-photos')
          .upload(fileName, photo_receipt);

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Nahrávanie fotky zlyhalo: ${uploadError.message}`);
        }
        photoUrl = fileName;
      }

      const { error } = await supabase
        .from('fuel_logs')
        .insert({ ...data, photo_receipt: photoUrl });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-fuelings'] });
      toast.success('Tankovanie vytvorené');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Chyba pri vytváraní tankovania');
    },
  });

  return {
    ...query,
    updateFueling: updateFueling.mutate,
    deleteFueling: deleteFueling.mutate,
    createFueling: createFueling.mutate,
    isUpdating: updateFueling.isPending,
    isDeleting: deleteFueling.isPending,
    isCreating: createFueling.isPending,
  };
}
