import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useGeolocation } from './useGeolocation';
import { getTodayISO, getCurrentTimeString, calculateWorkHours } from '@/lib/utils';

export function useAttendance(userId: string | undefined) {
  const queryClient = useQueryClient();
  const { getLocation } = useGeolocation();

  // Get today's attendance - find the latest incomplete record or the most recent one
  const { data: todayAttendance, isLoading } = useQuery({
    queryKey: ['attendance', 'today', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const today = getTodayISO();
      
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
    mutationFn: async (projectId?: string | null) => {
      if (!userId) throw new Error('User not authenticated');
      
      const today = getTodayISO();
      const now = getCurrentTimeString();

      // Get GPS location using centralized hook
      const location = await getLocation();

      const { error } = await supabase
        .from('attendance')
        .insert({
          user_id: userId,
          date: today,
          arrival_time: now,
          arrival_latitude: location?.latitude || null,
          arrival_longitude: location?.longitude || null,
          project_id: projectId || null,
        });

      if (error) throw error;
      
      return location;
    },
    onMutate: async () => {
      // Dismiss any existing toasts to prevent duplicates
      toast.dismiss();
      
      // Cancel outgoing queries to prevent race conditions
      await queryClient.cancelQueries({ queryKey: ['attendance', 'today', userId] });
      
      // Snapshot previous data
      const previousAttendance = queryClient.getQueryData(['attendance', 'today', userId]);
      
      // Optimistically update to new value
      const today = getTodayISO();
      const now = getCurrentTimeString();
      
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
      
      const today = getTodayISO();
      const now = getCurrentTimeString();
      
      // Critical: Prevent closing old records with today's time
      if (todayAttendance.date !== today) {
        throw new Error('Nie je možné ukončiť záznam z iného dňa. Prosím, kontaktujte administrátora.');
      }
      
      // Validate that departure time is after arrival time
      if (todayAttendance.arrival_time >= now) {
        throw new Error('Čas odchodu musí byť neskôr ako čas príchodu');
      }
      
      // Get GPS location using centralized hook
      const location = await getLocation();
      
      // Calculate total hours using centralized utility
      const totalHours = calculateWorkHours(todayAttendance.arrival_time, now);

      const { error } = await supabase
        .from('attendance')
        .update({
          departure_time: now,
          total_hours: totalHours,
          departure_latitude: location?.latitude || null,
          departure_longitude: location?.longitude || null,
        })
        .eq('id', todayAttendance.id);

      if (error) throw error;
      
      return location;
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
        const now = getCurrentTimeString();
        const totalHours = calculateWorkHours(todayAttendance.arrival_time, now);
        
        // Optimistically update to new value
        queryClient.setQueryData(['attendance', 'today', userId], {
          ...todayAttendance,
          departure_time: now,
          total_hours: totalHours,
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
