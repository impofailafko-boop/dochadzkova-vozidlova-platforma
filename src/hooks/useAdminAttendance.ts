import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAdminAttendance(filters?: { startDate?: string; endDate?: string; userId?: string }) {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['admin-attendance', filters],
    queryFn: async () => {
      let query = supabase
        .from('attendance')
        .select(`
          *,
          profiles!inner (
            full_name,
            user_id
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

      const { data, error } = await query;

      if (error) throw error;
      return data;
    },
  });

  const updateAttendance = useMutation({
    mutationFn: async ({ id, ...data }: { id: string; arrival_time?: string; departure_time?: string; date?: string; project_id?: string | null }) => {
      const { error } = await supabase
        .from('attendance')
        .update(data)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-attendance'] });
      toast.success('Dochádzka aktualizovaná');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Chyba pri aktualizácii dochádzky');
    },
  });

  const deleteAttendance = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('attendance')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-attendance'] });
      toast.success('Dochádzka odstránená');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Chyba pri odstraňovaní dochádzky');
    },
  });

  const createAttendance = useMutation({
    mutationFn: async (data: { user_id: string; date: string; arrival_time: string; departure_time?: string; project_id?: string }) => {
      const { error } = await supabase
        .from('attendance')
        .insert(data);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-attendance'] });
      toast.success('Dochádzka vytvorená');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Chyba pri vytváraní dochádzky');
    },
  });

  return {
    ...query,
    updateAttendance: updateAttendance.mutate,
    deleteAttendance: deleteAttendance.mutate,
    createAttendance: createAttendance.mutate,
    isUpdating: updateAttendance.isPending,
    isDeleting: deleteAttendance.isPending,
    isCreating: createAttendance.isPending,
  };
}
