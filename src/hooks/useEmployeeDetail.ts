import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useEmployeeDetail(userId: string | undefined) {
  // Fetch employee profile
  const employeeQuery = useQuery({
    queryKey: ['employee-detail', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID');
      
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles!inner (
            role
          ),
          projects:current_project_id (
            name
          )
        `)
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Fetch all attendance for this employee
  const attendanceQuery = useQuery({
    queryKey: ['employee-attendance', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID');
      
      const { data, error } = await supabase
        .from('attendance')
        .select(`
          *,
          projects (
            name,
            description
          )
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  // Fetch all vehicle logs for this employee
  const vehicleLogsQuery = useQuery({
    queryKey: ['employee-vehicle-logs', userId],
    queryFn: async () => {
      if (!userId) throw new Error('No user ID');
      
      const { data, error } = await supabase
        .from('vehicle_logs')
        .select(`
          *,
          vehicles (
            spz,
            brand,
            type
          ),
          projects (
            name,
            description
          )
        `)
        .eq('user_id', userId)
        .order('date', { ascending: false });

      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

  return {
    employee: employeeQuery.data,
    attendance: attendanceQuery.data || [],
    vehicleLogs: vehicleLogsQuery.data || [],
    isLoading: employeeQuery.isLoading || attendanceQuery.isLoading || vehicleLogsQuery.isLoading,
    isError: employeeQuery.isError || attendanceQuery.isError || vehicleLogsQuery.isError,
  };
}
