import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface OutstandingCouponSummary {
  customer_name: string;
  contract_ref: string;
  contract_id: string;
  total_coupons_issued: number;
  daily_installment_amount: number;
  coupons_paid: number;
  coupons_unpaid: number;
  total_unpaid_amount: number;
}

export const useOutstandingCoupons = () => {
  return useQuery({
    queryKey: ['outstanding_coupons'],
    queryFn: async () => {
      // Get all active contracts with customer info
      const { data: contracts, error: contractsError } = await supabase
        .from('credit_contracts')
        .select('id, contract_ref, daily_installment_amount, tenor_days, current_installment_index, customers(name)')
        .eq('status', 'active');
      if (contractsError) throw contractsError;

      // Get coupon counts per contract
      const { data: coupons, error: couponsError } = await supabase
        .from('installment_coupons')
        .select('contract_id, status')
        .lte('due_date', new Date().toISOString().split('T')[0]);
      if (couponsError) throw couponsError;

      // Aggregate coupons by contract
      const couponMap = new Map<string, { issued: number; paid: number }>();
      for (const c of coupons) {
        const existing = couponMap.get(c.contract_id) || { issued: 0, paid: 0 };
        existing.issued++;
        if (c.status === 'paid') existing.paid++;
        couponMap.set(c.contract_id, existing);
      }

      const results: OutstandingCouponSummary[] = [];
      for (const contract of contracts || []) {
        const stats = couponMap.get(contract.id) || { issued: 0, paid: 0 };
        const unpaid = stats.issued - stats.paid;
        if (stats.issued === 0) continue; // skip contracts with no due coupons yet

        results.push({
          customer_name: (contract.customers as { name: string } | null)?.name || '-',
          contract_ref: contract.contract_ref,
          contract_id: contract.id,
          total_coupons_issued: stats.issued,
          daily_installment_amount: contract.daily_installment_amount,
          coupons_paid: stats.paid,
          coupons_unpaid: unpaid,
          total_unpaid_amount: unpaid * contract.daily_installment_amount,
        });
      }

      // Sort by unpaid descending
      results.sort((a, b) => b.coupons_unpaid - a.coupons_unpaid);
      return results;
    },
  });
};
