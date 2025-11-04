import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook for managing the user's daily project selection.
 * Uses profiles.current_project_id to store the active project for the day.
 * This project is automatically pre-filled in Vehicle Logs and Fuel Logs forms.
 */
export function useDailyProject(userId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch current project from profile
  const { data: currentProjectId, isLoading } = useQuery({
    queryKey: ['daily-project', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('current_project_id')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return profile?.current_project_id || null;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Update current project
  const setDailyProject = useMutation({
    mutationFn: async (projectId: string) => {
      if (!userId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ current_project_id: projectId })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: (_, projectId) => {
      // Update cache immediately
      queryClient.setQueryData(['daily-project', userId], projectId);
      // Also invalidate profile cache
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
    onError: (error: any) => {
      console.error('Failed to set daily project:', error);
      toast.error('Nepodarilo sa nastaviť projekt');
    },
  });

  // Clear current project (e.g., at end of day or on demand)
  const clearDailyProject = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('User not authenticated');

      const { error } = await supabase
        .from('profiles')
        .update({ current_project_id: null })
        .eq('user_id', userId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.setQueryData(['daily-project', userId], null);
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
    onError: (error: any) => {
      console.error('Failed to clear daily project:', error);
    },
  });

  return {
    currentProjectId,
    isLoading,
    setDailyProject: setDailyProject.mutate,
    clearDailyProject: clearDailyProject.mutate,
    isUpdating: setDailyProject.isPending || clearDailyProject.isPending,
  };
}
