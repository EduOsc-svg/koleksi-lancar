import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useLogActivity } from './useActivityLog';

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
  const logActivity = useLogActivity();
  
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales_agents'] });
      
      logActivity.mutate({
        action: 'CREATE',
        entity_type: 'sales_agent',
        entity_id: data.id,
        description: `Created sales agent ${data.name} (${data.agent_code})`,
        sales_agent_id: data.id,
      });
    },
  });
};

export const useUpdateSalesAgent = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogActivity();
  
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
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales_agents'] });
      
      logActivity.mutate({
        action: 'UPDATE',
        entity_type: 'sales_agent',
        entity_id: data.id,
        description: `Updated sales agent ${data.name}`,
        sales_agent_id: data.id,
      });
    },
  });
};

export const useDeleteSalesAgent = () => {
  const queryClient = useQueryClient();
  const logActivity = useLogActivity();
  
  return useMutation({
    mutationFn: async (id: string) => {
      // Get agent info before deleting
      const { data: agentData } = await supabase
        .from('sales_agents')
        .select('name, agent_code')
        .eq('id', id)
        .single();
      
      const { error } = await supabase
        .from('sales_agents')
        .delete()
        .eq('id', id);
      if (error) throw error;
      return { id, name: agentData?.name, agent_code: agentData?.agent_code };
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['sales_agents'] });
      
      logActivity.mutate({
        action: 'DELETE',
        entity_type: 'sales_agent',
        entity_id: data.id,
        description: `Deleted sales agent ${data.name || data.id}`,
      });
    },
  });
};
