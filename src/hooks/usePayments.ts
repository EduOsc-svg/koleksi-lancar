import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLogActivity } from './useActivityLog';

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
    customer_id: string;
    customers: { name: string } | null;
  } | null;
  collectors: { name: string; collector_code: string } | null;
}

export const usePayments = (dateFrom?: string, dateTo?: string, collectorId?: string) => {
  return useQuery({
    queryKey: ['payment_logs', dateFrom, dateTo, collectorId],
    queryFn: async () => {
      let query = supabase
        .from('payment_logs')
        .select('*, credit_contracts(contract_ref, customer_id, customers(name)), collectors(name, collector_code)')
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
        .select('*, collectors(name, collector_code)')
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
  const logActivity = useLogActivity();
  
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

      // Get contract info for logging
      const { data: contractData } = await supabase
        .from('credit_contracts')
        .select('contract_ref, customers(name)')
        .eq('id', payment.contract_id)
        .single();

      return { ...paymentData, contract_ref: contractData?.contract_ref, customer_name: (contractData?.customers as { name: string } | null)?.name };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['payment_logs'] });
      queryClient.invalidateQueries({ queryKey: ['credit_contracts'] });
      queryClient.invalidateQueries({ queryKey: ['invoice_details'] });
      queryClient.invalidateQueries({ queryKey: ['collection_trend'] });
      queryClient.invalidateQueries({ queryKey: ['aggregated_payments'] });
      
      logActivity.mutate({
        action: 'PAYMENT',
        entity_type: 'payment',
        entity_id: data.id,
        description: `Payment received for coupon #${data.installment_index} on contract ${data.contract_ref || data.contract_id} (${data.customer_name || 'Unknown'}) - Rp ${data.amount_paid.toLocaleString()}`,
        contract_id: data.contract_id,
      });
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
