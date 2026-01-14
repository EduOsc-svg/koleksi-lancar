import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface InstallmentCoupon {
  id: string;
  contract_id: string;
  installment_index: number;
  due_date: string;
  amount: number;
  status: 'unpaid' | 'paid';
  created_at: string;
}

export interface CouponWithContract extends InstallmentCoupon {
  credit_contracts: {
    contract_ref: string;
    customer_id: string;
    daily_installment_amount: number;
    tenor_days: number;
    customers: {
      name: string;
      address: string | null;
      phone: string | null;
      sales_agents: { name: string; agent_code: string } | null;
    } | null;
  } | null;
}

// Fetch all coupons for a contract
export const useCouponsByContract = (contractId: string | null) => {
  return useQuery({
    queryKey: ['installment_coupons', 'contract', contractId],
    queryFn: async () => {
      if (!contractId) return [];
      const { data, error } = await supabase
        .from('installment_coupons')
        .select('*')
        .eq('contract_id', contractId)
        .order('installment_index', { ascending: true });
      if (error) throw error;
      return data as InstallmentCoupon[];
    },
    enabled: !!contractId,
  });
};

// Fetch today's due coupons
export const useTodayDueCoupons = () => {
  const today = new Date().toISOString().split('T')[0];
  return useQuery({
    queryKey: ['installment_coupons', 'today', today],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('installment_coupons')
        .select(`
          *,
          credit_contracts(
            contract_ref,
            customer_id,
            daily_installment_amount,
            tenor_days,
            customers(
              name,
              address,
              phone,
              sales_agents(name, agent_code)
            )
          )
        `)
        .eq('due_date', today)
        .eq('status', 'unpaid')
        .order('installment_index', { ascending: true });
      if (error) throw error;
      return data as CouponWithContract[];
    },
  });
};

// Fetch unpaid coupons filtered by sales agent
export const useUnpaidCoupons = (salesAgentId?: string) => {
  return useQuery({
    queryKey: ['installment_coupons', 'unpaid', salesAgentId],
    queryFn: async () => {
      const query = supabase
        .from('installment_coupons')
        .select(`
          *,
          credit_contracts(
            contract_ref,
            customer_id,
            daily_installment_amount,
            tenor_days,
            customers(
              name,
              address,
              phone,
              assigned_sales_id,
              sales_agents(name, agent_code)
            )
          )
        `)
        .eq('status', 'unpaid')
        .lte('due_date', new Date().toISOString().split('T')[0])
        .order('due_date', { ascending: true });

      const { data, error } = await query;
      if (error) throw error;

      // Filter by sales agent if specified
      let filtered = data as CouponWithContract[];
      if (salesAgentId) {
        filtered = filtered.filter(c => 
          c.credit_contracts?.customers?.sales_agents?.agent_code === salesAgentId
        );
      }

      return filtered;
    },
  });
};

// Generate coupons for a contract (calls the database function)
export const useGenerateCoupons = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      contractId, 
      startDate, 
      tenorDays, 
      dailyAmount 
    }: { 
      contractId: string; 
      startDate: string; 
      tenorDays: number; 
      dailyAmount: number;
    }) => {
      const { error } = await supabase.rpc('generate_installment_coupons', {
        p_contract_id: contractId,
        p_start_date: startDate,
        p_tenor_days: tenorDays,
        p_daily_amount: dailyAmount,
      });
      if (error) throw error;
      return { contractId };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installment_coupons'] });
      queryClient.invalidateQueries({ queryKey: ['credit_contracts'] });
    },
  });
};

// Mark a coupon as paid
export const useMarkCouponPaid = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (couponId: string) => {
      const { data, error } = await supabase
        .from('installment_coupons')
        .update({ status: 'paid' })
        .eq('id', couponId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['installment_coupons'] });
    },
  });
};
