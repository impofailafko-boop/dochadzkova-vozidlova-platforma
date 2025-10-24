import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export function useAttendance(userId: string | undefined) {
  const queryClient = useQueryClient();

  // Get today's attendance - find the latest incomplete record or the most recent one
  const { data: todayAttendance, isLoading } = useQuery({
    queryKey: ['attendance', 'today', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const today = new Date().toISOString().split('T')[0];
      
      // First, try to find an incomplete attendance (no departure_time)
      const { data: incompleteData, error: incompleteError } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .is('departure_time', null)
        .order('arrival_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (incompleteError) throw incompleteError;
      
      // If found incomplete record, return it
      if (incompleteData) return incompleteData;
      
      // Otherwise, return the most recent completed record
      const { data: completedData, error: completedError } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .order('arrival_time', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (completedError) throw completedError;
      return completedData;
    },
    enabled: !!userId,
  });

  // Record arrival with GPS location
  const recordArrival = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('User not authenticated');
      
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toTimeString().split(' ')[0];

      // Get GPS location
      let latitude: number | null = null;
      let longitude: number | null = null;

      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (error) {
          console.warn('GPS location not available:', error);
          // Continue without location - it's optional
        }
      }

      const { error } = await supabase
        .from('attendance')
        .insert({
          user_id: userId,
          date: today,
          arrival_time: now,
          arrival_latitude: latitude,
          arrival_longitude: longitude,
        });

      if (error) throw error;
      
      return { latitude, longitude };
    },
    onMutate: async () => {
      // Dismiss any existing toasts to prevent duplicates
      toast.dismiss();
      
      // Cancel outgoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['attendance', 'today', userId] });
      
      // Snapshot previous data
      const previousAttendance = queryClient.getQueryData(['attendance', 'today', userId]);
      
      // Optimistically update to new value
      const today = new Date().toISOString().split('T')[0];
      const now = new Date().toTimeString().split(' ')[0];
      
      queryClient.setQueryData(['attendance', 'today', userId], {
        id: 'temp-id',
        user_id: userId,
        date: today,
        arrival_time: now,
        departure_time: null,
        total_hours: null,
        arrival_latitude: null,
        arrival_longitude: null,
        created_at: new Date().toISOString(),
      });
      
      // Show success toast immediately
      toast.success('Príchod zaznamenaný (zisťujem polohu...)');
      
      // Return context for rollback
      return { previousAttendance };
    },
    onError: (error: any, _variables, context) => {
      // Rollback to previous state
      if (context?.previousAttendance !== undefined) {
        queryClient.setQueryData(['attendance', 'today', userId], context.previousAttendance);
      }
      toast.error(error.message || 'Chyba pri zaznamenaní príchodu');
    },
    onSettled: () => {
      // Always refetch after error or success to sync with server
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
    },
  });

  // Record departure
  const recordDeparture = useMutation({
    mutationFn: async () => {
      if (!userId || !todayAttendance) throw new Error('No arrival record found');
      
      const now = new Date().toTimeString().split(' ')[0];
      
      // Get GPS location for departure
      let latitude: number | null = null;
      let longitude: number | null = null;

      if ('geolocation' in navigator) {
        try {
          const position = await new Promise<GeolocationPosition>((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 0
            });
          });
          latitude = position.coords.latitude;
          longitude = position.coords.longitude;
        } catch (error) {
          console.warn('GPS location not available:', error);
          // Continue without location - it's optional
        }
      }
      
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
          departure_latitude: latitude,
          departure_longitude: longitude,
        })
        .eq('id', todayAttendance.id);

      if (error) throw error;
      
      return { latitude, longitude };
    },
    onMutate: async () => {
      // Dismiss any existing toasts to prevent duplicates
      toast.dismiss();
      
      // Cancel outgoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['attendance', 'today', userId] });
      
      // Snapshot previous data
      const previousAttendance = queryClient.getQueryData(['attendance', 'today', userId]);
      
      // Calculate optimistic values
      if (todayAttendance) {
        const now = new Date().toTimeString().split(' ')[0];
        const arrivalTime = todayAttendance.arrival_time;
        const arrival = new Date(`1970-01-01T${arrivalTime}`);
        const departure = new Date(`1970-01-01T${now}`);
        const diffMs = departure.getTime() - arrival.getTime();
        const totalHours = (diffMs / (1000 * 60 * 60)).toFixed(2);
        
        // Optimistically update to new value
        queryClient.setQueryData(['attendance', 'today', userId], {
          ...todayAttendance,
          departure_time: now,
          total_hours: parseFloat(totalHours),
        });
        
        // Show success toast immediately
        toast.success('Odchod zaznamenaný (zisťujem polohu...)');
      }
      
      // Return context for rollback
      return { previousAttendance };
    },
    onError: (error: any, _variables, context) => {
      // Rollback to previous state
      if (context?.previousAttendance !== undefined) {
        queryClient.setQueryData(['attendance', 'today', userId], context.previousAttendance);
      }
      toast.error(error.message || 'Chyba pri zaznamenaní odchodu');
    },
    onSettled: () => {
      // Always refetch after error or success to sync with server
      queryClient.invalidateQueries({ queryKey: ['attendance'] });
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
