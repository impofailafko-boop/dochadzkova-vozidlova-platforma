import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface FinanceRecord {
  id: string;
  order_number: string;
  location: string | null;
  completion_deadline: string | null;
  worker: string | null;
  scope_by_order: string | null;
  total_vsd: number | null;
  paid_employees: number | null;
  profit: number | null;
  completion_date: string | null;
  invoice_number: string | null;
  scope_by_invoice: string | null;
  actual_scope: string | null;
  by_employee: string | null;
  notes: string | null;
  row_color: string | null;
  created_at: string;
  created_by: string | null;
}

export interface FinanceRecordInput {
  order_number: string;
  location?: string;
  completion_deadline?: string;
  worker?: string;
  scope_by_order?: string;
  total_vsd?: number;
  paid_employees?: number;
  profit?: number;
  completion_date?: string;
  invoice_number?: string;
  scope_by_invoice?: string;
  actual_scope?: string;
  by_employee?: string;
  notes?: string;
  row_color?: string;
}

export function useFinanceRecords() {
  const queryClient = useQueryClient();

  const { data: records = [], isLoading } = useQuery({
    queryKey: ['finance-records'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('finance_records')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data as FinanceRecord[];
    },
  });

  const createRecord = useMutation({
    mutationFn: async (input: FinanceRecordInput) => {
      const { data, error } = await supabase
        .from('finance_records')
        .insert([input])
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-records'] });
      toast.success('Finančný záznam vytvorený');
    },
    onError: (error: Error) => {
      toast.error('Chyba pri vytváraní záznamu: ' + error.message);
    },
  });

  const updateRecord = useMutation({
    mutationFn: async ({ id, ...input }: { id: string } & Partial<FinanceRecordInput>) => {
      const { data, error } = await supabase
        .from('finance_records')
        .update(input)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-records'] });
      toast.success('Finančný záznam aktualizovaný');
    },
    onError: (error: Error) => {
      toast.error('Chyba pri aktualizácii: ' + error.message);
    },
  });

  const deleteRecord = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('finance_records')
        .delete()
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['finance-records'] });
      toast.success('Finančný záznam vymazaný');
    },
    onError: (error: Error) => {
      toast.error('Chyba pri vymazávaní: ' + error.message);
    },
  });

  return {
    records,
    isLoading,
    createRecord: createRecord.mutateAsync,
    isCreating: createRecord.isPending,
    updateRecord: updateRecord.mutateAsync,
    isUpdating: updateRecord.isPending,
    deleteRecord: deleteRecord.mutateAsync,
    isDeleting: deleteRecord.isPending,
  };
}
