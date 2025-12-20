import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface PaymentLog {
  id: string;
  contract_id: string;
  payment_date: string;
  installment_index: number;
  amount_paid: number;
  collector_id: string | null;
  notes: string | null;
  created_at: string;
}

export interface PaymentWithRelations extends PaymentLog {
  credit_contracts: {
    contract_ref: string;
    customers: { name: string } | null;
  } | null;
  sales_agents: { name: string } | null;
}

export const usePayments = (dateFrom?: string, dateTo?: string, collectorId?: string) => {
  return useQuery({
    queryKey: ['payment_logs', dateFrom, dateTo, collectorId],
    queryFn: async () => {
      let query = supabase
        .from('payment_logs')
        .select('*, credit_contracts(contract_ref, customers(name)), sales_agents(name)')
        .order('payment_date', { ascending: false });
      
      if (dateFrom) {
        query = query.gte('payment_date', dateFrom);
      }
      if (dateTo) {
        query = query.lte('payment_date', dateTo);
      }
      if (collectorId) {
        query = query.eq('collector_id', collectorId);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as PaymentWithRelations[];
    },
  });
};

export const usePaymentsByContract = (contractId: string) => {
  return useQuery({
    queryKey: ['payment_logs', 'contract', contractId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_logs')
        .select('*, sales_agents(name)')
        .eq('contract_id', contractId)
        .order('installment_index');
      if (error) throw error;
      return data;
    },
    enabled: !!contractId,
  });
};

export const useCreatePayment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payment: Omit<PaymentLog, 'id' | 'created_at'>) => {
      // Insert payment
      const { data: paymentData, error: paymentError } = await supabase
        .from('payment_logs')
        .insert(payment)
        .select()
        .single();
      if (paymentError) throw paymentError;

      // Update contract's current_installment_index
      const { error: updateError } = await supabase
        .from('credit_contracts')
        .update({ current_installment_index: payment.installment_index })
        .eq('id', payment.contract_id);
      if (updateError) throw updateError;

      return paymentData;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment_logs'] });
      queryClient.invalidateQueries({ queryKey: ['credit_contracts'] });
      queryClient.invalidateQueries({ queryKey: ['invoice_details'] });
    },
  });
};

export const useTodayCollections = () => {
  const today = new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: ['payment_logs', 'today', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payment_logs')
        .select('amount_paid')
        .eq('payment_date', today);
      if (error) throw error;
      return data.reduce((sum, p) => sum + Number(p.amount_paid), 0);
    },
  });
};
