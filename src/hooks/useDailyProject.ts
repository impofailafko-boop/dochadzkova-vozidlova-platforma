import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';

/**
 * Hook for managing the user's daily project selection.
 * Uses profiles.current_project_id and project_selected_date to store the active project for the day.
 * Automatically resets the project at the start of a new day.
 * This project is automatically pre-filled in Vehicle Logs and Fuel Logs forms.
 */
export function useDailyProject(userId: string | undefined) {
  const queryClient = useQueryClient();
  const hasCheckedTodayRef = useRef<string | null>(null);

  // Fetch current project from profile (PURE READ-ONLY)
  const { data: projectData, isLoading } = useQuery({
    queryKey: ['daily-project', userId],
    queryFn: async () => {
      if (!userId) return null;
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('current_project_id, project_selected_date')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      
      return {
        projectId: profile?.current_project_id || null,
        selectedDate: profile?.project_selected_date || null,
      };
    },
    enabled: !!userId,
    staleTime: 0, // Always fetch fresh data to detect day changes immediately
    refetchOnWindowFocus: true, // Refetch when user returns to app
  });

  // Extract current project ID from query data
  const currentProjectId = projectData?.projectId || null;

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
      const today = new Date().toISOString().split('T')[0];
      // Update cache immediately with new structure
      queryClient.setQueryData(['daily-project', userId], { 
        projectId, 
        selectedDate: today 
      });
      // Mark today as checked
      hasCheckedTodayRef.current = today;
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
      queryClient.setQueryData(['daily-project', userId], { projectId: null, selectedDate: null });
      queryClient.invalidateQueries({ queryKey: ['profile', userId] });
    },
    onError: (error: any) => {
      console.error('Failed to clear daily project:', error);
    },
  });

  // Auto-reset project at the start of a new day (useEffect handles side effects)
  useEffect(() => {
    if (!projectData || !userId) return;

    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const { projectId, selectedDate } = projectData;

    // Check if we already processed today's reset
    if (hasCheckedTodayRef.current === today) {
      return; // Already checked today, skip
    }

    // If project exists but was selected on a different day, clear it
    if (selectedDate && selectedDate !== today && projectId) {
      hasCheckedTodayRef.current = today; // Mark as checked for today
      clearDailyProject.mutate();
    } else if (selectedDate === today || !projectId) {
      // Project is from today or no project exists - mark as checked
      hasCheckedTodayRef.current = today;
    }
  }, [projectData, userId]); // Removed clearDailyProject from deps to prevent loop

  return {
    currentProjectId,
    isLoading,
    setDailyProject: setDailyProject.mutate,
    clearDailyProject: clearDailyProject.mutate,
    isUpdating: setDailyProject.isPending || clearDailyProject.isPending,
  };
}
