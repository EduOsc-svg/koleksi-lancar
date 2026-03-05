import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CouponHandover {
  id: string;
  collector_id: string;
  contract_id: string;
  coupon_count: number;
  start_index: number;
  end_index: number;
  handover_date: string;
  notes: string | null;
  created_at: string;
  collectors?: { name: string; collector_code: string } | null;
  credit_contracts?: {
    contract_ref: string;
    daily_installment_amount: number;
    current_installment_index: number;
    tenor_days: number;
    status: string;
    customers: { name: string } | null;
    sales_agents: { agent_code: string } | null;
  } | null;
}

export const useCouponHandovers = () => {
  return useQuery({
    queryKey: ['coupon_handovers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupon_handovers')
        .select('*, collectors(name, collector_code), credit_contracts(contract_ref, daily_installment_amount, current_installment_index, tenor_days, status, customers(name), sales_agents(agent_code))')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as CouponHandover[];
    },
  });
};

export const useCreateCouponHandover = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: {
      collector_id: string;
      contract_id: string;
      coupon_count: number;
      start_index: number;
      end_index: number;
      handover_date: string;
      notes?: string;
    }) => {
      const { data: result, error } = await supabase
        .from('coupon_handovers')
        .insert(data)
        .select()
        .single();
      if (error) throw error;
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupon_handovers'] });
      queryClient.invalidateQueries({ queryKey: ['outstanding_coupons'] });
      queryClient.invalidateQueries({ queryKey: ['credit_contracts'] });
      queryClient.invalidateQueries({ queryKey: ['installment_coupons'] });
    },
  });
};

export const useDeleteCouponHandover = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('coupon_handovers')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coupon_handovers'] });
      queryClient.invalidateQueries({ queryKey: ['outstanding_coupons'] });
      queryClient.invalidateQueries({ queryKey: ['credit_contracts'] });
    },
  });
};
