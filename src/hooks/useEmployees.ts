import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface EmployeeInput {
  email: string;
  password: string;
  full_name: string;
  phone?: string;
}

export function useEmployees() {
  const queryClient = useQueryClient();

  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(`
          *,
          user_roles (role),
          projects:current_project_id (id, name, status)
        `)
        .order('full_name');

      if (error) throw error;
      return data;
    },
  });

  const createEmployee = useMutation({
    mutationFn: async (input: EmployeeInput) => {
      // Create user via Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: input.email,
        password: input.password,
        options: {
          data: {
            full_name: input.full_name,
          },
        },
      });

      if (authError) throw authError;
      if (!authData.user) throw new Error('User creation failed');

      // Update profile with phone if provided
      if (input.phone) {
        const { error: profileError } = await supabase
          .from('profiles')
          .update({ phone: input.phone })
          .eq('user_id', authData.user.id);

        if (profileError) throw profileError;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Zamestnanec vytvorený');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Chyba pri vytváraní zamestnanca');
    },
  });

  const deleteEmployee = useMutation({
    mutationFn: async (userId: string) => {
      // Note: Deleting a user requires service role key
      // For now, we'll just remove their profile data
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Zamestnanec odstránený');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Chyba pri odstraňovaní zamestnanca');
    },
  });

  const updateEmployeeProject = useMutation({
    mutationFn: async ({ userId, projectId }: { userId: string; projectId: string | null }) => {
      const { error } = await supabase
        .from('profiles')
        .update({ current_project_id: projectId })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['employees'] });
      toast.success('Projekt zamestnanca aktualizovaný');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Chyba pri aktualizácii projektu');
    },
  });

  return {
    employees,
    isLoading,
    createEmployee: createEmployee.mutate,
    deleteEmployee: deleteEmployee.mutate,
    updateEmployeeProject: updateEmployeeProject.mutate,
    isCreating: createEmployee.isPending,
    isDeleting: deleteEmployee.isPending,
    isUpdatingProject: updateEmployeeProject.isPending,
  };
}
