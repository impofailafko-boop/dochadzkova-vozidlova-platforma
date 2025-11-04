import { supabase } from '@/integrations/supabase/client';
import { getPendingMutations, markMutationSynced, deleteSyncedMutations, incrementRetries, PendingMutation } from './offlineStorage';
import { toast } from 'sonner';
import { formatDateToISO, calculateWorkHours } from './utils';

const MAX_RETRIES = 3;

async function syncAttendance(mutation: PendingMutation): Promise<boolean> {
  try {
    const { type, timestamp, latitude, longitude, userId } = mutation.data;
    
    if (type === 'arrival') {
      const recordDate = new Date(timestamp);
      const { error } = await supabase
        .from('attendance')
        .insert({
          user_id: userId,
          date: formatDateToISO(recordDate),
          arrival_time: recordDate.toTimeString().split(' ')[0].substring(0, 5),
          arrival_latitude: latitude,
          arrival_longitude: longitude,
        });

      if (error) throw error;
    } else {
      const recordDate = new Date(timestamp);
      const today = formatDateToISO(recordDate);
      const { data: todayAttendance, error: fetchError } = await supabase
        .from('attendance')
        .select('*')
        .eq('user_id', userId)
        .eq('date', today)
        .is('departure_time', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (fetchError) throw fetchError;

      if (todayAttendance) {
        const departureTime = recordDate.toTimeString().split(' ')[0].substring(0, 5);
        const arrivalTime = todayAttendance.arrival_time;
        const totalHours = calculateWorkHours(arrivalTime, departureTime);

        const { error: updateError } = await supabase
          .from('attendance')
          .update({
            departure_time: departureTime,
            departure_latitude: latitude,
            departure_longitude: longitude,
            total_hours: totalHours,
          })
          .eq('id', todayAttendance.id);

        if (updateError) throw updateError;
      }
    }
    
    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to sync attendance:', error);
    }
    return false;
  }
}

async function syncVehicleLog(mutation: PendingMutation): Promise<boolean> {
  try {
    const { action, data } = mutation;
    
    if (action === 'create') {
      const { error } = await supabase
        .from('vehicle_logs')
        .insert(data);
      if (error) throw error;
    } else if (action === 'update') {
      const { id, ...updateData } = data;
      const { error } = await supabase
        .from('vehicle_logs')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to sync vehicle log:', error);
    }
    return false;
  }
}

async function syncFuelLog(mutation: PendingMutation): Promise<boolean> {
  try {
    const { action, data } = mutation;
    
    if (action === 'create') {
      const { error } = await supabase
        .from('fuel_logs')
        .insert(data);
      if (error) throw error;
    } else if (action === 'update') {
      const { id, ...updateData } = data;
      const { error } = await supabase
        .from('fuel_logs')
        .update(updateData)
        .eq('id', id);
      if (error) throw error;
    }
    
    return true;
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Failed to sync fuel log:', error);
    }
    return false;
  }
}

export async function syncPendingMutations(): Promise<{ success: number; failed: number }> {
  try {
    const pendingMutations = await getPendingMutations();
    
    if (pendingMutations.length === 0) {
      return { success: 0, failed: 0 };
    }

    // Sort by timestamp to maintain order
    const sortedMutations = pendingMutations.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let successCount = 0;
    let failedCount = 0;

    for (const mutation of sortedMutations) {
      // Skip if max retries reached
      if (mutation.retries >= MAX_RETRIES) {
        failedCount++;
        continue;
      }

      let success = false;

      switch (mutation.entityType) {
        case 'attendance':
          success = await syncAttendance(mutation);
          break;
        case 'vehicle_log':
          success = await syncVehicleLog(mutation);
          break;
        case 'fuel_log':
          success = await syncFuelLog(mutation);
          break;
      }

      if (success) {
        await markMutationSynced(mutation.id);
        successCount++;
      } else {
        await incrementRetries(mutation.id);
        failedCount++;
      }
    }

    // Clean up synced mutations
    await deleteSyncedMutations();

    return { success: successCount, failed: failedCount };
  } catch (error) {
    if (import.meta.env.DEV) {
      console.error('Sync failed:', error);
    }
    throw error;
  }
}

// Auto-sync when online
export function setupAutoSync() {
  window.addEventListener('online', async () => {
    try {
      const result = await syncPendingMutations();
      if (result.success > 0) {
        toast.success(`Synchronizované ${result.success} záznamov`);
      }
      if (result.failed > 0) {
        toast.error(`Nepodarilo sa synchronizovať ${result.failed} záznamov`);
      }
    } catch (error) {
      if (import.meta.env.DEV) {
        console.error('Auto-sync failed:', error);
      }
      toast.error('Nepodarilo sa synchronizovať dáta');
    }
  });
}
