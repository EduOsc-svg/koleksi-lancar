import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLogActivity } from './useActivityLog';

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
  start_date: string;
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
  const logActivity = useLogActivity();
  
  return useMutation({
    mutationFn: async (contract: Omit<CreditContract, 'id' | 'created_at' | 'current_installment_index'>) => {
      const { data, error } = await supabase
        .from('credit_contracts')
        .insert({ ...contract, current_installment_index: 0 })
        .select()
        .single();
      if (error) throw error;
      return { data };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['credit_contracts'] });
      queryClient.invalidateQueries({ queryKey: ['invoice_details'] });
      
      logActivity.mutate({
        action: 'CREATE',
        entity_type: 'contract',
        entity_id: result.data.id,
        description: `Created contract ${result.data.contract_ref} with loan amount ${result.data.total_loan_amount}`,
        contract_id: result.data.id,
      });
    },
  });
};

export const useUpdateContract = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogActivity();
  
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['credit_contracts'] });
      queryClient.invalidateQueries({ queryKey: ['invoice_details'] });
      
      logActivity.mutate({
        action: 'UPDATE',
        entity_type: 'contract',
        entity_id: data.id,
        description: `Updated contract ${data.contract_ref}`,
        contract_id: data.id,
      });
    },
  });
};

export const useDeleteContract = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogActivity();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Get contract info before deleting
      const { data: contractData } = await supabase
        .from('credit_contracts')
        .select('contract_ref')
        .eq('id', id)
        .single();
      
      const { error } = await supabase
        .from('credit_contracts')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { id, contract_ref: contractData?.contract_ref };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['credit_contracts'] });
      queryClient.invalidateQueries({ queryKey: ['invoice_details'] });
      
      logActivity.mutate({
        action: 'DELETE',
        entity_type: 'contract',
        entity_id: data.id,
        description: `Deleted contract ${data.contract_ref || data.id}`,
      });
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
