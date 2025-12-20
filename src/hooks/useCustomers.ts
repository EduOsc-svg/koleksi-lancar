import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface Customer {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
  assigned_sales_id: string | null;
  route_id: string;
  created_at: string;
}

export interface CustomerWithRelations extends Customer {
  sales_agents: { name: string; agent_code: string } | null;
  routes: { code: string; name: string } | null;
}

export const useCustomers = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*, sales_agents(name, agent_code), routes(code, name)')
        .order('name');
      if (error) throw error;
      return data as CustomerWithRelations[];
    },
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (customer: Omit<Customer, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('customers')
        .insert(customer)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...customer }: Partial<Customer> & { id: string }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(customer)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
    },
  });
};
