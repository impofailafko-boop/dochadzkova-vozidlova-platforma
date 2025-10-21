import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAttendance(userId: string | undefined) {
  const queryClient = useQueryClient();

  // Get today's attendance
  const { data: todayAttendance, isLoading } = useQuery({
    queryKey: ['attendance', 'today', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const today = new Date().toISOString().split('T')[0];
      const { data, error } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Record arrival
  const recordArrival = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toTimeString().split(' ')[0];

      const { error } = await supabase
        .from('attendance')
        .insert({
          user_id: userId,
          date: today,
          arrival_time: now,
        });

      if (error) throw error;
    },
    onMutate: () => {
      // Dismiss any existing toasts to prevent duplicates
      toast.dismiss();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Príchod zaznamenaný');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Chyba pri zaznamenaní príchodu');
    },
  });

  // Record departure
  const recordDeparture = useMutation({
    mutationFn: async () => {
      if (!userId || !todayAttendance) throw new Error('No arrival record found');
      
      const now = new Date().toTimeString().split(' ')[0];
      
      // Calculate total hours
      const arrivalTime = todayAttendance.arrival_time;
      const arrival = new Date(`1970-01-01T${arrivalTime}`);
      const departure = new Date(`1970-01-01T${now}`);
      const diffMs = departure.getTime() - arrival.getTime();
      const totalHours = (diffMs / (1000 * 60 * 60)).toFixed(2);

      const { error } = await supabase
        .from('attendance')
        .update({
          departure_time: now,
          total_hours: parseFloat(totalHours),
        })
        .eq('id', todayAttendance.id);

      if (error) throw error;
    },
    onMutate: () => {
      // Dismiss any existing toasts to prevent duplicates
      toast.dismiss();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
      toast.success('Odchod zaznamenaný');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Chyba pri zaznamenaní odchodu');
    },
  });

  // Get user's attendance history with pagination and date filtering
  const getHistory = (params?: { limit?: number; offset?: number; startDate?: string; endDate?: string }) => {
    const { limit = 30, offset = 0, startDate, endDate } = params || {};
    
    return useQuery({
      queryKey: ['attendance', 'history', userId, limit, offset, startDate, endDate],
      queryFn: async () => {
        if (!userId) return { data: [], count: 0 };
        
        let query = supabase
          .from('attendance')
          .select('*', { count: 'exact' })
          .eq('user_id', userId)
          .order('date', { ascending: false });

        if (startDate) {
          query = query.gte('date', startDate);
        }
        if (endDate) {
          query = query.lte('date', endDate);
        }

        query = query.range(offset, offset + limit - 1);

        const { data, error, count } = await query;

        if (error) throw error;
        return { data: data || [], count: count || 0 };
      },
      enabled: !!userId,
    });
  };

  return {
    todayAttendance,
    isLoading,
    recordArrival: recordArrival.mutate,
    recordDeparture: recordDeparture.mutate,
    isRecordingArrival: recordArrival.isPending,
    isRecordingDeparture: recordDeparture.isPending,
    getHistory,
  };
}
