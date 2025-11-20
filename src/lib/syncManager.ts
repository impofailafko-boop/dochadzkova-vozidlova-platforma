import { supabase } from '@/integrations/supabase/client';
import { getPendingMutations, markMutationSynced, deleteSyncedMutations, incrementRetries, PendingMutation } from './offlineStorage';
import { toast } from 'sonner';
import { formatDateToISO, calculateWorkHours } from './utils';
import { base64ToFile } from './fileUtils';
import { validateAttendanceData, validateVehicleLogData, validateFuelLogData } from './syncValidation';

const MAX_RETRIES = 3;

async function syncAttendance(mutation: PendingMutation): Promise<boolean> {
  try {
    // Validate data before sync
    const validation = validateAttendanceData(mutation);
    if (!validation.valid) {
      console.error('Attendance validation failed:', validation.error);
      toast.error(`Chyba validácie: ${validation.error}`);
      return false;
    }
    
    const { type, timestamp, latitude, longitude, userId, projectId } = mutation.data;
    
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
          project_id: projectId || null,
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
        .maybeSingle();

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
    // Validate data before sync
    const validation = validateVehicleLogData(mutation);
    if (!validation.valid) {
      console.error('Vehicle log validation failed:', validation.error);
      toast.error(`Chyba validácie: ${validation.error}`);
      return false;
    }
    
    const { action, data } = mutation;
    
    if (action === 'create') {
      // Convert Base64 to File and upload if exists
      let photoUrl = null;
      if (data.photo_km_start_base64) {
        const photoFile = base64ToFile(
          data.photo_km_start_base64,
          `${data.user_id}/${Date.now()}_start.jpg`
        );
        
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${data.user_id}/${Date.now()}_start.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('vehicle-photos')
          .upload(fileName, photoFile);
        
        if (uploadError) throw uploadError;
        photoUrl = fileName;
      }
      
      // Remove Base64 from data and add uploaded URL
      const { photo_km_start_base64, ...insertData } = data;
      
      const { error } = await supabase
        .from('vehicle_logs')
        .insert({
          ...insertData,
          photo_km_start: photoUrl,
          is_completed: false,
        });
      if (error) throw error;
      
      // Update last used vehicle
      if (data.user_id && data.vehicle_id) {
        await supabase
          .from('profiles')
          .update({ last_used_vehicle_id: data.vehicle_id })
          .eq('user_id', data.user_id);
      }
    } else if (action === 'update') {
      // Convert Base64 to File and upload if exists
      let photoUrl = null;
      if (data.photo_km_end_base64) {
        const photoFile = base64ToFile(
          data.photo_km_end_base64,
          `${mutation.userId}/${Date.now()}_end.jpg`
        );
        
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${mutation.userId}/${Date.now()}_end.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('vehicle-photos')
          .upload(fileName, photoFile);
        
        if (uploadError) throw uploadError;
        photoUrl = fileName;
      }
      
      // Remove Base64 from data and add uploaded URL
      const { id, photo_km_end_base64, ...updateData } = data;
      
      const { error } = await supabase
        .from('vehicle_logs')
        .update({
          ...updateData,
          photo_km_end: photoUrl,
        })
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
    // Validate data before sync
    const validation = validateFuelLogData(mutation);
    if (!validation.valid) {
      console.error('Fuel log validation failed:', validation.error);
      toast.error(`Chyba validácie: ${validation.error}`);
      return false;
    }
    
    const { action, data } = mutation;
    
    if (action === 'create') {
      // Convert Base64 to File and upload if exists
      let photoUrl = null;
      if (data.photo_receipt_base64) {
        const photoFile = base64ToFile(
          data.photo_receipt_base64,
          `${data.user_id}/${Date.now()}_receipt.jpg`
        );
        
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${data.user_id}/${Date.now()}_receipt.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('vehicle-photos')
          .upload(fileName, photoFile);
        
        if (uploadError) throw uploadError;
        photoUrl = fileName;
      }
      
      // Remove Base64 from data and add uploaded URL
      const { photo_receipt_base64, ...insertData } = data;
      
      const { error } = await supabase
        .from('fuel_logs')
        .insert({
          ...insertData,
          photo_receipt: photoUrl,
        });
      if (error) throw error;
    } else if (action === 'update') {
      // Convert Base64 to File and upload if exists
      let photoUrl = null;
      if (data.photo_receipt_base64) {
        const photoFile = base64ToFile(
          data.photo_receipt_base64,
          `${mutation.userId}/${Date.now()}_receipt.jpg`
        );
        
        const fileExt = photoFile.name.split('.').pop();
        const fileName = `${mutation.userId}/${Date.now()}_receipt.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('vehicle-photos')
          .upload(fileName, photoFile);
        
        if (uploadError) throw uploadError;
        photoUrl = fileName;
      }
      
      // Remove Base64 from data and add uploaded URL
      const { id, photo_receipt_base64, ...updateData } = data;
      
      const { error } = await supabase
        .from('fuel_logs')
        .update({
          ...updateData,
          photo_receipt: photoUrl,
        })
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
  const runSync = async () => {
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
  };

  // Spusť sync hneď pri štarte, ak je používateľ online
  if (navigator.onLine) {
    runSync();
  }

  // A potom pri každom prechode do online stavu
  window.addEventListener('online', runSync);
}
