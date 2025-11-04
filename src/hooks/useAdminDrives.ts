import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAdminDrives(filters?: { 
  startDate?: string; 
  endDate?: string; 
  userId?: string;
  vehicleId?: string;
  projectId?: string;
}) {
  const queryClient = useQueryClient();

  const query = useQuery({
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

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });

  const updateDrive = useMutation({
    mutationFn: async ({ id, photo_km_start, photo_km_end, ...data }: { 
      id: string; 
      km_start?: number; 
      km_end?: number; 
      date?: string; 
      vehicle_id?: string; 
      project_id?: string;
      photo_km_start?: File | string;
      photo_km_end?: File | string;
    }) => {
      const updateData: any = { ...data };
      
      // Get current user ID for photo naming
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('User not authenticated');

      // Handle photo_km_start upload
      if (photo_km_start instanceof File) {
        const timestamp = Date.now();
        const fileName = `${user.id}_${timestamp}_km_start.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('vehicle-photos')
          .upload(fileName, photo_km_start, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;
        updateData.photo_km_start = fileName;
      }

      // Handle photo_km_end upload
      if (photo_km_end instanceof File) {
        const timestamp = Date.now();
        const fileName = `${user.id}_${timestamp}_km_end.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('vehicle-photos')
          .upload(fileName, photo_km_end, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;
        updateData.photo_km_end = fileName;
      }
      
      // Recalculate km_driven if both km_start and km_end are present
      if (data.km_start !== undefined && data.km_end !== undefined) {
        updateData.km_driven = data.km_end - data.km_start;
      }

      const { error } = await supabase
        .from('vehicle_logs')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-drives'] });
      toast.success('Jazda aktualizovaná');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Chyba pri aktualizácii jazdy');
    },
  });

  const deleteDrive = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vehicle_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-drives'] });
      toast.success('Jazda odstránená');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Chyba pri odstraňovaní jazdy');
    },
  });

  const completeDrive = useMutation({
    mutationFn: async ({ id, km_end, photo_km_end }: { id: string; km_end: number; photo_km_end?: File }) => {
      // Get the drive to calculate km_driven
      const { data: drive, error: fetchError } = await supabase
        .from('vehicle_logs')
        .select('km_start, user_id')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      const updateData: any = {
        km_end,
        km_driven: km_end - drive.km_start,
        is_completed: true,
      };

      // Handle photo_km_end upload if provided
      if (photo_km_end) {
        const timestamp = Date.now();
        const fileName = `${drive.user_id}_${timestamp}_km_end.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('vehicle-photos')
          .upload(fileName, photo_km_end, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) throw uploadError;
        updateData.photo_km_end = fileName;
      }

      const { error } = await supabase
        .from('vehicle_logs')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-drives'] });
      toast.success('Jazda dokončená');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Chyba pri dokončovaní jazdy');
    },
  });

  return {
    ...query,
    updateDrive: updateDrive.mutate,
    deleteDrive: deleteDrive.mutate,
    completeDrive: completeDrive.mutate,
    isUpdating: updateDrive.isPending,
    isDeleting: deleteDrive.isPending,
    isCompleting: completeDrive.isPending,
  };
}
