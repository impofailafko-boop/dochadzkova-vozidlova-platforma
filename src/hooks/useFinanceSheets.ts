import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FinanceSheet {
  id: string;
  name: string;
  created_at: string;
  created_by: string | null;
  is_default: boolean;
}

export interface FinanceSheetInput {
  name: string;
}

export function useFinanceSheets() {
  const queryClient = useQueryClient();

  const { data: sheets = [], isLoading } = useQuery({
    queryKey: ['finance-sheets'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_sheets')
        .select('*')
        .order('created_at', { ascending: true });

      if (error) throw error;
      return data as FinanceSheet[];
    },
  });

  const createSheet = useMutation({
    mutationFn: async (input: FinanceSheetInput) => {
      const { data, error } = await supabase
        .from('finance_sheets')
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-sheets'] });
      toast.success('Nový hárok vytvorený');
    },
    onError: (error: Error) => {
      toast.error('Chyba pri vytváraní hárku: ' + error.message);
    },
  });

  const updateSheet = useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      const { data, error } = await supabase
        .from('finance_sheets')
        .update({ name })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-sheets'] });
      toast.success('Hárok aktualizovaný');
    },
    onError: (error: Error) => {
      toast.error('Chyba pri aktualizácii: ' + error.message);
    },
  });

  const deleteSheet = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('finance_sheets')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-sheets'] });
      queryClient.invalidateQueries({ queryKey: ['finance-records'] });
      toast.success('Hárok vymazaný');
    },
    onError: (error: Error) => {
      toast.error('Chyba pri vymazávaní: ' + error.message);
    },
  });

  return {
    sheets,
    isLoading,
    createSheet: createSheet.mutateAsync,
    isCreating: createSheet.isPending,
    updateSheet: updateSheet.mutateAsync,
    isUpdating: updateSheet.isPending,
    deleteSheet: deleteSheet.mutateAsync,
    isDeleting: deleteSheet.isPending,
  };
}
