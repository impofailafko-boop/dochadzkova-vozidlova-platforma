import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

interface ProjectInput {
  name: string;
  description?: string;
  status?: 'planned' | 'active' | 'completed';
}

export function useAdminProjects() {
  const queryClient = useQueryClient();

  const { data: projects, isLoading } = useQuery({
    queryKey: ['admin-projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .order('name');

      if (error) throw error;
      return data;
    },
  });

  const createProject = useMutation({
    mutationFn: async (input: ProjectInput) => {
      const { error } = await supabase
        .from('projects')
        .insert(input);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projekt vytvorený');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Chyba pri vytváraní projektu');
    },
  });

  const updateProject = useMutation({
    mutationFn: async ({ id, ...input }: ProjectInput & { id: string }) => {
      const { error } = await supabase
        .from('projects')
        .update(input)
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projekt aktualizovaný');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Chyba pri aktualizácii projektu');
    },
  });

  const updateProjectStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: 'planned' | 'active' | 'completed' }) => {
      const { error } = await supabase
        .from('projects')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Stav projektu zmenený');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Chyba pri zmene stavu projektu');
    },
  });

  const deleteProject = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('projects')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-projects'] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      toast.success('Projekt vymazaný');
    },
    onError: (error: any) => {
      toast.error(error.message || 'Chyba pri vymazávaní projektu');
    },
  });

  return {
    projects,
    isLoading,
    createProject: createProject.mutate,
    updateProject: updateProject.mutate,
    updateProjectStatus: updateProjectStatus.mutate,
    deleteProject: deleteProject.mutate,
    isCreating: createProject.isPending,
    isUpdating: updateProject.isPending,
    isUpdatingStatus: updateProjectStatus.isPending,
    isDeleting: deleteProject.isPending,
  };
}
