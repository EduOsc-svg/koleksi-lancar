import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { startOfMonth, endOfMonth, format } from 'date-fns';
import { toast } from 'sonner';

export interface OperationalExpense {
  id: string;
  expense_date: string;
  description: string;
  amount: number;
  category: string | null;
  notes: string | null;
  created_at: string;
}

export interface OperationalExpenseInput {
  expense_date: string;
  description: string;
  amount: number;
  category?: string;
  notes?: string;
}

// Hook untuk mengambil biaya operasional per bulan
export const useOperationalExpenses = (month: Date = new Date()) => {
  const monthStart = format(startOfMonth(month), 'yyyy-MM-dd');
  const monthEnd = format(endOfMonth(month), 'yyyy-MM-dd');

  return useQuery({
    queryKey: ['operational_expenses', monthStart, monthEnd],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('operational_expenses')
        .select('*')
        .gte('expense_date', monthStart)
        .lte('expense_date', monthEnd)
        .order('expense_date', { ascending: false });
      
      if (error) throw error;
      return data as OperationalExpense[];
    },
  });
};

// Hook untuk total biaya operasional bulan ini
export const useMonthlyExpenseTotal = (month: Date = new Date()) => {
  const { data } = useOperationalExpenses(month);
  const total = data?.reduce((sum, expense) => sum + Number(expense.amount), 0) ?? 0;
  return total;
};

// Hook untuk mutasi (create, update, delete)
export const useOperationalExpenseMutations = () => {
  const queryClient = useQueryClient();

  const createExpense = useMutation({
    mutationFn: async (input: OperationalExpenseInput) => {
      const { data, error } = await supabase
        .from('operational_expenses')
        .insert([input])
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operational_expenses'] });
      toast.success('Biaya operasional berhasil ditambahkan');
    },
    onError: (error) => {
      toast.error('Gagal menambahkan biaya operasional: ' + error.message);
    },
  });

  const updateExpense = useMutation({
    mutationFn: async ({ id, ...input }: OperationalExpenseInput & { id: string }) => {
      const { data, error } = await supabase
        .from('operational_expenses')
        .update(input)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operational_expenses'] });
      toast.success('Biaya operasional berhasil diperbarui');
    },
    onError: (error) => {
      toast.error('Gagal memperbarui biaya operasional: ' + error.message);
    },
  });

  const deleteExpense = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('operational_expenses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['operational_expenses'] });
      toast.success('Biaya operasional berhasil dihapus');
    },
    onError: (error) => {
      toast.error('Gagal menghapus biaya operasional: ' + error.message);
    },
  });

  return {
    createExpense,
    updateExpense,
    deleteExpense,
  };
};
