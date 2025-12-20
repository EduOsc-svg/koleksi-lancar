import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface SalesAgent {
  id: string;
  agent_code: string;
  name: string;
  phone: string | null;
  created_at: string;
}

export const useSalesAgents = () => {
  return useQuery({
    queryKey: ['sales_agents'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sales_agents')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as SalesAgent[];
    },
  });
};

export const useCreateSalesAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (agent: Omit<SalesAgent, 'id' | 'created_at'>) => {
      const { data, error } = await supabase
        .from('sales_agents')
        .insert(agent)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_agents'] });
    },
  });
};

export const useUpdateSalesAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, ...agent }: Partial<SalesAgent> & { id: string }) => {
      const { data, error } = await supabase
        .from('sales_agents')
        .update(agent)
        .eq('id', id)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_agents'] });
    },
  });
};

export const useDeleteSalesAgent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('sales_agents')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales_agents'] });
    },
  });
};
