import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export function useProjects() {
  return useQuery({
    queryKey: ['projects'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('projects')
        .select('*')
        .eq('status', 'active')
        .order('name');

      if (error) {
        if (import.meta.env.DEV) {
          console.error('Error loading projects:', error);
        }
        throw error;
      }
      
      if (import.meta.env.DEV) {
        console.log('Loaded projects:', data);
      }
      return data;
    },
  });
}
