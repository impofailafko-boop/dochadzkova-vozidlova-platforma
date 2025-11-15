import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useLastVehicleKm(vehicleId: string | undefined) {
  return useQuery({
    queryKey: ['last-vehicle-km', vehicleId],
    queryFn: async () => {
      if (!vehicleId) return null;

      const { data, error } = await supabase
        .from('vehicle_logs')
        .select('km_end')
        .eq('vehicle_id', vehicleId)
        .eq('is_completed', true)
        .not('km_end', 'is', null)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data?.km_end || null;
    },
    enabled: !!vehicleId,
    staleTime: 30000,
  });
}
