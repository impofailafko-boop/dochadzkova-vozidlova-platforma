import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useGeolocation } from './useGeolocation';
import { useNetworkStatus } from './useNetworkStatus';
import { savePendingMutation } from '@/lib/offlineStorage';
import { fileToBase64 } from '@/lib/fileUtils';

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

export function useActiveVehicleLogs(userId: string | undefined) {
  return useQuery({
    queryKey: ['active-vehicle-logs', userId],
    queryFn: async () => {
      if (!userId) return [];
      
      const { data: logs, error } = await supabase
        .from('vehicle_logs')
        .select(`
          *,
          vehicles (spz, brand, type),
          projects (name)
        `)
        .eq('user_id', userId)
        .eq('is_completed', false)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return logs || [];
    },
    enabled: !!userId,
  });
}

export function useVehicleLogs(userId: string | undefined, params?: { limit?: number; offset?: number; startDate?: string; endDate?: string }) {
  const queryClient = useQueryClient();
  const { getLocation } = useGeolocation();
  const { isConnected } = useNetworkStatus();
  const { limit = 30, offset = 0, startDate, endDate } = params || {};

  const { data, isLoading } = useQuery({
    queryKey: ['vehicle-logs', userId, limit, offset, startDate, endDate],
    queryFn: async () => {
      if (!userId) return { data: [], count: 0 };
      
      let query = supabase
        .from('vehicle_logs')
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
    mutationFn: async (input: VehicleLogInput) => {
      if (!userId) throw new Error('User not authenticated');

      // Get GPS location using centralized hook
      const location = await getLocation();

      if (!isConnected) {
        // Convert photo to Base64 for offline storage
        let photoBase64 = null;
        if (input.photo_km_start) {
          photoBase64 = await fileToBase64(input.photo_km_start);
        }
        
        // Save to IndexedDB for later sync
        await savePendingMutation({
          id: `vehicle_log_create_${Date.now()}`,
          entityType: 'vehicle_log',
          action: 'create',
          data: {
            vehicle_id: input.vehicle_id,
            project_id: input.project_id,
            date: input.date,
            km_start: input.km_start,
            photo_km_start_base64: photoBase64,
            start_latitude: location?.latitude || null,
            start_longitude: location?.longitude || null,
            user_id: userId,
          },
          timestamp: new Date().toISOString(),
          synced: false,
          retries: 0,
          userId: userId,
        });
        
        toast.info('Offline - jazda bude synchronizovaná neskôr');
        return location;
      }

      // Online flow - same as before
      let photoUrl = null;
      
      // Upload photo if provided
      if (input.photo_km_start) {
        const fileExt = input.photo_km_start.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}_start.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('vehicle-photos')
          .upload(fileName, input.photo_km_start);

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Nahrávanie fotky zlyhalo: ${uploadError.message}`);
        }
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
          start_latitude: location?.latitude || null,
          start_longitude: location?.longitude || null,
          user_id: userId,
          is_completed: false,
        });

      if (error) throw error;

      // Update last used vehicle in profile
      await supabase
        .from('profiles')
        .update({ last_used_vehicle_id: input.vehicle_id })
        .eq('user_id', userId);
      
      return location;
    },
    onMutate: async (input: VehicleLogInput) => {
      // Dismiss any existing toasts
      toast.dismiss();
      
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['vehicle-logs', userId] });
      
      // Snapshot previous data
      const previousLogs = queryClient.getQueryData(['vehicle-logs', userId, limit, offset, startDate, endDate]);
      
      // Create optimistic log entry
      const optimisticLog = {
        id: 'temp-' + Date.now(),
        user_id: userId,
        vehicle_id: input.vehicle_id,
        project_id: input.project_id,
        date: input.date,
        km_start: input.km_start,
        km_end: null,
        km_driven: null,
        photo_km_start: null,
        photo_km_end: null,
        is_completed: false,
        created_at: new Date().toISOString(),
        vehicles: null,
        projects: null,
      };
      
      // Optimistically update logs
      queryClient.setQueryData(['vehicle-logs', userId, limit, offset, startDate, endDate], (old: any) => {
        if (!old) return { data: [optimisticLog], count: 1 };
        return {
          data: [optimisticLog, ...old.data],
          count: old.count + 1,
        };
      });
      
      // Show success toast immediately
      toast.success('Jazda zaznamenaná');
      
      return { previousLogs };
    },
    onError: (error: any, _variables, context) => {
      // Rollback to previous state
      if (context?.previousLogs !== undefined) {
        queryClient.setQueryData(['vehicle-logs', userId, limit, offset, startDate, endDate], context.previousLogs);
      }
      toast.error(error.message || 'Chyba pri zaznamenaní jazdy');
    },
    onSettled: () => {
      // Always refetch after error or success to sync with server
      queryClient.invalidateQueries({ queryKey: ['vehicle-logs'] });
    },
  });

  const completeLog = useMutation({
    mutationFn: async (input: CompleteLogInput) => {
      if (!userId) throw new Error('User not authenticated');

      // Get GPS location using centralized hook
      const location = await getLocation();

      if (!isConnected) {
        try {
          // Get the log from cache to access required fields
          const activeLogs = queryClient.getQueryData(['active-vehicle-logs', userId]) as any[] || [];
          const log = activeLogs.find((l: any) => l.id === input.logId);

          if (!log) {
            toast.error('Offline režim: Log sa nenašiel v cache. Skúste obnoviť stránku a skúsiť znova.');
            throw new Error('Log not found in cache - cannot complete offline');
          }

          // Convert photo to Base64 for offline storage with error handling
          let photoBase64 = null;
          if (input.photo_km_end) {
            try {
              photoBase64 = await fileToBase64(input.photo_km_end);
            } catch (error) {
              console.error('Photo conversion failed:', error);
              toast.warning('Fotka sa nepodarila spracovať, ukončujem bez fotky');
              // Continue without photo
            }
          }

          // Save to IndexedDB for later sync with ALL required fields
          await savePendingMutation({
            id: `vehicle_log_complete_${Date.now()}`,
            entityType: 'vehicle_log',
            action: 'update',
            data: {
              log_id: input.logId,  // Changed from 'id' to 'log_id'
              user_id: userId,      // ADDED
              vehicle_id: log.vehicle_id,  // ADDED
              project_id: log.project_id,  // ADDED
              date: log.date,              // ADDED
              km_end: input.km_end,
              photo_km_end_base64: photoBase64,
              end_latitude: location?.latitude || null,
              end_longitude: location?.longitude || null,
              is_completed: true,
            },
            timestamp: new Date().toISOString(),
            synced: false,
            retries: 0,
            userId: userId,
          });

          toast.info('Offline - ukončenie jazdy bude synchronizované neskôr');
          return location;
        } catch (error) {
          console.error('Offline vehicle log completion failed:', error);
          throw error;
        }
      }

      // Online flow - same as before
      let photoUrl = null;
      
      // Upload photo if provided
      if (input.photo_km_end) {
        const fileExt = input.photo_km_end.name.split('.').pop();
        const fileName = `${userId}/${Date.now()}_end.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('vehicle-photos')
          .upload(fileName, input.photo_km_end);

        if (uploadError) {
          console.error('Storage upload error:', uploadError);
          throw new Error(`Nahrávanie fotky zlyhalo: ${uploadError.message}`);
        }
        photoUrl = fileName;
      }

      const { error } = await supabase
        .from('vehicle_logs')
        .update({
          km_end: input.km_end,
          photo_km_end: photoUrl,
          end_latitude: location?.latitude || null,
          end_longitude: location?.longitude || null,
          is_completed: true,
        })
        .eq('id', input.logId);

      if (error) throw error;
      
      return location;
    },
    onMutate: async (input: CompleteLogInput) => {
      // Dismiss any existing toasts
      toast.dismiss();
      
      // Cancel outgoing queries
      await queryClient.cancelQueries({ queryKey: ['vehicle-logs', userId] });
      
      // Snapshot previous data
      const previousLogs = queryClient.getQueryData(['vehicle-logs', userId, limit, offset, startDate, endDate]);
      
      // Optimistically update the log
      queryClient.setQueryData(['vehicle-logs', userId, limit, offset, startDate, endDate], (old: any) => {
        if (!old) return old;
        
        return {
          ...old,
          data: old.data.map((log: any) => {
            if (log.id === input.logId) {
              return {
                ...log,
                km_end: input.km_end,
                is_completed: true,
              };
            }
            return log;
          }),
        };
      });
      
      // Show success toast immediately
      toast.success('Jazda ukončená');
      
      return { previousLogs };
    },
    onError: (error: any, _variables, context) => {
      // Rollback to previous state
      if (context?.previousLogs !== undefined) {
        queryClient.setQueryData(['vehicle-logs', userId, limit, offset, startDate, endDate], context.previousLogs);
      }
      toast.error(error.message || 'Chyba pri ukončení jazdy');
    },
    onSettled: () => {
      // Always refetch after error or success to sync with server
      queryClient.invalidateQueries({ queryKey: ['vehicle-logs'] });
      queryClient.invalidateQueries({ queryKey: ['active-vehicle-logs'] });
    },
  });

  return {
    logs,
    count,
    isLoading,
    createLog: createLog.mutate,
    isCreating: createLog.isPending,
    completeLog: completeLog.mutate,
    isCompleting: completeLog.isPending,
  };
}
