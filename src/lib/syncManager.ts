import { supabase } from '@/integrations/supabase/client';
import { getPendingAttendance, markAttendanceSynced, deleteSyncedAttendance } from './offlineStorage';
import { toast } from 'sonner';
import { formatDateToISO } from './utils';

/**
 * Vypočíta pracovné hodiny medzi dvoma časmi.
 * Utility verzia pre použitie mimo React komponentov (napr. v syncManager).
 */
function calculateWorkHours(arrivalTime: string, departureTime: string): number | null {
  try {
    const arrivalDate = new Date(`1970-01-01T${arrivalTime}`);
    const departureDate = new Date(`1970-01-01T${departureTime}`);
    
    if (isNaN(arrivalDate.getTime()) || isNaN(departureDate.getTime())) {
      console.warn('Invalid time format:', { arrivalTime, departureTime });
      return null;
    }

    const diffMs = departureDate.getTime() - arrivalDate.getTime();
    const hours = diffMs / (1000 * 60 * 60);
    return parseFloat(hours.toFixed(2));
  } catch (error) {
    console.error('Error calculating work hours:', error);
    return null;
  }
}

export async function syncPendingAttendance(): Promise<number> {
  try {
    const pendingRecords = await getPendingAttendance();
    
    if (pendingRecords.length === 0) {
      return 0;
    }

    // Sort by timestamp to maintain order
    const sortedRecords = pendingRecords.sort((a, b) => 
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    let syncedCount = 0;

    for (const record of sortedRecords) {
      try {
        if (record.type === 'arrival') {
          const recordDate = new Date(record.timestamp);
          const { error } = await supabase
            .from('attendance')
            .insert({
              user_id: record.userId,
              date: formatDateToISO(recordDate),
              arrival_time: recordDate.toTimeString().split(' ')[0].substring(0, 5),
              arrival_latitude: record.latitude,
              arrival_longitude: record.longitude,
            });

          if (error) throw error;
        } else {
          // Find today's incomplete attendance
          const recordDate = new Date(record.timestamp);
          const today = formatDateToISO(recordDate);
          const { data: todayAttendance, error: fetchError } = await supabase
            .from('attendance')
            .select('*')
            .eq('user_id', record.userId)
            .eq('date', today)
            .is('departure_time', null)
            .order('created_at', { ascending: false })
            .limit(1)
            .single();

          if (fetchError) throw fetchError;

          if (todayAttendance) {
            const departureTime = recordDate.toTimeString().split(' ')[0].substring(0, 5);
            const arrivalTime = todayAttendance.arrival_time;
            
            // Calculate total hours using utility function
            const totalHours = calculateWorkHours(arrivalTime, departureTime);

            const { error: updateError } = await supabase
              .from('attendance')
              .update({
                departure_time: departureTime,
                departure_latitude: record.latitude,
                departure_longitude: record.longitude,
                total_hours: totalHours,
              })
              .eq('id', todayAttendance.id);

            if (updateError) throw updateError;
          }
        }

        await markAttendanceSynced(record.id);
        syncedCount++;
      } catch (error) {
        console.error('Failed to sync record:', record, error);
        // Continue with other records even if one fails
      }
    }

    // Clean up synced records
    await deleteSyncedAttendance();

    return syncedCount;
  } catch (error) {
    console.error('Sync failed:', error);
    throw error;
  }
}

// Auto-sync when online
export function setupAutoSync() {
  window.addEventListener('online', async () => {
    try {
      const syncedCount = await syncPendingAttendance();
      if (syncedCount > 0) {
        toast.success(`Synchronizované ${syncedCount} záznamov dochádzky`);
      }
    } catch (error) {
      console.error('Auto-sync failed:', error);
      toast.error('Nepodarilo sa synchronizovať dochádzku');
    }
  });
}
