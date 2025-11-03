import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface VehicleInput {
  spz: string;
  brand: string;
  type: string;
  current_km: number;
  vin?: string | null;
  highway_sticker_expiry?: string | null;
  service_date?: string | null;
  stk_date?: string | null;
  insurance_date?: string | null;
  emission_date?: string | null;
  service_note?: string | null;
  stk_note?: string | null;
  insurance_note?: string | null;
  emission_note?: string | null;
}

export function useAdminVehicles() {
  const queryClient = useQueryClient();

  const { data: vehicles, isLoading } = useQuery({
    queryKey: ['admin-vehicles'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('vehicles')
        .select('*')
        .order('spz');

      if (error) throw error;
      return data;
    },
  });

  const createVehicle = useMutation({
    mutationFn: async (input: VehicleInput) => {
      const { error } = await supabase
        .from('vehicles')
        .insert(input);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vozidlo vytvorené');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Chyba pri vytváraní vozidla');
    },
  });

  const updateVehicle = useMutation({
    mutationFn: async ({ id, ...input }: VehicleInput & { id: string }) => {
      const { error } = await supabase
        .from('vehicles')
        .update(input)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vozidlo aktualizované');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Chyba pri aktualizácii vozidla');
    },
  });

  const toggleVehicleStatus = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('vehicles')
        .update({ is_active: isActive })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Stav vozidla zmenený');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Chyba pri zmene stavu vozidla');
    },
  });

  const deleteVehicle = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('vehicles')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-vehicles'] });
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast.success('Vozidlo vymazané');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Chyba pri vymazávaní vozidla');
    },
  });

  return {
    vehicles,
    isLoading,
    createVehicle: createVehicle.mutate,
    updateVehicle: updateVehicle.mutate,
    toggleVehicleStatus: toggleVehicleStatus.mutate,
    deleteVehicle: deleteVehicle.mutate,
    isCreating: createVehicle.isPending,
    isUpdating: updateVehicle.isPending,
    isToggling: toggleVehicleStatus.isPending,
    isDeleting: deleteVehicle.isPending,
  };
}
