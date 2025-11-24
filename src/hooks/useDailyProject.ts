import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect, useRef } from 'react';
import { savePendingMutation } from '@/lib/offlineStorage';

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

  // Update current project with today's date (supports offline)
  const setDailyProject = useMutation({
    mutationFn: async ({ projectId, isOnline }: { projectId: string; isOnline: boolean }) => {
      if (!userId) throw new Error('User not authenticated');

      const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!isOnline) {
        // OFFLINE: Save to IndexedDB for later sync
        await savePendingMutation({
          id: `${userId}-project-${Date.now()}`,
          entityType: 'project_selection',
          action: 'create',
          data: {
            projectId,
            userId,
            timestamp: new Date().toISOString(),
          },
          timestamp: new Date().toISOString(),
          synced: false,
          retries: 0,
          userId,
        });
        
        // Also save to localStorage as immediate cache
        localStorage.setItem(`pending_project_${userId}`, JSON.stringify({ projectId, date: today }));
      } else {
        // ONLINE: Update Supabase directly
        const { error } = await supabase
          .from('profiles')
          .update({ 
            current_project_id: projectId,
            project_selected_date: today 
          })
          .eq('user_id', userId);

        if (error) throw error;
        
        // Clear localStorage cache after successful sync
        localStorage.removeItem(`pending_project_${userId}`);
      }
      
      return { projectId, today };
    },
    onSuccess: (data) => {
      const { projectId, today } = data;
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

  // On reconnect, sync pending project selection from localStorage
  useEffect(() => {
    if (!userId) return;
    
    const syncPendingProject = async () => {
      const pendingData = localStorage.getItem(`pending_project_${userId}`);
      if (!pendingData) return;
      
      try {
        const { projectId, date } = JSON.parse(pendingData);
        const today = new Date().toISOString().split('T')[0];
        
        // Only sync if it's from today
        if (date === today) {
          const { error } = await supabase
            .from('profiles')
            .update({ 
              current_project_id: projectId,
              project_selected_date: today 
            })
            .eq('user_id', userId);
          
          if (!error) {
            localStorage.removeItem(`pending_project_${userId}`);
            queryClient.invalidateQueries({ queryKey: ['daily-project', userId] });
          }
        } else {
          // Old data, clear it
          localStorage.removeItem(`pending_project_${userId}`);
        }
      } catch (error) {
        console.error('Failed to sync pending project:', error);
      }
    };
    
    // Run on reconnect
    window.addEventListener('online', syncPendingProject);
    return () => window.removeEventListener('online', syncPendingProject);
  }, [userId, queryClient]);

  return {
    currentProjectId,
    isLoading,
    setDailyProject: setDailyProject.mutate,
    clearDailyProject: clearDailyProject.mutate,
    isUpdating: setDailyProject.isPending || clearDailyProject.isPending,
  };
}
