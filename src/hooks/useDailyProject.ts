import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

/**
 * Hook for managing the user's daily project selection.
 * Uses profiles.current_project_id and project_selected_date to store the active project for the day.
 * Automatically resets the project at the start of a new day.
 * This project is automatically pre-filled in Vehicle Logs and Fuel Logs forms.
 */
export function useDailyProject(userId: string | undefined) {
  const queryClient = useQueryClient();

  // Fetch current project from profile and check if it's from today
  const { data: currentProjectId, isLoading } = useQuery({
    queryKey: ['daily-project', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('current_project_id, project_selected_date')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      
      // Check if the project was selected today
      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      const selectedDate = profile?.project_selected_date;
      
      // If project was selected on a different day, clear it
      if (selectedDate && selectedDate !== today && profile?.current_project_id) {
        // Clear the old project selection
        await supabase
          .from('profiles')
          .update({ current_project_id: null, project_selected_date: null })
          .eq('user_id', userId);
        
        return null;
      }
      
      return profile?.current_project_id || null;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });

  // Update current project with today's date
  const setDailyProject = useMutation({
    mutationFn: async (projectId: string) => {
      if (!userId) throw new Error('User not authenticated');

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      const { error } = await supabase
        .from('profiles')
        .update({ 
          current_project_id: projectId,
          project_selected_date: today 
        })
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
        .update({ 
          current_project_id: null,
          project_selected_date: null 
        })
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
