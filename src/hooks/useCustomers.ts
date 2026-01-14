import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLogActivity } from './useActivityLog';

export interface Customer {
  id: string;
  name: string;
  customer_code: string | null;
  nik: string; // Required 16-digit NIK
  address: string | null;
  phone: string | null;
  assigned_sales_id: string | null;
  route_id: string; // Still required by database
  created_at: string;
}

export interface CustomerWithRelations extends Customer {
  customer_code: string | null;
  nik: string; // Required 16-digit NIK
  sales_agents: { name: string; agent_code: string } | null;
}

// Type for creating customer without route_id (will use default)
export type CustomerCreateInput = Omit<Customer, 'id' | 'created_at' | 'route_id'>;

export const useCustomers = () => {
  return useQuery({
    queryKey: ['customers'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('customers')
        .select('*, sales_agents(name, agent_code)')
        .order('name');
      if (error) throw error;
      return data as CustomerWithRelations[];
    },
  });
};

// Get default route (first route in the system)
const getDefaultRouteId = async (): Promise<string> => {
  const { data, error } = await supabase
    .from('routes')
    .select('id')
    .order('code')
    .limit(1)
    .single();
  
  if (error || !data) {
    throw new Error('No default route found. Please create a route first.');
  }
  return data.id;
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogActivity();
  
  return useMutation({
    mutationFn: async (customer: CustomerCreateInput) => {
      // Get default route_id since it's still required by database
      const defaultRouteId = await getDefaultRouteId();
      
      const { data, error } = await supabase
        .from('customers')
        .insert({ ...customer, route_id: defaultRouteId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      logActivity.mutate({
        action: 'CREATE',
        entity_type: 'customer',
        entity_id: data.id,
        description: `Created customer ${data.name}`,
        customer_id: data.id,
      });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogActivity();
  
  return useMutation({
    mutationFn: async ({ id, ...customer }: Partial<CustomerCreateInput> & { id: string }) => {
      const { data, error } = await supabase
        .from('customers')
        .update(customer)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      logActivity.mutate({
        action: 'UPDATE',
        entity_type: 'customer',
        entity_id: data.id,
        description: `Updated customer ${data.name}`,
        customer_id: data.id,
      });
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogActivity();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Get customer info before deleting
      const { data: customerData } = await supabase
        .from('customers')
        .select('name')
        .eq('id', id)
        .single();
      
      const { error } = await supabase
        .from('customers')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { id, name: customerData?.name };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      
      logActivity.mutate({
        action: 'DELETE',
        entity_type: 'customer',
        entity_id: data.id,
        description: `Deleted customer ${data.name || data.id}`,
      });
    },
  });
};