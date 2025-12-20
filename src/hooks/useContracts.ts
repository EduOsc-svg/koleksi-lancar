import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface CreditContract {
  id: string;
  contract_ref: string;
  customer_id: string;
  product_type: string | null;
  total_loan_amount: number;
  tenor_days: number;
  daily_installment_amount: number;
  current_installment_index: number;
  status: string;
  created_at: string;
}

export interface ContractWithCustomer extends CreditContract {
  customers: {
    name: string;
    address: string | null;
    phone: string | null;
    routes: { code: string; name: string } | null;
    sales_agents: { name: string; agent_code: string } | null;
  } | null;
}

export const useContracts = (status?: string) => {
  return useQuery({
    queryKey: ['credit_contracts', status],
    queryFn: async () => {
      let query = supabase
        .from('credit_contracts')
        .select('*, customers(name, address, phone, routes(code, name), sales_agents(name, agent_code))')
        .order('created_at', { ascending: false });
      
      if (status) {
        query = query.eq('status', status);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as ContractWithCustomer[];
    },
  });
};

export const useCreateContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (contract: Omit<CreditContract, 'id' | 'created_at' | 'current_installment_index'>) => {
      const { data, error } = await supabase
        .from('credit_contracts')
        .insert({ ...contract, current_installment_index: 0 })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit_contracts'] });
      queryClient.invalidateQueries({ queryKey: ['invoice_details'] });
    },
  });
};

export const useUpdateContract = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...contract }: Partial<CreditContract> & { id: string }) => {
      const { data, error } = await supabase
        .from('credit_contracts')
        .update(contract)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['credit_contracts'] });
      queryClient.invalidateQueries({ queryKey: ['invoice_details'] });
    },
  });
};

export const useInvoiceDetails = () => {
  return useQuery({
    queryKey: ['invoice_details'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('invoice_details')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });
};
