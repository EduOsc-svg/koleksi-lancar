import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface AggregatedPayment {
  payment_date: string;
  customer_id: string;
  customer_name: string;
  contract_ref: string;
  collector_name: string | null;
  daily_installment_amount: number;
  coupon_count: number;
  total_amount: number;
  coupon_indices: number[];
}

export const useAggregatedPayments = (dateFrom?: string, dateTo?: string, collectorId?: string) => {
  return useQuery({
    queryKey: ['aggregated_payments', dateFrom, dateTo, collectorId],
    queryFn: async () => {
      let query = supabase
        .from('payment_logs')
        .select(`
          id,
          payment_date,
          amount_paid,
          installment_index,
          contract_id,
          credit_contracts(
            contract_ref,
            daily_installment_amount,
            customer_id,
            customers(name)
          ),
          collectors(name, collector_code)
        `)
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

      // Group by customer_id + payment_date
      const grouped = new Map<string, AggregatedPayment>();

      (data || []).forEach((payment) => {
        const key = `${payment.credit_contracts?.customer_id}-${payment.payment_date}`;
        
        if (!grouped.has(key)) {
          grouped.set(key, {
            payment_date: payment.payment_date,
            customer_id: payment.credit_contracts?.customer_id || '',
            customer_name: payment.credit_contracts?.customers?.name || 'Unknown',
            contract_ref: payment.credit_contracts?.contract_ref || '',
            collector_name: payment.collectors?.name || null,
            daily_installment_amount: Number(payment.credit_contracts?.daily_installment_amount) || 0,
            coupon_count: 0,
            total_amount: 0,
            coupon_indices: [],
          });
        }

        const entry = grouped.get(key)!;
        entry.coupon_count += 1;
        entry.total_amount += Number(payment.amount_paid);
        entry.coupon_indices.push(payment.installment_index);
      });

      // Sort coupon indices and convert map to array
      return Array.from(grouped.values()).map(entry => ({
        ...entry,
        coupon_indices: entry.coupon_indices.sort((a, b) => a - b),
      }));
    },
  });
};
