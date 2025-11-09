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
            name
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
    isLoading: employeeQuery.isLoading || attendanceQuery.isLoading,
    isError: employeeQuery.isError || attendanceQuery.isError,
  };
}
